import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { db, User } from '@/lib/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await db.getProfile(token);
        if (response.data && !response.error) {
          setUser(response.data);
        } else {
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await db.login(email, password);
      if (response.data && !response.error) {
        setUser(response.data.user);
        localStorage.setItem('auth_token', response.data.token);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await db.register(email, password);
      if (response.data && !response.error) {
        setUser(response.data.user);
        localStorage.setItem('auth_token', response.data.token);
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const isAdmin = user?.role === 'admin';

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
  };
};