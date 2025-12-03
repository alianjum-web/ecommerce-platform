import { ArrowRight, Badge, BadgeCheck, Clock, CreditCard, Loader2, Lock, Mail, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { PaymentFlowProps } from "@/types/checkout/PaymentFlowProps";

export function PaymentFlow({
  showPaymentFlow,
  checkoutEmail,
  onEmailChange,
  onProceedToPayment,
  onPayPalSuccess,
  onCreatePayPalOrder,
  isProcessing,
}: PaymentFlowProps) {

const { toast } = useToast();

  return (
    <Card className="glass-effect border border-glass-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Payment Method
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose how you'd like to pay
            </p>
          </div>
        </div>

        {showPaymentFlow ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-success" />
                  <span className="font-medium text-foreground">
                    Secure Payment
                  </span>
                </div>
                <Badge className="bg-success/20 text-success border-success/20">
                  <Shield className="h-3 w-3 mr-1" />
                  256-bit SSL
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                All transactions are encrypted and secure. Your payment
                information is never stored.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                PayPal Checkout
              </h4>

              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "black",
                  shape: "rect",
                  label: "paypal",
                  height: 48,
                }}
                fundingSource="card"
                createOrder={async () => {
                  const orderId = await onCreatePayPalOrder();
                  if (!orderId) {
                    throw new Error("Failed to create PayPal order");
                  }
                  return orderId;
                }}
                onApprove={async (data, actions) => {
                  await onPayPalSuccess(data);
                }}
                onError={(err) => {
                  console.error("PayPal Error:", err);
                  toast ({
                    title: "Payment Error",
                    description:
                      "There was an issue processing your payment. Please try again.",
                    variant: "destructive",
                  });
                }}
              />

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  By completing your purchase you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label
                htmlFor="checkout-email"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="checkout-email"
                  type="email"
                  placeholder="Enter your email to continue"
                  value={checkoutEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  className="pl-10 bg-input border-border"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                We'll send your order confirmation and updates to this email
              </p>
            </div>

            <Button
              onClick={onProceedToPayment}
              disabled={!checkoutEmail || isProcessing}
              className="w-full py-6 text-lg font-semibold"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5" />
                  Proceed to Secure Payment
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1">
                <BadgeCheck className="h-3 w-3" />
                Guaranteed
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                24/7 Support
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
