import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { DeploymentPipeline } from '@/components/deployment-pipeline';
import { ActivityLog } from '@/components/activity-log';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/use-websocket';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@shared/schema';

interface Stats {
  activeAgents: number;
  totalDeployments: number;
  weeklyDeployments: number;
  successRate: number;
  lastDeployTime?: string;
}

interface DeploymentProgress {
  stage: string;
  progress: number;
  message: string;
  success?: boolean;
  error?: string;
}

export default function Console() {
  const [prompt, setPrompt] = useState('Create a GPT-powered code reviewer that checks Python functions and writes results to a report.md');
  const [autoDeploy, setAutoDeploy] = useState(true);
  const [extensiveTesting, setExtensiveTesting] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState<DeploymentProgress | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  // Handle WebSocket messages
  React.useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'deployment_progress':
          setDeploymentProgress(lastMessage.data);
          break;
        case 'deployment_complete':
          if (lastMessage.data.success) {
            toast({
              title: 'Deployment Successful',
              description: `Agent "${lastMessage.data.agent.name}" deployed successfully`,
            });
            setDeploymentProgress(null);
            queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
          } else {
            toast({
              variant: 'destructive',
              title: 'Deployment Failed',
              description: lastMessage.data.error,
            });
            setDeploymentProgress({
              stage: 'error',
              progress: 0,
              message: 'Deployment failed',
              error: lastMessage.data.error
            });
          }
          break;
        case 'agent_updated':
          queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
          break;
      }
    }
  }, [lastMessage, toast, queryClient]);

  const { data: stats } = useQuery<Stats>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  const deployMutation = useMutation({
    mutationFn: async ({ prompt, autoDeploy, extensiveTesting }: {
      prompt: string;
      autoDeploy: boolean;
      extensiveTesting: boolean;
    }) => {
      const response = await apiRequest('POST', '/api/deploy', {
        prompt,
        autoDeploy,
        extensiveTesting
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Deployment Started',
        description: 'Agent deployment initiated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Deployment Failed',
        description: error.message,
      });
    },
  });

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Prompt',
        description: 'Prompt must be at least 10 characters long',
      });
      return;
    }
    
    deployMutation.mutate({ prompt, autoDeploy, extensiveTesting });
  };

  const formatLastDeployTime = (lastDeployTime?: string) => {
    if (!lastDeployTime) return 'Never';
    
    const now = new Date();
    const deployTime = new Date(lastDeployTime);
    const diffMinutes = Math.floor((now.getTime() - deployTime.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const recentAgents = agents
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Agent Console"
        subtitle="Deploy autonomous agents from natural language prompts"
        lastDeployTime={formatLastDeployTime(stats?.lastDeployTime)}
        onNewAgent={() => setPrompt('')}
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Console Interface */}
          <Card className="bg-surface border-dark">
            <CardHeader className="border-b border-dark">
              <CardTitle className="text-white flex items-center">
                <i className="fas fa-terminal mr-2 text-blue-500"></i>
                Agent Deployment Console
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleDeploy} className="space-y-4">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                    Agent Creation Prompt
                  </label>
                  <Textarea 
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-dark border-dark text-gray-100 placeholder-gray-500 focus:border-blue-500 font-mono text-sm"
                    placeholder="Example: Create a GPT-powered code reviewer that checks Python functions and writes results to a report.md"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="autoDeploy"
                        checked={autoDeploy}
                        onCheckedChange={setAutoDeploy}
                      />
                      <label htmlFor="autoDeploy" className="text-sm text-gray-300">
                        Auto-deploy on success
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="extensiveTesting"
                        checked={extensiveTesting}
                        onCheckedChange={setExtensiveTesting}
                      />
                      <label htmlFor="extensiveTesting" className="text-sm text-gray-300">
                        Run extensive tests
                      </label>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={deployMutation.isPending || !!deploymentProgress}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium"
                  >
                    <i className="fas fa-play mr-2"></i>
                    {deployMutation.isPending || deploymentProgress ? 'Deploying...' : 'Deploy Agent'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-surface border-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Active Agents</h3>
                  <i className="fas fa-cogs text-success"></i>
                </div>
                <div className="text-3xl font-bold text-success mb-2">
                  {stats?.activeAgents || 0}
                </div>
                <p className="text-sm text-gray-400">Running successfully</p>
              </CardContent>
            </Card>

            <Card className="bg-surface border-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Deployments</h3>
                  <i className="fas fa-rocket text-blue-500"></i>
                </div>
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  {stats?.weeklyDeployments || 0}
                </div>
                <p className="text-sm text-gray-400">This week</p>
              </CardContent>
            </Card>

            <Card className="bg-surface border-dark">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Success Rate</h3>
                  <i className="fas fa-chart-line text-warning"></i>
                </div>
                <div className="text-3xl font-bold text-warning mb-2">
                  {stats?.successRate || 0}%
                </div>
                <p className="text-sm text-gray-400">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agent List */}
            <Card className="bg-surface border-dark">
              <CardHeader className="border-b border-dark">
                <CardTitle className="text-white">Recent Agents</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-700">
                  {recentAgents.map((agent) => (
                    <div key={agent.id} className="px-6 py-4 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            agent.status === 'running' 
                              ? 'bg-success/20' 
                              : agent.status === 'deploying' 
                                ? 'bg-blue-500/20' 
                                : 'bg-warning/20'
                          }`}>
                            <i className={`text-sm ${
                              agent.status === 'running' 
                                ? 'fas fa-check text-success' 
                                : agent.status === 'deploying' 
                                  ? 'fas fa-sync-alt text-blue-500 animate-spin' 
                                  : 'fas fa-pause text-warning'
                            }`}></i>
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{agent.name}</h4>
                            <p className="text-sm text-gray-400">{agent.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">
                            {formatLastDeployTime(agent.updatedAt)}
                          </div>
                          <div className={`text-xs capitalize ${
                            agent.status === 'running' 
                              ? 'text-success' 
                              : agent.status === 'deploying' 
                                ? 'text-blue-500' 
                                : 'text-warning'
                          }`}>
                            {agent.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentAgents.length === 0 && (
                    <div className="px-6 py-8 text-center text-gray-400">
                      No agents deployed yet. Create your first agent above!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <ActivityLog />
          </div>

          {/* Deployment Pipeline Status */}
          {deploymentProgress && (
            <DeploymentPipeline 
              currentStage={deploymentProgress.stage}
              progress={deploymentProgress.progress}
              message={deploymentProgress.message}
            />
          )}
        </div>
      </main>
    </div>
  );
}
