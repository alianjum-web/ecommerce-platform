export interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
  onContinueShopping: () => void;
}