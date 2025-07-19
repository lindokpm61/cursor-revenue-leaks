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
      (event, session) => {
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

        // For existing users, ensure profile exists
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(() => {
            ensureUserProfile(session.user).catch(error => {
              console.error('Failed to ensure user profile:', error);
            });
          }, 0);
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
      // Import validation inside function to avoid circular dependencies
      const { validateEmail, mapAuthError } = await import('@/lib/authValidation');
      
      // Validate email format - accept all valid emails, not just business domains
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: mapAuthError(error) };
      }

      return { success: true };
    } catch (error) {
      const { mapAuthError } = await import('@/lib/authValidation');
      return { success: false, error: mapAuthError(error) };
    }
  };

  const register = async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      // Import validation inside function to avoid circular dependencies
      const { validateEmail, validatePassword, mapAuthError } = await import('@/lib/authValidation');
      
      // Validate inputs - accept all valid emails
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // CRITICAL: Remove email verification requirement for immediate access
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata || {}
        }
      });

      if (error) {
        return { success: false, error: mapAuthError(error) };
      }

      // If user is created and confirmed immediately, create profile
      if (data.user && !data.user.email_confirmed_at) {
        // For immediate access, we'll treat unconfirmed users as valid
        console.log('User created without email verification for immediate access');
      }

      // Send welcome email if registration successful (but don't block on it)
      if (data.user) {
        try {
          const { EmailService } = await import('@/lib/emailService');
          await EmailService.sendWelcomeEmail(email, {
            userName: metadata?.firstName || email.split('@')[0],
            companyName: metadata?.companyName || 'your company'
          });
        } catch (emailError) {
          console.warn('Failed to send welcome email:', emailError);
          // Don't fail registration if email fails
        }
      }

      return { success: true };
    } catch (error) {
      const { mapAuthError } = await import('@/lib/authValidation');
      return { success: false, error: mapAuthError(error) };
    }
  };

  const createUserProfile = async (user: User) => {
    console.log('useAuth createUserProfile called with user:', user.id);
    console.log('User metadata:', user.user_metadata);
    
    const profileData = {
      id: user.id,
      company_name: user.user_metadata?.company_name || null,
      business_model: user.user_metadata?.business_model || 'internal',
      role: user.user_metadata?.role || 'user',
      actual_company_name: user.user_metadata?.company_name || null,
      actual_role: user.user_metadata?.actual_role || null,
      phone: user.user_metadata?.phone || null,
      user_type: 'standard',
      engagement_tier: 'standard',
      user_tier: 'standard'
    };
    
    console.log('Inserting profile data:', profileData);
    
    const { error } = await supabase
      .from('user_profiles')
      .insert(profileData);
    
    if (error) {
      console.error('useAuth error creating user profile:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log('useAuth user profile created successfully');
  };

  const createCrmPerson = async (user: User, email: string) => {
    try {
      console.log('Creating CRM person for new user:', user.id);
      const { data, error } = await supabase.functions.invoke('create-crm-person', {
        body: {
          userId: user.id,
          email: email,
          firstName: user.user_metadata?.first_name || email.split('@')[0] || 'Unknown',
          lastName: user.user_metadata?.last_name || 'User',
          phone: user.user_metadata?.phone || null
        }
      });

      if (error) {
        console.warn('CRM person creation had issues (non-blocking):', error);
        // This is non-blocking - registration should still succeed
      } else {
        console.log('CRM person created successfully:', data);
      }
    } catch (error) {
      console.error('Error in CRM person creation:', error);
      // Don't fail registration if CRM person creation fails
    }
  };

  const ensureCrmPerson = async (user: User) => {
    try {
      // Check if CRM person already exists
      const { data: existingPerson, error: checkError } = await supabase
        .from('crm_persons')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Create CRM person if it doesn't exist
      if (!existingPerson) {
        await createCrmPerson(user, user.email!);
      }
    } catch (error) {
      console.error('Error ensuring CRM person:', error);
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
