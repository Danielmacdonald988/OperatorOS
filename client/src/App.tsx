import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useWebSocket } from "@/hooks/use-websocket";

// Pages
import Console from "@/pages/console";
import Agents from "@/pages/agents";
import Blueprints from "@/pages/blueprints";
import Deployments from "@/pages/deployments";
import Logs from "@/pages/logs";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { isConnected } = useWebSocket();
  
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['/api/logs'],
    select: (data: any[]) => data.filter(log => log.level === 'warn' || log.level === 'error'),
  });

  return (
    <div className="bg-dark min-h-screen text-gray-100 font-sans flex">
      <Sidebar 
        agentCount={(stats as any)?.activeAgents || 0}
        logCount={logs.length}
        isOnline={isConnected}
      />
      
      <Switch>
        <Route path="/" component={Console} />
        <Route path="/agents" component={Agents} />
        <Route path="/blueprints" component={Blueprints} />
        <Route path="/deployments" component={Deployments} />
        <Route path="/logs" component={Logs} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
