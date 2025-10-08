// services/order.service.ts
import { PrismaClient, Product, Coupon } from '@prisma/client';

export class OrderService {
  constructor(private prisma: PrismaClient) {}

  async validateProductsStock(items: any[]): Promise<{ valid: boolean; outOfStock: string[] }> {
    const productIds = items.map(item => item.productId);
    
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true }
    });

    const outOfStock: string[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        outOfStock.push(`Product not found: ${item.productId}`);
      } else if (product.stock < item.quantity) {
        outOfStock.push(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
    }

    return { valid: outOfStock.length === 0, outOfStock };
  }

  async validateCoupon(couponId: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
    if (!couponId) return { valid: true };

    const coupon = await this.prisma.coupon.findUnique({
      where: { id: couponId }
    });

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    const now = new Date();
    if (now < coupon.startDate) {
      return { valid: false, error: 'Coupon not yet active' };
    }

    if (now > coupon.endDate) {
      return { valid: false, error: 'Coupon has expired' };
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    return { valid: true, coupon };
  }

  async checkProductAvailability(productId: string, quantity: number): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true }
    });

    return product ? product.stock >= quantity : false;
  }
}