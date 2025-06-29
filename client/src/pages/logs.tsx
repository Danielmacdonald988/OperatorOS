import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ActivityLog } from '@shared/schema';

export default function Logs() {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/logs'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const filteredLogs = logs.filter(log => 
    levelFilter === 'all' || log.level === levelFilter
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'bg-success/20 text-success';
      case 'error': return 'bg-error/20 text-error';
      case 'warn': return 'bg-warning/20 text-warning';
      case 'info': return 'bg-blue-500/20 text-blue-500';
      case 'debug': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warn': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      case 'debug': return 'fas fa-bug';
      default: return 'fas fa-circle';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Logs"
          subtitle="System activity and agent operations"
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="text-center text-gray-400">Loading logs...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Logs"
        subtitle="System activity and agent operations"
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(levelCounts).map(([level, count]) => (
              <Card key={level} className="bg-surface border-dark">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold mb-1 ${
                    level === 'success' ? 'text-success' :
                    level === 'error' ? 'text-error' :
                    level === 'warn' ? 'text-warning' :
                    level === 'info' ? 'text-blue-500' :
                    'text-gray-400'
                  }`}>
                    {count}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{level}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="bg-surface border-dark">
            <CardHeader className="border-b border-dark">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Activity Logs</CardTitle>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-40 bg-dark border-dark text-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dark border-dark">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <i className="fas fa-file-alt text-4xl mb-4"></i>
                  <p>No logs found for the selected filter.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <i className={`${getLevelIcon(log.level)} text-sm ${
                            log.level === 'success' ? 'text-success' :
                            log.level === 'error' ? 'text-error' :
                            log.level === 'warn' ? 'text-warning' :
                            log.level === 'info' ? 'text-blue-500' :
                            'text-gray-400'
                          }`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getLevelColor(log.level)}>
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatTime(log.createdAt)}
                            </span>
                            {log.agentId && (
                              <span className="text-xs text-blue-400">
                                Agent #{log.agentId}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {log.message}
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                                View metadata
                              </summary>
                              <pre className="mt-2 text-xs text-gray-400 bg-gray-800 rounded p-2 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
