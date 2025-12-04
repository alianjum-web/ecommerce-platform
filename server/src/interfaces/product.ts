export interface MinimalProduct {
  productId: string;
  productName: string;
  productCategory: string;
  quantity: number;     
  size?: string | null;
  color?: string | null;
  price: number;
}
