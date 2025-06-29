interface PipelineStage {
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  icon: string;
}

interface DeploymentPipelineProps {
  currentStage?: string;
  progress?: number;
  message?: string;
}

export function DeploymentPipeline({ currentStage, progress = 0, message }: DeploymentPipelineProps) {
  const stages: PipelineStage[] = [
    {
      name: 'Code Generation',
      description: 'GPT-4 Processing',
      status: getStageStatus('code_generation', currentStage, progress),
      icon: 'fas fa-code'
    },
    {
      name: 'Testing',
      description: 'Unit Tests',
      status: getStageStatus('testing', currentStage, progress),
      icon: 'fas fa-vial'
    },
    {
      name: 'GitHub Push',
      description: 'Version Control',
      status: getStageStatus('github_push', currentStage, progress),
      icon: 'fab fa-github'
    },
    {
      name: 'Deploy',
      description: 'Render',
      status: getStageStatus('render_deploy', currentStage, progress),
      icon: 'fas fa-rocket'
    }
  ];

  return (
    <div className="bg-surface rounded-xl border border-dark overflow-hidden">
      <div className="px-6 py-4 border-b border-dark">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <i className="fas fa-stream mr-2 text-blue-500"></i>
          Deployment Pipeline
        </h3>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-8">
            {stages.map((stage, index) => (
              <div key={stage.name} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stage.status === 'completed' 
                    ? 'bg-success' 
                    : stage.status === 'active' 
                      ? 'bg-blue-500' 
                      : 'bg-gray-700'
                }`}>
                  {stage.status === 'completed' ? (
                    <i className="fas fa-check text-white text-sm"></i>
                  ) : stage.status === 'active' ? (
                    <i className="fas fa-sync-alt text-white text-sm animate-spin"></i>
                  ) : (
                    <i className="fas fa-clock text-gray-400 text-sm"></i>
                  )}
                </div>
                <div>
                  <div className={`font-medium ${
                    stage.status === 'pending' ? 'text-gray-400' : 'text-white'
                  }`}>
                    {stage.name}
                  </div>
                  <div className={`text-sm ${
                    stage.status === 'pending' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {stage.description}
                  </div>
                </div>
                {index < stages.length - 1 && (
                  <div className={`w-12 h-px ${
                    stage.status === 'completed' 
                      ? 'bg-success' 
                      : stage.status === 'active' 
                        ? 'bg-blue-500' 
                        : 'bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {message && (
          <div className="bg-dark rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{message}</span>
              <span className="text-blue-500">{Math.round(progress)}% Complete</span>
            </div>
            <div className="mt-2 bg-gray-800 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getStageStatus(stageName: string, currentStage?: string, progress?: number): 'completed' | 'active' | 'pending' {
  if (!currentStage) return 'pending';
  
  const stageOrder = ['code_generation', 'testing', 'github_push', 'render_deploy'];
  const currentIndex = stageOrder.indexOf(currentStage);
  const stageIndex = stageOrder.indexOf(stageName);
  
  if (stageIndex < currentIndex) return 'completed';
  if (stageIndex === currentIndex) return 'active';
  return 'pending';
}
