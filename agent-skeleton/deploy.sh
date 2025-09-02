#!/bin/bash

# Lab Portal Agent Deployment Script
# Run this script on the target host to install the agent

set -e

echo "🚀 Lab Portal Agent Deployment Script"
echo "====================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   echo "   Please run as a regular user with sudo access"
   exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "   Please copy env.example to .env and configure it first"
    exit 1
fi

echo "✅ Environment file found"
echo ""

# Build the agent
echo "🔨 Building agent..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Create system user and group
echo "👤 Creating system user..."
sudo useradd -r -s /bin/false labportal 2>/dev/null || echo "   User already exists"
sudo groupadd labportal 2>/dev/null || echo "   Group already exists"
sudo usermod -a -G labportal labportal 2>/dev/null || echo "   User already in group"

echo "✅ System user created"
echo ""

# Install agent
echo "📦 Installing agent..."
sudo mkdir -p /opt/lab-portal-agent
sudo cp -r dist/* /opt/lab-portal-agent/
sudo cp .env /opt/lab-portal-agent/
sudo chown -R labportal:labportal /opt/lab-portal-agent
sudo chmod 755 /opt/lab-portal-agent

echo "✅ Agent installed to /opt/lab-portal-agent"
echo ""

# Install systemd service
echo "⚙️  Installing systemd service..."
sudo cp install/lab-portal-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lab-portal-agent

echo "✅ Systemd service installed and enabled"
echo ""

# Test connection
echo "🧪 Testing connection to portal..."
cd /opt/lab-portal-agent
if node index.js --test-connection 2>/dev/null; then
    echo "✅ Connection test successful"
else
    echo "⚠️  Connection test failed - check your configuration"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Start the service: sudo systemctl start lab-portal-agent"
echo "2. Check status: sudo systemctl status lab-portal-agent"
echo "3. View logs: sudo journalctl -u lab-portal-agent -f"
echo ""
echo "Configuration:"
echo "- Edit /opt/lab-portal-agent/.env to change settings"
echo "- Restart service after configuration changes"
echo "- Check README.md for troubleshooting"
