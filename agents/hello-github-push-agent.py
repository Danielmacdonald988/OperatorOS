#!/usr/bin/env python3
"""
Hello GitHub Push Agent
Tests GitPushAgent functionality by creating a simple test agent
"""

import os
from datetime import datetime
from pathlib import Path

class HelloGitHubPushAgent:
    """Test agent for GitPushAgent functionality"""
    
    def __init__(self):
        self.name = "Hello GitHub Push Agent"
        self.description = "Test agent that prints greeting and logs to test_log.md"
        self.log_file = Path("test_log.md")
        
    def run(self):
        """Main agent execution"""
        message = "Hello from GitHub push!"
        
        # Print the message
        print(message)
        
        # Log to test_log.md
        self.log_to_file(message)
        
        return f"Agent '{self.name}' executed successfully"
    
    def log_to_file(self, message):
        """Log message to test_log.md with timestamp"""
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] {message}\n"
        
        # Create or append to test_log.md
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry)
            print(f"Logged to {self.log_file}: {message}")
        except Exception as e:
            print(f"Failed to log to {self.log_file}: {e}")
    
    def stop(self):
        """Stop agent execution"""
        print(f"Stopping {self.name}")
        return "Agent stopped successfully"

def main():
    """Entry point for Hello GitHub Push Agent"""
    agent = HelloGitHubPushAgent()
    
    print(f"Starting {agent.name}")
    print(f"Description: {agent.description}")
    
    # Execute the agent
    result = agent.run()
    print(result)
    
    return result

if __name__ == "__main__":
    main()