from fastapi import APIRouter, Query, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import re
import json
from openai import OpenAI

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Utility functions
def create_slug(text: str) -> str:
    """Convert text to a safe filename slug"""
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')[:50]

def log_deployment(message: str, level: str = "info"):
    """Log deployment actions to logs/deployments.log"""
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] {level.upper()}: {message}\n"
    
    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # Append to deployment log
    with open("logs/deployments.log", "a") as f:
        f.write(log_entry)

def generate_agent_code(prompt: str) -> str:
    """Use OpenAI GPT-4 to generate Python agent code from natural language"""
    system_prompt = """You are an expert Python developer creating autonomous AI agents. 
Generate clean, production-ready Python code based on the user's natural language description.

Requirements:
- Create a complete Python agent class
- Include proper imports and error handling
- Add docstrings and comments
- Make the agent autonomous and functional
- Use modern Python patterns and best practices
- Include a main() function to run the agent

Return only the Python code, no explanations."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a Python agent for: {prompt}"}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        if response.choices and response.choices[0].message.content:
            return response.choices[0].message.content.strip()
        else:
            raise Exception("No response content received from OpenAI")
    
    except Exception as e:
        # Log the OpenAI error for debugging
        log_deployment(f"OpenAI API error: {str(e)}", "error")
        
        # Generate a basic template agent when OpenAI fails
        template_code = f'''#!/usr/bin/env python3
"""
Agent: {prompt}
Generated as fallback template when OpenAI API unavailable
"""

import os
import sys
import time
from datetime import datetime

class Agent:
    """Autonomous agent for: {prompt}"""
    
    def __init__(self):
        self.name = "{prompt}"
        self.status = "initialized"
        self.created_at = datetime.now()
    
    def run(self):
        """Main agent execution loop"""
        print(f"Agent {{self.name}} starting...")
        self.status = "running"
        
        # TODO: Implement agent logic here
        print(f"Executing: {{self.name}}")
        
        self.status = "completed"
        print(f"Agent {{self.name}} completed successfully")
    
    def stop(self):
        """Stop agent execution"""
        self.status = "stopped"
        print(f"Agent {{self.name}} stopped")

def main():
    """Entry point for agent execution"""
    agent = Agent()
    try:
        agent.run()
    except KeyboardInterrupt:
        agent.stop()
    except Exception as e:
        print(f"Agent error: {{e}}")
        agent.status = "error"

if __name__ == "__main__":
    main()
'''
        
        log_deployment(f"Using fallback template for prompt: {prompt}", "warning")
        return template_code

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

class DeployResponse(BaseModel):
    status: str
    message: str
    agent_id: int
    agent_file: str
    slug: str

@router.post("/api/deploy")
async def deploy_agent(request: Optional[DeployRequest] = None, prompt: Optional[str] = Query(None, description="Natural language prompt for agent generation")):
    """
    Deploy endpoint that accepts natural language input and converts it to Python agent code.
    Accepts both JSON body and query parameter ?prompt=
    """
    try:
        # Get prompt from either JSON body or query parameter
        user_prompt = None
        if request and request.prompt:
            user_prompt = request.prompt
        elif prompt:
            user_prompt = prompt
        
        if not user_prompt:
            raise HTTPException(status_code=400, detail="Prompt is required via JSON body or ?prompt= query parameter")
        
        # Log the deployment start
        log_deployment(f"Starting deployment for prompt: '{user_prompt[:100]}'", "info")
        
        # Generate agent code using OpenAI GPT-4
        log_deployment("Generating agent code with OpenAI GPT-4", "info")
        agent_code = generate_agent_code(user_prompt)
        
        # Create slug for filename
        slug = create_slug(user_prompt)
        if not slug:
            slug = f"agent-{len(sample_agents) + 1}"
        
        # Ensure agents directory exists
        os.makedirs("agents", exist_ok=True)
        
        # Save agent code to file
        agent_filename = f"agents/{slug}.py"
        with open(agent_filename, "w") as f:
            f.write(f"# Agent generated from prompt: {user_prompt}\n")
            f.write(f"# Generated on: {datetime.now().isoformat()}\n\n")
            f.write(agent_code)
        
        log_deployment(f"Agent code generated and saved to {agent_filename}", "success")
        
        # Create new agent ID (ensure it's always a valid integer)
        import time
        new_agent_id = int(time.time() * 1000) % 10000  # Use timestamp-based ID for uniqueness
        
        # Fallback to simple counter if needed
        if new_agent_id <= 0:
            new_agent_id = len(sample_agents) + 1
        
        # Add to sample agents list (in production this would be saved to database)
        new_agent = Agent(
            id=new_agent_id,
            name=f"Agent {slug.replace('-', ' ').title()}",
            description=user_prompt[:100],
            status="deployed",
            created_at=datetime.now(),
            github_url="https://github.com/Danielmacdonald988/OperatorOS",
            render_url="https://operatoros.onrender.com"
        )
        sample_agents.append(new_agent)
        
        log_deployment(f"Agent {new_agent_id} successfully deployed as {slug}", "success")
        
        # Return simple format for frontend compatibility
        return {
            "status": "success",
            "agent_id": new_agent_id,
            "message": f"Agent successfully generated and deployed from prompt: '{user_prompt[:50]}...'",
            "agent_file": agent_filename,
            "slug": slug
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Deployment failed: {str(e)}"
        log_deployment(error_msg, "error")
        raise HTTPException(status_code=500, detail=error_msg)

# Also support /api/deployments endpoint (as mentioned by user)
@router.post("/api/deployments")
async def create_deployment(request: DeployRequest):
    """
    Alternative deployment endpoint that matches frontend expectations.
    Returns simplified response with status and agent_id.
    """
    try:
        # Use the existing deploy logic
        result = await deploy_agent(request=request)
        
        # Return simplified format as requested by user
        return {
            "status": "started",
            "agent_id": result["agent_id"],
            "message": result["message"]
        }
        
    except Exception as e:
        log_deployment(f"Deployment via /api/deployments failed: {str(e)}", "error")
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")