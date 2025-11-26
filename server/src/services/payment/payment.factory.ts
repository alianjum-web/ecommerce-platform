// services/payment/payment.factory.ts
import { PaymentMethod } from "../../interfaces/payment.interface";
import { PayPalService } from "./paypal.service";
import { StripeService } from "./stripe.service";
import { CardPaymentService } from "./card-payment.service";

export class PaymentFactory {
  static createPaymentMethod(method: string): PaymentMethod {
    if (!method) {
      throw new Error("Payment method is required");
    }
    switch (method.toUpperCase()) {
      case "PAYPAL":
        return new PayPalService();

      case "STRIPE":
        return new StripeService();

      case "CARD":
      case "CREDIT_CARD":
      case "DEBIT_CARD":
      case "VISA":
      case "MASTERCARD":
        return new CardPaymentService();

      default:
        throw new Error(`Payment method '${method}' is not supported`);
    }
  }

  static getAvailableMethods(): string[] {
    return ["PAYPAL", "STRIPE", "CREDIT_CARD"];
  }
}
