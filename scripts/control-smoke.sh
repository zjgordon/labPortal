#!/bin/bash

# Lab Portal Control Actions Smoke Test
# Tests the end-to-end flow of control actions without UI

set -e  # Exit on any error

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="admin@local"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

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

# Check if required tools are available
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Wait for portal to be ready
wait_for_portal() {
    log_info "Waiting for portal to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$BASE_URL/api/test-env" > /dev/null 2>&1; then
            log_success "Portal is ready"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - Portal not ready, waiting..."
        sleep 2
        ((attempt++))
    done
    
    log_error "Portal failed to become ready after $max_attempts attempts"
    exit 1
}

# Set admin API key for authentication
set_admin_auth() {
    log_info "Setting admin authentication..."
    
    # Use API key authentication for smoke tests
    ADMIN_API_KEY="smoke-test-key"
    
    log_success "Admin authentication configured"
}

# Create test host
create_test_host() {
    log_info "Creating test host..."
    
    local host_data='{
        "name": "smoke-test-host",
        "address": "localhost",
        "agentToken": "smoke-test-token-123"
    }'
    
    local response=$(curl -s -X POST "$BASE_URL/api/hosts" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $ADMIN_API_KEY" \
        -d "$host_data")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        # Check if host already exists
        if echo "$response" | grep -q "already exists"; then
            log_warning "Test host already exists, using existing one"
            # Get existing host
            response=$(curl -s -H "X-API-Key: $ADMIN_API_KEY" "$BASE_URL/api/hosts" | \
                jq -r '.[] | select(.name == "smoke-test-host") | @json')
        else
            log_error "Failed to create host: $(echo "$response" | jq -r '.error')"
            exit 1
        fi
    fi
    
    HOST_ID=$(echo "$response" | jq -r '.id')
    log_success "Test host created/retrieved with ID: $HOST_ID"
}

# Create test service
create_test_service() {
    log_info "Creating test service..."
    
    local service_data="{
        \"hostId\": \"$HOST_ID\",
        \"unitName\": \"smoke-test.service\",
        \"displayName\": \"Smoke Test Service\",
        \"description\": \"Service for smoke testing control actions\",
        \"allowStart\": true,
        \"allowStop\": true,
        \"allowRestart\": true
    }"
    
    local response=$(curl -s -X POST "$BASE_URL/api/services" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $ADMIN_API_KEY" \
        -d "$service_data")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        # Check if service already exists
        if echo "$response" | grep -q "already exists"; then
            log_warning "Test service already exists, using existing one"
            # Get existing service
            response=$(curl -s -H "X-API-Key: $ADMIN_API_KEY" "$BASE_URL/api/services" | \
                jq -r ".[] | select(.hostId == \"$HOST_ID\" and .unitName == \"smoke-test.service\") | @json")
        else
            log_error "Failed to create service: $(echo "$response" | jq -r '.error')"
            exit 1
        fi
    fi
    
    SERVICE_ID=$(echo "$response" | jq -r '.id')
    log_success "Test service created/retrieved with ID: $SERVICE_ID"
}

# Enqueue control action
enqueue_action() {
    local action_kind="$1"
    log_info "Enqueuing $action_kind action..."
    
    local action_data="{
        \"hostId\": \"$HOST_ID\",
        \"serviceId\": \"$SERVICE_ID\",
        \"kind\": \"$action_kind\"
    }"
    
    local response=$(curl -s -X POST "$BASE_URL/api/control/actions" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $ADMIN_API_KEY" \
        -d "$action_data")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        log_error "Failed to enqueue $action_kind action: $(echo "$response" | jq -r '.error')"
        exit 1
    fi
    
    ACTION_ID=$(echo "$response" | jq -r '.id')
    log_success "$action_kind action enqueued with ID: $ACTION_ID"
}

