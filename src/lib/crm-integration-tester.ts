import { supabase } from "@/integrations/supabase/client";
import { enhancedIntegrationLogger } from './enhanced-integration-logger';

interface TestResult {
  integration: string;
  success: boolean;
  error?: string;
  response_data?: any;
  execution_time_ms: number;
}

class CRMIntegrationTester {
  async testCreatePerson(testData: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<TestResult> {
    const startTime = Date.now();
    const logId = crypto.randomUUID();
    
    try {
      // Log the test attempt
      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_person_test',
        status: 'pending',
        request_data: testData
      });

      const { data, error } = await supabase.functions.invoke('create-crm-person', {
        body: {
          userId: 'test-user-id',
          email: testData.email,
          firstName: testData.firstName,
          lastName: testData.lastName,
          phone: testData.phone
        }
      });

      const execution_time_ms = Date.now() - startTime;

      if (error) {
        await enhancedIntegrationLogger.logIntegration({
          integration_type: 'twenty_crm_person_test',
          status: 'failed',
          request_data: testData,
          error_message: error.message,
          execution_time_ms
        });

        return {
          integration: 'Twenty CRM Person',
          success: false,
          error: error.message,
          execution_time_ms
        };
      }

      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_person_test',
        status: 'success',
        request_data: testData,
        response_data: data,
        execution_time_ms
      });

      return {
        integration: 'Twenty CRM Person',
        success: true,
        response_data: data,
        execution_time_ms
      };
    } catch (error) {
      const execution_time_ms = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_person_test',
        status: 'failed',
        request_data: testData,
        error_message: errorMessage,
        execution_time_ms
      });

      return {
        integration: 'Twenty CRM Person',
        success: false,
        error: errorMessage,
        execution_time_ms
      };
    }
  }

  async testCreateCompany(submissionId: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_company_test',
        status: 'pending',
        submission_id: submissionId
      });

      const { data, error } = await supabase.functions.invoke('create-crm-company', {
        body: { submissionId }
      });

      const execution_time_ms = Date.now() - startTime;

      if (error) {
        await enhancedIntegrationLogger.logIntegration({
          integration_type: 'twenty_crm_company_test',
          status: 'failed',
          submission_id: submissionId,
          error_message: error.message,
          execution_time_ms
        });

        return {
          integration: 'Twenty CRM Company',
          success: false,
          error: error.message,
          execution_time_ms
        };
      }

      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_company_test',
        status: 'success',
        submission_id: submissionId,
        response_data: data,
        execution_time_ms
      });

      return {
        integration: 'Twenty CRM Company',
        success: true,
        response_data: data,
        execution_time_ms
      };
    } catch (error) {
      const execution_time_ms = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_company_test',
        status: 'failed',
        submission_id: submissionId,
        error_message: errorMessage,
        execution_time_ms
      });

      return {
        integration: 'Twenty CRM Company',
        success: false,
        error: errorMessage,
        execution_time_ms
      };
    }
  }

  async testCreateOpportunity(testData: {
    userId: string;
    submissionId: string;
    actionType: 'download' | 'booking' | 'engagement' | 'conversion';
    actionData?: any;
  }): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_opportunity_test',
        status: 'pending',
        submission_id: testData.submissionId,
        user_id: testData.userId,
        request_data: testData
      });

      const { data, error } = await supabase.functions.invoke('create-crm-opportunity', {
        body: testData
      });

      const execution_time_ms = Date.now() - startTime;

      if (error) {
        await enhancedIntegrationLogger.logIntegration({
          integration_type: 'twenty_crm_opportunity_test',
          status: 'failed',
          submission_id: testData.submissionId,
          user_id: testData.userId,
          request_data: testData,
          error_message: error.message,
          execution_time_ms
        });

        return {
          integration: 'Twenty CRM Opportunity',
          success: false,
          error: error.message,
          execution_time_ms
        };
      }

      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_opportunity_test',
        status: 'success',
        submission_id: testData.submissionId,
        user_id: testData.userId,
        request_data: testData,
        response_data: data,
        execution_time_ms
      });

      return {
        integration: 'Twenty CRM Opportunity',
        success: true,
        response_data: data,
        execution_time_ms
      };
    } catch (error) {
      const execution_time_ms = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await enhancedIntegrationLogger.logIntegration({
        integration_type: 'twenty_crm_opportunity_test',
        status: 'failed',
        submission_id: testData.submissionId,
        user_id: testData.userId,
        request_data: testData,
        error_message: errorMessage,
        execution_time_ms
      });

      return {
        integration: 'Twenty CRM Opportunity',
        success: false,
        error: errorMessage,
        execution_time_ms
      };
    }
  }

  async runFullIntegrationTest(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Test person creation
    results.push(await this.testCreatePerson({
      email: `test-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890'
    }));

    // Test company creation (requires a valid submission ID)
    const testSubmissionId = crypto.randomUUID();
    results.push(await this.testCreateCompany(testSubmissionId));

    // Test opportunity creation
    results.push(await this.testCreateOpportunity({
      userId: 'test-user-id',
      submissionId: testSubmissionId,
      actionType: 'conversion',
      actionData: { test: true }
    }));

    return results;
  }
}

export const crmIntegrationTester = new CRMIntegrationTester();