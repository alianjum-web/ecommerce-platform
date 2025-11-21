// services/payment/card-payment.service.ts
import { PaymentMethod, PaymentOrderData, PaymentResult } from '../../interfaces/payment.interface';
import { getErrorMessage } from '../../utils/catchError';

export class CardPaymentService implements PaymentMethod {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CARD_PAYMENT_API_KEY!;
    this.baseUrl = process.env.CARD_PAYMENT_BASE_URL!;
  }

  async createOrder(orderData: PaymentOrderData): Promise<PaymentResult> {
    try {
      // Simulate card payment processing
      // In real scenario, you'd integrate with payment gateway like Braintree, Authorize.net, etc.
      
      const paymentPayload = {
        amount: orderData.total,
        currency: orderData.currency || 'USD',
        order_id: `order_${Date.now()}`,
        items: orderData.items.map(item => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity
        })),
        customer: {
          user_id: orderData.userId
        }
      };

      // For demo - in real app, you'd make API call to payment gateway
      const mockPaymentResponse = {
        id: `card_pay_${Date.now()}`,
        status: 'pending',
        payment_url: `${this.baseUrl}/pay/${Date.now()}`,
        requires_3ds: true
      };

      return {
        success: true,
        paymentId: mockPaymentResponse.id,
        orderId: paymentPayload.order_id,
        data: mockPaymentResponse
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  async capturePayment(paymentId: string, cardData?: any): Promise<PaymentResult> {
    try {
      // Simulate card payment capture
      // In real scenario, process the card payment
      
      if (!this.validateCardData(cardData)) {
        return {
          success: false,
          error: 'Invalid card data'
        };
      }

      const mockCaptureResponse = {
        id: paymentId,
        status: 'completed',
        transaction_id: `txn_${Date.now()}`,
        amount: cardData.amount,
        captured_at: new Date().toISOString()
      };

      return {
        success: true,
        paymentId: mockCaptureResponse.transaction_id,
        data: mockCaptureResponse
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  validatePayment(data: any): boolean {
    return !!(data.items && data.total && data.items.length > 0);
  }

  private validateCardData(cardData: any): boolean {
    if (!cardData) return false;
    
    const { cardNumber, expiryMonth, expiryYear, cvv, cardholderName } = cardData;
    
    // Basic validation
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) return false;
    if (!expiryMonth || !expiryYear) return false;
    if (!cvv || (cvv.length !== 3 && cvv.length !== 4)) return false;
    if (!cardholderName) return false;

    return true;
  }

  getName(): string {
    return "CARD";
  }

  // Card tokenization for security
  async tokenizeCard(cardData: any) {
    try {
      // In real app, tokenize card with payment gateway
      const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        token: token,
        card_type: this.detectCardType(cardData.cardNumber)
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error)
      };
    }
  }

  private detectCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)) return 'VISA';
    if (/^5[1-5][0-9]{14}$/.test(cleaned)) return 'MASTERCARD';
    if (/^3[47][0-9]{13}$/.test(cleaned)) return 'AMEX';
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(cleaned)) return 'DISCOVER';
    
    return 'UNKNOWN';
  }
}