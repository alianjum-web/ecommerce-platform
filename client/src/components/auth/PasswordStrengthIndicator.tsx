import { Check } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
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
  const strengthColors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-500"
  ];

  if (!password) return null;

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Password Strength</span>
        <span className={`font-medium ${
          strength >= 4 ? 'text-emerald-500' : 
          strength >= 2 ? 'text-yellow-500' : 'text-destructive'
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
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
        <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-500' : ''}`}>
          {password.length >= 8 ? 
            <Check className="w-3 h-3" /> : 
            <span className="w-1 h-1 rounded-full bg-current" />
          }
          <span>8+ chars</span>
        </div>
        <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-500' : ''}`}>
          {/[A-Z]/.test(password) ? 
            <Check className="w-3 h-3" /> : 
            <span className="w-1 h-1 rounded-full bg-current" />
          }
          <span>Uppercase</span>
        </div>
        <div className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-500' : ''}`}>
          {/[0-9]/.test(password) ? 
            <Check className="w-3 h-3" /> : 
            <span className="w-1 h-1 rounded-full bg-current" />
          }
          <span>Number</span>
        </div>
        <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-emerald-500' : ''}`}>
          {/[^A-Za-z0-9]/.test(password) ? 
            <Check className="w-3 h-3" /> : 
            <span className="w-1 h-1 rounded-full bg-current" />
          }
          <span>Special</span>
        </div>
      </div>
    </div>
  );
};