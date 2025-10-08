import axios from "axios";
import { AuthenticatedRequest } from "../types/express";
import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getErrorMessage } from "../utils/catchError";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_BASE_API =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "${PAYPAL_BASE_API}";

async function getPaypalAccessToken() {
  const base64Auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(
    `${PAYPAL_BASE_API}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${base64Auth}`,
      },
    }
  );

  return response.data.access_token;
}

const createPaypalOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { items, total } = req.body;

    if (!items && !total) {
      return res
        .status(404)
        .json(new ApiError(404, "Invalid data to process the order."));
    }

    const accessToken = await getPaypalAccessToken();

    const paypalItems = items.map((item: any) => ({
      name: item.name,
      description: item.description || "",
      sku: item.id,
      unit_amount: {
        currency_code: "USD",
        value: item.price.toFixed(2),
      },
      quantity: item.quantity.toString(),
      category: "PHYSICAL_GOODS",
    }));

    const itemTotal = paypalItems.reduce(
      (sum: any, item: any) =>
        sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity),
      0
    );

    const response = await axios.post(
      `${PAYPAL_BASE_API}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: itemTotal.toFixed(2),
                },
              },
            },
            items: paypalItems,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Request-ID": uuidv4(),
        },
      }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, response.data, "Paypal order created successfully")
      );
  }
);

const capturePaypalOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { orderId } = req.body;
    const accessToken = await getPaypalAccessToken();

    const response = await axios.post(
      `${PAYPAL_BASE_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    res.status(200).json(response.data);
  }
);
// TODO: add different payment mehtod: follow modularity
const createFinalOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { items, addressId, couponId, total, paymentId } = req.body;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json(new ApiError(401, "Unauthorized user"));
      }

      // Add this VALIDATION before transaction - SUPER IMPORTANT!
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        });

        if (!product) {
          throw new ApiError(404, `Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new ApiError(
            400,
            `Only ${product.stock} items left for ${product.name}`
          );
        }
      }

      const order = await prisma.$transaction(async (prisma) => {
        //       //create new order
        const newOrder = await prisma.order.create({
          data: {
            userId,
            addressId,
            couponId,
            total,
            paymentMethod: "CREDIT_CARD",
            paymentStatus: "COMPLETED",
            paymentId,
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                productName: item.productName,
                productCategory: item.productCategory,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                price: item.price,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        for (const item of items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
        }

        await prisma.cartItem.deleteMany({ where: { cart: { userId } } });
        await prisma.cart.delete({ where: { userId } });

        if (couponId) {
          await prisma.coupon.update({
            where: { id: couponId },
            data: {
              usageCount: { increment: 1 },
            },
          });
        }

        return newOrder;
      });

      return res
        .status(201)
        .json(
          new ApiResponse(201, order, "Created the final order successfully.")
        );
    } catch (error) {
      console.error("🎯 CREATE_ORDER_DEBUG:", {
        error: getErrorMessage(error), // ← Use helper
        userId: req.user?.userId,
        timestamp: new Date().toISOString(),
      });

      // Re-throw for asyncHandler to handle
      throw error;
    }
  }
);

const getOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthenticated user"));
    }
    //  TODO: check the input by zod

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      select: {
        items: true,
        address: true,
        coupon: true,
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, order, "orders fetched successfully"));
  }
);
// TODO: should do it for single or multiple order? validate the input req.params+body
const updateOrderStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    const { orderId } = req.params;
    const { status } = req.body;

    const statusUpdated = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    if (!statusUpdated) {
      return res
        .status(401)
        .json(
          new ApiError(401, "Error occured while updateing the order status")
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, statusUpdated,"stauts updated successfully"));
  }
);

const getAllOrdersForAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    const orders = await prisma.order.findMany({
      include: {
        items: true,
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json(orders);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

const getOrdersByUserId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated user",
      });

      return;
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: true,
        address: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: "Unexpected error occured!",
    });
  }
};

export {
  createPaypalOrder,
  capturePaypalOrder,
  createFinalOrder,
  getOrder,
  updateOrderStatus,
  getAllOrdersForAdmin,
  getOrdersByUserId,
};
