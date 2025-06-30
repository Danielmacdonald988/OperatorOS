from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# Data models
class Agent(BaseModel):
    id: int
    name: str
    description: str
    status: str
    created_at: datetime
    github_url: Optional[str] = None
    render_url: Optional[str] = None

class Stats(BaseModel):
    active_agents: int
    total_deployments: int
    success_rate: float
    last_deploy_time: Optional[str] = None

# Sample data
sample_agents = [
    Agent(
        id=1,
        name="Data Analyzer Agent",
        description="Processes CSV files and generates insights",
        status="active",
        created_at=datetime.now(),
        github_url="https://github.com/Danielmacdonald988/OperatorOS",
        render_url="https://operatoros.onrender.com"
    ),
    Agent(
        id=2,
        name="Email Assistant Agent",
        description="Automated email response system",
        status="deploying",
        created_at=datetime.now(),
        github_url="https://github.com/Danielmacdonald988/OperatorOS",
        render_url="https://operatoros.onrender.com"
    )
]

# API Routes
@router.get("/api/stats", response_model=Stats)
async def get_stats():
    return Stats(
        active_agents=len([a for a in sample_agents if a.status == "active"]),
        total_deployments=len(sample_agents),
        success_rate=85.5,
        last_deploy_time="2025-06-30T12:00:00Z"
    )

@router.get("/api/agents", response_model=List[Agent])
async def get_agents():
    return sample_agents

@router.get("/api/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: int):
    for agent in sample_agents:
        if agent.id == agent_id:
            return agent
    return {"error": "Agent not found"}

class DeployRequest(BaseModel):
    prompt: str

@router.post("/api/deploy")
async def deploy_agent(request: DeployRequest):
    return {
        "status": "success",
        "message": f"Deployment started for prompt: {request.prompt[:50]}...",
        "agent_id": len(sample_agents) + 1
    }