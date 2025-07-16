import { supabase } from '@/integrations/supabase/client';
import { getTempId } from '@/lib/submission/trackingHelpers';
import { Tables } from '@/integrations/supabase/types';

export type Experiment = Tables<'experiments'>;
export type ExperimentVariant = Tables<'experiment_variants'>;
export type ExperimentAssignment = Tables<'experiment_assignments'>;
export type ExperimentEvent = Omit<Tables<'experiment_events'>, 'id' | 'created_at'>;

class ExperimentService {
  private userIdentifier: string | null = null;

  constructor() {
    this.initializeUserIdentifier();
  }

  private async initializeUserIdentifier() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userIdentifier = user?.id || getTempId();
  }

  private getUserIdentifier(): string {
    return this.userIdentifier || getTempId();
  }

  // Get active experiments
  async getActiveExperiments(): Promise<Experiment[]> {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', new Date().toISOString())
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`);

    if (error) throw error;
    return data || [];
  }

  // Get all experiments (admin only)
  async getAllExperiments(): Promise<Experiment[]> {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get experiment variants
  async getExperimentVariants(experimentId: string): Promise<ExperimentVariant[]> {
    const { data, error } = await supabase
      .from('experiment_variants')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  // Assign user to experiment variant
  async assignVariant(experimentId: string): Promise<string | null> {
    const userIdentifier = this.getUserIdentifier();
    
    const { data, error } = await supabase.rpc('assign_experiment_variant', {
      p_experiment_id: experimentId,
      p_user_identifier: userIdentifier
    });

    if (error) {
      console.error('Error assigning variant:', error);
      return null;
    }

    return data;
  }

  // Get user's variant assignment for an experiment
  async getUserVariant(experimentId: string): Promise<string | null> {
    const userIdentifier = this.getUserIdentifier();
    
    const { data, error } = await supabase
      .from('experiment_assignments')
      .select('variant_id')
      .eq('experiment_id', experimentId)
      .eq('user_identifier', userIdentifier)
      .single();

    if (error || !data) return null;
    return data.variant_id;
  }

  // Track experiment event
  async trackEvent(
    experimentId: string,
    variantId: string,
    eventType: string,
    eventData?: Record<string, any>,
    value?: number
  ): Promise<void> {
    const userIdentifier = this.getUserIdentifier();

    const { error } = await supabase
      .from('experiment_events')
      .insert({
        experiment_id: experimentId,
        variant_id: variantId,
        user_identifier: userIdentifier,
        event_type: eventType,
        event_data: eventData || {},
        value: value || 0
      });

    if (error) {
      console.error('Error tracking experiment event:', error);
    }
  }

  // Create new experiment (admin only)
  async createExperiment(experiment: Omit<Experiment, 'id' | 'created_at' | 'updated_at'>): Promise<Experiment> {
    const { data, error } = await supabase
      .from('experiments')
      .insert(experiment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create experiment variant (admin only)
  async createVariant(variant: Omit<ExperimentVariant, 'id' | 'created_at' | 'updated_at'>): Promise<ExperimentVariant> {
    const { data, error } = await supabase
      .from('experiment_variants')
      .insert(variant)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update experiment status (admin only)
  async updateExperimentStatus(experimentId: string, status: Experiment['status']): Promise<void> {
    const { error } = await supabase
      .from('experiments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', experimentId);

    if (error) throw error;
  }

  // Get experiment results
  async getExperimentResults(experimentId: string): Promise<any> {
    const { data: events, error } = await supabase
      .from('experiment_events')
      .select(`
        variant_id,
        event_type,
        value,
        experiment_variants (
          name,
          is_control
        )
      `)
      .eq('experiment_id', experimentId);

    if (error) throw error;

    // Process results by variant
    const results = events?.reduce((acc: any, event: any) => {
      const variantId = event.variant_id;
      if (!acc[variantId]) {
        acc[variantId] = {
          name: event.experiment_variants?.name,
          is_control: event.experiment_variants?.is_control,
          total_events: 0,
          conversions: 0,
          total_value: 0,
          conversion_rate: 0
        };
      }

      acc[variantId].total_events++;
      if (event.event_type === 'conversion') {
        acc[variantId].conversions++;
      }
      acc[variantId].total_value += event.value || 0;
      acc[variantId].conversion_rate = acc[variantId].conversions / acc[variantId].total_events;

      return acc;
    }, {});

    return results || {};
  }

  // Check if experiment should be shown to user
  async shouldShowExperiment(experimentId: string): Promise<boolean> {
    try {
      const experiments = await this.getActiveExperiments();
      const experiment = experiments.find(exp => exp.id === experimentId);
      
      if (!experiment) return false;

      // Check traffic allocation
      const random = Math.random() * 100;
      return random <= experiment.traffic_allocation;
    } catch (error) {
      console.error('Error checking experiment eligibility:', error);
      return false;
    }
  }
}

export const experimentService = new ExperimentService();