import { Link, useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  agentCount: number;
  logCount: number;
  isOnline: boolean;
}

export function Sidebar({ agentCount, logCount, isOnline }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    {
      href: '/',
      icon: 'fas fa-terminal',
      label: 'Console',
      active: location === '/'
    },
    {
      href: '/agents',
      icon: 'fas fa-cogs',
      label: 'Agents',
      badge: agentCount,
      active: location === '/agents'
    },
    {
      href: '/blueprints',
      icon: 'fas fa-file-code',
      label: 'Blueprints',
      active: location === '/blueprints'
    },
    {
      href: '/deployments',
      icon: 'fas fa-rocket',
      label: 'Deployments',
      active: location === '/deployments'
    },
    {
      href: '/logs',
      icon: 'fas fa-file-alt',
      label: 'Logs',
      badge: logCount,
      badgeVariant: 'warning' as const,
      active: location === '/logs'
    }
  ];

  return (
    <div className="w-64 bg-surface border-r border-dark flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-dark">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple text-white rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-sm"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">OperatorGPT</h1>
            <p className="text-xs text-gray-400">Autonomous Agent OS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  item.active 
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}>
                  <i className={`${item.icon} text-sm`}></i>
                  <span className="font-medium">{item.label}</span>
                  {item.badge !== undefined && (
                    <Badge 
                      variant={item.badgeVariant || 'default'}
                      className={`ml-auto text-xs px-2 py-1 ${
                        item.badgeVariant === 'warning' 
                          ? 'bg-warning/20 text-warning' 
                          : 'bg-success/20 text-success'
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-dark">
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-gray-300">
            {isOnline ? 'System Online' : 'System Offline'}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <div>GitHub: Connected</div>
          <div>Render: Active</div>
          <div>GPT-4: Available</div>
        </div>
      </div>
    </div>
  );
}
