#!/usr/bin/env python3
"""
Test script for GitPushAgent
Tests file detection and Git operations
"""

import os
import time
import threading
from pathlib import Path

# Import the GitPushAgent
import sys
import importlib.util

def import_git_push_agent():
    """Dynamically import GitPushAgent"""
    spec = importlib.util.spec_from_file_location("git_push_agent", "agents/git-push-agent.py")
    git_push_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(git_push_module)
    return git_push_module.GitPushAgent

GitPushAgent = import_git_push_agent()

def test_git_push_agent():
    """Test the GitPushAgent functionality"""
    print("Testing GitPushAgent")
    print("=" * 50)
    
    # Initialize agent
    agent = GitPushAgent()
    
    # Show initial status
    print("\n1. Initial Status:")
    agent.status()
    
    # Start monitoring
    print("\n2. Starting GitPushAgent...")
    agent.start()
    
    # Wait a moment
    time.sleep(2)
    
    # Create a test agent file to trigger detection
    print("\n3. Creating test agent file...")
    test_agent_path = Path("agents/test-git-detection-agent.py")
    
    test_agent_content = '''#!/usr/bin/env python3
"""
Test Git Detection Agent
Generated to test GitPushAgent functionality
"""

class TestGitDetectionAgent:
    """Test agent for Git detection"""
    
    def __init__(self):
        self.name = "Test Git Detection Agent"
        self.description = "Agent created to test GitPushAgent auto-commit functionality"
    
    def run(self):
        """Main agent execution"""
        print(f"Running {self.name}")
        print(f"Description: {self.description}")
        return "Test agent executed successfully"
    
    def stop(self):
        """Stop agent execution"""
        print(f"Stopping {self.name}")

def main():
    """Entry point for test agent"""
    agent = TestGitDetectionAgent()
    result = agent.run()
    print(result)

if __name__ == "__main__":
    main()
'''
    
    # Write the test file
    with open(test_agent_path, "w", encoding="utf-8") as f:
        f.write(test_agent_content)
    
    print(f"✅ Created test file: {test_agent_path}")
    
    # Wait for GitPushAgent to detect and process
    print("\n4. Waiting for GitPushAgent to detect new file...")
    time.sleep(5)
    
    # Check logs
    print("\n5. Checking Git logs...")
    logs_path = Path("logs/git_push.log")
    if logs_path.exists():
        with open(logs_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        print("Recent log entries:")
        for line in lines[-5:]:  # Show last 5 entries
            print(f"  {line.strip()}")
    else:
        print("No Git logs found yet")
    
    # Show final status
    print("\n6. Final Status:")
    agent.status()
    
    # Stop agent
    print("\n7. Stopping GitPushAgent...")
    agent.stop()
    
    # Clean up test file
    if test_agent_path.exists():
        test_agent_path.unlink()
        print(f"🧹 Cleaned up test file: {test_agent_path}")
    
    print("\n✅ GitPushAgent test completed")

if __name__ == "__main__":
    test_git_push_agent()