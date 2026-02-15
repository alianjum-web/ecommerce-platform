import { PayPalScriptProvider } from "@paypal/react-paypal-js";

export function PayPalProviderWrapper({ children }: { children: React.ReactNode }) {
  const options = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AYYtmQuBVHm_q4fO-nRv84xIKhQk1-BdhSLckYRxcBJLhxI5EcxafPKdkvKpqLDP-pNLNXalxvlUSgZE",
    currency: "USD",
    intent: "capture",
    components: "buttons",
    "data-sdk-integration-source": "developer-studio",
  };

  return (
    <PayPalScriptProvider 
      options={options}
      deferLoading={false}
    >
      {children}
    </PayPalScriptProvider>
  );
}