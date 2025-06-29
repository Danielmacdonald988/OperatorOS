import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Deployment } from '@shared/schema';

export default function Deployments() {
  const { data: deployments = [], isLoading } = useQuery<Deployment[]>({
    queryKey: ['/api/deployments'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-success/20 text-success';
      case 'failed': return 'bg-error/20 text-error';
      case 'in_progress': return 'bg-blue-500/20 text-blue-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return 'fas fa-check';
      case 'failed': return 'fas fa-exclamation-circle';
      case 'in_progress': return 'fas fa-sync-alt animate-spin';
      default: return 'fas fa-clock';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'code_generation': return 'fas fa-code';
      case 'testing': return 'fas fa-vial';
      case 'github_push': return 'fab fa-github';
      case 'render_deploy': return 'fas fa-rocket';
      default: return 'fas fa-cog';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Deployments"
          subtitle="Track agent deployment history and status"
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="text-center text-gray-400">Loading deployments...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Deployments"
        subtitle="Track agent deployment history and status"
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {deployments.length === 0 ? (
            <Card className="bg-surface border-dark">
              <CardContent className="p-8 text-center">
                <i className="fas fa-rocket text-4xl text-gray-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-white mb-2">No Deployments Yet</h3>
                <p className="text-gray-400 mb-4">
                  Deployment history will appear here once you start creating agents.
                </p>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Deploy Agent
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {deployments.map((deployment) => (
                <Card key={deployment.id} className="bg-surface border-dark">
                  <CardHeader className="border-b border-dark">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center">
                        <i className="fas fa-rocket mr-2 text-blue-500"></i>
                        Deployment #{deployment.id}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(deployment.status)}>
                          <i className={`${getStatusIcon(deployment.status)} mr-1`}></i>
                          {deployment.status}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {formatDuration(deployment.createdAt, deployment.completedAt)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <i className={`${getStageIcon(deployment.stage)} text-blue-500`}></i>
                        <span className="text-gray-300 capitalize">
                          {deployment.stage.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {deployment.progress}% Complete
                      </span>
                    </div>
                    
                    <Progress 
                      value={deployment.progress} 
                      className="h-2 bg-gray-700"
                    />

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-400">Started:</span>
                        <div className="text-gray-300">
                          {new Date(deployment.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {deployment.completedAt && (
                        <div>
                          <span className="text-gray-400">Completed:</span>
                          <div className="text-gray-300">
                            {new Date(deployment.completedAt).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {deployment.error && (
                      <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <i className="fas fa-exclamation-circle text-error"></i>
                          <span className="text-error font-medium">Error</span>
                        </div>
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                          {deployment.error}
                        </pre>
                      </div>
                    )}

                    {deployment.logs && (
                      <div className="bg-dark rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <i className="fas fa-terminal text-blue-500"></i>
                          <span className="text-gray-300 font-medium">Logs</span>
                        </div>
                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                          {deployment.logs}
                        </pre>
                      </div>
                    )}
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
