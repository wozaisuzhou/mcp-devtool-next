#!/bin/bash

# MCP DevTool - Installation Script
# This script sets up the Electron desktop app with SQLite storage

set -e

echo "🚀 MCP DevTool - Installation & Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detected: $NODE_VERSION"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "Available commands:"
echo "  📱 Desktop App (Development):"
echo "     npm run electron-dev      - Run app with dev tools"
echo ""
echo "  🌐 Web App (Development):"
echo "     npm run dev               - Run Next.js dev server"
echo ""
echo "  🔨 Build:"
echo "     npm run electron-build    - Build standalone app"
echo "     npm run build             - Build web version"
echo ""
echo "📝 Activity storage:"
echo "  • Electron: SQLite (local file at ~/Library/Application Support/mcp-devtool/activities.db)"
echo "  • Web: PostgreSQL (requires DATABASE_URL env var)"
echo ""
echo "For more info, see ELECTRON_SETUP.md"
echo ""
