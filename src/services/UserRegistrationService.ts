import { supabase } from '@/integrations/supabase/client';

interface RegistrationData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  company_name?: string;
  actualCompanyName?: string;
  role?: string;
  actualRole?: string;
  phone?: string;
  industry?: string;
  business_model?: string;
  businessModel?: string;
  userClassification?: string;
  userTier?: string;
}

export class UserRegistrationService {
  static async register(data: RegistrationData) {
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user' };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          company_name: data.company_name || data.actualCompanyName,
          actual_company_name: data.actualCompanyName,
          role: data.role || data.actualRole,
          actual_role: data.actualRole,
          phone: data.phone,
          business_model: data.business_model || data.businessModel,
          user_type: data.userClassification || 'standard',
          user_tier: data.userTier || 'free',
          engagement_tier: 'basic'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue even if profile creation fails
      }

      // Schedule welcome email
      try {
        const tempId = crypto.randomUUID();
        const scheduledTime = new Date();
        scheduledTime.setMinutes(scheduledTime.getMinutes() + 1); // Send welcome email in 1 minute

        const { error: emailError } = await supabase
          .from('email_sequence_queue')
          .insert({
            temp_id: tempId,
            contact_email: data.email,
            sequence_type: 'welcome',
            scheduled_for: scheduledTime.toISOString(),
            contact_data: {
              userName: data.firstName || 'there',
              companyName: data.company_name || data.actualCompanyName || 'your company',
              userType: data.userClassification || 'standard'
            },
            status: 'pending'
          });

        if (emailError) {
          console.error('Welcome email scheduling error:', emailError);
        } else {
          console.log(`Welcome email scheduled for ${data.email}`);
        }
      } catch (emailScheduleError) {
        console.error('Error scheduling welcome email:', emailScheduleError);
      }

      return { success: true, user: authData.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async registerUser(data: RegistrationData) {
    return this.register(data);
  }
  
  static async handleRegistration(data: RegistrationData) {
    return this.register(data);
  }
}