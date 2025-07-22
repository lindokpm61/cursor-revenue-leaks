
import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  progress: number
  showPercentage?: boolean
  className?: string
  text?: string
}

export const ProgressIndicator = ({ 
  progress, 
  showPercentage = true, 
  className,
  text 
}: ProgressIndicatorProps) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <div className={cn("space-y-2", className)}>
      {(text || showPercentage) && (
        <div className="flex justify-between items-center">
          {text && <span className="text-sm text-muted-foreground">{text}</span>}
          {showPercentage && (
            <span className="text-sm font-medium">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}
