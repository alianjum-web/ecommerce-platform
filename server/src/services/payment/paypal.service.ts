// services/payment/paypal.service.ts
import {
  PaymentMethod,
  PaymentOrderData,
  PaymentResult,
} from "../../interfaces/payment.interface";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { getErrorMessage } from "../../utils/catchError";

export class PayPalService implements PaymentMethod {
  private clientId: string;
  private clientSecret: string;
  private baseApi: string;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID!;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
    this.baseApi =
      process.env.PAYPAL_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
  }

  private async getAccessToken(): Promise<string> {
    const base64Auth = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    const response = await axios.post(
      `${this.baseApi}/v1/oauth2/token`,
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

  async createOrder(orderData: PaymentOrderData): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken();

      const paypalItems = orderData.items.map((item) => ({
        name: item.productName,
        description: item.productName,
        sku: item.productId,
        unit_amount: {
          currency_code: "USD",
          value: item.price.toFixed(2),
        },
        quantity: item.quantity.toString(),
        category: "PHYSICAL_GOODS",
      }));

      const itemTotal = paypalItems.reduce(
        (sum, item) =>
          sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity),
        0
      );

      const response = await axios.post(
        `${this.baseApi}/v2/checkout/orders`,
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: orderData.total.toFixed(2),
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

      return {
        success: true,
        paymentId: response.data.id,
        orderId: response.data.id,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async capturePayment(paymentId: string): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseApi}/v2/checkout/orders/${paymentId}/capture`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async verifyWebhookSignature(
    body: any,
    transmissionId: string,
    timestamp: string,
    signature: string,
    certUrl: string
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `${this.baseApi}/v1/notifications/verify-webhook-signature`,
        {
          transmission_id: transmissionId,
          transmission_time: timestamp,
          transmission_sig: signature,
          cert_url: certUrl,
          auth_algo: "SHA256withRSA",
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: body,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.verification_status === "SUCCESS";
    } catch (error) {
      console.error("PayPal webhook verification failed:", error);
      return false;
    }
  }

  validatePayment(data: any): boolean {
    return !!(data.items && data.total && data.items.length > 0);
  }

  getName(): string {
    return "PAYPAL";
  }
}
