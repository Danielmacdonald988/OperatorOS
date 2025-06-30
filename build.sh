#!/bin/bash
# Build script for OperatorGPT on Render
set -e

echo "🔧 Building OperatorGPT for production deployment"
echo "================================================"

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "📦 Installing Node.js dependencies..."
npm ci

echo "🏗️ Building frontend assets..."
npm run build

echo "🧹 Cleaning up dist directory..."
# Keep only the frontend assets, remove Node.js backend
rm -f dist/index.js 2>/dev/null || true

echo "✅ Build complete - ready for Python FastAPI deployment"
echo "================================================"