#!/bin/bash

# Lab Portal Startup Script
# Validates environment, runs migrations, and starts the portal application

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_ROOT}/portal.log"
PID_FILE="${PROJECT_ROOT}/portal.pid"

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

# Check if portal is already running
check_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "Portal appears to be already running (PID: $pid)"
            log_info "Use 'scripts/portal-down.sh' to stop it first"
            exit 1
        else
            log_info "Removing stale PID file"
            rm -f "$PID_FILE"
        fi
    fi
}

# Validate environment variables
validate_environment() {
    log_info "Validating environment variables..."
    
    cd "$PROJECT_ROOT"
    
    # Check if required environment files exist
    if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
        log_error "No environment file found (.env or .env.local)"
        log_info "Please create a .env file with required configuration"
        exit 1
    fi
    
    # Load environment variables from .env files
    if [ -f ".env.local" ]; then
        set -a
        source .env.local
        set +a
    fi
    
    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    fi
    
    # Basic environment validation
    local required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_info "Please check your .env files and ensure all required variables are set"
        exit 1
    fi
    
    # Validate DATABASE_URL format
    if [[ ! "$DATABASE_URL" =~ ^(file:|sqlite://|postgresql://|mysql://) ]]; then
        log_error "Invalid DATABASE_URL format"
        log_info "DATABASE_URL should start with file:, sqlite://, postgresql://, or mysql://"
        exit 1
    fi
    
    # Validate NEXTAUTH_URL format
    if [[ ! "$NEXTAUTH_URL" =~ ^https?:// ]]; then
        log_error "Invalid NEXTAUTH_URL format"
        log_info "NEXTAUTH_URL should start with http:// or https://"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    if ! npm run prisma:migrate > /dev/null 2>&1; then
        log_error "Database migrations failed"
        log_info "Check the migration logs for details"
        exit 1
    fi
    
    log_success "Database migrations completed"
}

# Check if PM2 is available
check_pm2() {
    if command -v pm2 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start portal with PM2
start_with_pm2() {
    log_info "Starting portal with PM2..."
    
    cd "$PROJECT_ROOT"
    
    # Check if PM2 process already exists
    if pm2 describe lab-portal > /dev/null 2>&1; then
        log_warning "PM2 process 'lab-portal' already exists"
        log_info "Stopping existing process..."
        pm2 stop lab-portal
        pm2 delete lab-portal
    fi
    
    # Start with PM2
    pm2 start npm --name "lab-portal" -- start
    pm2 save
    
    # Get PM2 process info
    local pm2_pid=$(pm2 jlist | jq -r '.[] | select(.name=="lab-portal") | .pid')
    echo "$pm2_pid" > "$PID_FILE"
    
    log_success "Portal started with PM2 (PID: $pm2_pid)"
}

# Start portal with npm
start_with_npm() {
    log_info "Starting portal with npm..."
    
    cd "$PROJECT_ROOT"
    
    # Start in background and capture PID
    nohup npm run start > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    # Wait a moment and check if process is still running
    sleep 3
    if kill -0 "$pid" 2>/dev/null; then
        log_success "Portal started with npm (PID: $pid)"
    else
        log_error "Portal failed to start"
        log_info "Check the log file: $LOG_FILE"
        rm -f "$PID_FILE"
        exit 1
    fi
}

# Wait for portal to be ready
wait_for_portal() {
    log_info "Waiting for portal to be ready..."
    
    local max_attempts=30
    local attempt=1
    local port="${PORT:-3000}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port/api/public/status/summary" > /dev/null 2>&1; then
            log_success "Portal is ready and responding"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for portal..."
        sleep 2
        ((attempt++))
    done
    
    log_error "Portal failed to become ready within expected time"
    log_info "Check the log file: $LOG_FILE"
    return 1
}

# Display portal URLs
show_urls() {
    local port="${PORT:-3000}"
    local host="${HOST:-localhost}"
    
    echo ""
    log_success "🚀 Lab Portal is now running!"
    echo ""
    echo "Portal URLs:"
    echo "  Main Portal:    http://$host:$port"
    echo "  Admin Panel:    http://$host:$port/admin"
    echo "  Public API:     http://$host:$port/api/public/status/summary"
    echo "  Diagnostics:    http://$host:$port/api/control/diagnostics"
    echo ""
    echo "Useful Commands:"
    echo "  Stop Portal:    scripts/portal-down.sh"
    echo "  View Logs:      tail -f $LOG_FILE"
    echo "  Check Status:   scripts/portal-down.sh status"
    echo ""
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        echo "Process ID: $pid"
    fi
}

# Main startup process
main() {
    echo "🚀 Lab Portal Startup Script"
    echo "============================"
    echo ""
    
    # Check if already running
    check_running
    
    # Validate environment
    validate_environment
    
    # Run migrations
    run_migrations
    
    # Start portal
    if check_pm2; then
        start_with_pm2
    else
        log_info "PM2 not available, using npm"
        start_with_npm
    fi
    
    # Wait for portal to be ready
    if wait_for_portal; then
        show_urls
        log_success "Portal startup completed successfully"
        exit 0
    else
        log_error "Portal startup failed"
        exit 1
    fi
}

# Handle script interruption
cleanup() {
    log_info "Startup interrupted, cleaning up..."
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
    fi
    exit 1
}

# Set up signal handlers
trap cleanup INT TERM

# Run main function
main "$@"
