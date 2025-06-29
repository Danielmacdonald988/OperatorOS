import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@shared/schema';

export default function Agents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Agent> }) => {
      const response = await apiRequest('PATCH', `/api/agents/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: 'Agent Updated',
        description: 'Agent status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({
        title: 'Agent Deleted',
        description: 'Agent removed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message,
      });
    },
  });

  const handleStatusToggle = (agent: Agent) => {
    const newStatus = agent.status === 'running' ? 'paused' : 'running';
    updateAgentMutation.mutate({
      id: agent.id,
      updates: { status: newStatus, lastRun: newStatus === 'running' ? new Date() : agent.lastRun }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      deleteAgentMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-success/20 text-success';
      case 'deploying': return 'bg-blue-500/20 text-blue-500';
      case 'paused': return 'bg-warning/20 text-warning';
      case 'failed': return 'bg-error/20 text-error';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return 'fas fa-play';
      case 'deploying': return 'fas fa-sync-alt animate-spin';
      case 'paused': return 'fas fa-pause';
      case 'failed': return 'fas fa-exclamation-circle';
      default: return 'fas fa-clock';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Agents"
          subtitle="Manage your autonomous agents"
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="text-center text-gray-400">Loading agents...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Agents"
        subtitle="Manage your autonomous agents"
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {agents.length === 0 ? (
            <Card className="bg-surface border-dark">
              <CardContent className="p-8 text-center">
                <i className="fas fa-robot text-4xl text-gray-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-white mb-2">No Agents Yet</h3>
                <p className="text-gray-400 mb-4">
                  You haven't created any agents yet. Go to the console to create your first agent.
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create Agent
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="bg-surface border-dark">
                  <CardHeader className="border-b border-dark">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center">
                        <i className="fas fa-robot mr-2 text-blue-500"></i>
                        {agent.name}
                      </CardTitle>
                      <Badge className={getStatusColor(agent.status)}>
                        <i className={`${getStatusIcon(agent.status)} mr-1`}></i>
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-gray-300 text-sm">{agent.description}</p>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Version:</span>
                        <span className="text-gray-300">v{agent.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-gray-300">
                          {new Date(agent.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {agent.lastRun && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Run:</span>
                          <span className="text-gray-300">
                            {new Date(agent.lastRun).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusToggle(agent)}
                        disabled={updateAgentMutation.isPending}
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <i className={`fas fa-${agent.status === 'running' ? 'pause' : 'play'} mr-1`}></i>
                        {agent.status === 'running' ? 'Pause' : 'Start'}
                      </Button>
                      
                      {agent.githubUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(agent.githubUrl!, '_blank')}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <i className="fab fa-github"></i>
                        </Button>
                      )}
                      
                      {agent.renderUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(agent.renderUrl!, '_blank')}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(agent.id)}
                        disabled={deleteAgentMutation.isPending}
                        className="bg-error hover:bg-error/80"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
