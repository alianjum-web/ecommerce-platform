import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { AddressSelection } from "@/components/user/checkout/AddressSkeleton";
import { PaymentMethods } from "@/components/user/checkout/PaymentMethods";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface CheckoutLeftPanelProps {
  addresses: any[];
  selectedAddress: string;
  onSelectAddress: (addressId: string) => void;
  router: AppRouterInstance;
  checkoutReady: boolean;
  onSelectPaymentMethod: (method: "PAYPAL" | "STRIPE" | "CARD") => Promise<void>;
  isPaymentProcessing: boolean;
}

export const CheckoutLeftPanel = ({
  addresses,
  selectedAddress,
  onSelectAddress,
  router,
  checkoutReady,
  onSelectPaymentMethod,
  isPaymentProcessing
}: CheckoutLeftPanelProps) => {
  return (
    <>
      {/* Address Selection */}
      <AddressSelection
        addresses={addresses}
        selectedAddress={selectedAddress}
        onSelectAddress={onSelectAddress}
        onAddNewAddress={() => router.push("/account?tab=addresses")}
      />

      {/* Payment Methods - Only show if address is selected */}
      {selectedAddress ? (
        <PaymentMethods
          onSelectPaymentMethod={onSelectPaymentMethod}
          isLoading={isPaymentProcessing}
          isReady={checkoutReady}
        />
      ) : (
        <Card className="glass-effect border border-glass-border">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Select Shipping Address
                </h3>
                <p className="text-muted-foreground">
                  Please select a shipping address to continue with payment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};