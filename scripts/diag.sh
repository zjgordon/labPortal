#!/bin/bash

# Lab Portal Diagnostics Script
# Collects system information, validates environment, and packages diagnostics

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DIAG_DIR="${PROJECT_ROOT}/diag-${TIMESTAMP}"
DIAG_ARCHIVE="${PROJECT_ROOT}/diag-${TIMESTAMP}.tar.gz"
LOG_FILE="${DIAG_DIR}/diagnostics.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    if [ -f "$LOG_FILE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
    fi
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    if [ -f "$LOG_FILE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
    fi
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    if [ -f "$LOG_FILE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
    fi
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    if [ -f "$LOG_FILE" ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
    fi
}

# Create diagnostics directory
setup_diagnostics_dir() {
    echo -e "${BLUE}[INFO]${NC} Setting up diagnostics directory: $DIAG_DIR"
    mkdir -p "$DIAG_DIR"
    
    # Initialize log file
    echo "Lab Portal Diagnostics Report" > "$LOG_FILE"
    echo "Generated: $(date)" >> "$LOG_FILE"
    echo "=================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
}

# Get system and application versions
get_versions() {
    log_info "Collecting version information..."
    
    local versions_file="${DIAG_DIR}/versions.txt"
    
    {
        echo "=== System Information ==="
        echo "Date: $(date)"
        echo "Hostname: $(hostname)"
        echo "Uptime: $(uptime)"
        echo "OS: $(uname -a)"
        echo ""
        
        echo "=== Node.js Environment ==="
        echo "Node.js version: $(node --version 2>/dev/null || echo "Not installed")"
        echo "NPM version: $(npm --version 2>/dev/null || echo "Not installed")"
        echo ""
        
        echo "=== Application Version ==="
        if [ -f "$PROJECT_ROOT/package.json" ]; then
            echo "App version: $(node -p "require('$PROJECT_ROOT/package.json').version" 2>/dev/null || echo "Unknown")"
            echo "App name: $(node -p "require('$PROJECT_ROOT/package.json').name" 2>/dev/null || echo "Unknown")"
        else
            echo "package.json not found"
        fi
        echo ""
        
        echo "=== Agent Version ==="
        if [ -f "$PROJECT_ROOT/agent/package.json" ]; then
            echo "Agent version: $(node -p "require('$PROJECT_ROOT/agent/package.json').version" 2>/dev/null || echo "Unknown")"
            echo "Agent name: $(node -p "require('$PROJECT_ROOT/agent/package.json').name" 2>/dev/null || echo "Unknown")"
        else
            echo "Agent package.json not found"
        fi
        echo ""
        
        echo "=== Process Information ==="
        echo "Current user: $(whoami)"
        echo "Current directory: $(pwd)"
        echo "Shell: $SHELL"
        echo ""
        
    } > "$versions_file"
    
    log_success "Version information collected"
}

# Validate environment
validate_environment() {
    log_info "Validating environment..."
    
    local env_file="${DIAG_DIR}/environment.txt"
    
    {
        echo "=== Environment Validation ==="
        echo "Date: $(date)"
        echo ""
        
        # Check for environment files
        echo "Environment files:"
        if [ -f "$PROJECT_ROOT/.env" ]; then
            echo "  .env: Found"
        else
            echo "  .env: Not found"
        fi
        
        if [ -f "$PROJECT_ROOT/.env.local" ]; then
            echo "  .env.local: Found"
        else
            echo "  .env.local: Not found"
        fi
        echo ""
        
        # Load environment variables
        if [ -f "$PROJECT_ROOT/.env.local" ]; then
            set -a
            source "$PROJECT_ROOT/.env.local"
            set +a
        fi
        
        if [ -f "$PROJECT_ROOT/.env" ]; then
            set -a
            source "$PROJECT_ROOT/.env"
            set +a
        fi
        
        # Check required variables
        echo "Required environment variables:"
        local required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
        for var in "${required_vars[@]}"; do
            if [ -n "${!var:-}" ]; then
                echo "  $var: Set (${!var:0:20}...)"
            else
                echo "  $var: Not set"
            fi
        done
        echo ""
        
        # Validate DATABASE_URL format
        if [ -n "${DATABASE_URL:-}" ]; then
            if [[ "$DATABASE_URL" =~ ^(file:|sqlite://|postgresql://|mysql://) ]]; then
                echo "DATABASE_URL format: Valid"
            else
                echo "DATABASE_URL format: Invalid"
            fi
        fi
        
        # Validate NEXTAUTH_URL format
        if [ -n "${NEXTAUTH_URL:-}" ]; then
            if [[ "$NEXTAUTH_URL" =~ ^https?:// ]]; then
                echo "NEXTAUTH_URL format: Valid"
            else
                echo "NEXTAUTH_URL format: Invalid"
            fi
        fi
        echo ""
        
        # Try to validate with env.ts
        echo "TypeScript environment validation:"
        cd "$PROJECT_ROOT"
        if npm run typecheck > /dev/null 2>&1; then
            echo "  TypeScript compilation: Success"
        else
            echo "  TypeScript compilation: Failed"
        fi
        echo ""
        
    } > "$env_file"
    
    log_success "Environment validation completed"
}

# Check Prisma database status
check_prisma_status() {
    log_info "Checking Prisma database status..."
    
    local prisma_file="${DIAG_DIR}/prisma-status.txt"
    
    {
        echo "=== Prisma Database Status ==="
        echo "Date: $(date)"
        echo ""
        
        cd "$PROJECT_ROOT"
        
        # Check if Prisma is installed
        if command -v npx > /dev/null 2>&1; then
            echo "Prisma CLI: Available"
        else
            echo "Prisma CLI: Not available"
        fi
        echo ""
        
        # Check database file size (for SQLite)
        if [ -n "${DATABASE_URL:-}" ] && [[ "$DATABASE_URL" =~ ^file: ]]; then
            local db_file=$(echo "$DATABASE_URL" | sed 's/file://')
            if [ -f "$db_file" ]; then
                local db_size=$(du -h "$db_file" | cut -f1)
                echo "Database file: $db_file"
                echo "Database size: $db_size"
            else
                echo "Database file: Not found ($db_file)"
            fi
        else
            echo "Database type: Non-SQLite (PostgreSQL/MySQL)"
        fi
        echo ""
        
        # Check migration status
        echo "Migration status:"
        if npx prisma migrate status > /dev/null 2>&1; then
            npx prisma migrate status >> "$prisma_file" 2>&1 || true
        else
            echo "  Failed to check migration status"
        fi
        echo ""
        
        # Check if database is accessible
        echo "Database connectivity:"
        if npx prisma db pull --print > /dev/null 2>&1; then
            echo "  Database connection: Success"
        else
            echo "  Database connection: Failed"
        fi
        echo ""
        
    } > "$prisma_file"
    
    log_success "Prisma status check completed"
}

# Test API endpoints
test_api_endpoints() {
    log_info "Testing API endpoints..."
    
    local api_file="${DIAG_DIR}/api-tests.txt"
    local port="${PORT:-3000}"
    local base_url="http://localhost:$port"
    
    {
        echo "=== API Endpoint Tests ==="
        echo "Date: $(date)"
        echo "Base URL: $base_url"
        echo ""
        
        # Test endpoints
        local endpoints=(
            "/api/public/status/summary"
            "/healthz"
            "/readyz"
            "/api/control/diagnostics"
        )
        
        for endpoint in "${endpoints[@]}"; do
            local url="$base_url$endpoint"
            echo "Testing: $url"
            
            if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
                echo "  Status: Responding"
                local response=$(curl -s --max-time 5 "$url" 2>/dev/null || echo "Failed to get response")
                echo "  Response length: ${#response} characters"
            else
                echo "  Status: Not responding"
            fi
            echo ""
        done
        
    } > "$api_file"
    
    log_success "API endpoint tests completed"
}

# Collect recent logs
collect_logs() {
    log_info "Collecting recent logs..."
    
    local logs_dir="${DIAG_DIR}/logs"
    mkdir -p "$logs_dir"
    
    # Portal logs
    if [ -f "$PROJECT_ROOT/portal.log" ]; then
        log_info "Collecting portal logs..."
        tail -200 "$PROJECT_ROOT/portal.log" > "$logs_dir/portal.log" 2>/dev/null || true
    fi
    
    # Agent logs (if local)
    if [ -f "$PROJECT_ROOT/agent/agent.log" ]; then
        log_info "Collecting agent logs..."
        tail -200 "$PROJECT_ROOT/agent/agent.log" > "$logs_dir/agent.log" 2>/dev/null || true
    fi
    
    # System logs
    log_info "Collecting system logs..."
    journalctl -u lab-portal-agent --since "1 hour ago" --no-pager > "$logs_dir/systemd-agent.log" 2>/dev/null || true
    
    # NPM logs
    if [ -f "$PROJECT_ROOT/npm-debug.log" ]; then
        cp "$PROJECT_ROOT/npm-debug.log" "$logs_dir/" 2>/dev/null || true
    fi
    
    log_success "Log collection completed"
}

# Get admin diagnostics
get_admin_diagnostics() {
    log_info "Getting admin diagnostics..."
    
    local diag_file="${DIAG_DIR}/admin-diagnostics.txt"
    local port="${PORT:-3000}"
    local base_url="http://localhost:$port"
    
    {
        echo "=== Admin Diagnostics ==="
        echo "Date: $(date)"
        echo ""
        
        # Try to get diagnostics from admin endpoint
        local diagnostics_url="$base_url/api/control/diagnostics"
        
        if curl -s --max-time 10 "$diagnostics_url" > /dev/null 2>&1; then
            echo "Admin diagnostics endpoint: Responding"
            echo ""
            
            # Get the actual diagnostics data
            local response=$(curl -s --max-time 10 "$diagnostics_url" 2>/dev/null || echo "{}")
            
            # Parse and display key information
            echo "Action counts:"
            echo "$response" | jq -r '.actionCounts | to_entries[] | "  \(.key): \(.value)"' 2>/dev/null || echo "  Failed to parse action counts"
            echo ""
            
            echo "Host status:"
            echo "$response" | jq -r '.hosts[]? | "  \(.name): \(.isOnline) (last seen: \(.lastSeenAge)s ago)"' 2>/dev/null || echo "  Failed to parse host status"
            echo ""
            
            echo "Recent failures:"
            echo "$response" | jq -r '.recentFailures[]? | "  \(.host) - \(.service): \(.message)"' 2>/dev/null || echo "  No recent failures or failed to parse"
            echo ""
            
            echo "System information:"
            echo "$response" | jq -r '.system | "  Uptime: \(.uptime)s, Node: \(.nodeVersion), Platform: \(.platform)"' 2>/dev/null || echo "  Failed to parse system info"
            echo ""
            
        else
            echo "Admin diagnostics endpoint: Not responding"
            echo "This may be because:"
            echo "  - Portal is not running"
            echo "  - Authentication is required"
            echo "  - Endpoint is not available"
        fi
        
    } > "$diag_file"
    
    log_success "Admin diagnostics completed"
}

# Collect system information
collect_system_info() {
    log_info "Collecting system information..."
    
    local system_file="${DIAG_DIR}/system-info.txt"
    
    {
        echo "=== System Information ==="
        echo "Date: $(date)"
        echo ""
        
        echo "Memory usage:"
        free -h
        echo ""
        
        echo "Disk usage:"
        df -h
        echo ""
        
        echo "Process information:"
        ps aux | grep -E "(node|npm|next)" | grep -v grep || echo "No Node.js processes found"
        echo ""
        
        echo "Network connections:"
        netstat -tlnp 2>/dev/null | grep -E ":3000|:8080|:9000" || echo "No relevant network connections found"
        echo ""
        
        echo "Environment variables (relevant):"
        env | grep -E "(NODE|NPM|PORT|DATABASE|NEXTAUTH)" | sort
        echo ""
        
    } > "$system_file"
    
    log_success "System information collected"
}

# Package diagnostics
package_diagnostics() {
    log_info "Packaging diagnostics..."
    
    cd "$PROJECT_ROOT"
    
    if tar -czf "$DIAG_ARCHIVE" -C "$(dirname "$DIAG_DIR")" "$(basename "$DIAG_DIR")" 2>/dev/null; then
        log_success "Diagnostics packaged to: $DIAG_ARCHIVE"
        
        # Show archive contents
        log_info "Archive contents:"
        tar -tzf "$DIAG_ARCHIVE" | sed 's/^/  /'
        
        # Show archive size
        local archive_size=$(du -h "$DIAG_ARCHIVE" | cut -f1)
        log_info "Archive size: $archive_size"
        
    else
        log_error "Failed to create diagnostics archive"
        exit 1
    fi
}

# Cleanup
cleanup() {
    log_info "Cleaning up temporary files..."
    
    if [ -d "$DIAG_DIR" ]; then
        rm -rf "$DIAG_DIR"
        log_success "Temporary files cleaned up"
    fi
}

# Main diagnostics process
main() {
    echo "🔍 Lab Portal Diagnostics Script"
    echo "==============================="
    echo ""
    
    # Setup
    setup_diagnostics_dir
    
    # Collect information
    get_versions
    validate_environment
    check_prisma_status
    test_api_endpoints
    collect_logs
    get_admin_diagnostics
    collect_system_info
    
    # Package results
    package_diagnostics
    
    # Cleanup
    cleanup
    
    echo ""
    log_success "Diagnostics completed successfully!"
    echo ""
    echo "Diagnostics archive: $DIAG_ARCHIVE"
    echo "Archive size: $(du -h "$DIAG_ARCHIVE" | cut -f1)"
    echo ""
    echo "To extract and view:"
    echo "  tar -xzf $DIAG_ARCHIVE"
    echo "  cd diag-${TIMESTAMP}"
    echo ""
}

# Handle script interruption
cleanup_on_exit() {
    log_info "Script interrupted, cleaning up..."
    cleanup
    exit 1
}

# Set up signal handlers
trap cleanup_on_exit INT TERM

# Run main function
main "$@"
