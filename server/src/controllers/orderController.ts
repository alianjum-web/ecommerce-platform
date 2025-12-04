import { AuthenticatedRequest } from "../types/express";
import { NextFunction, Response } from "express";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError, InternalServerError, UnauthorizedError } from "../utils/ApiError";
// import { getErrorMessage } from "../utils/catchError";
import { PaymentFactory } from "../services/payment/payment.factory";
import { PaymentOrderData } from "../interfaces/payment.interface";
import type { MinimalProduct } from "../interfaces/product";

const createPaymentOrder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { items, total, paymentMethod, addressId, couponId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new UnauthorizedError("Unauthorized user"));
    }

    // Validate required fields
    if (!addressId) {
      return next(new ApiError(400, "Shipping address is required"));
    }

    try {
      // 1. Validate payment method
      const availableMethods = PaymentFactory.getAvailableMethods();
      if (!availableMethods.includes(paymentMethod.toUpperCase())) {
        return next(new ApiError(400, `Payment method '${paymentMethod}' is not supported`));
      }

      // 2. FIRST create a DRAFT order in your database
      const draftOrder = await prisma.order.create({
        data: {
          userId, // Convert to Int if needed
          addressId,
          couponId,
          total,
          currency: "USD",
          status: "DRAFT", // Use DRAFT status
          paymentMethod: paymentMethod.toUpperCase() as any,
          paymentStatus: "PENDING",
          items: {
            create: items.map((item: MinimalProduct)  => ({
              productId: item.productId,
              productName: item.productName,
              productCategory: item.productCategory,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              price: item.price,
            }))
          }
        },
        include: {
          items: true,
          address: true,
          coupon: true
        }
      });

      // 3. Create payment with external provider
      const paymentService = PaymentFactory.createPaymentMethod(paymentMethod);

      const paymentOrderData: PaymentOrderData = {
        items,
        total,
        userId,
        currency: "USD",
        internalOrderId: draftOrder.id,
      };

      const paymentResult = await paymentService.createOrder(paymentOrderData);

      if (!paymentResult.success) {
        // Update order status to PAYMENT_FAILED
        await prisma.order.update({
          where: { id: draftOrder.id },
          data: { 
            status: "PAYMENT_FAILED",
            paymentStatus: "FAILED"
          }
        });
        
        return next(new ApiError(400, paymentResult.error || "Payment order creation failed"));
      }

      // 4. Update order with PayPal info and change to PENDING_PAYMENT
      await prisma.order.update({
        where: { id: draftOrder.id },
        data: {
          providerOrderId: paymentResult.orderId,
          paymentId: paymentResult.paymentId,
          status: "PENDING_PAYMENT", // Waiting for user approval
          paymentStatus: "PENDING"
        }
      });

      // 5. Find the approval URL for PayPal
      const approvalUrl = paymentResult.data.links?.find(
        (link: any) => link.rel === "approve"
      )?.href;

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            internalOrderId: draftOrder.id,
            paymentId: paymentResult.paymentId,
            providerOrderId: paymentResult.orderId,
            approvalUrl: approvalUrl, // User must click this!
            status: "PENDING_PAYMENT",
            message: "Order created. User must approve payment on PayPal."
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
    const { paymentId, paymentMethod, internalOrderId } = req.body;
    const userId = req.user?.userId;

    // Add validation
    if (!paymentId || !paymentMethod || !internalOrderId) {
      return next(new ApiError(400, "Missing required fields: paymentId, paymentMethod, internalOrderId"));
    }

    if (!userId) {
      return next(new UnauthorizedError("Unauthorized user"));
    }

    try {
      // 1. Verify the order belongs to the user and is in correct state
      const existingOrder = await prisma.order.findFirst({
        where: {
          id: internalOrderId,
          userId,
          status: "PENDING_PAYMENT", // Must be in correct state
          paymentStatus: "PENDING"
        },
        include: {
          items: true
        }
      });

      if (!existingOrder) {
        return next(new ApiError(404, "Order not found or not in correct state for capture"));
      }

      // 2. Create payment service and capture
      const paymentService = PaymentFactory.createPaymentMethod(paymentMethod);
      const captureResult = await paymentService.capturePayment(paymentId);

      if (!captureResult.success) {
        // Update order status to CAPTURE_FAILED
        await prisma.order.update({
          where: { id: internalOrderId },
          data: { 
            status: "CAPTURE_FAILED", 
            paymentStatus: "FAILED" 
          }
        });
        
        return next(new ApiError(400, captureResult.error || "Payment capture failed"));
      }

      // 3. Update order with capture details and change to PROCESSING
      const updatedOrder = await prisma.order.update({
        where: { id: internalOrderId },
        data: {
          status: "PROCESSING",
          paymentStatus: "COMPLETED",
          paymentId: captureResult.paymentId, // Capture ID (different from order ID)
          providerCaptureId: captureResult.data.id,
          capturedAt: new Date()
        },
        include: {
          items: true,
          address: true,
          coupon: true
        }
      });

      // 4. Update stock and clear cart
      await updateStockAndClearCart(userId, existingOrder.items);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            order: updatedOrder,
            captureData: captureResult.data,
          },
          "Payment captured and order completed successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }
);

