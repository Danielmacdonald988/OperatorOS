from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import json
import os
from datetime import datetime
import uuid
import logging
from routes import router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OperatorGPT", description="Autonomous AI Agent Deployment Platform")

# Include router
app.include_router(router)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if self.active_connections:
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending WebSocket message: {e}")
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for conn in disconnected:
                self.disconnect(conn)

manager = ConnectionManager()

# Pydantic models
class Agent(BaseModel):
    id: int
    name: str
    description: str
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    prompt: str
    code: str
    github_url: Optional[str] = None
    render_url: Optional[str] = None

class DeployRequest(BaseModel):
    prompt: str = Field(..., min_length=10, description="Prompt for agent generation")
    auto_deploy: bool = Field(default=True, description="Automatically deploy after generation")
    extensive_testing: bool = Field(default=False, description="Run extensive tests")

class DeploymentProgress(BaseModel):
    stage: str
    progress: int
    message: str
    success: Optional[bool] = None
    error: Optional[str] = None

class Blueprint(BaseModel):
    id: int
    name: str
    description: str
    agent_id: int
    content: str
    created_at: datetime

class Deployment(BaseModel):
    id: int
    agent_id: int
    status: str
    github_commit: Optional[str] = None
    render_deploy_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

class ActivityLog(BaseModel):
    id: int
    message: str
    level: str
    timestamp: datetime
    agent_id: Optional[int] = None

class Stats(BaseModel):
    active_agents: int
    total_deployments: int
    weekly_deployments: int
    success_rate: float
    last_deploy_time: Optional[str] = None

# In-memory storage (replace with database in production)
class MemoryStorage:
    def __init__(self):
        self.agents: Dict[int, Agent] = {}
        self.blueprints: Dict[int, Blueprint] = {}
        self.deployments: Dict[int, Deployment] = {}
        self.activity_logs: Dict[int, ActivityLog] = {}
        self.next_id = 1
        
        # Add sample data
        self._add_sample_data()
    
    def _add_sample_data(self):
        # Sample agent
        agent = Agent(
            id=1,
            name="Web Scraper Agent",
            description="Intelligent web scraping agent that extracts data from websites",
            status="active",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            prompt="Create a web scraper that can extract product information from e-commerce sites",
            code="# Web scraper agent code\nimport requests\nfrom bs4 import BeautifulSoup\n\ndef scrape_products(url):\n    response = requests.get(url)\n    soup = BeautifulSoup(response.content, 'html.parser')\n    return soup.find_all('div', class_='product')",
            github_url="https://github.com/Danielmacdonald988/OperatorOS",
            render_url="https://operatoros.onrender.com"
        )
        self.agents[1] = agent
        
        # Sample blueprint
        blueprint = Blueprint(
            id=1,
            name="Web Scraper Blueprint",
            description="Blueprint for web scraping agents",
            agent_id=1,
            content="# Web Scraper Agent Blueprint\n\n## Overview\nThis blueprint creates intelligent web scraping agents...",
            created_at=datetime.now()
        )
        self.blueprints[1] = blueprint
        
        # Sample deployment
        deployment = Deployment(
            id=1,
            agent_id=1,
            status="deployed",
            github_commit="abc123",
            render_deploy_id="deploy_456",
            created_at=datetime.now(),
            completed_at=datetime.now()
        )
        self.deployments[1] = deployment
        
        # Sample activity log
        log = ActivityLog(
            id=1,
            message="Web Scraper Agent deployed successfully",
            level="info",
            timestamp=datetime.now(),
            agent_id=1
        )
        self.activity_logs[1] = log
        
        self.next_id = 2

storage = MemoryStorage()

# API Routes
@app.get("/")
async def root():
    return FileResponse("dist/public/index.html")

@app.get("/api/stats")
async def get_stats():
    active_agents = len([a for a in storage.agents.values() if a.status == "active"])
    total_deployments = len(storage.deployments)
    
    return Stats(
        active_agents=active_agents,
        total_deployments=total_deployments,
        weekly_deployments=5,
        success_rate=85.5,
        last_deploy_time="2025-06-29T23:15:00Z"
    )

@app.get("/api/agents", response_model=List[Agent])
async def get_agents():
    return list(storage.agents.values())

