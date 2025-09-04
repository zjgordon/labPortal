#!/bin/bash

# Lab Portal Agent Guided Installation Script
# Provides TUI interface with fallback to text prompts

set -euo pipefail

# Configuration defaults
DEFAULT_EXEC_TIMEOUT_MS=60000
DEFAULT_RESTART_RETRY=1
DEFAULT_INSTALL_DIR="/opt/lab-portal-agent"
DEFAULT_USERNAME="labagent"
AGENT_VERSION="1.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# TUI detection and setup
TUI_MODE=""
TUI_CMD=""

# Collected configuration values
HOST_ID=""
PORTAL_BASE_URL=""
AGENT_TOKEN=""
EXEC_TIMEOUT_MS="$DEFAULT_EXEC_TIMEOUT_MS"
RESTART_RETRY="$DEFAULT_RESTART_RETRY"
INSTALL_DIR="$DEFAULT_INSTALL_DIR"
USERNAME="$DEFAULT_USERNAME"

# CLI flags
HEADLESS_MODE=false
ASSUME_YES=false
ACTION=""

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

# Show usage information
show_usage() {
    cat << EOF
Lab Portal Agent Guided Installer

USAGE:
    $0 [OPTIONS]

ACTIONS:
    --install              Install Lab Portal Agent
    --upgrade              Upgrade existing installation
    --uninstall            Uninstall Lab Portal Agent
    --logs                 View service logs
    --dry-run              Show installation plan without making changes

CONFIGURATION OPTIONS:
    --host-id ID           Host identifier (required for install)
    --portal URL           Portal base URL (required for install)
    --token TOKEN          Agent token (required for install)
    --install-dir DIR      Installation directory (default: $DEFAULT_INSTALL_DIR)
    --user USER            Agent username (default: $DEFAULT_USERNAME)
    --exec-timeout MS      Execution timeout in milliseconds (default: $DEFAULT_EXEC_TIMEOUT_MS)
    --restart-retry N      Restart retry count (default: $DEFAULT_RESTART_RETRY)
    --assume-yes           Skip confirmation prompts

EXAMPLES:
    # Interactive mode (default)
    sudo $0

    # Headless install
    sudo $0 --install --host-id my-host --portal http://portal.local --token my-token

    # Upgrade existing installation
    sudo $0 --upgrade

    # Uninstall with confirmation
    sudo $0 --uninstall

    # View logs
    sudo $0 --logs

    # Install with custom settings
    sudo $0 --install --host-id my-host --portal https://portal.example.com \\
        --token my-secret-token --install-dir /opt/my-agent --user myagent

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --install)
                ACTION="install"
                shift
                ;;
            --upgrade)
                ACTION="upgrade"
                shift
                ;;
            --uninstall)
                ACTION="uninstall"
                shift
                ;;
            --logs)
                ACTION="logs"
                shift
                ;;
            --host-id)
                HOST_ID="$2"
                shift 2
                ;;
            --portal)
                PORTAL_BASE_URL="$2"
                shift 2
                ;;
            --token)
                AGENT_TOKEN="$2"
                shift 2
                ;;
            --install-dir)
                INSTALL_DIR="$2"
                shift 2
                ;;
            --user)
                USERNAME="$2"
                shift 2
                ;;
            --exec-timeout)
                EXEC_TIMEOUT_MS="$2"
                shift 2
                ;;
            --restart-retry)
                RESTART_RETRY="$2"
                shift 2
                ;;
            --assume-yes)
                ASSUME_YES=true
                shift
                ;;
            --dry-run)
                ACTION="dry-run"
                shift
                ;;
            --help|-h)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo ""
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate URL format
validate_url() {
    local url="$1"
    if [[ "$url" =~ ^https?://[a-zA-Z0-9.-]+(:[0-9]+)?(/.*)?$ ]]; then
        return 0
    else
        return 1
    fi
}

# Validate token length
validate_token() {
    local token="$1"
    if [[ ${#token} -ge 24 ]]; then
        return 0
    else
        return 1
    fi
}

# Check if Node.js is available
check_node() {
    if command -v node > /dev/null 2>&1; then
        local node_version
        node_version=$(node --version 2>/dev/null | sed 's/v//')
        local major_version
        major_version=$(echo "$node_version" | cut -d. -f1)
        
        if [[ "$major_version" -ge 18 ]]; then
            log_success "Node.js $node_version found"
            return 0
        else
            log_error "Node.js version $node_version found, but version 18+ is required"
            return 1
        fi
    else
        log_error "Node.js is not installed"
        echo ""
        echo "Please install Node.js 18+ before running this script:"
        echo ""
        echo "Ubuntu/Debian:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        echo ""
        echo "CentOS/RHEL/Fedora:"
        echo "  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
        echo "  sudo yum install -y nodejs"
        echo ""
        echo "Or visit: https://nodejs.org/"
        return 1
    fi
}

# Validate configuration for headless mode
validate_headless_config() {
    local errors=0
    
    if [[ -z "$HOST_ID" ]]; then
        log_error "HOST_ID is required (use --host-id)"
        errors=$((errors + 1))
    fi
    
    if [[ -z "$PORTAL_BASE_URL" ]]; then
        log_error "PORTAL_BASE_URL is required (use --portal)"
        errors=$((errors + 1))
    elif ! validate_url "$PORTAL_BASE_URL"; then
        log_error "PORTAL_BASE_URL must be a valid HTTP/HTTPS URL (got: $PORTAL_BASE_URL)"
        errors=$((errors + 1))
    fi
    
    if [[ -z "$AGENT_TOKEN" ]]; then
        log_error "AGENT_TOKEN is required (use --token)"
        errors=$((errors + 1))
    elif ! validate_token "$AGENT_TOKEN"; then
        log_error "AGENT_TOKEN must be at least 24 characters long (got: ${#AGENT_TOKEN} chars)"
        errors=$((errors + 1))
    fi
    
    if ! check_node; then
        errors=$((errors + 1))
    fi
    
    if [[ $errors -gt 0 ]]; then
        echo ""
        log_error "Configuration validation failed with $errors error(s)"
        exit 1
    fi
    
    log_success "Configuration validation passed"
}

# Check if headless mode is possible
check_headless_mode() {
    if [[ "$ACTION" == "install" ]] && [[ -n "$HOST_ID" ]] && [[ -n "$PORTAL_BASE_URL" ]] && [[ -n "$AGENT_TOKEN" ]]; then
        HEADLESS_MODE=true
        log_info "Headless mode enabled - all required configuration provided"
    fi
}

# Detect available TUI
detect_tui() {
    if command -v whiptail > /dev/null 2>&1; then
        TUI_MODE="whiptail"
        TUI_CMD="whiptail"
        log_info "Using whiptail for TUI interface"
    elif command -v dialog > /dev/null 2>&1; then
        TUI_MODE="dialog"
        TUI_CMD="dialog"
        log_info "Using dialog for TUI interface"
    else
        TUI_MODE="text"
        log_info "No TUI available, using text prompts"
    fi
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        if [[ "$TUI_MODE" == "text" ]]; then
            log_error "This script must be run as root"
            echo ""
            echo "Please run with sudo:"
            echo "  sudo $0"
            echo ""
        else
            $TUI_CMD --msgbox "This script must be run as root.\n\nPlease run with sudo:\n  sudo $0" 10 50
        fi
        exit 1
    fi
}

# Detect OS and package manager
detect_os() {
    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        source /etc/os-release
        case "$ID" in
            ubuntu|debian)
                PKG_MANAGER="apt"
                ;;
            fedora|rhel|centos)
                PKG_MANAGER="yum"
                if command -v dnf > /dev/null 2>&1; then
                    PKG_MANAGER="dnf"
                fi
                ;;
            *)
                PKG_MANAGER="unknown"
                ;;
        esac
        log_info "Detected OS: $PRETTY_NAME (Package manager: $PKG_MANAGER)"
    else
        PKG_MANAGER="unknown"
        log_warning "Could not detect OS, package manager unknown"
    fi
}

# Install TUI dependencies
install_tui_deps() {
    if [[ "$TUI_MODE" == "text" ]]; then
        if [[ "$PKG_MANAGER" != "unknown" ]]; then
            if [[ "$TUI_MODE" == "text" ]]; then
                echo ""
                echo "TUI packages (whiptail/dialog) are not installed."
                echo "Would you like to install them for a better experience? (y/n)"
                read -r install_tui
                if [[ "$install_tui" =~ ^[Yy]$ ]]; then
                    case "$PKG_MANAGER" in
                        apt)
                            apt update && apt install -y whiptail
                            ;;
                        yum|dnf)
                            $PKG_MANAGER install -y newt
                            ;;
                    esac
                    # Re-detect TUI after installation
                    detect_tui
                fi
            fi
        fi
    fi
}

