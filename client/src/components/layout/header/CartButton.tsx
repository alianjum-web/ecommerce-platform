// "use client";

// import { ShoppingCart, Plus, Minus } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import { useCartStore } from "@/store/useCartStore";
// import { useEffect, useState } from "react";
// import Link from "next/link";
// import Image from "next/image";

// export function CartButton() {
//   const { items, fetchCart } = useCartStore();
//   const { updateQuantity, removeItem, total, isLoading } = useCartStore();  
//   const [isOpen, setIsOpen] = useState(false);

//   useEffect(() => {
//     fetchCart();
//   }, [fetchCart]);

//   const handleQuantityChange = async (id: string, quantity: number) => {
//     if (quantity < 1) return;
//     await updateQuantity(id, quantity);
//   };

//   const handleRemove = async (id: string) => {
//     await removeItem(id);
//   };

//   return (
//     <>
//       <Sheet open={isOpen} onOpenChange={setIsOpen}>
//         <SheetTrigger asChild>
//           <Button variant="ghost" size="icon" className="relative">
//             <ShoppingCart className="h-5 w-5" />
//             {items.length > 0 && (
//               <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center animate-bounce">
//                 {items.length}
//               </span>
//             )}
//           </Button>
//         </SheetTrigger>
//         <SheetContent side="right" className="w-full sm:max-w-md">
//           <SheetHeader>
//             <SheetTitle>Shopping Cart ({items.length} items)</SheetTitle>
//           </SheetHeader>
          
//           {isLoading ? (
//             <div className="flex items-center justify-center h-64">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//             </div>
//           ) : items.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-64 space-y-4">
//               <ShoppingCart className="h-16 w-16 text-muted-foreground/50" />
//               <p className="text-muted-foreground">Your cart is empty</p>
//               <Button onClick={() => setIsOpen(false)} asChild>
//                 <Link href="/products">Continue Shopping</Link>
//               </Button>
//             </div>
//           ) : (
//             <>
//               <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
//                 {items.map((item) => (
//                   <div key={item.id} className="flex items-center space-x-4 p-2 border rounded-lg">
//                     <div className="relative h-16 w-16">
//                       <Image
//                         src={item.image || "/placeholder.jpg"}
//                         alt={item.name}
//                         fill
//                         className="object-cover rounded"
//                       />
//                     </div>
//                     <div className="flex-1">
//                       <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
//                       <p className="text-sm text-muted-foreground">${item.price}</p>
//                       <div className="flex items-center justify-between mt-2">
//                         <div className="flex items-center border rounded">
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="h-7 w-7"
//                             onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
//                           >
//                             <Minus className="h-3 w-3" />
//                           </Button>
//                           <span className="px-3 text-sm">{item.quantity}</span>
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="h-7 w-7"
//                             onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
//                           >
//                             <Plus className="h-3 w-3" />
//                           </Button>
//                         </div>
//                         <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
//                       </div>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="h-8 w-8"
//                       onClick={() => handleRemove(item.id)}
//                     >
//                       ×
//                     </Button>
//                   </div>
//                 ))}
//               </div>

//               <div className="mt-6 space-y-4 border-t pt-4">
//                 <div className="flex justify-between text-sm">
//                   <span>Subtotal</span>
//                   <span className="font-medium">${total.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-sm">
//                   <span>Shipping</span>
//                   <span>{total > 50 ? "FREE" : "$5.99"}</span>
//                 </div>
//                 <div className="flex justify-between text-lg font-bold">
//                   <span>Total</span>
//                   <span>${(total > 50 ? total : total + 5.99).toFixed(2)}</span>
//                 </div>

//                 <div className="flex space-x-2">
//                   <Button
//                     onClick={() => setIsOpen(false)}
//                     variant="outline"
//                     className="flex-1"
//                     asChild
//                   >
//                     <Link href="/cart">View Cart</Link>
//                   </Button>
//                   <Button className="flex-1" asChild>
//                     <Link href="/checkout">Checkout</Link>
//                   </Button>
//                 </div>

//                 <div className="text-xs text-muted-foreground text-center">
//                   <p>Free shipping on orders over $50</p>
//                   <p>30-day return policy</p>
//                 </div>
//               </div>
//             </>
//           )}
//         </SheetContent>
//       </Sheet>
//     </>
//   );
// }