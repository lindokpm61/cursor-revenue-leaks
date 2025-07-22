
import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loading-spinner"
import { ProgressIndicator } from "./progress-indicator"

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  text?: string
  progress?: number
  className?: string
}

export const LoadingOverlay = ({
  isLoading,
  children,
  text,
  progress,
  className
}: LoadingOverlayProps) => {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="text-center space-y-4 p-6">
            {typeof progress === 'number' ? (
              <ProgressIndicator 
                progress={progress} 
                text={text}
                className="min-w-64"
              />
            ) : (
              <LoadingSpinner size="lg" text={text} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
