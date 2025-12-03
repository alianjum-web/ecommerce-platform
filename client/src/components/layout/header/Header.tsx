// "use client";

// import { TopBar } from "./TopBar";
// import { SearchBar } from "./SearchBar";
// import { CartButton } from "./CartButton";
// import { WishlistButton } from "./WishlistButton";
// import { UserMenu } from "./UserMenu";
// import { MobileNav } from "./MobileNav";
// import { DesktopNav } from "./DesktopNav";
// import ThemeToggle from "../common/ThemeToggler";

// import Link from "next/link";
// import { Button } from "../ui/button";
// import { Bell, Headphones } from "lucide-react";
// import { useAuthStore } from "@/store/useAuthStore";

// export function Header() {
//   const { user } = useAuthStore();

//   return (
//     <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//       <TopBar />
      
//       <div className="container mx-auto px-4">
//         {/* Main Header Row */}
//         <div className="flex items-center justify-between h-16 gap-4">
//           {/* Logo */}
//           <div className="flex items-center space-x-2">
//             <Button variant="ghost" size="icon" className="lg:hidden" asChild>
//               <MobileNav />
//             </Button>
//             <Link href="/" className="flex items-center space-x-3">
//               <div className="relative">
//                 <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
//                   <span className="text-xl font-bold text-white">FS</span>
//                 </div>
//                 <div className="absolute -inset-1 rounded-xl bg-primary/10 animate-pulse"></div>
//               </div>
//               <div className="hidden sm:block">
//                 <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
//                   FutureShop
//                 </h1>
//                 <p className="text-xs text-muted-foreground">Premium E-Commerce</p>
//               </div>
//             </Link>
//           </div>

//           {/* Desktop Search */}
//           <div className="hidden lg:flex flex-1 max-w-2xl mx-4">
//             <SearchBar variant="desktop" />
//           </div>

//           {/* Actions */}
//           <div className="flex items-center space-x-2">
//             {/* Customer Support */}
//             <Button
//               variant="ghost"
//               size="icon"
//               className="hidden xl:inline-flex"
//               asChild
//             >
//               <Link href="/support">
//                 <Headphones className="h-5 w-5" />
//                 <span className="sr-only">Support</span>
//               </Link>
//             </Button>

//             {/* Notifications */}
//             <Button
//               variant="ghost"
//               size="icon"
//               className="relative hidden md:inline-flex"
//               asChild
//             >
//               <Link href="/notifications">
//                 <Bell className="h-5 w-5" />
//                 <span className="absolute -top-1 -right-1 h-5 w-5 bg-secondary text-secondary-foreground text-xs rounded-full flex items-center justify-center">
//                   3
//                 </span>
//               </Link>
//             </Button>

//             {/* Theme Toggle */}
//             <ThemeToggle />

//             {/* Wishlist */}
//             <WishlistButton />

//             {/* Cart */}
//             <CartButton />

//             {/* User Menu */}
//             <UserMenu />

//             {/* Mobile Search Trigger */}
//             <Button variant="ghost" size="icon" className="lg:hidden" asChild>
//               <MobileNav />
//             </Button>
//           </div>
//         </div>

//         {/* Desktop Navigation */}
//         <DesktopNav />

//         {/* Mobile Search (Hidden on desktop) */}
//         <div className="lg:hidden py-3">
//           <SearchBar variant="mobile" />
//         </div>
//       </div>
//     </header>
//   );
// }

// export default Header;