// "use client";
"use client";

import Image from "next/image";
import banner from "../../../../public/images/banner2.jpg";
import logo from "../../../../public/images/logo.avif";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { protectSignUpAction } from "@/actions/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, User, Mail, Lock, Shield, Check, Sparkles, Zap } from "lucide-react";

// Schema validation
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Modular Components
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const getStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strengthColors = ["bg-destructive", "bg-warning", "bg-warning", "bg-success", "bg-success"];

  return password ? (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password Strength</span>
        <span className={`font-medium ${
          strength >= 4 ? 'text-success' : 
          strength >= 2 ? 'text-warning' : 'text-destructive'
        }`}>
          {strengthLabels[strength]}
        </span>
      </div>
      <div className="h-2 rounded-full bg-card overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${strengthColors[strength]}`}
          style={{ width: `${(strength / 4) * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
        <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-success' : ''}`}>
          {password.length >= 8 ? <Check className="w-3 h-3" /> : <span className="w-1 h-1 rounded-full bg-current" />}
          <span>8+ chars</span>
        </div>
        <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-success' : ''}`}>
          {/[A-Z]/.test(password) ? <Check className="w-3 h-3" /> : <span className="w-1 h-1 rounded-full bg-current" />}
          <span>Uppercase</span>
        </div>
        <div className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-success' : ''}`}>
          {/[0-9]/.test(password) ? <Check className="w-3 h-3" /> : <span className="w-1 h-1 rounded-full bg-current" />}
          <span>Number</span>
        </div>
        <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-success' : ''}`}>
          {/[^A-Za-z0-9]/.test(password) ? <Check className="w-3 h-3" /> : <span className="w-1 h-1 rounded-full bg-current" />}
          <span>Special</span>
        </div>
      </div>
    </div>
  ) : null;
};

const InputField = ({ 
  label, 
  type, 
  icon: Icon, 
  error, 
  ...props 
}: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  
  return (
    <div className="space-y-2">
      <Label htmlFor={props.name} className="text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </Label>
      <div className="relative group">
        <Input
          {...props}
          type={isPassword && showPassword ? 'text' : type}
          className={`pl-10 pr-10 bg-card/50 backdrop-blur-sm border-glass-border focus:border-primary focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/60 transition-all duration-300 ${
            error ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/50' : ''
          } group-hover:border-primary/50`}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
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

const BenefitsGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
    <div className="flex items-start gap-3 p-3 rounded-lg glass-effect border-glass-border hover:border-primary/30 transition-all duration-300">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Shield className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">Secure Account</p>
        <p className="text-xs text-muted-foreground">Military-grade encryption</p>
      </div>
    </div>
    <div className="flex items-start gap-3 p-3 rounded-lg glass-effect border-glass-border hover:border-secondary/30 transition-all duration-300">
      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
        <Zap className="w-4 h-4 text-secondary" />
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">Fast Onboarding</p>
        <p className="text-xs text-muted-foreground">Get started in seconds</p>
      </div>
    </div>
  </div>
);

const LoadingButton = ({ isLoading }: { isLoading: boolean }) => (
  <Button
    type="submit"
    className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary-light neon-border hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
    disabled={isLoading}
  >
    <span className="relative z-10 flex items-center justify-center gap-2">
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          CREATING ACCOUNT...
        </>
      ) : (
        <>
          CREATE ACCOUNT
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </>
      )}
    </span>
    {!isLoading && (
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
    )}
  </Button>
);

// Main Register Component
function RegisterPage() {
  const { toast } = useToast();
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const checkFirstLevelOfValidation = await protectSignUpAction(data.email);
      
      if (!checkFirstLevelOfValidation.success) {
        setError("email", {
          type: "manual",
          message: checkFirstLevelOfValidation.error,
        });
        toast({
          title: "⚠️ Registration Error",
          description: checkFirstLevelOfValidation.error,
          variant: "destructive",
        });
        return;
      }

      const userId = await register(data.name, data.email, data.password);
      
      if (userId) {
        toast({
          title: "🎉 Account Created!",
          description: "Your futuristic account is ready. Redirecting to login...",
          className: "bg-primary/10 border-primary/20",
        });
        
        // Add a celebratory effect
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "🚨 Registration Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground theme-transition relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="error-grid absolute inset-0 opacity-5" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="error-particle absolute animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 6 + 4}s`,
              '--particle-opacity': '0.15',
            } as any}
          />
        ))}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Banner Section - Enhanced */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden group">
          <div className="absolute inset-0">
            <Image
              src={banner}
              alt="Register Banner"
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
              priority
              className="scale-105 group-hover:scale-100 transition-transform duration-1000"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
          <div className="hologram-effect absolute inset-0 opacity-20" />
          
          {/* Animated elements */}
          <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full border border-primary/30 animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-full border border-secondary/30 animate-float animation-delay-2000" />
          
          <div className="absolute bottom-10 left-10 max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Join the <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Revolution</span>
              </h2>
            </div>
            <p className="text-muted-foreground">
              Create your account and unlock access to cutting-edge features, exclusive content, and a personalized futuristic experience.
            </p>
          </div>
        </div>
        
        {/* Form Section - Enhanced */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 lg:p-12 relative">
          <div className="max-w-md w-full mx-auto">
            {/* Logo Section */}
            <div className="flex justify-center mb-8 group">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-500" />
                <Image 
                  src={logo} 
                  width={180} 
                  height={45} 
                  alt="Company Logo" 
                  priority 
                  className="relative z-10"
                />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2 text-foreground">
                Create Account
              </h1>
              <p className="text-muted-foreground">
                Begin your journey into the future
              </p>
              <div className="w-16 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto rounded-full mt-4" />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <InputField
                label="Full Name"
                type="text"
                icon={User}
                placeholder="Enter your name"
                {...registerField("name")}
                error={errors.name}
                disabled={isLoading}
              />
              
              <InputField
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="Enter your email"
                {...registerField("email")}
                error={errors.email}
                disabled={isLoading}
              />
              
              <InputField
                label="Password"
                type="password"
                icon={Lock}
                placeholder="Create a strong password"
                {...registerField("password")}
                error={errors.password}
                disabled={isLoading}
              />
              
              <PasswordStrengthIndicator password={password} />
              
              <InputField
                label="Confirm Password"
                type="password"
                icon={Lock}
                placeholder="Confirm your password"
                {...registerField("confirmPassword")}
                error={errors.confirmPassword}
                disabled={isLoading}
              />

              <BenefitsGrid />
              
              <LoadingButton isLoading={isLoading} />
              
              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-primary hover:text-primary-light font-semibold transition-colors group inline-flex items-center gap-1"
                  >
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </div>
            </form>

            {/* Terms */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground/60">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-primary/70 hover:text-primary">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary/70 hover:text-primary">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/50">
          <span className="w-1 h-1 rounded-full bg-primary/30 animate-pulse" />
          <span>Secure Registration System</span>
          <span className="w-1 h-1 rounded-full bg-secondary/30 animate-pulse animation-delay-1000" />
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;