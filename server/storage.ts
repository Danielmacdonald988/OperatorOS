import { 
  users, agents, blueprints, deployments, activityLogs,
  type User, type InsertUser,
  type Agent, type InsertAgent,
  type Blueprint, type InsertBlueprint,
  type Deployment, type InsertDeployment,
  type ActivityLog, type InsertActivityLog
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Agents
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByName(name: string): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<boolean>;

  // Blueprints
  getBlueprint(id: number): Promise<Blueprint | undefined>;
  getBlueprintsByAgent(agentId: number): Promise<Blueprint[]>;
  getAllBlueprints(): Promise<Blueprint[]>;
  createBlueprint(blueprint: InsertBlueprint): Promise<Blueprint>;

  // Deployments
  getDeployment(id: number): Promise<Deployment | undefined>;
  getDeploymentsByAgent(agentId: number): Promise<Deployment[]>;
  getAllDeployments(): Promise<Deployment[]>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: number, updates: Partial<Deployment>): Promise<Deployment | undefined>;

  // Activity Logs
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getAllActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsByAgent(agentId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;

  // Statistics
  getAgentStats(): Promise<{
    activeAgents: number;
    totalDeployments: number;
    successRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private agents: Map<number, Agent>;
  private blueprints: Map<number, Blueprint>;
  private deployments: Map<number, Deployment>;
  private activityLogs: Map<number, ActivityLog>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.agents = new Map();
    this.blueprints = new Map();
    this.deployments = new Map();
    this.activityLogs = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentByName(name: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(
      (agent) => agent.name === name,
    );
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentId++;
    const now = new Date();
    const agent: Agent = { 
      ...insertAgent, 
      id, 
      code: '',
      status: 'creating',
      version: 1,
      createdAt: now,
      updatedAt: now,
      lastRun: null,
      githubUrl: null,
      renderUrl: null,
      metadata: null
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent = { 
      ...agent, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<boolean> {
    return this.agents.delete(id);
  }

  async getBlueprint(id: number): Promise<Blueprint | undefined> {
    return this.blueprints.get(id);
  }

  async getBlueprintsByAgent(agentId: number): Promise<Blueprint[]> {
    return Array.from(this.blueprints.values()).filter(
      (blueprint) => blueprint.agentId === agentId,
    );
  }

  async getAllBlueprints(): Promise<Blueprint[]> {
    return Array.from(this.blueprints.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createBlueprint(insertBlueprint: InsertBlueprint): Promise<Blueprint> {
    const id = this.currentId++;
    const blueprint: Blueprint = { 
      ...insertBlueprint, 
      id, 
      agentId: insertBlueprint.agentId || null,
      createdAt: new Date() 
    };
    this.blueprints.set(id, blueprint);
    return blueprint;
  }

  async getDeployment(id: number): Promise<Deployment | undefined> {
    return this.deployments.get(id);
  }

  async getDeploymentsByAgent(agentId: number): Promise<Deployment[]> {
    return Array.from(this.deployments.values()).filter(
      (deployment) => deployment.agentId === agentId,
    );
  }

  async getAllDeployments(): Promise<Deployment[]> {
    return Array.from(this.deployments.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createDeployment(insertDeployment: InsertDeployment): Promise<Deployment> {
    const id = this.currentId++;
    const deployment: Deployment = { 
      ...insertDeployment, 
      id,
      agentId: insertDeployment.agentId || null,
      status: 'pending',
      stage: 'code_generation',
      progress: 0,
      logs: null,
      error: null,
      createdAt: new Date(),
      completedAt: null
    };
    this.deployments.set(id, deployment);
    return deployment;
  }

  async updateDeployment(id: number, updates: Partial<Deployment>): Promise<Deployment | undefined> {
    const deployment = this.deployments.get(id);
    if (!deployment) return undefined;
    
    const updatedDeployment = { ...deployment, ...updates };
    this.deployments.set(id, updatedDeployment);
    return updatedDeployment;
  }

  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogs.get(id);
  }

  async getAllActivityLogs(limit = 100): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return logs.slice(0, limit);
  }

  async getActivityLogsByAgent(agentId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentId++;
    const log: ActivityLog = { 
      ...insertLog, 
      id, 
      agentId: insertLog.agentId || null,
      deploymentId: insertLog.deploymentId || null,
      metadata: insertLog.metadata || null,
      createdAt: new Date() 
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getAgentStats(): Promise<{
    activeAgents: number;
    totalDeployments: number;
    successRate: number;
  }> {
    const agents = Array.from(this.agents.values());
    const deployments = Array.from(this.deployments.values());
    
    const activeAgents = agents.filter(agent => agent.status === 'running').length;
    const totalDeployments = deployments.length;
    const successfulDeployments = deployments.filter(d => d.status === 'success').length;
    const successRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;

    return {
      activeAgents,
      totalDeployments,
      successRate
    };
  }
}

export const storage = new MemStorage();
