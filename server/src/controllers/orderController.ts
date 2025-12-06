import { AuthenticatedRequest } from "../types/express";
import { NextFunction, Response } from "express";
import { prisma } from "../server";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError, InternalServerError, UnauthorizedError } from "../utils/ApiError";
import { PaymentFactory } from "../services/payment/payment.factory";
import { PaymentOrderData } from "../services/interfaces/payment.interface";
import type { MinimalProduct } from "../services/interfaces/product";
import { PayPalService } from "../services/payment/providers/paypal.service";
const paypalService = new PayPalService();

async function updateStockAndClearCart(userId: string, items: any[]) {
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
       if (item.couponId) {
        await prisma.coupon.update({
          where: { id: item.couponId },
          data: {
            usageCount: { increment: 1 },
          },
        });
      }
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

      const draftOrder = await prisma.order.create({
        data: {
          userId, 
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

      // FIXED: Use createPaymentService instead of createPaymentMethod
      const paymentService = PaymentFactory.createPaymentService(paymentMethod);

      const paymentOrderData: PaymentOrderData = {
        items,
        total,
        userId,
        currency: "USD",
        internalOrderId: draftOrder.id,
      };

      const paymentResult = await paymentService.createOrder(paymentOrderData);

      if (!paymentResult.success) {
        await prisma.order.update({
          where: { id: draftOrder.id },
          data: { 
            status: "PAYMENT_FAILED",
            paymentStatus: "FAILED"
          }
        });
        
        return next(new ApiError(400, paymentResult.error || "Payment order creation failed"));
      }

      // 4. Update order with provider info
      const updateData: any = {
        providerOrderId: paymentResult.orderId,
        paymentId: paymentResult.paymentId,
        status: "PENDING_PAYMENT",
        paymentStatus: "PENDING"
      };

      // Add provider-specific fields
      if (paymentResult.approvalUrl) {
        updateData.approvalUrl = paymentResult.approvalUrl;
      }
      if (paymentResult.url) {
        updateData.checkoutUrl = paymentResult.url;
      }
      if (paymentResult.clientSecret) {
        updateData.clientSecret = paymentResult.clientSecret;
      }

      await prisma.order.update({
        where: { id: draftOrder.id },
        data: updateData
      });

      // 5. Prepare response
      const responseData: any = {
        internalOrderId: draftOrder.id,
        paymentId: paymentResult.paymentId!,
        providerOrderId: paymentResult.orderId!,
        status: "PENDING_PAYMENT",
        paymentMethod: paymentMethod.toUpperCase(),
      };

      // Add provider-specific response fields
      if (paymentResult.approvalUrl) {
        responseData.approvalUrl = paymentResult.approvalUrl;
      }
      if (paymentResult.url) {
        responseData.url = paymentResult.url; // For Stripe
      }
      if (paymentResult.clientSecret) {
        responseData.clientSecret = paymentResult.clientSecret;
      }

      return res.status(200).json(
        new ApiResponse(
          200,
          responseData,
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
    const { paymentId, paymentMethod, internalOrderId, cardData } = req.body;
    const userId = req.user?.userId;

    if (!paymentId || !paymentMethod || !internalOrderId) {
      return next(new ApiError(400, "Missing required fields"));
    }

    if (!userId) {
      return next(new UnauthorizedError("Unauthorized user"));
    }

    try {
      // 1. Verify the order belongs to the user
      const existingOrder = await prisma.order.findFirst({
        where: {
          id: internalOrderId,
          userId,
          status: "PENDING_PAYMENT",
          paymentStatus: "PENDING"
        },
        include: { items: true }
      });

      if (!existingOrder) {
        return next(new ApiError(404, "Order not found or not in correct state"));
      }

      // 2. FIXED: Use createPaymentService instead of createPaymentMethod
      const paymentService = PaymentFactory.createPaymentService(paymentMethod);
      
      // For card payments, pass cardData as second parameter
      let captureResult;
      if (paymentMethod.toUpperCase() === "CARD" && cardData) {
        captureResult = await paymentService.capturePayment(paymentId, cardData);
      } else {
        captureResult = await paymentService.capturePayment(paymentId);
      }

      if (!captureResult.success) {
        await prisma.order.update({
          where: { id: internalOrderId },
          data: { 
            status: "CAPTURE_FAILED", 
            paymentStatus: "FAILED" 
          }
        });
        return next(new ApiError(400, captureResult.error || "Payment capture failed"));
      }

      // 3. Update EXISTING order
      const updatedOrder = await prisma.order.update({
        where: { id: internalOrderId },
        data: {
          status: "PROCESSING",
          paymentStatus: "COMPLETED",
          paymentId: captureResult.paymentId,
          providerCaptureId: captureResult.captureId || captureResult.data?.id,
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

      // 5. Apply coupon usage if exists
      if (existingOrder.couponId) {
        await prisma.coupon.update({
          where: { id: existingOrder.couponId },
          data: { usageCount: { increment: 1 } },
        });
      }

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

// export const paypalWebhook = async (req: AuthenticatedRequest, res: Response) => {
//   const signature = req.headers["paypal-transmission-sig"] as string;
//   const transmissionId = req.headers["paypal-transmission-id"] as string;
//   const timestamp = req.headers["paypal-transmission-time"] as string;
//   const certUrl = req.headers["paypal-cert-url"] as string;
//   const webhookId = req.headers["paypal-webhook-id"] as string;

//   // 1. Verify webhook signature
//   const isValid = await paypalService.verifyWebhookSignature(
//     req.body,
//     transmissionId,
//     timestamp,
//     signature,
//     certUrl
//   );

//   if (!isValid) {
//     console.error("Invalid webhook signature");
//     return res.status(400).send("Invalid signature");
//   }

//   const eventType = req.body.event_type;
//   const resource = req.body.resource;

//   console.log(`Received PayPal webhook: ${eventType}`, {
//     orderId: resource?.id,
//     timestamp: new Date().toISOString(),
//   });

//   try {
//     switch (eventType) {
//       case "CHECKOUT.ORDER.APPROVED":
//         await handleOrderApproved(resource.id);
//         break;

//       case "PAYMENT.CAPTURE.COMPLETED":
//         await handlePaymentCaptured(resource);
//         break;

//       case "PAYMENT.CAPTURE.DENIED":
//       case "PAYMENT.CAPTURE.FAILED":
//         await handlePaymentFailed(resource.id);
//         break;

//       case "CHECKOUT.ORDER.COMPLETED":
//         // Order is fully completed
//         await handleOrderCompleted(resource.id);
//         break;

//       default:
//         console.log(`Unhandled webhook event: ${eventType}`);
//     }

//     res.status(200).send("Webhook processed");
//   } catch (error) {
//     console.error("Error processing webhook:", error);
//     res.status(500).send("Internal server error");
//   }
// };
// // Webhook handlers
// async function handleOrderApproved(paypalOrderId: string) {
//   // Update order status when user approves on PayPal
//   await prisma.order.updateMany({
//     where: {
//       providerOrderId: paypalOrderId,
//       status: "PENDING_PAYMENT",
//     },
//     data: {
//       status: "PAYMENT_APPROVED",
//       paymentStatus: "APPROVED",
//       updatedAt: new Date(),
//     },
//   });
// }

// async function handlePaymentCaptured(resource: any) {
//   const captureId = resource.id;
//   const paypalOrderId = resource.supplementary_data?.related_ids?.order_id;

//   if (!paypalOrderId) {
//     console.error("No order ID in capture webhook");
//     return;
//   }

//   await prisma.$transaction(async (tx) => {
//     // Find the order
//     const order = await tx.order.findFirst({
//       where: {
//         providerOrderId: paypalOrderId,
//         paymentStatus: { in: ["APPROVED", "PENDING"] },
//       },
//       include: { items: true },
//     });

//     if (!order) {
//       console.error(`Order not found for PayPal order: ${paypalOrderId}`);
//       return;
//     }

//     // Update order
//     await tx.order.update({
//       where: { id: order.id },
//       data: {
//         status: "PROCESSING",
//         paymentStatus: "COMPLETED",
//         providerCaptureId: captureId,
//         capturedAt: new Date(),
//         paymentId: captureId,
//       },
//     });

//     // Update stock and clear cart
//     await updateStockAndClearCart(order.userId, order.items);

//     // Update coupon usage
//     if (order.couponId) {
//       await tx.coupon.update({
//         where: { id: order.couponId },
//         data: { usageCount: { increment: 1 } },
//       });
//     }

//     console.log(`Order ${order.id} completed via webhook`);
//   });
// }

// async function handlePaymentFailed(paypalOrderId: string) {
//   await prisma.order.updateMany({
//     where: {
//       providerOrderId: paypalOrderId,
//       paymentStatus: { in: ["PENDING", "APPROVED"] },
//     },
//     data: {
//       status: "PAYMENT_FAILED",
//       paymentStatus: "FAILED",
//       updatedAt: new Date(),
//     },
//   });
// }

// async function handleOrderCompleted(paypalOrderId: string) {
//   // Optional: Additional handling for completed orders
//   console.log(`Order ${paypalOrderId} fully completed`);
// }

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
  getOrder,
  updateOrderStatus,
  getAllOrdersForAdmin,
  getOrdersByUserId,
};
