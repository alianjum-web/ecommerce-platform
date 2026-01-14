// "use client";

// import { protectCouponFormAction } from "@/actions/coupon";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { useCouponStore } from "@/store/useCouponStore";
// import { useRouter } from "next/navigation";
// import { useState } from "react";

// function SuperAdminManageCouponsPage() {
//   const [formData, setFormData] = useState({
//     code: "",
//     discountPercent: 0,
//     startDate: "",
//     endDate: "",
//     usageLimit: 0,
//   });
//   const router = useRouter();
//   const { toast } = useToast();
//   const { createCoupon, isLoading } = useCouponStore();

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleCreateUniqueCoupon = () => {
//     const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//     let result = "";
//     for (let i = 0; i < 8; i++) {
//       result += characters.charAt(
//         Math.floor(Math.random() * characters.length)
//       );
//     }

//     setFormData((prev) => ({
//       ...prev,
//       code: result,
//     }));
//   };

//   const handleCouponSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();
//     if (new Date(formData.endDate) <= new Date(formData.startDate)) {
//       console.log("logging");

//       toast({
//         title: "End date must be after start date",
//         variant: "destructive",
//       });

//       return;
//     }

//     const checkCouponFormvalidation = await protectCouponFormAction();
//     if (!checkCouponFormvalidation.success) {
//       toast({
//         title: checkCouponFormvalidation.error,
//         variant: "destructive",
//       });
//       return;
//     }

//     const couponData = {
//       ...formData,
//       discountPercent: parseFloat(formData.discountPercent.toString()),
//       usageLimit: parseInt(formData.usageLimit.toString()),
//     };

//     const result = await createCoupon(couponData);
//     if (result) {
//       toast({
//         title: "Coupon added successfully",
//       });

//       router.push("/super-admin/coupons/list");
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="flex flex-col gap-6">
//         <header className="flex items-center justify-between">
//           <h1>Create New Coupon</h1>
//         </header>
//         <form
//           onSubmit={handleCouponSubmit}
//           className="grid gap-6 md:grid-cols-2 lg:grid-cols-1"
//         >
//           <div className="space-y-4">
//             <div>
//               <Label>Start Date</Label>
//               <Input
//                 value={formData.startDate}
//                 onChange={handleInputChange}
//                 name="startDate"
//                 type="date"
//                 className="mt-1.5"
//                 required
//               />
//             </div>
//             <div>
//               <Label>End Date</Label>
//               <Input
//                 value={formData.endDate}
//                 onChange={handleInputChange}
//                 name="endDate"
//                 type="date"
//                 className="mt-1.5"
//                 required
//               />
//             </div>
//             <div>
//               <Label>Coupon Code</Label>
//               <div className="flex justify-between items-center gap-2">
//                 <Input
//                   type="text"
//                   name="code"
//                   placeholder="Enter coupon code"
//                   className="mt-1.5"
//                   required
//                   value={formData.code}
//                   onChange={handleInputChange}
//                 />
//                 <Button type="button" onClick={handleCreateUniqueCoupon}>
//                   Create Unique Code
//                 </Button>
//               </div>
//             </div>
//             <div>
//               <Label>Discount Percentage</Label>
//               <Input
//                 type="number"
//                 name="discountPercent"
//                 placeholder="Enter discount percentage"
//                 className="mt-1.5"
//                 required
//                 value={formData.discountPercent}
//                 onChange={handleInputChange}
//               />
//             </div>
//             <div>
//               <Label>Usage Limits</Label>
//               <Input
//                 type="number"
//                 name="usageLimit"
//                 placeholder="Enter usage limits"
//                 className="mt-1.5"
//                 required
//                 value={formData.usageLimit}
//                 onChange={handleInputChange}
//               />
//             </div>
//             <Button disabled={isLoading} type="submit" className="w-full">
//               {isLoading ? "creating..." : "Create"}
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default SuperAdminManageCouponsPage;

"use client";

import { protectCouponFormAction } from "@/actions/coupon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCouponStore } from "@/store/useCouponStore";
import { 
  Tag, 
  Percent, 
  Calendar, 
  Hash, 
  Sparkles, 
  Zap, 
  Ticket, 
  Clock,
  Users,
  Shield,
  Key,
  Copy,
  CheckCircle,
  AlertCircle,
  Rocket,
  Gift
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ==================== MODULAR COMPONENTS ====================

// 1. Coupon Preview Component
interface CouponPreviewProps {
  code: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
}

function CouponPreview({ 
  code, 
  discountPercent, 
  startDate, 
  endDate, 
  usageLimit 
}: CouponPreviewProps) {
  const isValidCoupon = code && discountPercent > 0 && startDate && endDate;
  
  if (!isValidCoupon) return null;

  const getDateStatus = () => {
    if (!startDate || !endDate) return 'inactive';
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    return 'active';
  };

  const status = getDateStatus();
  const statusColors = {
    active: 'bg-success/20 text-success border-success/20',
    upcoming: 'bg-warning/20 text-warning border-warning/20',
    expired: 'bg-destructive/20 text-destructive border-destructive/20',
    inactive: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className="glass-effect border border-glass-border overflow-hidden">
      <div className="relative">
        {/* Coupon Cut Pattern */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-6 w-4 bg-background rounded-r-full" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-6 w-4 bg-background rounded-l-full" />
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge className={statusColors[status as keyof typeof statusColors]}>
              {status === 'active' ? (
                <Zap className="h-3 w-3 mr-1" />
              ) : status === 'upcoming' ? (
                <Clock className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            
            <div className="text-xs text-muted-foreground">
              ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </div>

          {/* Coupon Code Display */}
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <code className="text-2xl font-bold tracking-widest text-foreground font-mono">
                  {code}
                </code>
                <Copy className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
              </div>
            </div>
          </div>

          {/* Discount Display */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-gradient-to-r from-primary to-secondary">
              <span className="text-4xl font-bold text-primary-foreground">
                {discountPercent}%
              </span>
              <span className="ml-2 text-lg text-primary-foreground/80">OFF</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Maximum discount applies
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Start Date
              </div>
              <p className="font-medium text-foreground">
                {new Date(startDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                End Date
              </div>
              <p className="font-medium text-foreground">
                {new Date(endDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Usage Limit
              </div>
              <p className="font-medium text-foreground">
                {usageLimit || '∞'} uses
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Security
              </div>
              <p className="font-medium text-foreground">
                Auto-generated
              </p>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// 2. Form Field Component
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  required?: boolean;
  tooltip?: string;
}

function FormField({ 
  label, 
  name, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  icon,
  required = false,
  tooltip 
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="flex items-center gap-2">
          {icon}
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="bg-input border-border focus:ring-primary/50 focus:border-primary"
      />
    </div>
  );
}

// 3. Date Validation Component
interface DateValidationProps {
  startDate: string;
  endDate: string;
}

function DateValidation({ startDate, endDate }: DateValidationProps) {
  if (!startDate || !endDate) return null;

  const isValid = new Date(endDate) > new Date(startDate);
  const daysValid = Math.floor(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  );

  return (
    <div className={`p-3 rounded-lg ${isValid ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle className="h-4 w-4 text-success" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        <div>
          <p className={`text-sm font-medium ${isValid ? 'text-success' : 'text-destructive'}`}>
            {isValid 
              ? `Valid for ${daysValid} days` 
              : 'End date must be after start date'
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {isValid 
              ? 'Coupon schedule is properly configured'
              : 'Please adjust your dates'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

function SuperAdminManageCouponsPage() {
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 0,
    startDate: "",
    endDate: "",
    usageLimit: 0,
  });
  
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const { createCoupon, isLoading } = useCouponStore();

  // Set default dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      startDate: prev.startDate || today,
      endDate: prev.endDate || nextMonthStr,
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Percent') || name.includes('Limit') ? parseFloat(value) || 0 : value,
    }));
  };

  const generateCouponCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const vowels = "AEIOU";
    const consonants = "BCDFGHJKLMNPQRSTVWXYZ";
    
    // Generate a readable code: CVC-CVC-XX
    let result = "";
    
    // First part: CVC
    for (let i = 0; i < 3; i++) {
      if (i % 2 === 0) {
        result += consonants.charAt(Math.floor(Math.random() * consonants.length));
      } else {
        result += vowels.charAt(Math.floor(Math.random() * vowels.length));
      }
    }
    
    result += "-";
    
    // Second part: CVC
    for (let i = 0; i < 3; i++) {
      if (i % 2 === 0) {
        result += consonants.charAt(Math.floor(Math.random() * consonants.length));
      } else {
        result += vowels.charAt(Math.floor(Math.random() * vowels.length));
      }
    }
    
    result += "-";
    
    // Last part: 2 numbers
    result += Math.floor(10 + Math.random() * 90);
    
    setFormData(prev => ({ ...prev, code: result }));
    setGeneratedCodes(prev => [result, ...prev.slice(0, 4)]);
  };

  const copyToClipboard = () => {
    if (formData.code) {
      navigator.clipboard.writeText(formData.code);
      toast({
        title: "Copied to clipboard",
        description: "Coupon code copied successfully",
      });
    }
  };

  const handleCouponSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Date validation
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    // Form validation
    const checkCouponFormvalidation = await protectCouponFormAction();
    if (!checkCouponFormvalidation.success) {
      toast({
        title: "Validation Error",
        description: checkCouponFormvalidation.error,
        variant: "destructive",
      });
      return;
    }

    const couponData = {
      ...formData,
      discountPercent: parseFloat(formData.discountPercent.toString()),
      usageLimit: parseInt(formData.usageLimit.toString()) || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await createCoupon(couponData);
    if (result) {
      toast({
        title: "Coupon Created!",
        description: "Your futuristic coupon has been created successfully",
        className: "bg-success/10 border-success/20 text-success",
      });

      // Reset form
      setFormData({
        code: "",
        discountPercent: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        usageLimit: 0,
      });
      
      router.push("/super-admin/coupons/list");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="glass-effect rounded-2xl p-6 mb-8 border border-glass-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -inset-2 rounded-xl bg-primary/20 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Create New Coupon
                </h1>
                <p className="text-muted-foreground">
                  Design powerful discount codes for your futuristic store
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/super-admin/coupons/list")}
                className="border-border hover:border-primary"
              >
                View All Coupons
              </Button>
              <Badge variant="outline" className="border-primary text-primary">
                <Rocket className="h-3 w-3 mr-1" />
                Beta
              </Badge>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-8">
            {/* Form Section */}
            <div className="glass-effect rounded-2xl p-6 border border-glass-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Coupon Details
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Configure your discount campaign
                  </p>
                </div>
              </div>

              <form onSubmit={handleCouponSubmit} className="space-y-6">
                {/* Code Generation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Coupon Code
                    </Label>
                    <Button
                      type="button"
                      onClick={generateCouponCode}
                      variant="outline"
                      size="sm"
                      className="border-border hover:border-primary"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Code
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      name="code"
                      placeholder="e.g., FUTURE20 or click Generate"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="flex-1 bg-input border-border font-mono"
                      required
                    />
                    <Button
                      type="button"
                      onClick={copyToClipboard}
                      variant="outline"
                      size="icon"
                      disabled={!formData.code}
                      className="border-border"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Recent Generated Codes */}
                  {generatedCodes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Recently generated:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {generatedCodes.map((code, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="cursor-pointer hover:border-primary hover:text-primary"
                            onClick={() => setFormData(prev => ({ ...prev, code }))}
                          >
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount Percentage */}
                <FormField
                  label="Discount Percentage"
                  name="discountPercent"
                  type="number"
                  placeholder="e.g., 20 for 20% off"
                  value={formData.discountPercent}
                  onChange={handleInputChange}
                  icon={<Percent className="h-4 w-4" />}
                  required
                  tooltip="Enter percentage discount (1-100)"
                />

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    icon={<Calendar className="h-4 w-4" />}
                    required
                  />
                  
                  <FormField
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    icon={<Calendar className="h-4 w-4" />}
                    required
                  />
                </div>

                {/* Date Validation */}
                <DateValidation 
                  startDate={formData.startDate} 
                  endDate={formData.endDate} 
                />

                {/* Usage Limit */}
                <FormField
                  label="Usage Limit"
                  name="usageLimit"
                  type="number"
                  placeholder="0 for unlimited"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  icon={<Users className="h-4 w-4" />}
                  tooltip="Set 0 for unlimited usage"
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Creating Coupon...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Gift className="h-5 w-5" />
                      Create Futuristic Coupon
                    </div>
                  )}
                </Button>
              </form>
            </div>

            {/* Tips Section */}
            <div className="glass-effect rounded-2xl p-6 border border-glass-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Pro Tips
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Use readable codes like "SUMMER25" for better brand recall</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Set usage limits to prevent abuse of high-value coupons</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Create seasonal coupons aligned with marketing campaigns</span>
                </li>
                <li className="flex items-start gap-2">
                  <Percent className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Test different discount percentages to find optimal conversion rates</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-8">
            {/* Preview Section */}
            <div className="sticky top-8">
              <div className="glass-effect rounded-2xl p-6 border border-glass-border mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">
                      Live Preview
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      See how your coupon will appear to customers
                    </p>
                  </div>
                </div>

                <CouponPreview
                  code={formData.code}
                  discountPercent={formData.discountPercent}
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  usageLimit={formData.usageLimit}
                />

                {/* Stats */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Strength</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 w-6 rounded-full ${
                            i < Math.min(formData.discountPercent / 20, 5)
                              ? 'bg-gradient-to-r from-primary to-secondary'
                              : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Impact</span>
                    <span className="font-medium text-foreground">
                      {formData.discountPercent > 30 ? 'High' : 
                       formData.discountPercent > 15 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Code Security</span>
                    <span className="font-medium text-success flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Strong
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="glass-effect rounded-2xl p-6 border border-glass-border">
                <h3 className="font-semibold text-foreground mb-4">Coupon Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">
                      {formData.discountPercent}%
                    </div>
                    <p className="text-xs text-muted-foreground">Discount Rate</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-secondary">
                      {formData.usageLimit || '∞'}
                    </div>
                    <p className="text-xs text-muted-foreground">Max Uses</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-accent">
                      {formData.code ? 'Active' : '—'}
                    </div>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {formData.startDate && formData.endDate 
                        ? Math.floor(
                            (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 
                            (1000 * 60 * 60 * 24)
                          )
                        : '—'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">Days Valid</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminManageCouponsPage;