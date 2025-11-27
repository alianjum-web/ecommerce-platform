export interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  payer: any;
  purchase_units: any[];
}

export interface PayPalWebhookVerificationResponse {
  verification_status: "SUCCESS" | "FAILED";
}

export interface PayPalItem {
  name: string;
  description: string;
  sku: string;
  unit_amount: {
    currency_code: string;
    value: string;
  };
  quantity: string;
  category: "PHYSICAL_GOODS" | "DIGITAL_GOODS" | "DONATION";
}