# Check systemctl availability
check_systemctl() {
    if ! command -v systemctl > /dev/null 2>&1; then
        log_error "systemctl is not available. This script requires systemd."
        exit 1
    fi
    log_success "systemctl is available"
}

# TUI input functions
tui_input() {
    local title="$1"
    local prompt="$2"
    local default="$3"
    local result=""
    
    if [[ "$TUI_MODE" == "whiptail" ]]; then
        result=$($TUI_CMD --inputbox "$prompt" 10 50 "$default" 3>&1 1>&2 2>&3)
    elif [[ "$TUI_MODE" == "dialog" ]]; then
        result=$($TUI_CMD --inputbox "$prompt" 10 50 "$default" 2>&1)
    else
        echo -n "$prompt [$default]: "
        read -r result
        if [[ -z "$result" ]]; then
            result="$default"
        fi
    fi
    
    echo "$result"
}

# TUI password input
tui_password() {
    local title="$1"
    local prompt="$2"
    local result=""
    
    if [[ "$TUI_MODE" == "whiptail" ]]; then
        result=$($TUI_CMD --passwordbox "$prompt" 10 50 3>&1 1>&2 2>&3)
    elif [[ "$TUI_MODE" == "dialog" ]]; then
        result=$($TUI_CMD --passwordbox "$prompt" 10 50 2>&1)
    else
        echo -n "$prompt: "
        read -rs result
        echo ""
    fi
    
    echo "$result"
}

# TUI yes/no dialog
tui_yesno() {
    local title="$1"
    local prompt="$2"
    local result=""
    
    # In headless mode with --assume-yes, always return yes
    if [[ "$HEADLESS_MODE" == true ]] && [[ "$ASSUME_YES" == true ]]; then
        return 0
    fi
    
    # In headless mode without --assume-yes, always return no
    if [[ "$HEADLESS_MODE" == true ]]; then
        return 1
    fi
    
    if [[ "$TUI_MODE" == "whiptail" ]]; then
        $TUI_CMD --yesno "$prompt" 10 50
        result=$?
    elif [[ "$TUI_MODE" == "dialog" ]]; then
        $TUI_CMD --yesno "$prompt" 10 50
        result=$?
    else
        echo -n "$prompt (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            result=0
        else
            result=1
        fi
    fi
    
    return $result
}

