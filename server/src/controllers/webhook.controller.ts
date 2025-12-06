// controllers/payment/webhook.controller.ts
import { Request, Response } from "express";
import { prisma } from "../server";
import { PaymentFactory } from "../services/payment/payment.factory";

// Helper function to find order by different identifiers WITH relations
async function findOrderByIdentifiers(
  providerOrderId?: string,
  internalOrderId?: string,
  paymentId?: string,
  includeItems: boolean = true  // Add this parameter
) {
  // Base query
  const include = includeItems ? { items: true } : {};
  
  // Try by internal order ID first (fastest)
  if (internalOrderId) {
    const order = await prisma.order.findUnique({
      where: { id: internalOrderId },
      include  // Include items if needed
    });
    if (order) return order;
  }

  // Try by provider order ID
  if (providerOrderId) {
    const order = await prisma.order.findFirst({
      where: { providerOrderId },
      include  // Include items if needed
    });
    if (order) return order;
  }

  // Try by payment ID
  if (paymentId) {
    const order = await prisma.order.findFirst({
      where: { paymentId },
      include  // Include items if needed
    });
    if (order) return order;
  }

  return null;
}

// PayPal-specific webhook handler
export const paypalWebhook = async (req: Request, res: Response) => {
  try {
    // Get PayPal-specific headers
    const signature = req.headers["paypal-transmission-sig"] as string;
    const transmissionId = req.headers["paypal-transmission-id"] as string;
    const timestamp = req.headers["paypal-transmission-time"] as string;
    const certUrl = req.headers["paypal-cert-url"] as string;

    // Create PayPal service
    const paymentService = PaymentFactory.createPaymentService("PAYPAL");
    
    // Get raw body
    const rawBody = JSON.stringify(req.body);
    
    // Verify signature
    const isValid = await paymentService.verifyWebhookSignature(
      rawBody,
      transmissionId,
      timestamp,
      certUrl
    );

    if (!isValid) {
      console.error("Invalid PayPal webhook signature");
      return res.status(400).send("Invalid signature");
    }

    // Handle the webhook
    const result = await paymentService.handleWebhook(
      rawBody,
      signature
    );

    // Process the result
    if (result.success) {
      switch (result.event) {
        case 'payment_captured':
          await handlePayPalPaymentCaptured(result.data);
          break;
        case 'order_approved':
          await handlePayPalOrderApproved(result.data);
          break;
        case 'payment_failed':
          await handlePaymentFailed("PAYPAL", result.data);
          break;
      }
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Error processing PayPal webhook:", error);
    res.status(500).send("Internal server error");
  }
};

// Stripe-specific webhook handler
export const stripeWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    
    // Create Stripe service
    const paymentService = PaymentFactory.createPaymentService("STRIPE");
    
    // For Stripe, we need the raw body buffer
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    
    // Handle the webhook
    const result = await paymentService.handleWebhook(
      rawBody,
      signature
    );

    // Process the result
    if (result.success && result.event === 'payment_success') {
      await handleStripePaymentSuccess(result.data);
    } else if (!result.success && result.event === 'payment_failed') {
      await handlePaymentFailed("STRIPE", result.data);
    }

    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Error processing Stripe webhook:", error);
    res.status(500).send("Internal server error");
  }
};

// Generic webhook handler
export const genericWebhook = async (req: Request, res: Response) => {
  try {
    // Determine provider from path
    const provider = req.path.includes('paypal') ? 'PAYPAL' : 
                    req.path.includes('stripe') ? 'STRIPE' : 
                    req.headers['x-payment-provider'] as string;
    
    if (!provider) {
      return res.status(400).send("Payment provider not specified");
    }

    const paymentService = PaymentFactory.createPaymentService(provider);
    
    // Get headers based on provider
    let signature = '';
    let timestamp = '';
    let transmissionId = '';
    let certUrl = '';
    
    if (provider === 'PAYPAL') {
      signature = req.headers["paypal-transmission-sig"] as string;
      transmissionId = req.headers["paypal-transmission-id"] as string;
      timestamp = req.headers["paypal-transmission-time"] as string;
      certUrl = req.headers["paypal-cert-url"] as string;
    } else if (provider === 'STRIPE') {
      signature = req.headers["stripe-signature"] as string;
    }
    
    const rawBody = JSON.stringify(req.body);
    
    // Verify signature for PayPal
    if (provider === 'PAYPAL' && transmissionId && timestamp && certUrl) {
      const isValid = await paymentService.verifyWebhookSignature(
        rawBody,
        transmissionId,
        timestamp,
        certUrl
      );
      
      if (!isValid) {
        return res.status(400).send("Invalid signature");
      }
    }
    
    // Handle webhook
    const result = await paymentService.handleWebhook(
      rawBody,
      signature
    );
    
    // Process result
    if (result.success) {
      switch (result.event) {
        case 'payment_captured':
        case 'payment_success':
          await handlePaymentSuccess(provider, result.data);
          break;
        case 'order_approved':
          if (provider === 'PAYPAL') {
            await handlePayPalOrderApproved(result.data);
          }
          break;
        case 'payment_failed':
          await handlePaymentFailed(provider, result.data);
          break;
      }
    }
    
    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal server error");
  }
};



