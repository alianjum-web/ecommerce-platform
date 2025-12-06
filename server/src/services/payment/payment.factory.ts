// services/payment/payment.factory.ts
import { BasePaymentService } from "./base.payment.service";
import { PayPalService } from "./providers/paypal.service";
import { StripeService } from "./providers/stripe.service";
import { CardService } from "./providers/card.service";

export class PaymentFactory {
  // Main method
  static createPaymentService(method: string): BasePaymentService {
    const normalizedMethod = method.toUpperCase();
    
    switch (normalizedMethod) {
      case "PAYPAL":
        return new PayPalService();
      case "STRIPE":
        return new StripeService();
      case "CARD":
      case "CREDIT_CARD":
        return new CardService();
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  // Alias method for backward compatibility
  static createPaymentMethod(method: string): BasePaymentService {
    return this.createPaymentService(method);
  }

  static getAvailableMethods(): string[] {
    return ["PAYPAL", "STRIPE", "CARD"];
  }
}