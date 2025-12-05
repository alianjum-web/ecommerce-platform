// interfaces/payment.interface.ts
export interface PaymentMethod {
  createOrder(orderData: any): Promise<any>;
  capturePayment(paymentId: string, data?: any): Promise<any>;
  validatePayment(data: any): boolean;
  getName(): string;
}

export interface PaymentOrderData {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
  total: number;
  currency?: string;
  userId: string;
  internalOrderId: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  data?: any;
  error?: string;
}