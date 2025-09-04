#!/bin/bash

# Lab Portal Agent Installation Script
# Installs the agent as a systemd service with proper user isolation

set -euo pipefail

# Configuration
AGENT_USER="lab-portal"
AGENT_GROUP="lab-portal"
AGENT_HOME="/opt/lab-portal-agent"
SERVICE_NAME="lab-portal-agent"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root"
        log_info "Please run as a regular user with sudo access"
        exit 1
    fi
}

# Check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        log_error ".env file not found!"
        log_info "Please copy env.example to .env and configure it first"
        exit 1
    fi
    log_success "Environment file found"
}

# Create agent user and group
create_agent_user() {
    log_info "Creating agent user and group..."
    
    # Create group if it doesn't exist
    if ! getent group "$AGENT_GROUP" > /dev/null 2>&1; then
        sudo groupadd --system "$AGENT_GROUP"
        log_success "Created group: $AGENT_GROUP"
    else
        log_info "Group already exists: $AGENT_GROUP"
    fi
    
    # Create user if it doesn't exist
    if ! getent passwd "$AGENT_USER" > /dev/null 2>&1; then
        sudo useradd --system \
            --gid "$AGENT_GROUP" \
            --home-dir "$AGENT_HOME" \
            --shell /bin/false \
            --comment "Lab Portal Agent" \
            "$AGENT_USER"
        log_success "Created user: $AGENT_USER"
    else
        log_info "User already exists: $AGENT_USER"
    fi
}

# Create agent directory and set permissions
setup_agent_directory() {
    log_info "Setting up agent directory..."
    
    # Create directory
    sudo mkdir -p "$AGENT_HOME"
    
    # Copy agent files
    sudo cp -r dist/ "$AGENT_HOME/"
    sudo cp package.json "$AGENT_HOME/"
    sudo cp README.md "$AGENT_HOME/" 2>/dev/null || true
    sudo cp .env "$AGENT_HOME/"
    
    # Set ownership
    sudo chown -R "$AGENT_USER:$AGENT_GROUP" "$AGENT_HOME"
    
    # Set permissions
    sudo chmod 755 "$AGENT_HOME"
    sudo chmod 644 "$AGENT_HOME/.env"
    sudo chmod 644 "$AGENT_HOME/package.json"
    sudo chmod 644 "$AGENT_HOME/README.md" 2>/dev/null || true
    sudo chmod -R 644 "$AGENT_HOME/dist/"
    
    log_success "Agent directory setup complete"
}

# Install systemd service
install_systemd_service() {
    log_info "Installing systemd service..."
    
    # Create service file
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=Lab Portal Agent
Documentation=https://github.com/your-org/lab-portal
After=network.target
Wants=network.target

[Service]
Type=simple
User=$AGENT_USER
Group=$AGENT_GROUP
WorkingDirectory=$AGENT_HOME
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lab-portal-agent

# Environment variables (loaded from .env file)
EnvironmentFile=$AGENT_HOME/.env

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$AGENT_HOME
ReadWritePaths=/var/log/lab-portal-agent

# Resource limits
LimitNOFILE=65536
MemoryMax=256M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
    
    log_success "Systemd service installed and enabled"
}

# Install Node.js dependencies
install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    # Check if Node.js is installed
    if ! command -v node > /dev/null 2>&1; then
        log_error "Node.js is not installed"
        log_info "Please install Node.js 18+ before running this script"
        exit 1
    fi
    
    # Install dependencies as the agent user
    sudo -u "$AGENT_USER" bash -c "cd '$AGENT_HOME' && npm install --production"
    
    log_success "Dependencies installed"
}

# Start the service
start_service() {
    log_info "Starting agent service..."
    
    sudo systemctl start "$SERVICE_NAME"
    
    # Wait a moment and check status
    sleep 2
    if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
        log_success "Agent service started successfully"
    else
        log_error "Failed to start agent service"
        log_info "Check service status with: sudo systemctl status $SERVICE_NAME"
        log_info "Check service logs with: sudo journalctl -u $SERVICE_NAME -f"
        exit 1
    fi
}

# Show installation summary
show_summary() {
    log_success "Installation completed successfully!"
    echo ""
    echo "Service Information:"
    echo "  Name: $SERVICE_NAME"
    echo "  User: $AGENT_USER"
    echo "  Home: $AGENT_HOME"
    echo "  Config: $AGENT_HOME/.env"
    echo ""
    echo "Useful Commands:"
    echo "  Check status: sudo systemctl status $SERVICE_NAME"
    echo "  View logs:    sudo journalctl -u $SERVICE_NAME -f"
    echo "  Restart:      sudo systemctl restart $SERVICE_NAME"
    echo "  Stop:         sudo systemctl stop $SERVICE_NAME"
    echo ""
    echo "Configuration:"
    echo "  Edit config:  sudo nano $AGENT_HOME/.env"
    echo "  After changes, restart: sudo systemctl restart $SERVICE_NAME"
}

# Main installation process
main() {
    echo "🚀 Lab Portal Agent Installation Script"
    echo "======================================="
    echo ""
    
    check_root
    check_env_file
    
    create_agent_user
    setup_agent_directory
    install_dependencies
    install_systemd_service
    start_service
    show_summary
}

# Run main function
main "$@"
