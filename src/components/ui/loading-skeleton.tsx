
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'chart'
  lines?: number
}

export const LoadingSkeleton = ({ 
  className, 
  variant = 'rectangular',
  lines = 1 
}: LoadingSkeletonProps) => {
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 bg-muted animate-pulse rounded",
              i === lines - 1 ? "w-3/4" : "w-full",
              className
            )}
          />
        ))}
      </div>
    )
  }

  const variantClasses = {
    text: "h-4 w-full",
    circular: "rounded-full aspect-square w-10 h-10",
    rectangular: "h-20 w-full",
    chart: "h-64 w-full"
  }

  return (
    <div
      className={cn(
        "bg-muted animate-pulse rounded",
        variantClasses[variant],
        className
      )}
    />
  )
}
