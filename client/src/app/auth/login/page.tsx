// src/app/auth/login/page.tsx - SIMPLIFIED VERSION
"use client";

import Image from "next/image";
import banner from "../../../../public/images/banner2.jpg";
import logo from "../../../../public/images/logo.avif";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

const ROUTES = {
  SUPER_ADMIN: "/super-admin",
  HOME: "/home",
  REGISTER: "/auth/register",
} as const;

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const { toast } = useToast();
  const { login, isLoading, user, error } = useAuthStore();
  const router = useRouter();

  // ✅ SIMPLIFIED: Single redirect effect
  useEffect(() => {
    if (user) {
      console.log("🎯 User authenticated, redirecting...");
      const targetPath = user.role === "SUPER_ADMIN" ? ROUTES.SUPER_ADMIN : ROUTES.HOME;
      router.push(targetPath);
    }
  }, [user, router]);

  // ✅ SIMPLIFIED: Clean form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await login(formData.email, formData.password);

      if (success) {
        toast({
          title: "Login Successful!",
          description: "Redirecting to your dashboard...",
        });
        // Redirect will be handled by the useEffect above
      } else {
        throw new Error(error || "Login failed");
      }
    } catch (err) {
      toast({
        title: "Login Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof typeof formData) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ 
        ...prev, 
        [field]: e.target.value 
      }));
    };

  return (
    <div className="min-h-screen bg-[#fff6f4] flex">
      {/* Banner Section */}
      <div className="hidden lg:block w-1/2 bg-[#ffede1] relative overflow-hidden">
        <Image
          src={banner}
          alt="Login Banner"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
        />
      </div>
      
      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-center mb-8">
            <Image src={logo} width={200} height={50} alt="Company Logo" priority />
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                className="bg-[#ffede1] focus:ring-2 focus:ring-black transition-colors"
                autoComplete="email"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={handleInputChange('email')}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                className="bg-[#ffede1] focus:ring-2 focus:ring-black transition-colors"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={handleInputChange('password')}
                disabled={isLoading}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 transition-colors py-2.5"
              disabled={isLoading}
            >
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </Button>
            
            <p className="text-center text-[#3f3d56] text-sm">
              New here?{" "}
              <Link
                href={ROUTES.REGISTER}
                className="text-black hover:underline font-semibold transition-colors"
              >
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;