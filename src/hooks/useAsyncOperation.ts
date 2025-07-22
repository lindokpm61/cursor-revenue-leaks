
import { useState, useCallback } from 'react'

interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  progress?: number
}

export const useAsyncOperation = <T>() => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    progress: 0
  })

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options?: {
      onProgress?: (progress: number) => void
      loadingText?: string
    }
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null, progress: 0 }))
    
    try {
      // Simulate progress if onProgress callback provided
      if (options?.onProgress) {
        const progressInterval = setInterval(() => {
          setState(prev => {
            const newProgress = Math.min(prev.progress! + 10, 90)
            options.onProgress?.(newProgress)
            return { ...prev, progress: newProgress }
          })
        }, 100)

        const result = await operation()
        clearInterval(progressInterval)
        
        // Complete progress
        setState(prev => ({ ...prev, progress: 100 }))
        setTimeout(() => {
          setState({ data: result, loading: false, error: null, progress: 100 })
        }, 200)
      } else {
        const result = await operation()
        setState({ data: result, loading: false, error: null })
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('An error occurred'),
        progress: 0
      })
    }
  }, [])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, progress: 0 })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}
