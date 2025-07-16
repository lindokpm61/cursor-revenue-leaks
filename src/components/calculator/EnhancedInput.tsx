import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationRule {
  min?: number;
  max?: number;
  required?: boolean;
  pattern?: RegExp;
  message?: string;
}

interface EnhancedInputProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  type?: "text" | "number" | "email" | "tel";
  icon?: React.ReactNode;
  helpText?: string;
  validation?: ValidationRule;
  benchmark?: {
    value: number;
    label: string;
    type: "good" | "warning" | "danger";
  };
  industryDefaults?: {
    [key: string]: number;
  };
  currentIndustry?: string;
  className?: string;
  suffix?: string;
  formatValue?: (value: number) => string;
}

export const EnhancedInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  helpText,
  validation,
  benchmark,
  industryDefaults,
  currentIndustry,
  className,
  suffix,
  formatValue,
}: EnhancedInputProps) => {
  const [error, setError] = useState<string>("");
  const [isValid, setIsValid] = useState(true);
  const [showBenchmark, setShowBenchmark] = useState(false);

  const numericValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const stringValue = typeof value === "number" ? value.toString() : value;

  // Get industry default suggestion
  const industryDefault = currentIndustry && industryDefaults?.[currentIndustry];

  // Validate input
  useEffect(() => {
    if (!validation) return;

    let errorMessage = "";
    let valid = true;

    if (validation.required && (!value || value === "")) {
      errorMessage = "This field is required";
      valid = false;
    } else if (type === "number" && value) {
      const num = numericValue;
      if (validation.min !== undefined && num < validation.min) {
        errorMessage = `Value must be at least ${validation.min}`;
        valid = false;
      }
      if (validation.max !== undefined && num > validation.max) {
        errorMessage = `Value must not exceed ${validation.max}`;
        valid = false;
      }
    } else if (validation.pattern && !validation.pattern.test(stringValue)) {
      errorMessage = validation.message || "Invalid format";
      valid = false;
    }

    setError(errorMessage);
    setIsValid(valid);
  }, [value, validation, numericValue, stringValue, type]);

  // Show benchmark comparison for numeric values
  useEffect(() => {
    if (benchmark && type === "number" && numericValue > 0) {
      setShowBenchmark(true);
    } else {
      setShowBenchmark(false);
    }
  }, [benchmark, type, numericValue]);

  const getBenchmarkStatus = () => {
    if (!benchmark || !showBenchmark) return null;
    
    const ratio = numericValue / benchmark.value;
    if (ratio >= 1.2) return "good";
    if (ratio >= 0.8) return "warning";
    return "danger";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === "number" ? e.target.value : e.target.value;
    onChange(newValue);
  };

  const applyIndustryDefault = () => {
    if (industryDefault) {
      onChange(industryDefault);
    }
  };

  const status = getBenchmarkStatus();

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
            {validation?.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          
          {helpText && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{helpText}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-3 z-10">
              {icon}
            </div>
          )}
          
          <Input
            id={id}
            type={type}
            value={stringValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={cn(
              "transition-all duration-200 focus:ring-2 focus:ring-primary",
              icon && "pl-10",
              suffix && "pr-12",
              error && "border-destructive focus:ring-destructive",
              isValid && value && "border-success focus:ring-success",
              className
            )}
          />

          {suffix && (
            <div className="absolute right-3 top-3 text-sm text-muted-foreground">
              {suffix}
            </div>
          )}

          {/* Validation status icon */}
          {value && (
            <div className="absolute right-3 top-3">
              {error ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
            </div>
          )}
        </div>

        {/* Industry default suggestion */}
        {industryDefault && !value && (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-primary/10"
              onClick={applyIndustryDefault}
            >
              Use {currentIndustry} average: {formatValue ? formatValue(industryDefault) : industryDefault}
            </Badge>
          </div>
        )}

        {/* Benchmark comparison */}
        {showBenchmark && benchmark && (
          <div className="flex items-center gap-2 text-sm">
            {status === "good" && (
              <>
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-success">Above industry average ({benchmark.label})</span>
              </>
            )}
            {status === "warning" && (
              <>
                <div className="h-4 w-4 rounded-full bg-warning" />
                <span className="text-warning">Near industry average ({benchmark.label})</span>
              </>
            )}
            {status === "danger" && (
              <>
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-destructive">Below industry average ({benchmark.label})</span>
              </>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}

        {/* Help text */}
        {helpText && !error && (
          <p className="text-sm text-muted-foreground">{helpText}</p>
        )}
      </div>
    </TooltipProvider>
  );
};