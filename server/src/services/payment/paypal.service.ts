// services/payment/paypal.service.ts
import {
  PaymentMethod,
  PaymentOrderData,
  PaymentResult,
} from "../../interfaces/payment.interface";
import {
  PayPalAccessTokenResponse,
  PayPalOrderResponse,
  PayPalCaptureResponse,
  PayPalWebhookVerificationResponse,
  PayPalItem,
} from "../../interfaces/paypal.interface.response";
import axios, { AxiosResponse, AxiosError } from "axios";
import { v4 as uuidv4 } from "uuid";
import { getErrorMessage } from "../../utils/catchError";

export class PayPalService implements PaymentMethod {
  private clientId: string;
  private clientSecret: string;
  private baseApi: string;
  private readonly timeout: number = 10000; // 10 seconds
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || "";
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    this.baseApi =
      process.env.PAYPAL_MODE === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const missingVars: string[] = [];

    if (!this.clientId) missingVars.push("PAYPAL_CLIENT_ID");
    if (!this.clientSecret) missingVars.push("PAYPAL_CLIENT_SECRET");
    if (!process.env.PAYPAL_WEBHOOK_ID) missingVars.push("PAYPAL_WEBHOOK_ID");

    if (missingVars.length > 0) {
      throw new Error(
        `PayPal configuration missing: ${missingVars.join(", ")}`
      );
    }
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if it's still valid (with 1-minute buffer)
    if (
      this.accessToken &&
      this.tokenExpiry &&
      Date.now() < this.tokenExpiry - 60000
    ) {
      return this.accessToken;
    }

    const base64Auth = Buffer.from(
      `${this.clientId}:${this.clientSecret}`
    ).toString("base64");

