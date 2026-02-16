"use client";

import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
// import { warmupService } from "@/utils/warmupService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, Rocket, Shield, Zap } from "lucide-react";

// Schema validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Routes
const ROUTES = {
  SUPER_ADMIN: "/super-admin",
  HOME: "/home",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
} as const;

// Modular Components
const WarmupStatus = ({ isWarming }: { isWarming: boolean }) => (
  <div className={`mb-6 transition-all duration-500 ${isWarming ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
    <div className="rounded-xl p-4 glass-effect border-glass-border neon-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <Rocket className="w-4 h-4 text-white animate-float" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">🚀 Initializing Systems</p>
          <p className="text-sm text-muted-foreground">Optimizing your experience...</p>
        </div>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 h-1 rounded-full bg-card overflow-hidden">
        <div className="h-full w-0 bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer rounded-full" />
      </div>
    </div>
  </div>
);

const SecurityBadge = () => (
  <div className="rounded-xl p-4 glass-effect border-glass-border mb-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Shield className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-foreground">Secure Authentication</p>
        <p className="text-sm text-muted-foreground">Enterprise-grade security</p>
      </div>
    </div>
  </div>
);

const ThemeTogglePlaceholder = () => (
  <div className="absolute top-6 right-6">
    <div className="w-10 h-6 rounded-full bg-card border border-glass-border relative">
      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary transition-all duration-300" />
    </div>
  </div>
);

const InputField = ({ 
  label, 
  type, 
  icon: Icon, 
  error, 
  ...props 
}: any) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="space-y-2">
      <Label htmlFor={props.name} className="text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </Label>
      <div className="relative group">
        <Input
          {...props}
          type={type === 'password' && showPassword ? 'text' : type}
          className={`pl-10 pr-10 bg-card/50 backdrop-blur-sm border-glass-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 ${
            error ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/50' : ''
          } group-hover:border-primary/50`}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        {type === 'password' && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-destructive text-sm flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
          {error.message}
        </p>
      )}
    </div>
  );
};

const LoadingButton = ({ isLoading, isWarming }: { isLoading: boolean; isWarming: boolean }) => (
  <Button
    type="submit"
    className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary-light neon-border hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
    disabled={isLoading || isWarming}
  >
    <span className="relative z-10 flex items-center justify-center gap-2">
      {isLoading || isWarming ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {isWarming ? "INITIALIZING..." : "AUTHENTICATING..."}
        </>
      ) : (
        <>
          <Zap className="w-4 h-4" />
          ACCESS SYSTEM
        </>
      )}
    </span>
    {(isLoading || isWarming) && (
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent animate-shimmer" />
    )}
  </Button>
);

// Main Login Component
function LoginPage() {
  const [isWarming, setIsWarming] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { toast } = useToast();
  const { login, isLoading, user, error } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    setFocus("email");
    
    // const pre = async () => {
    //   if (warmupService.shouldWarm()) {
    //     setIsWarming(true);
    //     await warmupService.warmBackend();
    //     setIsWarming(false);
    //   }
    // };
    // pre();
  }, [setFocus]);

  useEffect(() => {
    if (user) {
      console.log("🎯 User authenticated, redirecting...");
      const targetPath = user.role === "SUPER_ADMIN" ? ROUTES.SUPER_ADMIN : ROUTES.HOME;
      
      // Add a brief delay for visual feedback
      setTimeout(() => {
        router.push(targetPath);
      }, 500);
    }
  }, [user, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      // if (warmupService.shouldWarm()) {
      //   setIsWarming(true);
      //   await warmupService.ensureWarm();
      //   setIsWarming(false);
      // }

      const success = await login(data.email, data.password);

      if (success) {
        toast({
          title: "🔐 Access Granted",
          description: "Welcome back! Redirecting to dashboard...",
          className: "bg-primary/10 border-primary/20",
        });
      } else {
        throw new Error(error || "Authentication failed");
      }
    } catch (err) {
      toast({
        title: "⚠️ Authentication Error",
        description: err instanceof Error ? err.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const isSubmitDisabled = isLoading || isWarming;

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0 opacity-5" />
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="error-particle absolute animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
              '--particle-opacity': '0.1',
            } as any}
          />
        ))}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Banner Section - Enhanced */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden group">
          <div className="absolute inset-0">
            <Image
              src="images/banner2.jpg"
              alt="Login Banner"
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
              priority
              className="scale-110 group-hover:scale-100 transition-transform duration-700"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/50 to-transparent" />
          <div className="hologram-effect absolute inset-0 opacity-30" />
          
          {/* Floating elements */}
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full border border-primary/20 animate-float" />
          <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full border border-secondary/20 animate-float animation-delay-1000" />
          
          <div className="absolute bottom-10 left-10 max-w-md">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Welcome to the <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Future</span>
            </h2>
            <p className="text-muted-foreground">
              Experience next-generation authentication with cutting-edge security and lightning-fast performance.
            </p>
          </div>
        </div>
        
        {/* Form Section - Enhanced */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 relative">
          <ThemeTogglePlaceholder />
          
          <div className="max-w-md w-full mx-auto">
            <WarmupStatus isWarming={isWarming} />
            
            {/* Logo Section */}
            <div className="flex justify-center mb-8 group">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500" />
                <Image 
                  src="/images/logo.webp" 
                  width={180} 
                  height={45} 
                  alt="Company Logo" 
                  priority 
                  className="relative z-10"
                />
              </div>
            </div>
            
            <SecurityBadge />
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <InputField
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="Enter your email"
                autoComplete="email"
                {...register("email")}
                error={errors.email}
                disabled={isSubmitDisabled}
              />
              
              <InputField
                label="Password"
                type="password"
                icon={Lock}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
                error={errors.password}
                disabled={isSubmitDisabled}
              />
              
              <div className="flex items-center justify-between text-sm">
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="text-primary hover:text-primary-light transition-colors flex items-center gap-1"
                >
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  Forgot Password?
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <span className="text-muted-foreground">Secure Connection</span>
                </div>
              </div>
              
              <LoadingButton isLoading={isLoading} isWarming={isWarming} />
              
              <div className="text-center">
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    href={ROUTES.REGISTER}
                    className="text-primary hover:text-primary-light font-semibold transition-colors group"
                  >
                    Create Account
                    <span className="block h-px w-0 group-hover:w-full bg-primary transition-all duration-300" />
                  </Link>
                </p>
              </div>
            </form>
            
            {/* Features Grid */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg glass-effect border-glass-border">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Fast Login</p>
              </div>
              <div className="text-center p-3 rounded-lg glass-effect border-glass-border">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-4 h-4 text-secondary" />
                </div>
                <p className="text-xs text-muted-foreground">Secure</p>
              </div>
              <div className="text-center p-3 rounded-lg glass-effect border-glass-border">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
                  <Rocket className="w-4 h-4 text-accent" />
                </div>
                <p className="text-xs text-muted-foreground">Modern</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground/50">
        <p>© 2024 Futuristic Auth System. All rights reserved.</p>
      </div>
    </div>
  );
}

export default LoginPage;