import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Blueprint } from '@shared/schema';

export default function Blueprints() {
  const { data: blueprints = [], isLoading } = useQuery<Blueprint[]>({
    queryKey: ['/api/blueprints'],
  });

  const downloadBlueprint = (blueprint: Blueprint) => {
    const blob = new Blob([blueprint.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Blueprints"
          subtitle="Agent specifications and documentation"
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="text-center text-gray-400">Loading blueprints...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Blueprints"
        subtitle="Agent specifications and documentation"
      />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {blueprints.length === 0 ? (
            <Card className="bg-surface border-dark">
              <CardContent className="p-8 text-center">
                <i className="fas fa-file-code text-4xl text-gray-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-white mb-2">No Blueprints Yet</h3>
                <p className="text-gray-400 mb-4">
                  Blueprints are automatically created when you deploy agents. 
                  Create your first agent to see blueprints here.
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {blueprints.map((blueprint) => (
                <Card key={blueprint.id} className="bg-surface border-dark">
                  <CardHeader className="border-b border-dark">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center">
                        <i className="fas fa-file-code mr-2 text-blue-500"></i>
                        {blueprint.name}
                      </CardTitle>
                      <Badge className="bg-blue-500/20 text-blue-500">
                        {blueprint.version}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-gray-300">
                          {new Date(blueprint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Size:</span>
                        <span className="text-gray-300">
                          {Math.round(blueprint.content.length / 1024)}KB
                        </span>
                      </div>
                    </div>

                    <div className="bg-dark rounded-lg p-4 max-h-40 overflow-y-auto">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {blueprint.content.substring(0, 300)}
                        {blueprint.content.length > 300 && '...'}
                      </pre>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => downloadBlueprint(blueprint)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <i className="fas fa-download mr-2"></i>
                        Download
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(blueprint.content);
                          // You could add a toast here
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <i className="fas fa-copy"></i>
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