# TUI message box
tui_msgbox() {
    # shellcheck disable=SC2034
    local title="$1"
    local message="$2"
    local height="${3:-10}"
    local width="${4:-50}"
    
    if [[ "$TUI_MODE" == "whiptail" ]]; then
        # shellcheck disable=SC2086
        $TUI_CMD --msgbox "$message" $height $width
    elif [[ "$TUI_MODE" == "dialog" ]]; then
        # shellcheck disable=SC2086
        $TUI_CMD --msgbox "$message" $height $width
    else
        echo ""
        echo "$message"
        echo ""
    fi
}

# Welcome screen
show_welcome() {
    local message="Welcome to Lab Portal Agent Installation

Version: $AGENT_VERSION

This installer will guide you through setting up the Lab Portal Agent
on this system. The agent will be installed as a systemd service.

Press OK to continue or Cancel to exit."
    
    if [[ "$TUI_MODE" == "text" ]]; then
        echo "=========================================="
        echo "Lab Portal Agent Installation"
        echo "=========================================="
        echo ""
        echo "Version: $AGENT_VERSION"
        echo ""
        echo "This installer will guide you through setting up the Lab Portal Agent"
        echo "on this system. The agent will be installed as a systemd service."
        echo ""
        echo -n "Press Enter to continue or Ctrl+C to exit: "
        read -r
    else
        tui_yesno "Welcome" "$message"
        if [[ $? -ne 0 ]]; then
            exit 0
        fi
    fi
}

# Collect configuration inputs
collect_inputs() {
    log_info "Collecting configuration..."
    
    # HOST_ID (required)
    HOST_ID=$(tui_input "Configuration" "Enter Host ID (required):" "")
    while [[ -z "$HOST_ID" ]]; do
        if [[ "$TUI_MODE" == "text" ]]; then
            echo "Host ID is required!"
            HOST_ID=$(tui_input "Configuration" "Enter Host ID (required):" "")
        else
            tui_msgbox "Error" "Host ID is required!" 8 40
            HOST_ID=$(tui_input "Configuration" "Enter Host ID (required):" "")
        fi
    done
    
    # PORTAL_BASE_URL (required)
    PORTAL_BASE_URL=$(tui_input "Configuration" "Enter Portal Base URL (e.g., http://portal.local):" "http://localhost:3000")
    while [[ -z "$PORTAL_BASE_URL" ]]; do
        if [[ "$TUI_MODE" == "text" ]]; then
            echo "Portal Base URL is required!"
            PORTAL_BASE_URL=$(tui_input "Configuration" "Enter Portal Base URL (e.g., http://portal.local):" "http://localhost:3000")
        else
            tui_msgbox "Error" "Portal Base URL is required!" 8 40
            PORTAL_BASE_URL=$(tui_input "Configuration" "Enter Portal Base URL (e.g., http://portal.local):" "http://localhost:3000")
        fi
    done
    
    # AGENT_TOKEN (required, masked)
    AGENT_TOKEN=$(tui_password "Configuration" "Enter Agent Token (required):")
    while [[ -z "$AGENT_TOKEN" ]]; do
        if [[ "$TUI_MODE" == "text" ]]; then
            echo "Agent Token is required!"
            AGENT_TOKEN=$(tui_password "Configuration" "Enter Agent Token (required):")
        else
            tui_msgbox "Error" "Agent Token is required!" 8 40
            AGENT_TOKEN=$(tui_password "Configuration" "Enter Agent Token (required):")
        fi
    done
    
    # EXEC_TIMEOUT_MS (optional)
    EXEC_TIMEOUT_MS=$(tui_input "Configuration" "Enter execution timeout in milliseconds:" "$DEFAULT_EXEC_TIMEOUT_MS")
    
    # RESTART_RETRY (optional)
    RESTART_RETRY=$(tui_input "Configuration" "Enter restart retry count:" "$DEFAULT_RESTART_RETRY")
    
    # INSTALL_DIR (optional)
    INSTALL_DIR=$(tui_input "Configuration" "Enter installation directory:" "$DEFAULT_INSTALL_DIR")
    
    # USERNAME (optional)
    USERNAME=$(tui_input "Configuration" "Enter agent username:" "$DEFAULT_USERNAME")
}

# Show configuration summary
show_summary() {
    local summary="Configuration Summary:

Host ID: $HOST_ID
Portal Base URL: $PORTAL_BASE_URL
Agent Token: [HIDDEN]
Execution Timeout: ${EXEC_TIMEOUT_MS}ms
Restart Retry: $RESTART_RETRY
Install Directory: $INSTALL_DIR
Username: $USERNAME

This is a DRY RUN - no changes will be made.
Press OK to see the installation plan."
    
    if [[ "$TUI_MODE" == "text" ]]; then
        echo ""
        echo "=========================================="
        echo "Configuration Summary"
        echo "=========================================="
        echo ""
        echo "Host ID: $HOST_ID"
        echo "Portal Base URL: $PORTAL_BASE_URL"
        echo "Agent Token: [HIDDEN]"
        echo "Execution Timeout: ${EXEC_TIMEOUT_MS}ms"
        echo "Restart Retry: $RESTART_RETRY"
        echo "Install Directory: $INSTALL_DIR"
        echo "Username: $USERNAME"
        echo ""
        echo "This is a DRY RUN - no changes will be made."
        echo ""
        echo -n "Press Enter to see the installation plan: "
        read -r
    else
        tui_msgbox "Configuration Summary" "$summary" 15 60
    fi
}

