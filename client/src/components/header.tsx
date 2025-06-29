import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  subtitle: string;
  lastDeployTime?: string;
  onNewAgent?: () => void;
}

export function Header({ title, subtitle, lastDeployTime, onNewAgent }: HeaderProps) {
  return (
    <header className="bg-surface border-b border-dark px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-gray-400">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastDeployTime && (
            <div className="flex items-center space-x-2 bg-dark px-3 py-2 rounded-lg">
              <i className="fas fa-clock text-warning text-sm"></i>
              <span className="text-sm text-gray-300">{lastDeployTime}</span>
            </div>
          )}
          {onNewAgent && (
            <Button 
              onClick={onNewAgent}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              New Agent
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
