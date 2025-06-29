import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { deployAgent, type DeploymentProgress } from "./services/agent-generator";
import { insertAgentSchema } from "@shared/schema";
import { z } from "zod";

const deploySchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  autoDeploy: z.boolean().optional().default(true),
  extensiveTesting: z.boolean().optional().default(false),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  // WebSocket connection handling for real-time updates
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast to all connected WebSocket clients
  function broadcast(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(data));
      }
    });
  }

  // Deploy agent endpoint
  app.post('/api/deploy', async (req, res) => {
    try {
      const { prompt, autoDeploy, extensiveTesting } = deploySchema.parse(req.body);
      
      // Start deployment process
      deployAgent(prompt, (progress: DeploymentProgress) => {
        // Broadcast progress to WebSocket clients
        broadcast({
          type: 'deployment_progress',
          data: progress
        });
      })
      .then(async (agent) => {
        broadcast({
          type: 'deployment_complete',
          data: { agent, success: true }
        });
      })
      .catch(async (error) => {
        broadcast({
          type: 'deployment_complete',
          data: { error: error.message, success: false }
        });
      });

      res.json({ 
        message: 'Deployment started', 
        status: 'initiated' 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to start deployment', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all agents
  app.get('/api/agents', async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch agents', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get specific agent
  app.get('/api/agents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id);
      
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch agent', 
        error: error.message 
      });
    }
  });

  // Update agent status
  app.patch('/api/agents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const agent = await storage.updateAgent(id, updates);
      
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
      
      // Broadcast update to WebSocket clients
      broadcast({
        type: 'agent_updated',
        data: agent
      });
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to update agent', 
        error: error.message 
      });
    }
  });

  // Delete agent
  app.delete('/api/agents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAgent(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Agent not found' });
      }
      
      // Broadcast deletion to WebSocket clients
      broadcast({
        type: 'agent_deleted',
        data: { id }
      });
      
      res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to delete agent', 
        error: error.message 
      });
    }
  });

  // Get all blueprints
  app.get('/api/blueprints', async (req, res) => {
    try {
      const blueprints = await storage.getAllBlueprints();
      res.json(blueprints);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch blueprints', 
        error: error.message 
      });
    }
  });

  // Get blueprints for specific agent
  app.get('/api/agents/:id/blueprints', async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const blueprints = await storage.getBlueprintsByAgent(agentId);
      res.json(blueprints);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch agent blueprints', 
        error: error.message 
      });
    }
  });

  // Get all deployments
  app.get('/api/deployments', async (req, res) => {
    try {
      const deployments = await storage.getAllDeployments();
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch deployments', 
        error: error.message 
      });
    }
  });

  // Get deployment status
  app.get('/api/deployments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deployment = await storage.getDeployment(id);
      
      if (!deployment) {
        return res.status(404).json({ message: 'Deployment not found' });
      }
      
      res.json(deployment);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch deployment', 
        error: error.message 
      });
    }
  });

  // Get activity logs
  app.get('/api/logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getAllActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch logs', 
        error: error.message 
      });
    }
  });

  // Get logs for specific agent
  app.get('/api/agents/:id/logs', async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const logs = await storage.getActivityLogsByAgent(agentId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch agent logs', 
        error: error.message 
      });
    }
  });

  // Get system statistics
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getAgentStats();
      const recentDeployments = await storage.getAllDeployments();
      const weeklyDeployments = recentDeployments.filter(d => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(d.createdAt) > weekAgo;
      }).length;

      res.json({
        ...stats,
        weeklyDeployments,
        lastDeployTime: recentDeployments[0]?.createdAt || null
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Failed to fetch statistics', 
        error: error.message 
      });
    }
  });

  return httpServer;
}
