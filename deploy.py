#!/usr/bin/env python3
"""
GitHub deployment script for OperatorGPT
Pushes the complete application to GitHub for Render deployment
"""
import os
import subprocess
import sys
from datetime import datetime

def run_command(cmd, cwd=None):
    """Run a shell command and return the result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
        if result.returncode != 0:
            print(f"❌ Error running command: {cmd}")
            print(f"Error output: {result.stderr}")
            return False
        return result.stdout.strip()
    except Exception as e:
        print(f"❌ Exception running command: {cmd}")
        print(f"Exception: {e}")
        return False

def setup_git_repo():
    """Initialize git repository and configure for GitHub"""
    print("🔧 Setting up Git repository...")
    
    # Check if git is initialized
    if not os.path.exists('.git'):
        run_command('git init')
        print("✅ Git repository initialized")
    
    # Configure git user (using GitHub username)
    run_command('git config user.name "Danielmacdonald988"')
    run_command('git config user.email "49652589+Danielmacdonald988@users.noreply.github.com"')
    
    # Add remote origin
    run_command('git remote remove origin')  # Remove if exists
    run_command('git remote add origin https://github.com/Danielmacdonald988/OperatorOS.git')
    
    return True

def commit_and_push():
    """Commit all changes and push to GitHub"""
    print("📦 Committing changes...")
    
    # Add all files
    run_command('git add .')
    
    # Create commit message with timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    commit_message = f"Automated deploy update from Replit - {timestamp}"
    
    # Commit changes
    result = run_command(f'git commit -m "{commit_message}"')
    if not result:
        print("❌ No changes to commit or commit failed")
        return False
    
    print("✅ Changes committed successfully")
    
    # Push to GitHub
    print("🚀 Pushing to GitHub...")
    result = run_command('git push -u origin main')
    if not result:
        print("❌ Push to GitHub failed")
        return False
    
    print("✅ Successfully pushed to GitHub!")
    return True

def verify_deployment_files():
    """Verify all required deployment files exist"""
    required_files = [
        'main.py',
        'requirements.txt',
        'Procfile',
        'render.yaml',
        'runtime.txt',
        'dist/public/index.html'
    ]
    
    print("🔍 Verifying deployment files...")
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        return False
    
    print("✅ All deployment files present")
    return True

def main():
    """Main deployment function"""
    print("🚀 Starting OperatorGPT deployment to GitHub...")
    print("=" * 50)
    
    # Verify files
    if not verify_deployment_files():
        sys.exit(1)
    
    # Setup git
    if not setup_git_repo():
        sys.exit(1)
    
    # Commit and push
    if not commit_and_push():
        sys.exit(1)
    
    print("=" * 50)
    print("🎉 Deployment complete!")
    print("📍 Repository: https://github.com/Danielmacdonald988/OperatorOS")
    print("🌐 Deploy URL: https://operatoros.onrender.com")
    print("=" * 50)

if __name__ == "__main__":
    main()