@app.get("/api/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: int):
    if agent_id not in storage.agents:
        raise HTTPException(status_code=404, detail="Agent not found")
    return storage.agents[agent_id]

@app.post("/api/agents/{agent_id}/toggle")
async def toggle_agent(agent_id: int):
    if agent_id not in storage.agents:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = storage.agents[agent_id]
    agent.status = "inactive" if agent.status == "active" else "active"
    agent.updated_at = datetime.now()
    
    # Log activity
    log = ActivityLog(
        id=storage.next_id,
        message=f"Agent {agent.name} status changed to {agent.status}",
        level="info",
        timestamp=datetime.now(),
        agent_id=agent_id
    )
    storage.activity_logs[storage.next_id] = log
    storage.next_id += 1
    
    # Broadcast update
    await manager.broadcast({
        "type": "agent_status_update",
        "data": {"agent_id": agent_id, "status": agent.status}
    })
    
    return {"status": "success", "new_status": agent.status}

@app.get("/api/blueprints", response_model=List[Blueprint])
async def get_blueprints():
    return list(storage.blueprints.values())

@app.get("/api/blueprints/{blueprint_id}/download")
async def download_blueprint(blueprint_id: int):
    if blueprint_id not in storage.blueprints:
        raise HTTPException(status_code=404, detail="Blueprint not found")
    
    blueprint = storage.blueprints[blueprint_id]
    return {"content": blueprint.content, "filename": f"{blueprint.name}.md"}

@app.get("/api/deployments", response_model=List[Deployment])
async def get_deployments():
    return list(storage.deployments.values())

@app.get("/api/logs", response_model=List[ActivityLog])
async def get_logs():
    return sorted(storage.activity_logs.values(), key=lambda x: x.timestamp, reverse=True)

@app.post("/api/deploy")
async def deploy_agent(request: DeployRequest):
    try:
        # Create new agent
        agent_id = storage.next_id
        agent = Agent(
            id=agent_id,
            name=f"Agent {agent_id}",
            description="Generated from prompt: " + request.prompt[:100] + "...",
            status="deploying",
            created_at=datetime.now(),
            updated_at=datetime.now(),
            prompt=request.prompt,
            code="# Generated agent code will go here",
            github_url="https://github.com/Danielmacdonald988/OperatorOS",
            render_url="https://operatoros.onrender.com"
        )
        storage.agents[agent_id] = agent
        storage.next_id += 1
        
        # Create deployment record
        deployment = Deployment(
            id=storage.next_id,
            agent_id=agent_id,
            status="in_progress",
            created_at=datetime.now()
        )
        storage.deployments[storage.next_id] = deployment
        storage.next_id += 1
        
        # Start deployment process (simulated)
        asyncio.create_task(simulate_deployment(agent_id, request.prompt))
        
        return {
            "status": "success",
            "message": "Deployment started",
            "agent_id": agent_id
        }
    
    except Exception as e:
        logger.error(f"Deployment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def simulate_deployment(agent_id: int, prompt: str):
    """Simulate the deployment process with progress updates"""
    stages = [
        {"stage": "code_generation", "progress": 25, "message": "Generating agent code with GPT-4..."},
        {"stage": "testing", "progress": 50, "message": "Running automated tests..."},
        {"stage": "github_push", "progress": 75, "message": "Pushing to GitHub repository..."},
        {"stage": "render_deploy", "progress": 100, "message": "Deploying to Render platform..."}
    ]
    
    for stage_info in stages:
        await asyncio.sleep(2)  # Simulate processing time
        
        progress = DeploymentProgress(**stage_info)
        
        # Broadcast progress
        await manager.broadcast({
            "type": "deployment_progress",
            "data": progress.dict()
        })
        
        # Log activity
        log = ActivityLog(
            id=storage.next_id,
            message=f"Agent {agent_id}: {progress.message}",
            level="info",
            timestamp=datetime.now(),
            agent_id=agent_id
        )
        storage.activity_logs[storage.next_id] = log
        storage.next_id += 1
    
    # Mark deployment as complete
    agent = storage.agents[agent_id]
    agent.status = "active"
    agent.updated_at = datetime.now()
    
    # Find and update deployment record
    for deployment in storage.deployments.values():
        if deployment.agent_id == agent_id and deployment.status == "in_progress":
            deployment.status = "deployed"
            deployment.completed_at = datetime.now()
            deployment.github_commit = str(uuid.uuid4())[:8]
            deployment.render_deploy_id = f"deploy_{uuid.uuid4().hex[:8]}"
            break
    
    # Final success broadcast
    await manager.broadcast({
        "type": "deployment_complete",
        "data": {
            "agent_id": agent_id,
            "status": "success",
            "message": "Agent deployed successfully!"
        }
    })

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Static files are handled by the router homepage

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)