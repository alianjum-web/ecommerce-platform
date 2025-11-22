import axios from "axios";
import { AuthenticatedRequest } from "../types/express";
import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { getErrorMessage } from "../utils/catchError";
import { PaymentFactory } from "../services/payment/payment.factory";
import { PaymentOrderData } from "../interfaces/payment.interface";

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

const createPaymentOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { items, total, paymentMethod } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthorized user"));
    }

    try {
      // Validate payment method
      const availableMethods = PaymentFactory.getAvailableMethods();
      if (!availableMethods.includes(paymentMethod.toUpperCase())) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              `Payment method '${paymentMethod}' is not supported`
            )
          );
      }

      // Create payment service
      const paymentService = PaymentFactory.createPaymentMethod(paymentMethod);

      // Validate payment data
      const orderData: PaymentOrderData = {
        items,
        total,
        userId,
        currency: "USD",
      };

      if (!paymentService.validatePayment(orderData)) {
        return res.status(400).json(new ApiError(400, "Invalid payment data"));
      }

      // Create payment order
      const paymentResult = await paymentService.createOrder(orderData);

      if (!paymentResult.success) {
        return res
          .status(400)
          .json(
            new ApiError(
              400,
              paymentResult.error || "Payment order creation failed"
            )
          );
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            paymentId: paymentResult.paymentId,
            orderData: paymentResult.data,
          },
          `${paymentMethod} order created successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

const capturePayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { paymentId, paymentMethod, orderData } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json(new ApiError(401, "Unauthorized user"));
    }

    try {
      const paymentService = PaymentFactory.createPaymentMethod(paymentMethod);
      const captureResult = await paymentService.capturePayment(paymentId);

      if (!captureResult.success) {
        return res
          .status(400)
          .json(
            new ApiError(400, captureResult.error || "Payment capture failed")
          );
      }

      // Now create the final order in database
      const finalOrder = await createFinalOrderInDB({
        ...orderData,
        userId,
        paymentMethod: paymentMethod.toUpperCase(),
        paymentId: captureResult.paymentId,
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            order: finalOrder,
            paymentData: captureResult.data,
          },
          "Payment captured and order created successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

// Updated final order creation
const createFinalOrderInDB = async (orderData: any) => {
  return await prisma.$transaction(async (prisma) => {
    // Stock validation (your existing code)
    for (const item of orderData.items) {
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

    // Create order
    const newOrder = await prisma.order.create({
      data: {
        userId: orderData.userId,
        addressId: orderData.addressId,
        couponId: orderData.couponId,
        total: orderData.total,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: "PENDING", // Start as pending
        paymentId: orderData.paymentId, // ✅ Save payment ID for webhooks
        items: {
          create: orderData.items.map((item: any) => ({
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

    // Update stock and clear cart (your existing code)
    for (const item of orderData.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity },
        },
      });
    }

    await prisma.cartItem.deleteMany({
      where: { cart: { userId: orderData.userId } },
    });
    await prisma.cart.delete({ where: { userId: orderData.userId } });

    if (orderData.couponId) {
      await prisma.coupon.update({
        where: { id: orderData.couponId },
        data: {
          usageCount: { increment: 1 },
        },
      });
    }

    return newOrder;
  });
};

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
      .json(new ApiResponse(200, statusUpdated, "stauts updated successfully"));
  }
);

const getAllOrdersForAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(404).json(new ApiResponse(404, "Unauthenticated user"));
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

    if (!orders || orders.length === 0) {
      return res.status(404).json(new ApiError(404, "No orders found."));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          orders,
          "All orders fetched for the admin sucessfully."
        )
      );
  }
);

const getOrdersByUserId = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(404).json(new ApiResponse(404, "Unauthenticated user"));
    }
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: userId },
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
    if (!order) {
      return res.status(403).json(new ApiError(403, "No order found."));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, order, "Order fetched for the user succesfully")
      );
  }
);

export {
  createPaymentOrder,
  capturePayment,
  createFinalOrderInDB,
  getOrder,
  updateOrderStatus,
  getAllOrdersForAdmin,
  getOrdersByUserId,
};
