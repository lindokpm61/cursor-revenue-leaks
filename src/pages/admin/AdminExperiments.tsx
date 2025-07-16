import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { experimentService, Experiment, ExperimentVariant } from '@/lib/experimentation/experimentService';
import { Play, Pause, Square, TrendingUp, Users, Target, BarChart3, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminExperiments = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [experimentResults, setExperimentResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const [newExperiment, setNewExperiment] = useState({
    name: '',
    description: '',
    type: 'ab_test' as const,
    target_metric: 'conversion_rate',
    traffic_allocation: 50,
    start_date: '',
    end_date: ''
  });

  const [newVariants, setNewVariants] = useState([
    { name: 'Control', description: 'Original version', is_control: true, traffic_weight: 50 },
    { name: 'Variant A', description: 'Test version', is_control: false, traffic_weight: 50 }
  ]);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const data = await experimentService.getAllExperiments();
      setExperiments(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load experiments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadExperimentResults = async (experimentId: string) => {
    try {
      const results = await experimentService.getExperimentResults(experimentId);
      setExperimentResults(prev => ({ ...prev, [experimentId]: results }));
    } catch (error) {
      console.error('Error loading experiment results:', error);
    }
  };

  const handleStatusChange = async (experimentId: string, newStatus: Experiment['status']) => {
    try {
      await experimentService.updateExperimentStatus(experimentId, newStatus);
      await loadExperiments();
      toast({
        title: "Success",
        description: `Experiment ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update experiment status",
        variant: "destructive"
      });
    }
  };

  const handleCreateExperiment = async () => {
    try {
      const experiment = await experimentService.createExperiment({
        ...newExperiment,
        status: 'draft',
        configuration: {},
        results: {},
        statistical_significance: null,
        winner_variant_id: null,
        created_by: null
      });
      
      // Create variants
      for (const variant of newVariants) {
        await experimentService.createVariant({
          experiment_id: experiment.id,
          ...variant,
          configuration: {}
        });
      }

      await loadExperiments();
      setShowCreateDialog(false);
      setNewExperiment({
        name: '',
        description: '',
        type: 'ab_test',
        target_metric: 'conversion_rate',
        traffic_allocation: 50,
        start_date: '',
        end_date: ''
      });
      setNewVariants([
        { name: 'Control', description: 'Original version', is_control: true, traffic_weight: 50 },
        { name: 'Variant A', description: 'Test version', is_control: false, traffic_weight: 50 }
      ]);

      toast({
        title: "Success",
        description: "Experiment created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create experiment",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { label: 'Draft', variant: 'secondary' as const },
      active: { label: 'Active', variant: 'default' as const },
      paused: { label: 'Paused', variant: 'outline' as const },
      completed: { label: 'Completed', variant: 'secondary' as const }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading experiments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing & Experiments</h1>
          <p className="text-muted-foreground">Manage and analyze conversion optimization experiments</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Experiment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Experiment</DialogTitle>
              <DialogDescription>
                Set up a new A/B test or multivariate experiment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Experiment Name</Label>
                  <Input
                    id="name"
                    value={newExperiment.name}
                    onChange={(e) => setNewExperiment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Email Subject Line Test"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newExperiment.type} onValueChange={(value) => setNewExperiment(prev => ({ ...prev, type: value as any }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ab_test">A/B Test</SelectItem>
                      <SelectItem value="multivariate">Multivariate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newExperiment.description}
                  onChange={(e) => setNewExperiment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Testing different email subject lines for conversion..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_metric">Target Metric</Label>
                  <Select value={newExperiment.target_metric} onValueChange={(value) => setNewExperiment(prev => ({ ...prev, target_metric: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                      <SelectItem value="email_open_rate">Email Open Rate</SelectItem>
                      <SelectItem value="click_through_rate">Click Through Rate</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="traffic_allocation">Traffic Allocation (%)</Label>
                  <Input
                    id="traffic_allocation"
                    type="number"
                    min="1"
                    max="100"
                    value={newExperiment.traffic_allocation}
                    onChange={(e) => setNewExperiment(prev => ({ ...prev, traffic_allocation: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateExperiment}>
                  Create Experiment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Results Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Experiments</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{experiments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments.filter(exp => exp.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tests</CardTitle>
                <Square className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments.filter(exp => exp.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {experiments.length > 0 
                    ? `${(experiments.reduce((acc, exp) => acc + (exp.statistical_significance || 0), 0) / experiments.length * 100).toFixed(0)}%`
                    : '0%'
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            {experiments.map((experiment) => (
              <Card key={experiment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {experiment.name}
                        {getStatusBadge(experiment.status)}
                      </CardTitle>
                      <CardDescription>{experiment.description}</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      {experiment.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(experiment.id, 'active')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {experiment.status === 'active' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusChange(experiment.id, 'paused')}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusChange(experiment.id, 'completed')}
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                        </>
                      )}
                      {experiment.status === 'paused' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(experiment.id, 'active')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Resume
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedExperiment(experiment);
                          loadExperimentResults(experiment.id);
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        View Results
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Target Metric</p>
                      <p className="font-medium">{experiment.target_metric}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Traffic Allocation</p>
                      <p className="font-medium">{experiment.traffic_allocation}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Statistical Significance</p>
                      <p className="font-medium">
                        {experiment.statistical_significance 
                          ? formatPercentage(experiment.statistical_significance)
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(experiment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {selectedExperiment ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedExperiment.name} - Results</CardTitle>
                <CardDescription>
                  Statistical analysis and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {experimentResults[selectedExperiment.id] ? (
                  <div className="space-y-4">
                    {Object.entries(experimentResults[selectedExperiment.id]).map(([variantId, results]: [string, any]) => (
                      <div key={variantId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            {results.name}
                            {results.is_control && <Badge variant="outline">Control</Badge>}
                          </h3>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Conversion Rate</p>
                            <p className="text-lg font-bold">{formatPercentage(results.conversion_rate)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Events</p>
                            <p className="font-medium">{results.total_events}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversions</p>
                            <p className="font-medium">{results.conversions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Value</p>
                            <p className="font-medium">${results.total_value.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <Progress value={results.conversion_rate * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No results data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Select an experiment to view results</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Opportunities</CardTitle>
                <CardDescription>Automated recommendations for improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Email Subject Line Test</p>
                      <p className="text-sm text-muted-foreground">
                        Test showing 15% improvement - consider implementing variant A
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Landing Page CTA</p>
                      <p className="text-sm text-muted-foreground">
                        Low sample size - extend test duration for statistical significance
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key optimization statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Overall Conversion Rate</span>
                      <span>4.2%</span>
                    </div>
                    <Progress value={4.2} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Test Win Rate</span>
                      <span>68%</span>
                    </div>
                    <Progress value={68} className="h-2 mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Average Uplift</span>
                      <span>12.5%</span>
                    </div>
                    <Progress value={12.5} className="h-2 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminExperiments;