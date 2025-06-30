#!/usr/bin/env python3
"""
Production start script for OperatorGPT
Ensures the FastAPI application starts correctly on Render
"""
import os
import sys
import uvicorn

def main():
    # Get port from environment or default to 8000
    port = int(os.environ.get('PORT', 8000))
    
    print(f"🚀 Starting OperatorGPT on port {port}")
    print("📱 Application: FastAPI + React")
    print("🌐 Environment: Production")
    print("-" * 40)
    
    # Start the uvicorn server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main()