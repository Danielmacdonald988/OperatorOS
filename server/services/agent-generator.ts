import { storage } from '../storage';
import { generateAgentCode, fixAgentCode } from './openai';
import { testAgentCode } from './testing';
import { pushAgentToGitHub } from './github';
import { triggerRenderDeploy } from './render';
import type { Agent, InsertAgent } from '@shared/schema';

export interface DeploymentProgress {
  stage: 'code_generation' | 'testing' | 'github_push' | 'render_deploy';
  progress: number;
  message: string;
  success?: boolean;
  error?: string;
}

export async function deployAgent(
  prompt: string,
  onProgress?: (progress: DeploymentProgress) => void
): Promise<Agent> {
  let agent: Agent | undefined;
  let deploymentId: number | undefined;

  try {
    // Stage 1: Code Generation
    onProgress?.({
      stage: 'code_generation',
      progress: 10,
      message: 'Generating agent code with GPT-4...'
    });

    await storage.createActivityLog({
      level: 'info',
      message: `Starting agent deployment from prompt: ${prompt.substring(0, 100)}...`,
      agentId: null,
      deploymentId: null,
      metadata: { prompt }
    });

    const generatedAgent = await generateAgentCode(prompt);
    
    // Create agent record
    const insertAgent: InsertAgent = {
      name: generatedAgent.name,
      description: generatedAgent.description,
      prompt: prompt
    };

    agent = await storage.createAgent(insertAgent);
    
    // Create deployment record
    const deployment = await storage.createDeployment({ agentId: agent.id });
    deploymentId = deployment.id;

    // Update agent with code
    agent = await storage.updateAgent(agent.id, {
      code: generatedAgent.code,
      status: 'testing'
    });

    onProgress?.({
      stage: 'code_generation',
      progress: 25,
      message: 'Code generation completed'
    });

    await storage.createActivityLog({
      level: 'success',
      message: `Generated ${generatedAgent.name}.py (${generatedAgent.code.length} characters)`,
      agentId: agent!.id,
      deploymentId,
      metadata: { dependencies: generatedAgent.dependencies }
    });

    // Stage 2: Testing
    onProgress?.({
      stage: 'testing',
      progress: 40,
      message: 'Testing agent functionality...'
    });

    await storage.updateDeployment(deploymentId, {
      stage: 'testing',
      progress: 40
    });

    let testResult = await testAgentCode(generatedAgent.code, generatedAgent.name);
    
    // Auto-fix if test fails
    if (!testResult.success) {
      await storage.createActivityLog({
        level: 'warn',
        message: `Initial test failed: ${testResult.error}`,
        agentId: agent!.id,
        deploymentId,
        metadata: { testOutput: testResult.output }
      });

      onProgress?.({
        stage: 'testing',
        progress: 50,
        message: 'Auto-fixing code issues...'
      });

      try {
        const fixedCode = await fixAgentCode(generatedAgent.code, testResult.error || 'Test failed');
        agent = await storage.updateAgent(agent!.id, { code: fixedCode });
        
        // Re-test fixed code
        testResult = await testAgentCode(fixedCode, generatedAgent.name);
      } catch (fixError) {
        await storage.createActivityLog({
          level: 'error',
          message: `Auto-fix failed: ${fixError.message}`,
          agentId: agent!.id,
          deploymentId,
          metadata: { fixError: fixError.message }
        });
      }
    }

    if (!testResult.success) {
      throw new Error(`Agent testing failed: ${testResult.error}`);
    }

    onProgress?.({
      stage: 'testing',
      progress: 60,
      message: 'Testing completed successfully'
    });

    await storage.createActivityLog({
      level: 'success',
      message: `Agent testing passed (${testResult.executionTime}ms)`,
      agentId: agent!.id,
      deploymentId,
      metadata: { testResult }
    });

    // Stage 3: GitHub Push
    onProgress?.({
      stage: 'github_push',
      progress: 70,
      message: 'Pushing to GitHub...'
    });

    await storage.updateDeployment(deploymentId, {
      stage: 'github_push',
      progress: 70
    });

    const blueprint = generateBlueprint(agent!, generatedAgent, testResult);
    const githubResult = await pushAgentToGitHub(
      generatedAgent.name,
      agent!.code,
      blueprint
    );

    // Save blueprint to database
    await storage.createBlueprint({
      agentId: agent!.id,
      name: `v1-${generatedAgent.name}`,
      version: 'v1',
      content: blueprint
    });

    agent = await storage.updateAgent(agent!.id, {
      githubUrl: githubResult.url,
      status: 'deploying'
    });

    onProgress?.({
      stage: 'github_push',
      progress: 85,
      message: 'GitHub push completed'
    });

    await storage.createActivityLog({
      level: 'success',
      message: `GitHub push completed`,
      agentId: agent!.id,
      deploymentId,
      metadata: { githubUrl: githubResult.url, commitSha: githubResult.commitSha }
    });

    // Stage 4: Render Deploy
    onProgress?.({
      stage: 'render_deploy',
      progress: 90,
      message: 'Triggering Render deployment...'
    });

    await storage.updateDeployment(deploymentId, {
      stage: 'render_deploy',
      progress: 90
    });

    const renderResult = await triggerRenderDeploy();
    
    agent = await storage.updateAgent(agent!.id, {
      renderUrl: renderResult.url,
      status: 'running',
      lastRun: new Date()
    });

    // Complete deployment
    await storage.updateDeployment(deploymentId, {
      status: 'success',
      progress: 100,
      completedAt: new Date()
    });

    onProgress?.({
      stage: 'render_deploy',
      progress: 100,
      message: 'Deployment completed successfully',
      success: true
    });

    await storage.createActivityLog({
      level: 'success',
      message: `Agent '${generatedAgent.name}' deployed successfully`,
      agentId: agent!.id,
      deploymentId,
      metadata: { 
        renderUrl: renderResult.url,
        deployId: renderResult.deployId
      }
    });

    return agent!;

  } catch (error) {
    const errorMessage = error.message || 'Unknown deployment error';
    
    if (agent) {
      await storage.updateAgent(agent.id, { status: 'failed' });
    }

    if (deploymentId) {
      await storage.updateDeployment(deploymentId, {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date()
      });
    }

    await storage.createActivityLog({
      level: 'error',
      message: `Deployment failed: ${errorMessage}`,
      agentId: agent?.id || null,
      deploymentId: deploymentId || null,
      metadata: { error: errorMessage, prompt }
    });

    onProgress?.({
      stage: 'code_generation',
      progress: 0,
      message: 'Deployment failed',
      success: false,
      error: errorMessage
    });

    throw error;
  }
}

function generateBlueprint(agent: Agent, generatedAgent: any, testResult: any): string {
  const timestamp = new Date().toISOString();
  
  return `# ${agent.name} - Agent Blueprint v1

## Overview
- **Name**: ${agent.name}
- **Description**: ${agent.description}
- **Created**: ${timestamp}
- **Status**: ${agent.status}

## Original Prompt
\`\`\`
${agent.prompt}
\`\`\`

## Generated Code
\`\`\`python
${agent.code}
\`\`\`

## Dependencies
${generatedAgent.dependencies.map((dep: string) => `- ${dep}`).join('\n')}

## Test Results
- **Success**: ${testResult.success}
- **Execution Time**: ${testResult.executionTime}ms
- **Output**: 
\`\`\`
${testResult.output}
\`\`\`

## Metadata
- **Version**: 1
- **GitHub URL**: ${agent.githubUrl || 'Not deployed'}
- **Render URL**: ${agent.renderUrl || 'Not deployed'}

---
Generated by OperatorGPT Autonomous Agent System
`;
}
