# OperatorGPT - Autonomous AI Agent Operating System

![OperatorGPT](https://img.shields.io/badge/OperatorGPT-Autonomous%20AI%20Agents-blue)
![Python](https://img.shields.io/badge/Python-3.11-green)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-red)
![Deploy](https://img.shields.io/badge/Deploy-Render-purple)

## Overview

OperatorGPT is a cutting-edge autonomous AI agent deployment platform that accepts natural language prompts and automatically generates, tests, and deploys intelligent Python agents. Built with FastAPI, React, and deployed on Render.

## 🚀 Live Demo

**Production URL**: [https://operatoros.onrender.com](https://operatoros.onrender.com)

## ✨ Features

- **Natural Language Agent Generation**: Create AI agents using simple English prompts
- **Automated Testing Pipeline**: Built-in syntax and execution validation
- **GitHub Integration**: Automatic version control and code management
- **Real-time WebSocket Updates**: Live deployment progress tracking
- **Modern Dark UI**: Intuitive console interface with multiple management panels
- **Blueprint System**: Reusable agent specifications and documentation
- **Activity Logging**: Comprehensive system monitoring and logging

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11
- **WebSocket Support**: Real-time communication for deployment updates
- **Modular Structure**: Organized agents, blueprints, and logs modules
- **RESTful API**: Complete CRUD operations for all resources

### Frontend (React + TypeScript)
- **UI Framework**: React 18 with shadcn/ui components
- **Build Tool**: Vite for optimized production builds
- **State Management**: TanStack React Query for server state
- **Real-time**: WebSocket integration for live updates

### Deployment Pipeline
1. **Code Generation**: GPT-4 powered agent creation
2. **Testing Phase**: Automated validation and error checking
3. **Version Control**: GitHub commits and repository management
4. **Platform Deployment**: Render integration for live hosting
5. **Status Updates**: Real-time progress via WebSocket

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Danielmacdonald988/OperatorOS.git
   cd OperatorOS
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Build the frontend**
   ```bash
   npm run build
   ```

5. **Start the FastAPI server**
   ```bash
   python main.py
   ```

6. **Access the application**
   - Open your browser to `http://localhost:8000`

### Environment Variables

Create a `.env` file with the following variables:
```env
OPENAI_API_KEY=your_openai_api_key
GITHUB_TOKEN=your_github_token
RENDER_WEBHOOK_URL=your_render_webhook_url
PORT=8000
```

## 🚢 Deployment

### Render Deployment

This application is configured for automatic deployment on Render:

1. **Connect Repository**: Link your GitHub repository to Render
2. **Configure Build**: Render automatically detects the Python environment
3. **Set Environment Variables**: Add your API keys in Render dashboard
4. **Deploy**: Automatic deployment on every push to main branch

### Manual Deployment

```bash
# Deploy to GitHub
python deploy.py

# The application will be automatically deployed to Render
```

## 📁 Project Structure

```
OperatorOS/
├── agents/                 # Generated AI agents
├── blueprints/            # Agent specifications
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Application pages
│   │   └── hooks/         # Custom React hooks
├── dist/                  # Built frontend assets
├── logs/                  # System logs
├── server/                # Legacy Node.js server (deprecated)
├── main.py               # FastAPI application entry point
├── requirements.txt      # Python dependencies
├── Procfile             # Render deployment configuration
├── render.yaml          # Render service configuration
└── deploy.py            # GitHub deployment script
```

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - Serve frontend application
- `GET /api/stats` - System statistics
- `GET /api/agents` - List all agents
- `POST /api/deploy` - Deploy new agent
- `WebSocket /ws` - Real-time updates

### Agent Management
- `GET /api/agents/{id}` - Get specific agent
- `POST /api/agents/{id}/toggle` - Toggle agent status

### Resources
- `GET /api/blueprints` - List blueprints
- `GET /api/deployments` - List deployments
- `GET /api/logs` - System activity logs

## 🔮 Usage Examples

### Creating an Agent

```bash
curl -X POST "https://operatoros.onrender.com/api/deploy" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "Create a web scraper that extracts product prices from e-commerce sites",
       "auto_deploy": true,
       "extensive_testing": false
     }'
```

### WebSocket Connection

```javascript
const ws = new WebSocket('wss://operatoros.onrender.com/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Deployment progress:', data);
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions and support:
- **GitHub Issues**: [Create an Issue](https://github.com/Danielmacdonald988/OperatorOS/issues)
- **Repository**: [OperatorOS](https://github.com/Danielmacdonald988/OperatorOS)

## 🎯 Roadmap

- [ ] OpenAI GPT-4 integration for real agent generation
- [ ] Advanced testing framework with multiple validation layers
- [ ] Multi-language agent support (JavaScript, Go, Rust)
- [ ] Agent marketplace and sharing system
- [ ] Advanced monitoring and analytics dashboard
- [ ] Kubernetes deployment support

---

**Built with ❤️ using FastAPI, React, and Render**