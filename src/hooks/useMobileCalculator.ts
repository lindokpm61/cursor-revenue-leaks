import { useState, useCallback, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface MobileCalculatorOptions {
  totalSteps: number;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const useMobileCalculator = ({ totalSteps, currentStep, onStepChange }: MobileCalculatorOptions) => {
  const isMobile = useIsMobile();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsScrolling(false);
  }, [isMobile]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !touchStart) return;
    setTouchEnd(e.targetTouches[0].clientX);
    
    // Detect if user is scrolling vertically
    const touchCurrent = e.targetTouches[0];
    const verticalMovement = Math.abs(touchCurrent.clientY - (e.currentTarget as any).initialY);
    if (verticalMovement > 10) {
      setIsScrolling(true);
    }
  }, [isMobile, touchStart]);

  const onTouchEnd = useCallback(() => {
    if (!isMobile || !touchStart || !touchEnd || isScrolling) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentStep < totalSteps) {
      onStepChange(currentStep + 1);
    }
    if (isRightSwipe && currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  }, [isMobile, touchStart, touchEnd, isScrolling, currentStep, totalSteps, onStepChange]);

  const handleMobileNavigation = useCallback((direction: 'next' | 'prev') => {
    if (!isMobile) return;
    
    if (direction === 'next' && currentStep < totalSteps) {
      onStepChange(currentStep + 1);
    } else if (direction === 'prev' && currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  }, [isMobile, currentStep, totalSteps, onStepChange]);

  const getMobileStepIndicatorProps = () => ({
    className: isMobile ? "flex justify-between items-center p-4 bg-background/80 backdrop-blur-sm border-t" : "",
    style: isMobile ? { position: 'sticky' as const, bottom: 0, zIndex: 10 } : {}
  });

  return {
    isMobile,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd
    },
    handleMobileNavigation,
    getMobileStepIndicatorProps,
    canSwipeNext: currentStep < totalSteps,
    canSwipePrev: currentStep > 1
  };
};