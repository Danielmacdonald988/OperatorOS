import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  prompt: text("prompt").notNull(),
  code: text("code").notNull(),
  status: text("status", { enum: ["creating", "testing", "deploying", "running", "paused", "failed"] }).notNull().default("creating"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastRun: timestamp("last_run"),
  githubUrl: text("github_url"),
  renderUrl: text("render_url"),
  metadata: json("metadata").$type<Record<string, any>>(),
});

export const blueprints = pgTable("blueprints", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  name: text("name").notNull(),
  version: text("version").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  status: text("status", { enum: ["pending", "in_progress", "success", "failed"] }).notNull().default("pending"),
  stage: text("stage", { enum: ["code_generation", "testing", "github_push", "render_deploy"] }).notNull().default("code_generation"),
  progress: integer("progress").notNull().default(0),
  logs: text("logs"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  level: text("level", { enum: ["debug", "info", "warn", "error", "success"] }).notNull(),
  message: text("message").notNull(),
  agentId: integer("agent_id").references(() => agents.id),
  deploymentId: integer("deployment_id").references(() => deployments.id),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAgentSchema = createInsertSchema(agents).pick({
  name: true,
  description: true,
  prompt: true,
});

export const insertBlueprintSchema = createInsertSchema(blueprints).pick({
  agentId: true,
  name: true,
  version: true,
  content: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).pick({
  agentId: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  level: true,
  message: true,
  agentId: true,
  deploymentId: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertBlueprint = z.infer<typeof insertBlueprintSchema>;
export type Blueprint = typeof blueprints.$inferSelect;

export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deployments.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
