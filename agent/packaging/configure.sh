#!/bin/bash

# Lab Portal Agent Configuration Script
# Helps configure the agent environment and settings

set -euo pipefail

# Configuration
AGENT_HOME="/opt/lab-portal-agent"
ENV_FILE="$AGENT_HOME/.env"
SERVICE_NAME="lab-portal-agent"

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

# Check if agent is installed
check_installation() {
    if [ ! -d "$AGENT_HOME" ]; then
        log_error "Agent is not installed at $AGENT_HOME"
        log_info "Please run install.sh first"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found at $ENV_FILE"
        log_info "Please ensure the agent is properly installed"
        exit 1
    fi
}

# Show current configuration
show_current_config() {
    log_info "Current agent configuration:"
    echo ""
    
    if [ -f "$ENV_FILE" ]; then
        echo "Environment file: $ENV_FILE"
        echo "Contents:"
        echo "----------------------------------------"
        sudo cat "$ENV_FILE" | grep -v '^#' | grep -v '^$' || echo "No configuration found"
        echo "----------------------------------------"
    else
        log_warning "Environment file not found"
    fi
    
    echo ""
    echo "Service status:"
    if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        echo "  Status: Running"
    else
        echo "  Status: Stopped"
    fi
    
    if sudo systemctl is-enabled --quiet "$SERVICE_NAME" 2>/dev/null; then
        echo "  Enabled: Yes"
    else
        echo "  Enabled: No"
    fi
}

# Interactive configuration
interactive_config() {
    log_info "Interactive configuration setup"
    echo ""
    
    # Get current values or defaults
    local current_host_id=$(sudo grep "^HOST_ID=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "")
    local current_portal_url=$(sudo grep "^PORTAL_BASE_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "")
    local current_token=$(sudo grep "^AGENT_TOKEN=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "")
    local current_poll_interval=$(sudo grep "^POLL_INTERVAL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "4000")
    local current_timeout=$(sudo grep "^EXEC_TIMEOUT_MS=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "60000")
    local current_retry=$(sudo grep "^RESTART_RETRY=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2 || echo "1")
    
    echo "Enter configuration values (press Enter to keep current value):"
    echo ""
    
    # Host ID
    read -p "Host ID [$current_host_id]: " host_id
    host_id=${host_id:-$current_host_id}
    
    # Portal URL
    read -p "Portal Base URL [$current_portal_url]: " portal_url
    portal_url=${portal_url:-$current_portal_url}
    
    # Agent Token
    read -p "Agent Token [$current_token]: " token
    token=${token:-$current_token}
    
    # Poll Interval
    read -p "Poll Interval (ms) [$current_poll_interval]: " poll_interval
    poll_interval=${poll_interval:-$current_poll_interval}
    
    # Timeout
    read -p "Execution Timeout (ms) [$current_timeout]: " timeout
    timeout=${timeout:-$current_timeout}
    
    # Retry count
    read -p "Restart Retry Count [$current_retry]: " retry
    retry=${retry:-$current_retry}
    
    # Confirm changes
    echo ""
    echo "New configuration:"
    echo "  Host ID: $host_id"
    echo "  Portal URL: $portal_url"
    echo "  Agent Token: ${token:0:8}..."
    echo "  Poll Interval: $poll_interval ms"
    echo "  Timeout: $timeout ms"
    echo "  Retry Count: $retry"
    echo ""
    
    read -p "Apply these changes? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        apply_config "$host_id" "$portal_url" "$token" "$poll_interval" "$timeout" "$retry"
    else
        log_info "Configuration cancelled"
    fi
}

# Apply configuration changes
apply_config() {
    local host_id="$1"
    local portal_url="$2"
    local token="$3"
    local poll_interval="$4"
    local timeout="$5"
    local retry="$6"
    
    log_info "Applying configuration changes..."
    
    # Create backup
    sudo cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Write new configuration
    sudo tee "$ENV_FILE" > /dev/null << EOF
# Lab Portal Agent Configuration
# Generated on $(date)

# Required settings
HOST_ID=$host_id
PORTAL_BASE_URL=$portal_url
AGENT_TOKEN=$token

# Optional settings
POLL_INTERVAL=$poll_interval
EXEC_TIMEOUT_MS=$timeout
RESTART_RETRY=$retry
NODE_ENV=production

# Logging
LOG_LEVEL=info
EOF

    # Set proper permissions
    sudo chown lab-portal:lab-portal "$ENV_FILE"
    sudo chmod 644 "$ENV_FILE"
    
    log_success "Configuration updated"
    
    # Restart service if running
    if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_info "Restarting service to apply changes..."
        sudo systemctl restart "$SERVICE_NAME"
        log_success "Service restarted"
    fi
}

# Edit configuration file
edit_config() {
    log_info "Opening configuration file for editing..."
    
    # Check if editor is available
    local editor="${EDITOR:-nano}"
    if ! command -v "$editor" > /dev/null 2>&1; then
        editor="nano"
        if ! command -v "$editor" > /dev/null 2>&1; then
            log_error "No suitable editor found (tried \$EDITOR and nano)"
            log_info "Please install nano or set the EDITOR environment variable"
            exit 1
        fi
    fi
    
    # Edit the file
    sudo "$editor" "$ENV_FILE"
    
    # Restart service if running
    if sudo systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_info "Restarting service to apply changes..."
        sudo systemctl restart "$SERVICE_NAME"
        log_success "Service restarted"
    fi
}

# Validate configuration
validate_config() {
    log_info "Validating configuration..."
    
    local errors=0
    
    # Check required fields
    if ! sudo grep -q "^HOST_ID=" "$ENV_FILE"; then
        log_error "HOST_ID is not set"
        ((errors++))
    fi
    
    if ! sudo grep -q "^PORTAL_BASE_URL=" "$ENV_FILE"; then
        log_error "PORTAL_BASE_URL is not set"
        ((errors++))
    fi
    
    if ! sudo grep -q "^AGENT_TOKEN=" "$ENV_FILE"; then
        log_error "AGENT_TOKEN is not set"
        ((errors++))
    fi
    
    # Check URL format
    local portal_url=$(sudo grep "^PORTAL_BASE_URL=" "$ENV_FILE" | cut -d'=' -f2)
    if [[ ! "$portal_url" =~ ^https?:// ]]; then
        log_error "PORTAL_BASE_URL must start with http:// or https://"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "Configuration is valid"
    else
        log_error "Configuration has $errors error(s)"
        exit 1
    fi
}

# Show help
show_help() {
    echo "Lab Portal Agent Configuration Script"
    echo "====================================="
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  show       - Show current configuration"
    echo "  edit       - Edit configuration file with default editor"
    echo "  interactive- Interactive configuration setup"
    echo "  validate   - Validate current configuration"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 show"
    echo "  $0 edit"
    echo "  $0 interactive"
    echo "  $0 validate"
}

# Main function
main() {
    local command="${1:-show}"
    
    check_root
    check_installation
    
    case "$command" in
        "show")
            show_current_config
            ;;
        "edit")
            edit_config
            ;;
        "interactive")
            interactive_config
            ;;
        "validate")
            validate_config
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
