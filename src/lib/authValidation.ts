
import type { AuthError } from '@supabase/supabase-js';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }

  // Basic email format validation - accept ALL valid email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  // Remove business domain restrictions - accept all email types
  // Previously restrictive logic removed to improve conversion

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password || password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }

  return { isValid: true };
};

export const mapAuthError = (error: AuthError | Error | any): string => {
  if (!error) return 'An unknown error occurred';

  // Handle specific Supabase auth errors
  if (error.message) {
    const message = error.message.toLowerCase();
    
    if (message.includes('email already registered') || message.includes('user already registered')) {
      return 'An account with this email already exists. Please try signing in instead.';
    }
    
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    
    if (message.includes('password')) {
      return 'Password must be at least 6 characters long.';
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (message.includes('invalid credentials') || message.includes('invalid login')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }

    if (message.includes('email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }

    // Return the original message if it's user-friendly
    if (error.message.length < 100) {
      return error.message;
    }
  }

  // Fallback for unknown errors
  return 'Something went wrong. Please try again.';
};
