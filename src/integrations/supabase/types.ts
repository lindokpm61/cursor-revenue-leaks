export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      calculator_submissions: {
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
          process_inefficiency_loss: number | null
          recovery_potential_70: number | null
          recovery_potential_85: number | null
          selfserve_gap_loss: number | null
          total_leak: number | null
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
          process_inefficiency_loss?: number | null
          recovery_potential_70?: number | null
          recovery_potential_85?: number | null
          selfserve_gap_loss?: number | null
          total_leak?: number | null
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
          process_inefficiency_loss?: number | null
          recovery_potential_70?: number | null
          recovery_potential_85?: number | null
          selfserve_gap_loss?: number | null
          total_leak?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_engagement_events: {
        Row: {
          created_at: string
          engagement_score_delta: number | null
          event_data: Json | null
          event_type: string
          id: string
          temp_id: string
        }
        Insert: {
          created_at?: string
          engagement_score_delta?: number | null
          event_data?: Json | null
          event_type: string
          id?: string
          temp_id: string
        }
        Update: {
          created_at?: string
          engagement_score_delta?: number | null
          event_data?: Json | null
          event_type?: string
          id?: string
          temp_id?: string
        }
        Relationships: []
      }
      email_sequence_analytics: {
        Row: {
          bounce_type: string | null
          clicked_at: string | null
          converted_at: string | null
          created_at: string | null
          engagement_score: number | null
          id: string
          opened_at: string | null
          recipient_email: string
          sent_at: string | null
          sequence_type: string
          temp_submission_id: string | null
        }
        Insert: {
          bounce_type?: string | null
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          sent_at?: string | null
          sequence_type: string
          temp_submission_id?: string | null
        }
        Update: {
          bounce_type?: string | null
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          sent_at?: string | null
          sequence_type?: string
          temp_submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_analytics_temp_submission_id_fkey"
            columns: ["temp_submission_id"]
            isOneToOne: false
            referencedRelation: "temporary_submissions"
            referencedColumns: ["temp_id"]
          },
        ]
      }
      email_sequence_queue: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          contact_data: Json | null
          contact_email: string
          created_at: string
          error_message: string | null
          id: string
          opened_at: string | null
          retry_count: number | null
          scheduled_for: string
          sent_at: string | null
          sequence_type: string
          status: string
          temp_id: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          contact_data?: Json | null
          contact_email: string
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          sent_at?: string | null
          sequence_type: string
          status?: string
          temp_id: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          contact_data?: Json | null
          contact_email?: string
          created_at?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          sent_at?: string | null
          sequence_type?: string
          status?: string
          temp_id?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string | null
          temp_id: string | null
          unsubscribed_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason?: string | null
          temp_id?: string | null
          unsubscribed_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
          temp_id?: string | null
          unsubscribed_at?: string
        }
        Relationships: []
      }
      experiment_assignments: {
        Row: {
          assigned_at: string | null
          experiment_id: string
          id: string
          session_id: string | null
          user_id: string | null
          variant_id: string
        }
        Insert: {
          assigned_at?: string | null
          experiment_id: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          variant_id: string
        }
        Update: {
          assigned_at?: string | null
          experiment_id?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          experiment_id: string
          id: string
          session_id: string | null
          user_id: string | null
          value: number | null
          variant_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          experiment_id: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          value?: number | null
          variant_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          experiment_id?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
          value?: number | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_events_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_events_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_variants: {
        Row: {
          configuration: Json | null
          created_at: string | null
          experiment_id: string
          id: string
          is_control: boolean | null
          name: string
          traffic_percentage: number
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          experiment_id: string
          id?: string
          is_control?: boolean | null
          name: string
          traffic_percentage: number
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          experiment_id?: string
          id?: string
          is_control?: boolean | null
          name?: string
          traffic_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "experiment_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          traffic_allocation: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          traffic_allocation?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          traffic_allocation?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          actual_company_name: string | null
          actual_role: string | null
          business_model: string | null
          company_name: string | null
          created_at: string | null
          engagement_score: number | null
          engagement_tier: string | null
          first_submission_date: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string | null
          user_tier: string | null
          user_type: string | null
        }
        Insert: {
          actual_company_name?: string | null
          actual_role?: string | null
          business_model?: string | null
          company_name?: string | null
          created_at?: string | null
          engagement_score?: number | null
          engagement_tier?: string | null
          first_submission_date?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_tier?: string | null
          user_type?: string | null
        }
        Update: {
          actual_company_name?: string | null
          actual_role?: string | null
          business_model?: string | null
          company_name?: string | null
          created_at?: string | null
          engagement_score?: number | null
          engagement_tier?: string | null
          first_submission_date?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_tier?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      saved_summaries: {
        Row: {
          created_at: string | null
          id: string
          submission_id: string
          summary_data: Json
          summary_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          submission_id: string
          summary_data: Json
          summary_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          submission_id?: string
          summary_data?: Json
          summary_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      temporary_submissions: {
        Row: {
          calculator_data: Json | null
          calculator_interactions: number | null
          company_name: string | null
          completion_percentage: number | null
          conversion_completed_at: string | null
          converted_to_user_id: string | null
          created_at: string | null
          current_step: number | null
          email: string | null
          email_engagement_score: number | null
          email_sequences_triggered: string[] | null
          industry: string | null
          ip_address: string | null
          last_activity_at: string | null
          last_email_sent_at: string | null
          last_updated: string | null
          lead_score: number | null
          n8n_workflow_status: Json | null
          page_views: number | null
          phone: string | null
          recovery_potential: number | null
          referrer_url: string | null
          return_visits: number | null
          session_id: string | null
          smartlead_campaign_ids: string[] | null
          steps_completed: number | null
          temp_id: string
          time_spent_seconds: number | null
          total_revenue_leak: number | null
          twenty_crm_contact_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          calculator_data?: Json | null
          calculator_interactions?: number | null
          company_name?: string | null
          completion_percentage?: number | null
          conversion_completed_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          current_step?: number | null
          email?: string | null
          email_engagement_score?: number | null
          email_sequences_triggered?: string[] | null
          industry?: string | null
          ip_address?: string | null
          last_activity_at?: string | null
          last_email_sent_at?: string | null
          last_updated?: string | null
          lead_score?: number | null
          n8n_workflow_status?: Json | null
          page_views?: number | null
          phone?: string | null
          recovery_potential?: number | null
          referrer_url?: string | null
          return_visits?: number | null
          session_id?: string | null
          smartlead_campaign_ids?: string[] | null
          steps_completed?: number | null
          temp_id?: string
          time_spent_seconds?: number | null
          total_revenue_leak?: number | null
          twenty_crm_contact_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          calculator_data?: Json | null
          calculator_interactions?: number | null
          company_name?: string | null
          completion_percentage?: number | null
          conversion_completed_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          current_step?: number | null
          email?: string | null
          email_engagement_score?: number | null
          email_sequences_triggered?: string[] | null
          industry?: string | null
          ip_address?: string | null
          last_activity_at?: string | null
          last_email_sent_at?: string | null
          last_updated?: string | null
          lead_score?: number | null
          n8n_workflow_status?: Json | null
          page_views?: number | null
          phone?: string | null
          recovery_potential?: number | null
          referrer_url?: string | null
          return_visits?: number | null
          session_id?: string | null
          smartlead_campaign_ids?: string[] | null
          steps_completed?: number | null
          temp_id?: string
          time_spent_seconds?: number | null
          total_revenue_leak?: number | null
          twenty_crm_contact_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_email_unsubscribe: {
        Args: {
          email_address: string
          unsubscribe_reason?: string
          submission_temp_id?: string
        }
        Returns: undefined
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_email_unsubscribed: {
        Args: { email_address: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
