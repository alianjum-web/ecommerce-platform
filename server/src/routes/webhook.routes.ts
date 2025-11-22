// routes/webhook.routes.ts
import express from 'express';
import { StripeService } from '../services/payment/stripe.service';
import { PrismaClient, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// ✅ WORKING STRIPE WEBHOOK
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  try {
    const stripeService = new StripeService();
    const result = await stripeService.handleWebhook(req.body, sig);
    
    if (result.success) {
      console.log('🎯 Stripe Webhook Success:', result.event);
      
      // Handle webhook based on event type
      if (result.event === 'checkout.session.completed') {
        await handleStripePaymentSuccess(result.data);
      } else if (result.event === 'payment_intent.payment_failed') {
        await handleStripePaymentFailure(result.data);
      }
      
      res.status(200).json({ received: true, event: result.event });
    } else {
      console.error('🎯 Stripe Webhook Error:', result.error);
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('🎯 Stripe Webhook Exception:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// ✅ WORKING PAYPAL WEBHOOK
router.post('/paypal', express.json(), async (req, res) => {
  try {
    const eventType = req.body.event_type;
    console.log('🎯 PayPal Webhook Received:', eventType);
    
    // Handle PayPal events
    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      await handlePayPalPaymentSuccess(req.body.resource);
    } else if (eventType === 'PAYMENT.CAPTURE.DENIED') {
      await handlePayPalPaymentFailure(req.body.resource);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('🎯 PayPal Webhook Error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Helper functions
async function handleStripePaymentSuccess(session: any) {
  try {
    // Find order by paymentId (session.id) or create logic to match orders
    const order = await prisma.order.findFirst({
      where: { 
        OR: [
          { paymentId: session.id },
          { paymentId: session.payment_intent }
        ]
      }
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          paymentStatus: 'COMPLETED',
          status: 'PROCESSING' // Update to processing after payment
        }
      });
      console.log('✅ Stripe payment successful, order updated:', order.id);
    } else {
      console.log('⚠️ Order not found for Stripe session:', session.id);
    }
  } catch (error) {
    console.error('Error handling Stripe payment success:', error);
  }
}

async function handleStripePaymentFailure(paymentIntent: any) {
  try {
    const order = await prisma.order.findFirst({
      where: { 
        paymentId: paymentIntent.id 
      }
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          paymentStatus: 'FAILED',
          status: OrderStatus.CANCELLED
        }
      });
      console.log('❌ Stripe payment failed, order cancelled:', order.id);
    }
  } catch (error) {
    console.error('Error handling Stripe payment failure:', error);
  }
}

async function handlePayPalPaymentSuccess(resource: any) {
  try {
    const order = await prisma.order.findFirst({
      where: { 
        paymentId: resource.id 
      }
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          paymentStatus: 'COMPLETED',
          status: 'PROCESSING'
        }
      });
      console.log('✅ PayPal payment successful, order updated:', order.id);
    }
  } catch (error) {
    console.error('Error handling PayPal payment success:', error);
  }
}

async function handlePayPalPaymentFailure(resource: any) {
  try {
    const order = await prisma.order.findFirst({
      where: { 
        paymentId: resource.id 
      }
    });

    if (order) {
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          paymentStatus: 'FAILED',
          status: OrderStatus.CANCELLED
        }
      });
      console.log('❌ PayPal payment failed, order cancelled:', order.id);
    }
  } catch (error) {
    console.error('Error handling PayPal payment failure:', error);
  }
}

export default router;