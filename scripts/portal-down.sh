#!/bin/bash

# Lab Portal Shutdown Script
# Stops the portal application cleanly

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

# Check if PM2 is available
check_pm2() {
    if command -v pm2 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Stop portal with PM2
stop_with_pm2() {
    log_info "Stopping portal with PM2..."
    
    if pm2 describe lab-portal > /dev/null 2>&1; then
        pm2 stop lab-portal
        pm2 delete lab-portal
        pm2 save
        log_success "Portal stopped with PM2"
        return 0
    else
        log_info "No PM2 process 'lab-portal' found"
        return 1
    fi
}

# Stop portal with PID file
stop_with_pid() {
    if [ ! -f "$PID_FILE" ]; then
        log_info "No PID file found at $PID_FILE"
        return 1
    fi
    
    local pid=$(cat "$PID_FILE")
    log_info "Stopping portal process (PID: $pid)..."
    
    if kill -0 "$pid" 2>/dev/null; then
        # Try graceful shutdown first
        kill -TERM "$pid" 2>/dev/null || true
        
        # Wait for graceful shutdown
        local count=0
        while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
            sleep 1
            ((count++))
        done
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "Process did not stop gracefully, forcing shutdown..."
            kill -KILL "$pid" 2>/dev/null || true
            sleep 1
        fi
        
        if kill -0 "$pid" 2>/dev/null; then
            log_error "Failed to stop process $pid"
            return 1
        else
            log_success "Portal process stopped"
        fi
    else
        log_warning "Process $pid is not running"
    fi
    
    # Remove PID file
    rm -f "$PID_FILE"
    return 0
}

# Find and stop portal processes
find_and_stop_processes() {
    log_info "Searching for portal processes..."
    
    local found=false
    
    # Look for Node.js processes running the portal
    local pids=$(pgrep -f "next start\|npm run start\|next-server" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        log_info "Found portal processes: $pids"
        for pid in $pids; do
            log_info "Stopping process $pid..."
            kill -TERM "$pid" 2>/dev/null || true
            sleep 2
            
            if kill -0 "$pid" 2>/dev/null; then
                log_warning "Process $pid did not stop gracefully, forcing shutdown..."
                kill -KILL "$pid" 2>/dev/null || true
            fi
        done
        found=true
    fi
    
    if [ "$found" = true ]; then
        log_success "Portal processes stopped"
        return 0
    else
        log_info "No portal processes found"
        return 1
    fi
}

# Check portal status
check_status() {
    echo "🔍 Lab Portal Status Check"
    echo "========================="
    echo ""
    
    local running=false
    
    # Check PM2
    if check_pm2; then
        if pm2 describe lab-portal > /dev/null 2>&1; then
            echo "PM2 Process: Running"
            pm2 describe lab-portal
            running=true
        else
            echo "PM2 Process: Not running"
        fi
    else
        echo "PM2: Not available"
    fi
    
    # Check PID file
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "PID File Process: Running (PID: $pid)"
            running=true
        else
            echo "PID File Process: Not running (stale PID file)"
        fi
    else
        echo "PID File: Not found"
    fi
    
    # Check for any portal processes
    local pids=$(pgrep -f "next start\|npm run start\|next-server" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "Other Portal Processes: Running (PIDs: $pids)"
        running=true
    else
        echo "Other Portal Processes: None found"
    fi
    
    # Check if portal is responding
    local port="${PORT:-3000}"
    if curl -s "http://localhost:$port/api/public/status/summary" > /dev/null 2>&1; then
        echo "Portal Response: Responding on port $port"
        running=true
    else
        echo "Portal Response: Not responding on port $port"
    fi
    
    echo ""
    if [ "$running" = true ]; then
        log_info "Portal appears to be running"
        return 0
    else
        log_info "Portal appears to be stopped"
        return 1
    fi
}

# Main shutdown process
main() {
    local command="${1:-stop}"
    
    case "$command" in
        "stop")
            echo "🛑 Lab Portal Shutdown Script"
            echo "============================="
            echo ""
            
            local stopped=false
            
            # Try PM2 first
            if check_pm2; then
                if stop_with_pm2; then
                    stopped=true
                fi
            fi
            
            # Try PID file
            if [ "$stopped" = false ]; then
                if stop_with_pid; then
                    stopped=true
                fi
            fi
            
            # Try finding processes
            if [ "$stopped" = false ]; then
                if find_and_stop_processes; then
                    stopped=true
                fi
            fi
            
            if [ "$stopped" = true ]; then
                log_success "Portal shutdown completed successfully"
                exit 0
            else
                log_info "No running portal processes found"
                exit 0
            fi
            ;;
        "status")
            check_status
            ;;
        "help"|"-h"|"--help")
            echo "Lab Portal Shutdown Script"
            echo "========================="
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  stop    - Stop the portal application (default)"
            echo "  status  - Check portal status"
            echo "  help    - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 stop"
            echo "  $0 status"
            ;;
        *)
            log_error "Unknown command: $command"
            echo ""
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
