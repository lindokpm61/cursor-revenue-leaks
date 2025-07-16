// Authentication validation utilities
import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string().email('Please enter a valid email address');

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Registration form schema
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Validation helper functions
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid email format' };
  }
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  try {
    passwordSchema.parse(password);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: 'Invalid password format' };
  }
};

// Common authentication errors
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'No account found with this email',
  USER_ALREADY_EXISTS: 'An account with this email already exists',
  WEAK_PASSWORD: 'Password is too weak',
  EMAIL_NOT_CONFIRMED: 'Please check your email and click the confirmation link',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  RATE_LIMITED: 'Too many attempts. Please try again later',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again',
} as const;

// Map Supabase errors to user-friendly messages
export const mapAuthError = (error: any): string => {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('invalid login credentials')) {
    return AUTH_ERRORS.INVALID_CREDENTIALS;
  }
  
  if (errorMessage.includes('user already registered')) {
    return AUTH_ERRORS.USER_ALREADY_EXISTS;
  }
  
  if (errorMessage.includes('email not confirmed')) {
    return AUTH_ERRORS.EMAIL_NOT_CONFIRMED;
  }
  
  if (errorMessage.includes('password')) {
    return AUTH_ERRORS.WEAK_PASSWORD;
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return AUTH_ERRORS.NETWORK_ERROR;
  }
  
  if (errorMessage.includes('rate limit')) {
    return AUTH_ERRORS.RATE_LIMITED;
  }
  
  // Return the original message if it's user-friendly, otherwise use generic error
  if (error?.message && error.message.length < 100 && !error.message.includes('Error:')) {
    return error.message;
  }
  
  return AUTH_ERRORS.UNKNOWN_ERROR;
};