// Helper function for stock and cart updates
async function updateStockAndClearCart(userId: number, items: any[]) {
  // Update stock for each product
  for (const item of items) {
    if (item.productId) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity },
        },
      });
    }
  }

  // Clear cart
  try {
    await prisma.cartItem.deleteMany({
      where: { cart: { userId } },
    });
    
    await prisma.cart.delete({ where: { userId } });
  } catch (error) {
    // Cart might not exist, that's okay
    console.log("Cart already cleared or doesn't exist");
  }
}

// const capturePayment = asyncHandler(
//   async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//     const { paymentId, paymentMethod, orderData } = req.body;

//     // Add validation:
//     if (!paymentId || !paymentMethod || !orderData) {
//       throw new ApiError(
//         400,
//         "Missing required fields: paymentId, paymentMethod, orderData"
//       );
//     }

//     const userId = req.user?.userId;
//     if (!userId) {
//       return res.status(401).json(new ApiError(401, "Unauthorized user"));
//     }

//     try {
//       const paymentService = PaymentFactory.createPaymentMethod(paymentMethod);
//       const captureResult = await paymentService.capturePayment(paymentId);

//       if (!captureResult.success) {
//         return res
//           .status(400)
//           .json(
//             new ApiError(400, captureResult.error || "Payment capture failed")
//           );
//       }

//       // Now create the final order in database
//       const finalOrder = await createFinalOrderInDB({
//         ...orderData,
//         userId,
//         paymentMethod: paymentMethod.toUpperCase(),
//         paymentId: captureResult.paymentId,
//       });

//       return res.status(200).json(
//         new ApiResponse(
//           200,
//           {
//             order: finalOrder,
//             paymentData: captureResult.data,
//           },
//           "Payment captured and order created successfully"
//         )
//       );
//     } catch (error) {
//       next(error);
//     }
//   }
// );

const createFinalOrderInDB = async (orderData: any) => {
  try {   
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
          paymentStatus: "COMPLETED", // After successful payment capture
          status: "PROCESSING", // update order status
          paymentId: orderData.paymentId, // Save payment ID for webhooks
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
  } catch (error) {
     if (error instanceof ApiError) {
      throw error;
    }
    // Handle Prisma errors
    throw new InternalServerError("Failed to create order in database");
  }
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
      return res
        .status(401)
        .json(new UnauthorizedError("Unauthenticated user"));
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
      return res.status(401).json(new ApiResponse(401, "Unauthenticated user"));
    }
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: userId }, // users see it's own orders
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
