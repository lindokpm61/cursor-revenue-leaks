import { useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { AuthContext } from '@/components/auth/AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Check admin status when user signs in
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user);
          }, 0);
        } else {
          setIsAdmin(false);
        }

        // Ensure user profile exists when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await ensureUserProfile(session.user);
          } catch (error) {
            console.error('Failed to ensure user profile:', error);
          }
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkAdminStatus(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (user: User) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const ensureUserProfile = async (user: User) => {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    // Create profile if it doesn't exist
    if (!existingProfile) {
      await createUserProfile(user);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Create user profile immediately after successful registration
      if (data.user) {
        try {
          await createUserProfile(data.user);
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError);
          // Don't fail the registration if profile creation fails
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const createUserProfile = async (user: User) => {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        company_name: user.user_metadata?.company_name || null,
        business_model: user.user_metadata?.business_model || 'internal',
        role: user.user_metadata?.role || 'user',
        actual_company_name: user.user_metadata?.company_name || null,
        actual_role: user.user_metadata?.role || null,
        user_type: 'standard',
        engagement_tier: 'standard',
        user_tier: 'standard'
      });
    
    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    login,
    register,
    logout,
    isAdmin,
  };
};