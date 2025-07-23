
import { useState } from 'react';
import { calendarIntegration } from '@/lib/calendarIntegration';
import { useToast } from '@/hooks/use-toast';

interface BookingData {
  user_id?: string;
  temp_id?: string;
  email?: string;
  company_name?: string;
  recovery_potential?: number;
  lead_score?: number;
}

export const useCalendarBooking = () => {
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();

  const bookConsultation = async (bookingData: BookingData = {}, openInNewTab = true) => {
    setIsBooking(true);
    
    try {
      if (openInNewTab) {
        await calendarIntegration.openBooking(bookingData);
      } else {
        await calendarIntegration.navigateToBooking(bookingData);
      }
      
      toast({
        title: "Redirecting to Booking",
        description: "Opening calendar to schedule your strategy session...",
      });
    } catch (error) {
      console.error('Booking failed:', error);
      toast({
        title: "Booking Error",
        description: "Failed to open booking calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const generateBookingLink = (bookingData: BookingData = {}) => {
    return calendarIntegration.generateBookingUrl(bookingData);
  };

  return {
    bookConsultation,
    generateBookingLink,
    isBooking
  };
};
