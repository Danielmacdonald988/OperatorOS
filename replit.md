# OperatorGPT - AI Agent Deployment Platform

## Overview

OperatorGPT is a full-stack web application that enables users to create, deploy, and manage AI agents through natural language prompts. The platform generates Python code using GPT-4, tests it, pushes to GitHub, and deploys to Render automatically. Built with modern web technologies including React, TypeScript, Express, and PostgreSQL.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket connection for deployment progress updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **External Services**: OpenAI GPT-4 API, GitHub API, Render webhooks
- **Real-time**: WebSocket Server for broadcasting deployment updates
- **Development**: Hot module replacement via Vite middleware

### Database Schema
- **Users**: Authentication and user management
- **Agents**: Core agent entities with status tracking
- **Blueprints**: Agent specifications and documentation
- **Deployments**: Deployment pipeline tracking with progress stages
- **Activity Logs**: System-wide logging with different severity levels

## Key Components

### Agent Generation Pipeline
1. **Code Generation**: Uses OpenAI GPT-4 to generate Python agent code from natural language prompts
2. **Testing Phase**: Automated syntax checking and basic execution validation
3. **Version Control**: Automatic Git commits and pushes to GitHub repository
4. **Deployment**: Trigger Render deployments via webhooks
5. **Status Tracking**: Real-time progress updates through WebSocket connections

### User Interface Components
- **Console Dashboard**: Main interface for creating new agents with prompt input
- **Agent Management**: View, edit, and manage existing agents
- **Deployment Pipeline**: Visual representation of deployment stages with progress indicators
- **Activity Logging**: Real-time system logs with filtering capabilities
- **Blueprint Viewer**: Agent documentation and specifications

### External Integrations
- **OpenAI API**: GPT-4 for code generation and error fixing
- **GitHub API**: Repository management and code versioning via Octokit
- **Render Platform**: Automated deployment via webhook triggers
- **Neon Database**: PostgreSQL hosting for production data

## Data Flow

1. **User Input**: User submits natural language prompt through web interface
2. **Code Generation**: Backend calls OpenAI API to generate Python agent code
3. **Database Storage**: Agent metadata and code stored in PostgreSQL
4. **Testing Pipeline**: Automated syntax and execution validation
5. **Version Control**: Code pushed to GitHub repository with proper versioning
6. **Deployment Trigger**: Render webhook initiated for live deployment
7. **Real-time Updates**: WebSocket broadcasts progress to connected clients
8. **Activity Logging**: All operations logged with appropriate severity levels

## External Dependencies

### Production Services
- **Neon Database**: PostgreSQL hosting (@neondatabase/serverless)
- **OpenAI**: GPT-4 API access for code generation
- **GitHub**: Version control and repository management
- **Render**: Application deployment and hosting platform

### Development Tools
- **Replit**: Development environment with custom plugins
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Development Environment
- Vite dev server with HMR for frontend development
- Express server with TypeScript compilation via tsx
- Local database connection via environment variables
- WebSocket server integrated with HTTP server

### Production Build
- Frontend: Vite build with optimized bundles
- Backend: ESBuild compilation to single JavaScript file
- Database: Drizzle migrations applied automatically
- Static assets served via Express with proper caching

### Environment Configuration
- Database connection via `DATABASE_URL`
- OpenAI API key via `OPENAI_API_KEY`
- GitHub credentials via `GITHUB_TOKEN`
- Render webhook URL via `RENDER_WEBHOOK_URL`

## Changelog
- June 29, 2025. Initial setup
- June 29, 2025. Built complete OperatorGPT autonomous agent operating system with full deployment pipeline
- June 30, 2025. Created GitPushAgent for automatic Git operations when new agents are generated

## Current Status
- ✅ Complete full-stack web application built
- ✅ FastAPI backend with Python 3.11 serving all endpoints
- ✅ Clean FastAPI + uvicorn setup with working router
- ✅ Homepage route using HTMLResponse for Render deployment
- ✅ Real-time WebSocket communication working properly
- ✅ Modern dark UI with console, agents, blueprints, deployments, and logs
- ✅ Render configuration optimized for Python deployment
- ✅ All deployment files verified (main.py, routes.py, render.yaml)
- ✅ Complete API endpoint testing passed (200 status codes)
- ✅ Ready for Replit → GitHub → Render deployment at operatoros.onrender.com

## User Preferences

Preferred communication style: Simple, everyday language.