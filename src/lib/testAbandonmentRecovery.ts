// Test abandonment recovery system
import { supabase } from "@/integrations/supabase/client";

export const testAbandonmentRecovery = async () => {
  try {
    console.log('🧪 Testing abandonment recovery system...');

    // Check for pending abandonment emails
    const { data: pendingEmails, error } = await supabase
      .from('email_sequence_queue')
      .select('*')
      .eq('status', 'pending')
      .like('sequence_type', 'abandonment_%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching pending abandonment emails:', error);
      return;
    }

    console.log(`📧 Found ${pendingEmails?.length || 0} pending abandonment emails:`);
    
    if (pendingEmails && pendingEmails.length > 0) {
      pendingEmails.forEach((email, index) => {
        console.log(`${index + 1}. ${email.sequence_type} for ${email.contact_email}`);
        console.log(`   Scheduled: ${email.scheduled_for}`);
        console.log(`   Temp ID: ${email.temp_id}`);
        console.log(`   Data:`, email.contact_data);
      });
    } else {
      console.log('   No pending abandonment emails found');
    }

    // Check automation service status
    console.log('\n⚙️ Automation service should be running every 15 minutes');
    console.log('📊 Check admin dashboard for analytics');
    
    return {
      pendingCount: pendingEmails?.length || 0,
      pendingEmails: pendingEmails || []
    };

  } catch (error) {
    console.error('❌ Error testing abandonment recovery:', error);
    return null;
  }
};

// Test function to manually trigger abandonment recovery processing
export const triggerAbandonmentRecoveryTest = async () => {
  try {
    console.log('🚀 Manually triggering abandonment recovery...');
    
    const response = await supabase.functions.invoke('automation-processor', {
      body: { 
        action: 'process_all',
        test_mode: true,
        triggered_by: 'manual_test'
      }
    });

    if (response.error) {
      console.error('❌ Error triggering abandonment recovery:', response.error);
    } else {
      console.log('✅ Abandonment recovery triggered successfully:', response.data);
    }

    return response;
  } catch (error) {
    console.error('❌ Error in abandonment recovery test:', error);
    return null;
  }
};