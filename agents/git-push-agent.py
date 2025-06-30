#!/usr/bin/env python3
"""
GitPushAgent - Autonomous Git Operations Agent
Automatically detects new agent files and pushes changes to GitHub
"""

import os
import subprocess
import time
import threading
from datetime import datetime
from pathlib import Path
import logging

class GitPushAgent:
    """Autonomous agent for Git operations when new agents are generated"""
    
    def __init__(self):
        self.agents_folder = Path("agents")
        self.logs_folder = Path("logs")
        self.git_log_file = self.logs_folder / "git_push.log"
        self.known_files = set()
        self.running = False
        self.monitor_thread = None
        
        # Ensure directories exist
        self.agents_folder.mkdir(exist_ok=True)
        self.logs_folder.mkdir(exist_ok=True)
        
        # Setup logging
        self.setup_logging()
        
        # Initialize known files
        self.scan_existing_files()
        
        self.log("INFO", "GitPushAgent initialized and ready")
    
    def setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - GitPushAgent - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('GitPushAgent')
    
    def log(self, level, message):
        """Log message to both file and console"""
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] {level}: {message}"
        
        # Write to log file
        try:
            with open(self.git_log_file, "a", encoding="utf-8") as f:
                f.write(log_entry + "\n")
        except Exception as e:
            print(f"Failed to write to log file: {e}")
        
        # Console output
        print(f"🤖 GitPushAgent - {message}")
        
        # Standard logging
        if level == "INFO":
            self.logger.info(message)
        elif level == "ERROR":
            self.logger.error(message)
        elif level == "SUCCESS":
            self.logger.info(f"SUCCESS: {message}")
    
    def scan_existing_files(self):
        """Scan existing agent files to establish baseline"""
        try:
            if self.agents_folder.exists():
                for file_path in self.agents_folder.glob("*.py"):
                    if file_path.name != "__init__.py":
                        self.known_files.add(file_path.name)
                        
            self.log("INFO", f"Baseline scan complete: {len(self.known_files)} existing agent files")
        except Exception as e:
            self.log("ERROR", f"Failed to scan existing files: {e}")
    
    def detect_new_files(self):
        """Detect newly created agent files"""
        new_files = []
        
        try:
            if not self.agents_folder.exists():
                return new_files
                
            current_files = set()
            for file_path in self.agents_folder.glob("*.py"):
                if file_path.name != "__init__.py":
                    current_files.add(file_path.name)
            
            # Find new files
            new_files = list(current_files - self.known_files)
            
            # Update known files
            self.known_files = current_files
            
        except Exception as e:
            self.log("ERROR", f"Failed to detect new files: {e}")
        
        return new_files
    
    def run_git_command(self, command):
        """Execute Git command and return result"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": "Git command timed out",
                "returncode": -1
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "returncode": -1
            }
    
    def check_git_status(self):
        """Check if there are changes to commit"""
        result = self.run_git_command("git status --porcelain")
        
        if not result["success"]:
            self.log("ERROR", f"Failed to check git status: {result['stderr']}")
            return False
        
        # If output is empty, no changes to commit
        has_changes = bool(result["stdout"].strip())
        return has_changes
    
    def git_add_all(self):
        """Stage all changes"""
        result = self.run_git_command("git add .")
        
        if result["success"]:
            self.log("INFO", "Successfully staged all changes")
            return True
        else:
            self.log("ERROR", f"Failed to stage changes: {result['stderr']}")
            return False
    
    def git_commit(self, agent_name):
        """Commit changes with agent-specific message"""
        commit_message = f"Add agent: {agent_name}"
        command = f'git commit -m "{commit_message}"'
        
        result = self.run_git_command(command)
        
        if result["success"]:
            self.log("SUCCESS", f"Successfully committed: {commit_message}")
            return True
        else:
            # Check if it's a "nothing to commit" scenario
            if "nothing to commit" in result["stdout"].lower():
                self.log("INFO", "No changes to commit")
                return True
            else:
                self.log("ERROR", f"Failed to commit: {result['stderr']}")
                return False
    
    def git_push(self):
        """Push changes to GitHub"""
        result = self.run_git_command("git push origin main")
        
        if result["success"]:
            self.log("SUCCESS", "Successfully pushed to GitHub")
            return True
        else:
            # Try pushing to master branch as fallback
            master_result = self.run_git_command("git push origin master")
            if master_result["success"]:
                self.log("SUCCESS", "Successfully pushed to GitHub (master branch)")
                return True
            else:
                self.log("ERROR", f"Failed to push to GitHub: {result['stderr']}")
                return False
    
    def process_new_agent(self, agent_filename):
        """Process a newly detected agent file"""
        agent_name = agent_filename.replace(".py", "").replace("-", " ").title()
        
        self.log("INFO", f"Processing new agent: {agent_name}")
        
        # Check if there are actually changes to commit
        if not self.check_git_status():
            self.log("INFO", f"No Git changes detected for {agent_name}")
            return
        
        # Stage changes
        if not self.git_add_all():
            return
        
        # Commit changes
        if not self.git_commit(agent_name):
            return
        
        # Push to GitHub
        if self.git_push():
            self.log("SUCCESS", f"🚀 Agent '{agent_name}' successfully pushed to GitHub!")
            print(f"\n✅ SUCCESS: Agent '{agent_name}' is now live on GitHub!")
        else:
            print(f"\n❌ ERROR: Failed to push agent '{agent_name}' to GitHub")
    
    def monitor_loop(self):
        """Main monitoring loop"""
        self.log("INFO", "Starting file monitoring loop")
        
        while self.running:
            try:
                # Check for new files
                new_files = self.detect_new_files()
                
                # Process each new file
                for new_file in new_files:
                    self.process_new_agent(new_file)
                
                # Wait before next check
                time.sleep(2)  # Check every 2 seconds
                
            except Exception as e:
                self.log("ERROR", f"Error in monitoring loop: {e}")
                time.sleep(5)  # Wait longer on error
        
        self.log("INFO", "File monitoring stopped")
    
    def start(self):
        """Start the GitPushAgent"""
        if self.running:
            self.log("INFO", "GitPushAgent is already running")
            return
        
        self.running = True
        self.monitor_thread = threading.Thread(target=self.monitor_loop, daemon=True)
        self.monitor_thread.start()
        
        self.log("INFO", "GitPushAgent started successfully")
        print("🤖 GitPushAgent is now monitoring for new agents...")
    
    def stop(self):
        """Stop the GitPushAgent"""
        if not self.running:
            self.log("INFO", "GitPushAgent is not running")
            return
        
        self.running = False
        
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
        
        self.log("INFO", "GitPushAgent stopped")
        print("🤖 GitPushAgent has been stopped")
    
    def status(self):
        """Get current status"""
        status = "RUNNING" if self.running else "STOPPED"
        files_count = len(self.known_files)
        
        print(f"🤖 GitPushAgent Status: {status}")
        print(f"📁 Monitoring: {self.agents_folder}")
        print(f"📊 Known agent files: {files_count}")
        print(f"📝 Log file: {self.git_log_file}")
        
        return {
            "status": status,
            "monitored_folder": str(self.agents_folder),
            "known_files_count": files_count,
            "log_file": str(self.git_log_file)
        }

def main():
    """Entry point for GitPushAgent"""
    agent = GitPushAgent()
    
    try:
        # Start the agent
        agent.start()
        
        # Keep running
        print("GitPushAgent is running. Press Ctrl+C to stop.")
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nShutting down GitPushAgent...")
        agent.stop()
    except Exception as e:
        agent.log("ERROR", f"Unexpected error: {e}")
        agent.stop()

if __name__ == "__main__":
    main()