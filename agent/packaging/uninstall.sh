#!/bin/bash

# Lab Portal Agent Uninstallation Script
# Removes the agent service and all associated files

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

# Confirm uninstallation
confirm_uninstall() {
    echo "⚠️  Lab Portal Agent Uninstallation"
    echo "=================================="
    echo ""
    echo "This will remove:"
    echo "  - The $SERVICE_NAME systemd service"
    echo "  - All agent files from $AGENT_HOME"
    echo "  - The $AGENT_USER user account"
    echo "  - The $AGENT_GROUP group (if empty)"
    echo ""
    echo "This action cannot be undone!"
    echo ""
    
    read -p "Are you sure you want to continue? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Uninstallation cancelled"
        exit 0
    fi
}

# Stop and disable service
stop_service() {
    log_info "Stopping and disabling service..."
    
    # Stop service if running
    if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        sudo systemctl stop "$SERVICE_NAME"
        log_success "Service stopped"
    else
        log_info "Service was not running"
    fi
    
    # Disable service
    if sudo systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        sudo systemctl disable "$SERVICE_NAME"
        log_success "Service disabled"
    else
        log_info "Service was not enabled"
    fi
}

# Remove systemd service file
remove_service_file() {
    log_info "Removing systemd service file..."
    
    if [ -f "$SERVICE_FILE" ]; then
        sudo rm -f "$SERVICE_FILE"
        sudo systemctl daemon-reload
        log_success "Service file removed"
    else
        log_info "Service file not found"
    fi
}

# Remove agent files
remove_agent_files() {
    log_info "Removing agent files..."
    
    if [ -d "$AGENT_HOME" ]; then
        sudo rm -rf "$AGENT_HOME"
        log_success "Agent files removed"
    else
        log_info "Agent directory not found"
    fi
}

# Remove agent user
remove_agent_user() {
    log_info "Removing agent user..."
    
    # Remove user if exists
    if getent passwd "$AGENT_USER" > /dev/null 2>&1; then
        sudo userdel "$AGENT_USER" 2>/dev/null || {
            log_warning "Could not remove user $AGENT_USER (may have active processes)"
            log_info "You may need to manually remove the user later"
        }
        log_success "User removed"
    else
        log_info "User not found"
    fi
    
    # Remove group if empty
    if getent group "$AGENT_GROUP" > /dev/null 2>&1; then
        # Check if group has any members
        if [ -z "$(getent group "$AGENT_GROUP" | cut -d: -f4)" ]; then
            sudo groupdel "$AGENT_GROUP" 2>/dev/null || {
                log_warning "Could not remove group $AGENT_GROUP"
            }
            log_success "Group removed"
        else
            log_info "Group has remaining members, keeping it"
        fi
    else
        log_info "Group not found"
    fi
}

# Clean up log files
cleanup_logs() {
    log_info "Cleaning up log files..."
    
    # Remove journal logs for the service
    sudo journalctl --vacuum-time=1s --unit="$SERVICE_NAME" 2>/dev/null || true
    
    # Remove any custom log files
    sudo rm -rf /var/log/lab-portal-agent 2>/dev/null || true
    
    log_success "Log files cleaned up"
}

# Show uninstallation summary
show_summary() {
    log_success "Uninstallation completed successfully!"
    echo ""
    echo "Removed components:"
    echo "  - Service: $SERVICE_NAME"
    echo "  - User: $AGENT_USER"
    echo "  - Group: $AGENT_GROUP"
    echo "  - Files: $AGENT_HOME"
    echo "  - Logs: System journal entries"
    echo ""
    echo "The Lab Portal Agent has been completely removed from this system."
}

# Main uninstallation process
main() {
    check_root
    confirm_uninstall
    
    stop_service
    remove_service_file
    remove_agent_files
    remove_agent_user
    cleanup_logs
    show_summary
}

# Run main function
main "$@"