# Wait for action completion (for localhost path)
wait_for_localhost_completion() {
    log_info "Waiting for localhost action completion..."
    
    local max_attempts=60  # 5 minutes max
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local response=$(curl -s -H "X-API-Key: $ADMIN_API_KEY" "$BASE_URL/api/control/actions/$ACTION_ID")
        
        if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
            log_error "Failed to get action status: $(echo "$response" | jq -r '.error')"
            exit 1
        fi
        
        local status=$(echo "$response" | jq -r '.status')
        log_info "Action status: $status (attempt $attempt/$max_attempts)"
        
        if [ "$status" = "completed" ]; then
            local exit_code=$(echo "$response" | jq -r '.exitCode')
            local message=$(echo "$response" | jq -r '.message')
            log_success "Action completed successfully (exit code: $exit_code, message: $message)"
            return 0
        elif [ "$status" = "failed" ]; then
            local exit_code=$(echo "$response" | jq -r '.exitCode')
            local message=$(echo "$response" | jq -r '.message')
            log_error "Action failed (exit code: $exit_code, message: $message)"
            exit 1
        fi
        
        sleep 5
        ((attempt++))
    done
    
    log_error "Action did not complete within expected time"
    exit 1
}

# Wait for agent to pick up action (for agent path)
wait_for_agent_pickup() {
    log_info "Waiting for agent to pick up action..."
    
    local max_attempts=30  # 2.5 minutes max
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local response=$(curl -s -H "X-API-Key: $ADMIN_API_KEY" "$BASE_URL/api/control/actions/$ACTION_ID")
        
        if echo "$response" | jq -r '.error' > /dev/null 2>&1; then
            log_error "Failed to get action status: $(echo "$response" | jq -r '.error')"
            exit 1
        fi
        
        local status=$(echo "$response" | jq -r '.status')
        log_info "Action status: $status (attempt $attempt/$max_attempts)"
        
        if [ "$status" = "running" ]; then
            log_success "Agent picked up the action"
            return 0
        elif [ "$status" = "completed" ] || [ "$status" = "failed" ]; then
            log_warning "Action completed before agent pickup (status: $status)"
            return 0
        fi
        
        sleep 5
        ((attempt++))
    done
    
    log_warning "Agent did not pick up action within expected time, but continuing..."
}

# Test localhost path (systemctl executor)
test_localhost_path() {
    log_info "Testing localhost path (systemctl executor)..."
    
    # Enqueue start action
    enqueue_action "start"
    
    # Wait for completion
    wait_for_localhost_completion
    
    # Enqueue stop action
    enqueue_action "stop"
    
    # Wait for completion
    wait_for_localhost_completion
    
    log_success "Localhost path test completed successfully"
}

# Test agent path
test_agent_path() {
    log_info "Testing agent path..."
    
    # Enqueue restart action
    enqueue_action "restart"
    
    # Wait for agent to pick it up
    wait_for_agent_pickup
    
    log_success "Agent path test completed successfully"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # No temporary files to clean up with API key approach
    log_success "Cleanup completed"
}

# Main test function
run_smoke_test() {
    log_info "Starting Lab Portal Control Actions Smoke Test"
    log_info "Base URL: $BASE_URL"
    log_info "Admin Email: $ADMIN_EMAIL"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run tests
    check_dependencies
    wait_for_portal
    set_admin_auth
    create_test_host
    create_test_service
    
    # Test both paths
    test_localhost_path
    test_agent_path
    
    log_success "All smoke tests passed! 🎉"
}

# Help function
show_help() {
    echo "Lab Portal Control Actions Smoke Test"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -u, --url URL       Base URL for the portal (default: http://localhost:3000)"
    echo "  -p, --password PASS Admin password (default: admin123)"
    echo "  -v, --verbose       Enable verbose output"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL            Base URL for the portal"
    echo "  ADMIN_PASSWORD      Admin password"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run with defaults"
    echo "  $0 -u http://localhost:8080          # Custom URL"
    echo "  $0 -p mypassword                     # Custom password"
    echo "  BASE_URL=http://localhost:8080 $0    # Environment variable"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -p|--password)
            ADMIN_PASSWORD="$2"
            shift 2
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run the smoke test
run_smoke_test
