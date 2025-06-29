import { useQuery } from '@tanstack/react-query';
import type { ActivityLog } from '@shared/schema';

export function ActivityLog() {
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/logs'],
  });

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl border border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-dark">
          <h3 className="text-lg font-semibold text-white">Activity Log</h3>
        </div>
        <div className="p-4 bg-dark font-mono text-sm">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-success';
      case 'error': return 'text-error';
      case 'warn': return 'text-warning';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-dark overflow-hidden">
      <div className="px-6 py-4 border-b border-dark">
        <h3 className="text-lg font-semibold text-white">Activity Log</h3>
      </div>
      <div className="p-4 bg-dark font-mono text-sm max-h-80 overflow-y-auto">
        <div className="space-y-1">
          {logs.map((log) => (
            <div key={log.id} className={getLevelColor(log.level)}>
              <span className="text-gray-500">[{formatTime(log.createdAt)}]</span>{' '}
              <span className={getLevelColor(log.level)}>{log.level.toUpperCase()}</span>{' '}
              {log.message}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-400">No activity logs yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
