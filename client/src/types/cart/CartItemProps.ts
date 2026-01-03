export interface CartItemProps {
  item: any;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  isUpdating: boolean;
}

