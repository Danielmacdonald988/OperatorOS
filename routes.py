from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()

@router.get("/", response_class=HTMLResponse)
async def homepage():
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>OperatorGPT</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #0f172a; color: #e2e8f0; }
            .container { max-width: 800px; margin: 0 auto; text-align: center; }
            h1 { color: #3b82f6; font-size: 3em; margin-bottom: 20px; }
            p { font-size: 1.2em; line-height: 1.6; }
            .status { background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>OperatorGPT</h1>
            <p>Autonomous AI Agent Deployment Platform</p>
            <div class="status">
                <h2>🚀 System Online</h2>
                <p>FastAPI backend running successfully on Render</p>
                <p>Ready to deploy AI agents via natural language prompts</p>
            </div>
        </div>
    </body>
    </html>
    """)