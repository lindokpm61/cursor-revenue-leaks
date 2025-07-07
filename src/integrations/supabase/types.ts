export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          properties: Json | null
          submission_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          properties?: Json | null
          submission_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          properties?: Json | null
          submission_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          email_step: number
          id: string
          opened_at: string | null
          replied_at: string | null
          sent_at: string | null
          sequence_type: string
          smartlead_campaign_id: string | null
          smartlead_prospect_id: string | null
          status: string | null
          submission_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          email_step: number
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          sequence_type: string
          smartlead_campaign_id?: string | null
          smartlead_prospect_id?: string | null
          status?: string | null
          submission_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          email_step?: number
          id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          sequence_type?: string
          smartlead_campaign_id?: string | null
          smartlead_prospect_id?: string | null
          status?: string | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          integration_type: string
          response_data: Json | null
          retry_count: number | null
          status: string
          submission_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_type: string
          response_data?: Json | null
          retry_count?: number | null
          status: string
          submission_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_type?: string
          response_data?: Json | null
          retry_count?: number | null
          status?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          average_deal_value: number | null
          company_name: string
          contact_email: string
          created_at: string | null
          current_arr: number | null
          failed_payment_loss: number | null
          failed_payment_rate: number | null
          free_to_paid_conversion: number | null
          hourly_rate: number | null
          id: string
          industry: string | null
          lead_response_loss: number | null
          lead_response_time: number | null
          lead_score: number | null
          leak_percentage: number | null
          manual_hours: number | null
          monthly_free_signups: number | null
          monthly_leads: number | null
          monthly_mrr: number | null
          n8n_triggered: boolean | null
          process_inefficiency_loss: number | null
          recovery_potential_70: number | null
          recovery_potential_85: number | null
          selfserve_gap_loss: number | null
          smartlead_campaign_id: string | null
          synced_to_self_hosted: boolean | null
          total_leak: number | null
          twenty_contact_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_deal_value?: number | null
          company_name: string
          contact_email: string
          created_at?: string | null
          current_arr?: number | null
          failed_payment_loss?: number | null
          failed_payment_rate?: number | null
          free_to_paid_conversion?: number | null
          hourly_rate?: number | null
          id?: string
          industry?: string | null
          lead_response_loss?: number | null
          lead_response_time?: number | null
          lead_score?: number | null
          leak_percentage?: number | null
          manual_hours?: number | null
          monthly_free_signups?: number | null
          monthly_leads?: number | null
          monthly_mrr?: number | null
          n8n_triggered?: boolean | null
          process_inefficiency_loss?: number | null
          recovery_potential_70?: number | null
          recovery_potential_85?: number | null
          selfserve_gap_loss?: number | null
          smartlead_campaign_id?: string | null
          synced_to_self_hosted?: boolean | null
          total_leak?: number | null
          twenty_contact_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_deal_value?: number | null
          company_name?: string
          contact_email?: string
          created_at?: string | null
          current_arr?: number | null
          failed_payment_loss?: number | null
          failed_payment_rate?: number | null
          free_to_paid_conversion?: number | null
          hourly_rate?: number | null
          id?: string
          industry?: string | null
          lead_response_loss?: number | null
          lead_response_time?: number | null
          lead_score?: number | null
          leak_percentage?: number | null
          manual_hours?: number | null
          monthly_free_signups?: number | null
          monthly_leads?: number | null
          monthly_mrr?: number | null
          n8n_triggered?: boolean | null
          process_inefficiency_loss?: number | null
          recovery_potential_70?: number | null
          recovery_potential_85?: number | null
          selfserve_gap_loss?: number | null
          smartlead_campaign_id?: string | null
          synced_to_self_hosted?: boolean | null
          total_leak?: number | null
          twenty_contact_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          companies_analyzed: number | null
          company_name: string | null
          created_at: string | null
          engagement_tier: string | null
          id: string
          last_analysis_date: string | null
          role: string | null
          total_opportunity: number | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          companies_analyzed?: number | null
          company_name?: string | null
          created_at?: string | null
          engagement_tier?: string | null
          id: string
          last_analysis_date?: string | null
          role?: string | null
          total_opportunity?: number | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          companies_analyzed?: number | null
          company_name?: string | null
          created_at?: string | null
          engagement_tier?: string | null
          id?: string
          last_analysis_date?: string | null
          role?: string | null
          total_opportunity?: number | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_submissions_with_user_data: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          company_name: string
          contact_email: string
          industry: string
          current_arr: number
          monthly_leads: number
          average_deal_value: number
          lead_response_time: number
          monthly_free_signups: number
          free_to_paid_conversion: number
          monthly_mrr: number
          failed_payment_rate: number
          manual_hours: number
          hourly_rate: number
          lead_response_loss: number
          failed_payment_loss: number
          selfserve_gap_loss: number
          process_inefficiency_loss: number
          total_leak: number
          leak_percentage: number
          recovery_potential_70: number
          recovery_potential_85: number
          lead_score: number
          created_at: string
          updated_at: string
          user_id: string
          user_email: string
          user_registered_date: string
          user_last_login: string
          user_email_verified: boolean
          user_role: string
          user_company_name: string
          user_type: string
          user_total_submissions: number
        }[]
      }
      get_users_with_analytics: {
        Args: { limit_count?: number }
        Returns: {
          user_id: string
          email: string
          created_at: string
          email_confirmed_at: string
          last_sign_in_at: string
          user_role: string
          user_company: string
          user_type: string
          total_submissions: number
          companies_analyzed: number
          first_submission_date: string
          last_submission_date: string
          avg_lead_score: number
          total_pipeline_value: number
          account_status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
