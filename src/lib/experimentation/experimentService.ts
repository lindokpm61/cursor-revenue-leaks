// Temporarily disabled - references non-existent tables and functions

export type Experiment = any;
export type ExperimentVariant = any;
export type ExperimentAssignment = any;
export type ExperimentEvent = any;

class ExperimentService {
  async getActiveExperiments() { return []; }
  async getAllExperiments() { return []; }
  async getExperimentVariants(experimentId: string) { return []; }
  async assignVariant(experimentId: string) { return null; }
  async getUserVariant(experimentId: string) { return null; }
  async trackEvent(a: any, b: any, c: any, d?: any, e?: any) { return; }
  async createExperiment(data: any) { throw new Error('Service disabled'); }
  async createVariant(data: any) { throw new Error('Service disabled'); }
  async updateExperimentStatus(id: string, status: any) { throw new Error('Service disabled'); }
  async getExperimentResults(experimentId: string) { return {}; }
  async shouldShowExperiment(experimentId: string) { return false; }
}

export const experimentService = new ExperimentService();