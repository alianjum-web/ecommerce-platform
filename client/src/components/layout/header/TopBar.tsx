import { Button } from "@/components/ui/button";
import { Globe, Truck, Headphones, Smartphone, BadgePercent } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

export function TopBar() {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-9 text-sm">
          {/* Left side - Promotions */}
          <div className="flex items-center space-x-4 overflow-x-auto">
            <div className="flex items-center shrink-0">
              <Truck className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <span className="text-primary font-medium">🚀 Free shipping over $50</span>
            </div>
            <div className="hidden md:flex items-center shrink-0">
              <BadgePercent className="h-3.5 w-3.5 mr-1.5 text-secondary" />
              <span className="text-secondary">30-Day Return Policy</span>
            </div>
            <div className="hidden lg:flex items-center shrink-0">
              <Headphones className="h-3.5 w-3.5 mr-1.5 text-green-500" />
              <span className="text-green-600">24/7 Customer Support</span>
            </div>
            <Button 
              variant="link" 
              size="sm" 
              className="hidden xl:inline text-xs px-2 h-6 bg-primary/20 rounded"
              asChild
            >
              <Link href="/app-download">
                <Smartphone className="h-3 w-3 mr-1" />
                Download App - Get ₹100 Off
              </Link>
            </Button>
          </div>

          {/* Right side - Utilities */}
          <div className="flex items-center space-x-3">
            {/* Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <span className="font-mono">$ USD</span>
                  <Globe className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>$ USD</DropdownMenuItem>
                <DropdownMenuItem>€ EUR</DropdownMenuItem>
                <DropdownMenuItem>£ GBP</DropdownMenuItem>
                <DropdownMenuItem>₹ INR</DropdownMenuItem>
                <DropdownMenuItem>¥ JPY</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  English
                  <Globe className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>Español</DropdownMenuItem>
                <DropdownMenuItem>Français</DropdownMenuItem>
                <DropdownMenuItem>Deutsch</DropdownMenuItem>
                <DropdownMenuItem>中文</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Links */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="h-7" asChild>
                <Link href="/store-locator">Store Locator</Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-7" asChild>
                <Link href="/track-order">Track Order</Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-7" asChild>
                <Link href="/business">Business</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}