    try {
      const response: AxiosResponse<PayPalAccessTokenResponse> =
        await axios.post(
          `${this.baseApi}/v1/oauth2/token`,
          "grant_type=client_credentials",
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${base64Auth}`,
            },
            timeout: this.timeout,
          }
        );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      this.accessToken = null;
      this.tokenExpiry = null;
      throw new Error(
        `Failed to get PayPal access token: ${getErrorMessage(error)}`
      );
    }
  }

  private async makePayPalRequest<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    url: string,
    data?: any,
    retryCount: number = 0
  ): Promise<AxiosResponse<T>> {
    const accessToken = await this.getAccessToken();
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Request-ID": requestId,
          "User-Agent": "Ecommerce-Platform/1.0",
        },
        timeout: this.timeout,
      });

      // Log successful request
      console.log(
        `PayPal API ${method} ${url}: ${
          Date.now() - startTime
        }ms - RequestID: ${requestId}`
      );

      return response;
    } catch (error) {
      const axiosError = error as AxiosError;

      // Log error with context
      console.error(`PayPal API Error ${method} ${url}:`, {
        status: axiosError.response?.status,
        message: axiosError.message,
        requestId,
        duration: Date.now() - startTime,
      });

      // Retry logic for 5xx errors and network issues
      if (
        retryCount < 2 &&
        (!axiosError.response ||
          (axiosError.response.status >= 500 &&
            axiosError.response.status < 600))
      ) {
        console.log(`Retrying PayPal request (${retryCount + 1}/2)...`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.makePayPalRequest<T>(method, url, data, retryCount + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isValidPayPalCertUrl(url: string): boolean {
    const validDomains = [
      "api-m.paypal.com",
      "api-m.sandbox.paypal.com",
      "www.paypal.com",
      "www.sandbox.paypal.com",
    ];

    try {
      const certUrl = new URL(url);
      return validDomains.includes(certUrl.hostname);
    } catch {
      return false;
    }
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentResult> {
    try {
      // Validate input data
      if (!this.validatePayment(orderData)) {
        return {
          success: false,
          error: "Invalid payment data: items and total are required",
        };
      }

      const paypalItems: PayPalItem[] = orderData.items.map((item) => ({
        name: item.productName.substring(0, 127), // PayPal limit
        description: (item.productName || "").substring(0, 127),
        sku: item.productId.substring(0, 127),
        unit_amount: {
          currency_code: "USD",
          value: Math.max(0, item.price).toFixed(2), // Ensure non-negative
        },
        quantity: Math.max(1, Math.min(item.quantity, 1000000)).toString(), // Reasonable limits
        category: "PHYSICAL_GOODS",
      }));

      // Calculate item total for validation
      const calculatedItemTotal = paypalItems.reduce(
        (sum, item) =>
          sum + parseFloat(item.unit_amount.value) * parseInt(item.quantity),
        0
      );

      // Validate that calculated total matches orderData.total within reasonable tolerance
      const tolerance = 0.01; // 1 cent tolerance for floating point arithmetic
      if (Math.abs(calculatedItemTotal - orderData.total) > tolerance) {
        return {
          success: false,
          error: `Item total (${calculatedItemTotal}) does not match order total (${orderData.total})`,
        };
      }

      const response = await this.makePayPalRequest<PayPalOrderResponse>(
        "POST",
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
                    value: calculatedItemTotal.toFixed(2),
                  },
                },
              },
              items: paypalItems,
            },
          ],
          application_context: {
            brand_name: process.env.APP_NAME || "Ecommerce Store",
            user_action: "PAY_NOW",
            return_url: process.env.PAYPAL_RETURN_URL,
            cancel_url: process.env.PAYPAL_CANCEL_URL,
          },
        }
      );

      return {
        success: true,
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
      if (!paymentId || typeof paymentId !== "string") {
        return {
          success: false,
          error: "Valid paymentId is required",
        };
      }

      const response = await this.makePayPalRequest<PayPalCaptureResponse>(
        "POST",
        `${this.baseApi}/v2/checkout/orders/${paymentId}/capture`,
        {}
      );

      // Validate capture was successful
      const isSuccessful = response.data.status === "COMPLETED";

      return {
        success: isSuccessful,
        paymentId: response.data.id,
        data: response.data,
        ...(isSuccessful
          ? {}
          : { error: `Capture status: ${response.data.status}` }),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }

  async verifyWebhookSignature(
    body: Record<string, unknown>,
    transmissionId: string,
    timestamp: string,
    signature: string,
    certUrl: string
  ): Promise<boolean> {
    try {
      // Validate input parameters
      if (!transmissionId || !timestamp || !signature || !certUrl) {
        console.error(
          "Webhook verification failed: Missing required parameters"
        );
        return false;
      }

      // Validate certificate URL to prevent SSRF attacks
      if (!this.isValidPayPalCertUrl(certUrl)) {
        console.error(
          `Webhook verification failed: Invalid certificate URL: ${certUrl}`
        );
        return false;
      }

      const response =
        await this.makePayPalRequest<PayPalWebhookVerificationResponse>(
          "POST",
          `${this.baseApi}/v1/notifications/verify-webhook-signature`,
          {
            transmission_id: transmissionId,
            transmission_time: timestamp,
            transmission_sig: signature,
            cert_url: certUrl,
            auth_algo: "SHA256withRSA",
            webhook_id: process.env.PAYPAL_WEBHOOK_ID,
            webhook_event: body,
          }
        );

      return response.data.verification_status === "SUCCESS";
    } catch (error) {
      console.error("PayPal webhook verification failed:", {
        error: getErrorMessage(error),
        transmissionId,
        timestamp,
      });
      return false;
    }
  }
  

  validatePayment(data: unknown): boolean {
    if (typeof data !== "object" || data === null) {
      return false;
    }

    const paymentData = data as { items?: unknown; total?: unknown };

    if (!Array.isArray(paymentData.items) || paymentData.items.length === 0) {
      return false;
    }

    if (typeof paymentData.total !== "number" || paymentData.total <= 0) {
      return false;
    }

    // Validate each item
    return paymentData.items.every(
      (item: any) =>
        item &&
        typeof item.productId === "string" &&
        typeof item.productName === "string" &&
        typeof item.price === "number" &&
        item.price >= 0 &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  }

  getName(): string {
    return "PAYPAL";
  }

  // Utility method to clear cached token (useful for testing)
  clearTokenCache(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}