# Show dry-run installation plan
show_dry_run() {
    local plan="Installation Plan (DRY RUN):

1. Create user and group: $USERNAME
2. Create directory: $INSTALL_DIR
3. Copy agent files to: $INSTALL_DIR
4. Create .env configuration file
5. Create systemd service: /etc/systemd/system/lab-portal-agent.service
6. Enable and start service
7. Validate service status
8. Test heartbeat API

Configuration will be written to:
$INSTALL_DIR/.env

Service will run as user: $USERNAME
Service name: lab-portal-agent
Service file: /etc/systemd/system/lab-portal-agent.service

To proceed with actual installation, run:
sudo $0 --install

Press OK to exit."
    
    if [[ "$TUI_MODE" == "text" ]]; then
        echo ""
        echo "=========================================="
        echo "Installation Plan (DRY RUN)"
        echo "=========================================="
        echo ""
        echo "1. Create user and group: $USERNAME"
        echo "2. Create directory: $INSTALL_DIR"
        echo "3. Copy agent files to: $INSTALL_DIR"
        echo "4. Create .env configuration file"
        echo "5. Create systemd service: /etc/systemd/system/lab-portal-agent.service"
        echo "6. Enable and start service"
        echo "7. Validate service status"
        echo "8. Test heartbeat API"
        echo ""
        echo "Configuration will be written to:"
        echo "$INSTALL_DIR/.env"
        echo ""
        echo "Service will run as user: $USERNAME"
        echo "Service name: lab-portal-agent"
        echo "Service file: /etc/systemd/system/lab-portal-agent.service"
        echo ""
        echo "To proceed with actual installation, run:"
        echo "sudo $0 --install"
        echo ""
    else
        tui_msgbox "Installation Plan" "$plan" 20 60
    fi
}

# Quote-safe value for .env file
quote_env_value() {
    local value="$1"
    # Escape quotes and backslashes
    value="${value//\\/\\\\}"
    value="${value//\"/\\\"}"
    # Quote the value
    echo "\"$value\""
}

# Create system user
create_user() {
    log_info "Creating system user: $USERNAME"
    
    # Check if user already exists
    if id "$USERNAME" >/dev/null 2>&1; then
        log_info "User $USERNAME already exists"
        return 0
    fi
    
    # Create user with no shell
    useradd --system \
        --home-dir "$INSTALL_DIR" \
        --shell /usr/sbin/nologin \
        --comment "Lab Portal Agent" \
        "$USERNAME"
    
    log_success "Created user: $USERNAME"
}

# Create installation directory
create_install_directory() {
    log_info "Creating installation directory: $INSTALL_DIR"
    
    # Create directory
    mkdir -p "$INSTALL_DIR"
    
    # Set ownership
    chown "$USERNAME:$USERNAME" "$INSTALL_DIR"
    
    # Set permissions
    chmod 755 "$INSTALL_DIR"
    
    log_success "Created directory: $INSTALL_DIR"
}

