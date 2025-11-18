"use client";

import Image from "next/image";
import banner from "../../../../public/images/banner2.jpg";
import logo from "../../../../public/images/logo1.png";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { DebugAuth } from "@/components/debug/DebugAuth";

function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { toast } = useToast();
  const { login, isLoading, user, error, triggerRedirect } = useAuthStore();
  const router = useRouter();

  // ✅ FIX: Improved redirect with better state handling
  useEffect(() => {
    console.log("🔄 Redirect useEffect - user:", user, "redirecting:", isRedirecting);
    
    if (user && !isRedirecting) {
      console.log("🎯 REDIRECT CONDITION MET - User:", user.email);
      setIsRedirecting(true);
      
      const redirectTimer = setTimeout(() => {
        const targetPath = user.role === "SUPER_ADMIN" ? "/super-admin" : "/home";
        console.log("🚀 Redirecting to:", targetPath);
        
        // ✅ FIX: Use push instead of replace for better navigation
        router.push(targetPath);
      }, 200); // Increased delay for state persistence
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, isRedirecting, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
   
    console.log("🟡 Login form submitted");
    console.log("🟡 Form data:", formData);

    const success = await login(formData.email, formData.password);

    console.log("🟡 Login result:", success);
    
    // ✅ FIX: Get fresh state after login
    const currentState = useAuthStore.getState();
    console.log("🟡 Store state after login:", currentState);

    if (success) {
      toast({
        title: "Login Successful!",
        description: "Redirecting to your dashboard...",
      });
      
      // DEVELOPMENT: Force check after successful login
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          const updatedState = useAuthStore.getState();
          console.log("🔧 DEVELOPMENT - State after timeout:", updatedState);
          if (updatedState.user && !isRedirecting) {
            console.log("🔧 DEVELOPMENT - User exists but redirect didn't trigger!");
            // Force redirect
            setIsRedirecting(true);
            const targetPath = updatedState.user.role === "SUPER_ADMIN" ? "/super-admin" : "/home";
            router.push(targetPath);
          }
        }, 1000);
      }
    } else {
      toast({
        title: error || "Login failed",
        variant: "destructive",
      });
    }
  };

  // DEVELOPMENT: Add manual redirect button
  const handleManualRedirect = () => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      console.log("🔧 Manual redirect for:", currentUser.email);
      setIsRedirecting(true);
      const targetPath = currentUser.role === "SUPER_ADMIN" ? "/super-admin" : "/home";
      router.push(targetPath);
      toast({
        title: "Manual redirect triggered!",
        description: `Redirecting ${currentUser.email}`,
      });
    } else {
      toast({
        title: "No user found for redirect",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fff6f4] flex">
      <DebugAuth />
      
      {/* DEVELOPMENT: Manual redirect button */}
      {process.env.NODE_ENV === 'development' && (
        <button 
          onClick={handleManualRedirect}
          className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50"
        >
          🔧 Manual Redirect
        </button>
      )}
      
      <div className="hidden lg:block w-1/2 bg-[#ffede1] relative overflow-hidden">
        <Image
          src={banner}
          alt="Register"
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
        />
      </div>
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="flex justify-center">
            <Image src={logo} width={200} height={50} alt="Logo" />
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="bg-[#ffede1]"
                autoComplete="email"
                placeholder="Enter your email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="bg-[#ffede1]"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-black transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </Button>
            <p className="text-center text-[#3f3d56] text-sm">
              New here{" "}
              <Link
                href={"/auth/register"}
                className="text-[#000] hover:underline font-bold"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
  // const handleSubmit = async (event: React.FormEvent) => {
  //   event.preventDefault();
  //  //     const checkFirstLevelOfValidation = await protectSignInAction(
  //   //   formData.email
  //   // );

  //   // if (!checkFirstLevelOfValidation.success) {
  //   //   toast({
  //   //     title: checkFirstLevelOfValidation.error,
  //   //     variant: "destructive",
  //   //   });
  //   //   return;
  //   // }