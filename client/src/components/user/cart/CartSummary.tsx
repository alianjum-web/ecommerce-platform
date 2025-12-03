import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CreditCard, Gift, Package, Shield, ShoppingBag, ShoppingCart, Truck } from "lucide-react";
import type { CartSummaryProps } from "@/types/cart/CartSummaryProps";

export function CartSummary({ 
  subtotal, 
  shipping, 
  tax, 
  total, 
  itemCount,
  onCheckout, 
  onContinueShopping 
}: CartSummaryProps) {
  const discount = subtotal > 100 ? subtotal * 0.1 : 0; // 10% discount for orders over $100
  
  return (
    <Card className="glass-effect border border-glass-border sticky top-8">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Order Summary</h3>
            <p className="text-sm text-muted-foreground">{itemCount} items in cart</p>
          </div>
        </div>

        {/* Summary Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-success flex items-center gap-1">
                <Gift className="h-4 w-4" />
                Discount (10%)
              </span>
              <span className="font-medium text-success">-${discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
          
          <div className="h-px bg-border my-2" />
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-2xl text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Progress to Free Shipping */}
        {subtotal < 100 && (
          <div className="mt-6 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Free shipping on orders over $100
              </span>
              <span className="text-sm text-primary">
                ${(100 - subtotal).toFixed(2)} away
              </span>
            </div>
            <div className="h-2 bg-card rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${(subtotal / 100) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-6">
          <Button
            onClick={onCheckout}
            className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5" />
              Proceed to Checkout
              <ArrowRight className="h-5 w-5" />
            </div>
          </Button>
          
          <Button
            onClick={onContinueShopping}
            variant="outline"
            className="w-full border-border hover:border-primary"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Security Badges */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              Secure Payment
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3 w-3" />
              Free Returns
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Truck className="h-3 w-3" />
              Fast Shipping
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}