# Find and copy agent artifacts
copy_agent_artifacts() {
    log_info "Copying agent artifacts..."
    
    local agent_dir=""
    local tarball_found=false
    
    # Look for tarball in dist-artifacts directory
    if [[ -d "../../dist-artifacts" ]]; then
        local tarball
        # shellcheck disable=SC2155
        tarball=$(find ../../dist-artifacts -name "agent-labportal-*.tgz" -o -name "lab-portal-agent-*.tgz" | head -1)
        if [[ -n "$tarball" && -f "$tarball" ]]; then
            log_info "Found tarball: $tarball"
            tarball_found=true
            
            # Extract tarball
            tar -xzf "$tarball" -C "$INSTALL_DIR" --strip-components=1
            log_success "Extracted tarball to: $INSTALL_DIR"
        fi
    fi
    
    # If no tarball found, copy from dist directory
    if [[ "$tarball_found" == false ]]; then
        if [[ -d "../dist" ]]; then
            agent_dir="../dist"
        elif [[ -d "../../agent/dist" ]]; then
            agent_dir="../../agent/dist"
        else
            log_error "No agent artifacts found. Please build the agent first."
            exit 1
        fi
        
        log_info "Copying from: $agent_dir"
        cp -r "$agent_dir"/* "$INSTALL_DIR/"
        
        # Copy additional files if they exist
        [[ -f "../package.json" ]] && cp "../package.json" "$INSTALL_DIR/"
        [[ -f "../../agent/package.json" ]] && cp "../../agent/package.json" "$INSTALL_DIR/"
        [[ -f "../README.md" ]] && cp "../README.md" "$INSTALL_DIR/"
        [[ -f "../../agent/README.md" ]] && cp "../../agent/README.md" "$INSTALL_DIR/"
        
        log_success "Copied agent files to: $INSTALL_DIR"
    fi
    
    # Make scripts executable
    find "$INSTALL_DIR" -name "*.js" -type f -exec chmod +x {} \;
    find "$INSTALL_DIR" -name "*.sh" -type f -exec chmod +x {} \;
    
    log_success "Set executable permissions on scripts"
}

# Create .env configuration file
create_env_file() {
    log_info "Creating .env configuration file..."
    
    cat > "$INSTALL_DIR/.env" << EOF
# Lab Portal Agent Configuration
# Generated by guided installer on $(date)

# Your host identifier (must match what's configured in the portal)
HOST_ID=$(quote_env_value "$HOST_ID")

# Base URL of the Lab Portal (no trailing slash)
PORTAL_BASE_URL=$(quote_env_value "$PORTAL_BASE_URL")

# Authentication token from the portal (get this from the hosts management page)
AGENT_TOKEN=$(quote_env_value "$AGENT_TOKEN")

# Polling interval in milliseconds (default: 4000 = 4 seconds)
POLL_INTERVAL=4000

# Command execution timeout in milliseconds
EXEC_TIMEOUT_MS=$EXEC_TIMEOUT_MS

# Number of retry attempts for restart failures
RESTART_RETRY=$RESTART_RETRY

# Environment (development/production)
NODE_ENV=production
EOF
    
    log_success "Created .env file: $INSTALL_DIR/.env"
}

# Set final permissions
set_permissions() {
    log_info "Setting final permissions..."
    
    # Set ownership recursively
    chown -R "$USERNAME:$USERNAME" "$INSTALL_DIR"
    
    # Set .env file permissions (readable by owner only)
    chmod 640 "$INSTALL_DIR/.env"
    
    # Ensure directory permissions
    chmod 755 "$INSTALL_DIR"
    
    log_success "Set permissions on: $INSTALL_DIR"
}

# Create systemd service file
create_systemd_service() {
    log_info "Creating systemd service file..."
    
    local service_file="/etc/systemd/system/lab-portal-agent.service"
    
    cat > "$service_file" << EOF
[Unit]
Description=Lab Portal Agent
After=network-online.target
Wants=network-online.target

[Service]
EnvironmentFile=$INSTALL_DIR/.env
User=$USERNAME
Group=$USERNAME
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node $INSTALL_DIR/index.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
    
    log_success "Created systemd service file: $service_file"
}

# Enable and start systemd service
enable_start_service() {
    log_info "Enabling and starting systemd service..."
    
    # Reload systemd daemon
    systemctl daemon-reload
    
    # Enable service
    systemctl enable lab-portal-agent
    
    # Start service
    systemctl start lab-portal-agent
    
    log_success "Service enabled and started: lab-portal-agent"
}

# Validate service status
validate_service_status() {
    log_info "Validating service status..."
    
    echo ""
    echo "=========================================="
    echo "Service Status"
    echo "=========================================="
    echo ""
    
    # Show service status
    systemctl status lab-portal-agent --no-pager --lines=20
    
    # Check if service is active
    if systemctl is-active --quiet lab-portal-agent; then
        log_success "Service is active and running"
        return 0
    else
        log_error "Service is not active"
        return 1
    fi
}

# Test heartbeat API
test_heartbeat() {
    log_info "Testing heartbeat API..."
    
    local heartbeat_url="$PORTAL_BASE_URL/api/agents/heartbeat"
    
    echo ""
    echo "=========================================="
    echo "Heartbeat Test"
    echo "=========================================="
    echo ""
    echo "Testing: $heartbeat_url"
    echo "Token: [HIDDEN]"
    echo ""
    
    # Test heartbeat with curl
    local response
    local http_code
    
    if command -v curl > /dev/null 2>&1; then
        response=$(curl -s -w "\n%{http_code}" \
            -X POST \
            -H "Authorization: Bearer $AGENT_TOKEN" \
            -H "Content-Type: application/json" \
            "$heartbeat_url" 2>/dev/null)
        
        http_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)
        
        if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
            log_success "Heartbeat successful (HTTP $http_code)"
            echo "Response: $response_body"
            return 0
        else
            log_error "Heartbeat failed (HTTP $http_code)"
            echo "Response: $response_body"
            return 1
        fi
    else
        log_warning "curl not available, skipping heartbeat test"
        return 1
    fi
}

# Show journal logs if needed
show_journal_logs() {
    log_info "Showing recent service logs..."
    
    echo ""
    echo "=========================================="
    echo "Recent Service Logs"
    echo "=========================================="
    echo ""
    
    journalctl -u lab-portal-agent -n 50 --no-pager
}

# Show installation summary
show_installation_summary() {
    # shellcheck disable=SC2155
    local summary="Installation completed successfully!

Files installed to: $INSTALL_DIR
Configuration file: $INSTALL_DIR/.env
Service user: $USERNAME
Service: lab-portal-agent

Service Status: $(systemctl is-active lab-portal-agent 2>/dev/null || echo 'unknown')

Press OK to exit."
    
    if [[ "$TUI_MODE" == "text" ]]; then
        echo ""
        echo "=========================================="
        echo "Installation Summary"
        echo "=========================================="
        echo ""
        echo "Files installed to: $INSTALL_DIR"
        echo "Configuration file: $INSTALL_DIR/.env"
        echo "Service user: $USERNAME"
        echo "Service: lab-portal-agent"
        echo "Service Status: $(systemctl is-active lab-portal-agent 2>/dev/null || echo 'unknown')"
        echo ""
        log_success "Installation completed successfully!"
    else
        tui_msgbox "Installation Complete" "$summary" 15 60
    fi
}

# Perform actual installation
perform_installation() {
    log_info "Starting installation process..."
    
    create_user
    create_install_directory
    copy_agent_artifacts
    create_env_file
    set_permissions
    create_systemd_service
    enable_start_service
    
    # Wait a moment for service to start
    sleep 2
    
    # Validate service
    if validate_service_status; then
        log_success "Service validation passed"
        
        # Test heartbeat
        if test_heartbeat; then
            log_success "Heartbeat test passed"
        else
            log_warning "Heartbeat test failed - this may be normal if portal is not running"
            echo ""
            echo "If you need to troubleshoot, you can view logs with:"
            echo "  journalctl -u lab-portal-agent -f"
            echo ""
        fi
        
        # Offer sudoers helper
        local sudoers_msg="Installation completed successfully!

Would you like to create a sudoers helper file?
This allows the agent user to manage system services without requiring root access.

The helper will be created at: /etc/sudoers.d/lab-portal-agent

Create sudoers helper?"
        
        if [[ "$TUI_MODE" == "text" ]]; then
            echo ""
            echo -n "Create sudoers helper? (y/n): "
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                create_sudoers_helper
            fi
        else
            tui_yesno "Create Sudoers Helper" "$sudoers_msg"
            if [[ $? -eq 0 ]]; then
                create_sudoers_helper
            fi
        fi
    else
        log_error "Service validation failed"
        echo ""
        echo "Troubleshooting information:"
        show_journal_logs
        echo ""
        echo "You can view live logs with:"
        echo "  journalctl -u lab-portal-agent -f"
        echo ""
    fi
    
    show_installation_summary
}

# Show main menu
show_main_menu() {
    local menu_title="Lab Portal Agent Management"
    local menu_options=""
    
    if [[ "$TUI_MODE" == "whiptail" ]]; then
        # shellcheck disable=SC2089,SC2090
        menu_options="Install (new) 'Install Lab Portal Agent' \
                     Upgrade 'Upgrade existing installation' \
                     Uninstall 'Remove Lab Portal Agent' \
                     View Logs 'View service logs' \
                     Exit 'Exit installer'"
        
        local choice
        # shellcheck disable=SC2086
        choice=$($TUI_CMD --menu "$menu_title" 15 60 5 $menu_options 3>&1 1>&2 2>&3)
        echo "$choice"
    elif [[ "$TUI_MODE" == "dialog" ]]; then
        # shellcheck disable=SC2089,SC2090
        menu_options="Install (new) Install Lab Portal Agent \
                     Upgrade Upgrade existing installation \
                     Uninstall Remove Lab Portal Agent \
                     View Logs View service logs \
                     Exit Exit installer"
        
        local choice
        # shellcheck disable=SC2086
        choice=$($TUI_CMD --menu "$menu_title" 15 60 5 $menu_options 2>&1)
        echo "$choice"
    else
        echo ""
        echo "=========================================="
        echo "$menu_title"
        echo "=========================================="
        echo ""
        echo "1) Install (new) - Install Lab Portal Agent"
        echo "2) Upgrade - Upgrade existing installation"
        echo "3) Uninstall - Remove Lab Portal Agent"
        echo "4) View Logs - View service logs"
        echo "5) Exit - Exit installer"
        echo ""
        echo -n "Please select an option (1-5): "
        read -r choice
        
        case "$choice" in
            1) echo "Install (new)" ;;
            2) echo "Upgrade" ;;
            3) echo "Uninstall" ;;
            4) echo "View Logs" ;;
            5) echo "Exit" ;;
            *) echo "Invalid option" ;;
        esac
    fi
}

# Check if service exists
check_service_exists() {
    systemctl list-unit-files | grep -q "lab-portal-agent.service"
}

# Check if installation exists
check_installation_exists() {
    [[ -d "$INSTALL_DIR" ]] && [[ -f "$INSTALL_DIR/.env" ]]
}

# Load existing configuration
load_existing_config() {
    if [[ -f "$INSTALL_DIR/.env" ]]; then
        log_info "Loading existing configuration..."
        
        # Extract values from existing .env file
        HOST_ID=$(grep "^HOST_ID=" "$INSTALL_DIR/.env" | cut -d'=' -f2- | tr -d '"')
        PORTAL_BASE_URL=$(grep "^PORTAL_BASE_URL=" "$INSTALL_DIR/.env" | cut -d'=' -f2- | tr -d '"')
        AGENT_TOKEN=$(grep "^AGENT_TOKEN=" "$INSTALL_DIR/.env" | cut -d'=' -f2- | tr -d '"')
        EXEC_TIMEOUT_MS=$(grep "^EXEC_TIMEOUT_MS=" "$INSTALL_DIR/.env" | cut -d'=' -f2- | tr -d '"')
        RESTART_RETRY=$(grep "^RESTART_RETRY=" "$INSTALL_DIR/.env" | cut -d'=' -f2- | tr -d '"')
        
        # Get username from service file if it exists
        if [[ -f "/etc/systemd/system/lab-portal-agent.service" ]]; then
            USERNAME=$(grep "^User=" "/etc/systemd/system/lab-portal-agent.service" | cut -d'=' -f2)
        fi
        
        log_success "Configuration loaded from existing installation"
    else
        log_error "No existing configuration found at $INSTALL_DIR/.env"
        return 1
    fi
}

# Perform upgrade
perform_upgrade() {
    log_info "Starting upgrade process..."
    
    # Check if installation exists
    if ! check_installation_exists; then
        log_error "No existing installation found at $INSTALL_DIR"
        return 1
    fi
    
    # Load existing configuration
    load_existing_config || return 1
    
    # Stop service
    log_info "Stopping service..."
    systemctl stop lab-portal-agent || true
    
    # Backup .env file
    log_info "Backing up configuration..."
    cp "$INSTALL_DIR/.env" "$INSTALL_DIR/.env.backup"
    
    # Replace binaries
    log_info "Replacing agent binaries..."
    copy_agent_artifacts
    
    # Restore .env file
    log_info "Restoring configuration..."
    mv "$INSTALL_DIR/.env.backup" "$INSTALL_DIR/.env"
    
    # Set permissions
    set_permissions
    
    # Start service
    log_info "Starting service..."
    systemctl start lab-portal-agent
    
    # Wait and validate
    sleep 2
    if validate_service_status; then
        log_success "Upgrade completed successfully!"
    else
        log_error "Upgrade completed but service validation failed"
        show_journal_logs
    fi
}

# Perform uninstall
perform_uninstall() {
    log_info "Starting uninstall process..."
    
    # Check if service exists
    if check_service_exists; then
        log_info "Stopping and disabling service..."
        systemctl stop lab-portal-agent || true
        systemctl disable lab-portal-agent || true
    fi
    
    # Remove service file
    if [[ -f "/etc/systemd/system/lab-portal-agent.service" ]]; then
        log_info "Removing service file..."
        rm -f "/etc/systemd/system/lab-portal-agent.service"
        systemctl daemon-reload
    fi
    
    # Ask about removing installation directory
    local remove_dir_msg="Uninstall completed successfully!

Service has been stopped, disabled, and removed.

Installation directory: $INSTALL_DIR
Configuration file: $INSTALL_DIR/.env

Do you want to remove the installation directory and all files?
This will permanently delete the agent files and configuration."
    
    local remove_dir=false
    if [[ "$TUI_MODE" == "text" ]]; then
        echo ""
        echo -n "Remove installation directory? (y/n): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            remove_dir=true
        fi
    else
        tui_yesno "Remove Installation Directory" "$remove_dir_msg"
        if [[ $? -eq 0 ]]; then
            remove_dir=true
        fi
    fi
    
    if [[ "$remove_dir" == true ]]; then
        log_info "Removing installation directory..."
        rm -rf "$INSTALL_DIR"
        log_success "Installation directory removed"
    else
        log_info "Installation directory preserved: $INSTALL_DIR"
    fi
    
    log_success "Uninstall completed successfully!"
}

# View service logs
view_service_logs() {
    log_info "Showing service logs..."
    
    if ! check_service_exists; then
        log_error "Service not found. Please install the agent first."
        return 1
    fi
    
    echo ""
    echo "=========================================="
    echo "Service Logs (last 200 lines, following)"
    echo "=========================================="
    echo ""
    echo "Press Ctrl+C to exit log viewing"
    echo ""
    
    # Show last 200 lines and follow
    journalctl -u lab-portal-agent -n 200 -f
}

# Create sudoers helper
create_sudoers_helper() {
    log_info "Creating sudoers helper..."
    
    local sudoers_file="/etc/sudoers.d/lab-portal-agent"
    local sudoers_content="# Lab Portal Agent sudoers configuration
# This allows the lab-portal-agent user to manage specific system services

# Allow lab-portal-agent to manage its own service
$USERNAME ALL=(root) NOPASSWD: /bin/systemctl start lab-portal-agent
$USERNAME ALL=(root) NOPASSWD: /bin/systemctl stop lab-portal-agent
$USERNAME ALL=(root) NOPASSWD: /bin/systemctl restart lab-portal-agent
$USERNAME ALL=(root) NOPASSWD: /bin/systemctl status lab-portal-agent

# Allow lab-portal-agent to manage other services (customize as needed)
# $USERNAME ALL=(root) NOPASSWD: /bin/systemctl start service-name
# $USERNAME ALL=(root) NOPASSWD: /bin/systemctl stop service-name
# $USERNAME ALL=(root) NOPASSWD: /bin/systemctl restart service-name

# Allow lab-portal-agent to read system information
$USERNAME ALL=(root) NOPASSWD: /bin/ps aux
$USERNAME ALL=(root) NOPASSWD: /bin/df -h
$USERNAME ALL=(root) NOPASSWD: /bin/free -h
"
    
    # Validate sudoers content
    if echo "$sudoers_content" | visudo -cf - > /dev/null 2>&1; then
        log_info "Sudoers content validated successfully"
        
        # Write atomically
        echo "$sudoers_content" > "$sudoers_file.tmp"
        chmod 440 "$sudoers_file.tmp"
        mv "$sudoers_file.tmp" "$sudoers_file"
        
        log_success "Sudoers helper created: $sudoers_file"
        log_info "You can customize the allowed commands by editing this file"
    else
        log_error "Sudoers content validation failed"
        return 1
    fi
}

# Main function
main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Initialize common components
    detect_tui
    check_root
    detect_os
    install_tui_deps
    check_systemctl
    
    # Handle specific actions
    case "$ACTION" in
        "install")
            # Check if headless mode is possible
            check_headless_mode
            
            if [[ "$HEADLESS_MODE" == true ]]; then
                # Headless install mode
                log_info "Starting headless installation..."
                validate_headless_config
                perform_installation
            else
                # Interactive install mode
                show_welcome
                collect_inputs
                show_summary
                
                # Confirm installation
                local confirm_msg="Ready to install Lab Portal Agent with the above configuration?

This will:
- Create user: $USERNAME
- Install to: $INSTALL_DIR
- Create configuration file
- Set up file permissions

Continue with installation?"
                
                if [[ "$TUI_MODE" == "text" ]]; then
                    echo ""
                    echo -n "Continue with installation? (y/n): "
                    read -r response
                    if [[ ! "$response" =~ ^[Yy]$ ]]; then
                        log_info "Installation cancelled by user"
                        exit 0
                    fi
                else
                    tui_yesno "Confirm Installation" "$confirm_msg"
                    if [[ $? -ne 0 ]]; then
                        log_info "Installation cancelled by user"
                        exit 0
                    fi
                fi
                
                perform_installation
            fi
            ;;
            
        "upgrade")
            if ! check_installation_exists; then
                log_error "No existing installation found. Please install first."
                exit 1
            fi
            
            local upgrade_msg="Ready to upgrade Lab Portal Agent?

This will:
- Stop the service
- Replace agent binaries
- Preserve configuration
- Restart the service

Continue with upgrade?"
            
            if [[ "$ASSUME_YES" == true ]]; then
                log_info "Upgrade confirmed (--assume-yes)"
            else
                tui_yesno "Confirm Upgrade" "$upgrade_msg"
                if [[ $? -ne 0 ]]; then
                    log_info "Upgrade cancelled by user"
                    exit 0
                fi
            fi
            
            perform_upgrade
            ;;
            
        "uninstall")
            if ! check_service_exists; then
                log_error "No service found. Nothing to uninstall."
                exit 1
            fi
            
            local uninstall_msg="Ready to uninstall Lab Portal Agent?

This will:
- Stop and disable the service
- Remove the service file
- Optionally remove installation directory

Continue with uninstall?"
            
            if [[ "$ASSUME_YES" == true ]]; then
                log_info "Uninstall confirmed (--assume-yes)"
            else
                tui_yesno "Confirm Uninstall" "$uninstall_msg"
                if [[ $? -ne 0 ]]; then
                    log_info "Uninstall cancelled by user"
                    exit 0
                fi
            fi
            
            perform_uninstall
            ;;
            
        "logs")
            view_service_logs
            ;;
            
        "dry-run")
            # Dry-run mode - show installation plan without making changes
            if [[ -z "$HOST_ID" ]] || [[ -z "$PORTAL_BASE_URL" ]] || [[ -z "$AGENT_TOKEN" ]]; then
                log_error "Dry-run mode requires --host-id, --portal, and --token flags"
                echo ""
                echo "Example:"
                echo "  $0 --dry-run --host-id my-host --portal http://portal.local --token my-token"
                exit 1
            fi
            
            log_info "Running in dry-run mode..."
            validate_headless_config
            show_dry_run
            log_success "Dry-run completed successfully"
            ;;
            
        "")
            # No action specified, show interactive menu
            ;;
            
        *)
            log_error "Unknown action: $ACTION"
            show_usage
            exit 1
            ;;
    esac
    
    # If no action was specified, show interactive menu
    if [[ -z "$ACTION" ]]; then
        # Show main menu
        while true; do
            local choice
            choice=$(show_main_menu)
            
            case "$choice" in
                "Install (new)")
                    show_welcome
                    collect_inputs
                    show_summary
                    
                    # Confirm installation
                    local confirm_msg="Ready to install Lab Portal Agent with the above configuration?

This will:
- Create user: $USERNAME
- Install to: $INSTALL_DIR
- Create configuration file
- Set up file permissions

Continue with installation?"
                    
                    if [[ "$TUI_MODE" == "text" ]]; then
                        echo ""
                        echo -n "Continue with installation? (y/n): "
                        read -r response
                        if [[ ! "$response" =~ ^[Yy]$ ]]; then
                            log_info "Installation cancelled by user"
                            continue
                        fi
                    else
                        tui_yesno "Confirm Installation" "$confirm_msg"
                        if [[ $? -ne 0 ]]; then
                            log_info "Installation cancelled by user"
                            continue
                        fi
                    fi
                    
                    perform_installation
                    ;;
                    
                "Upgrade")
                    if ! check_installation_exists; then
                        log_error "No existing installation found. Please install first."
                        continue
                    fi
                    
                    local upgrade_msg="Ready to upgrade Lab Portal Agent?

This will:
- Stop the service
- Replace agent binaries
- Preserve configuration
- Restart the service

Continue with upgrade?"
                    
                    if [[ "$TUI_MODE" == "text" ]]; then
                        echo ""
                        echo -n "Continue with upgrade? (y/n): "
                        read -r response
                        if [[ ! "$response" =~ ^[Yy]$ ]]; then
                            log_info "Upgrade cancelled by user"
                            continue
                        fi
                    else
                        tui_yesno "Confirm Upgrade" "$upgrade_msg"
                        if [[ $? -ne 0 ]]; then
                            log_info "Upgrade cancelled by user"
                            continue
                        fi
                    fi
                    
                    perform_upgrade
                    ;;
                    
                "Uninstall")
                    if ! check_service_exists; then
                        log_error "No service found. Nothing to uninstall."
                        continue
                    fi
                    
                    local uninstall_msg="Ready to uninstall Lab Portal Agent?

This will:
- Stop and disable the service
- Remove the service file
- Optionally remove installation directory

Continue with uninstall?"
                    
                    if [[ "$TUI_MODE" == "text" ]]; then
                        echo ""
                        echo -n "Continue with uninstall? (y/n): "
                        read -r response
                        if [[ ! "$response" =~ ^[Yy]$ ]]; then
                            log_info "Uninstall cancelled by user"
                            continue
                        fi
                    else
                        tui_yesno "Confirm Uninstall" "$uninstall_msg"
                        if [[ $? -ne 0 ]]; then
                            log_info "Uninstall cancelled by user"
                            continue
                        fi
                    fi
                    
                    perform_uninstall
                    ;;
                    
                "View Logs")
                    view_service_logs
                    ;;
                    
                "Exit")
                    log_info "Exiting installer"
                    exit 0
                    ;;
                    
                *)
                    log_error "Invalid option selected"
                    ;;
            esac
            
            # Ask if user wants to continue
            if [[ "$TUI_MODE" == "text" ]]; then
                echo ""
                echo -n "Press Enter to return to main menu or Ctrl+C to exit: "
                read -r
            else
                tui_msgbox "Continue" "Press OK to return to main menu" 8 40
            fi
        done
    fi
}

# Run main function
main "$@"