async function handlePayPalOrderApproved(resource: any) {
  const paypalOrderId = resource.id;

  if (!paypalOrderId) return;

  // Find orders by providerOrderId
  const orders = await prisma.order.findMany({
    where: { 
      providerOrderId: paypalOrderId,
      status: "PENDING_PAYMENT" 
    }
  });

  // Update each order using their primary key
  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id }, // Use primary key
      data: {
        status: "PAYMENT_APPROVED",
        paymentStatus: "APPROVED",
        updatedAt: new Date()
      }
    });
  }
}

async function handlePayPalPaymentCaptured(resource: any) {
  const captureId = resource.id;
  const paypalOrderId = resource.supplementary_data?.related_ids?.order_id;

  if (!paypalOrderId) return;

  // Find order by providerOrderId WITH items
  const order = await findOrderByIdentifiers(paypalOrderId, undefined, undefined, true);
  
  if (order && order.items) { // Add type guard
    // Update using primary key (id)
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PROCESSING",
        paymentStatus: "COMPLETED",
        providerCaptureId: captureId,
        capturedAt: new Date()
      }
    });

    // Update stock and clear cart - Now order.items exists!
    await updateStockAndClearCart(order.userId, order.items);
    
    // Update coupon if exists
    if (order.couponId) {
      await prisma.coupon.update({
        where: { id: order.couponId },
        data: { usageCount: { increment: 1 } },
      });
    }
  }
}

async function handleStripePaymentSuccess(session: any) {
  const sessionId = session.id;
  const metadata = session.metadata;
  
  if (!metadata?.internalOrderId) return;

  // For Stripe, we have internalOrderId directly - include items
  const order = await prisma.order.findUnique({
    where: { id: metadata.internalOrderId },
    include: { items: true }  // Include items here
  });

  if (order && order.items) { // Add type guard
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PROCESSING",
        paymentStatus: "COMPLETED",
        providerCaptureId: sessionId,
        capturedAt: new Date()
      }
    });

    // Update stock and clear cart
    await updateStockAndClearCart(order.userId, order.items);
    
    // Update coupon if exists
    if (order.couponId) {
      await prisma.coupon.update({
        where: { id: order.couponId },
        data: { usageCount: { increment: 1 } },
      });
    }
  }
}

async function handlePaymentSuccess(provider: string, data: any) {
  if (provider === 'PAYPAL') {
    await handlePayPalPaymentCaptured(data);
  } else if (provider === 'STRIPE') {
    await handleStripePaymentSuccess(data);
  }
}

async function handlePaymentFailed(provider: string, data: any) {
  let providerOrderId: string | undefined;
  let internalOrderId: string | undefined;
  
  if (provider === 'PAYPAL') {
    providerOrderId = data.supplementary_data?.related_ids?.order_id;
  } else if (provider === 'STRIPE') {
    providerOrderId = data.id;
    internalOrderId = data.metadata?.internalOrderId;
  }
  
  // Find the order
  const order = await findOrderByIdentifiers(providerOrderId, internalOrderId);
  
  if (order) {
    // Update using primary key (id)
    await prisma.order.update({
      where: { id: order.id }, // Use primary key here
      data: {
        status: "PAYMENT_FAILED",
        paymentStatus: "FAILED",
        updatedAt: new Date()
      }
    });
  }
}

// You'll need to import or define these functions
async function updateStockAndClearCart(userId: string, items: any[]) {
  // Your existing implementation
  // Update product stock and clear user's cart
}

// If updateStockAndClearCart is in another file, import it
// import { updateStockAndClearCart } from "./order.utils";