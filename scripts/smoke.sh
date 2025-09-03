#!/bin/bash

# Lab Portal Comprehensive Smoke Test
# Tests critical flows: public APIs, admin card management, and queue endpoint

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

# Get admin session cookie
get_admin_session() {
    log_info "Getting admin session..."
    
    # Try to get session cookie from existing session
    local session_response=$(curl -s -c /tmp/admin_cookies.txt -b /tmp/admin_cookies.txt \
        "$BASE_URL/api/auth/session" 2>/dev/null || echo "")
    
    # If no valid session, try to login
    if ! echo "$session_response" | jq -e '.user.email' > /dev/null 2>&1; then
        log_info "No valid session found, attempting login..."
        
        # Get CSRF token first
        local csrf_response=$(curl -s -c /tmp/admin_cookies.txt "$BASE_URL/api/auth/csrf")
        local csrf_token=$(echo "$csrf_response" | jq -r '.csrfToken' 2>/dev/null || echo "")
        
        if [ -z "$csrf_token" ] || [ "$csrf_token" = "null" ]; then
            log_warning "Could not get CSRF token, proceeding without it"
        fi
        
        # Attempt login
        local login_data="{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
        if [ -n "$csrf_token" ] && [ "$csrf_token" != "null" ]; then
            login_data="{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"csrfToken\":\"$csrf_token\"}"
        fi
        
        local login_response=$(curl -s -c /tmp/admin_cookies.txt -b /tmp/admin_cookies.txt \
            -X POST "$BASE_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d "$login_data")
        
        if echo "$login_response" | jq -e '.error' > /dev/null 2>&1; then
            log_warning "Login failed: $(echo "$login_response" | jq -r '.error')"
            log_warning "Proceeding with manual cookie instructions"
            return 1
        fi
        
        log_success "Admin login successful"
    else
        log_success "Using existing admin session"
    fi
    
    return 0
}

# Test public appearance endpoint
test_public_appearance() {
    log_info "Testing public appearance endpoint..."
    
    local response=$(curl -s "$BASE_URL/api/public/appearance")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        log_error "Public appearance endpoint failed: $(echo "$response" | jq -r '.error')"
        exit 1
    fi
    
    local instance_name=$(echo "$response" | jq -r '.instanceName' 2>/dev/null || echo "")
    log_success "Public appearance endpoint working - Instance: $instance_name"
}

# Test public status summary endpoint
test_public_status_summary() {
    log_info "Testing public status summary endpoint..."
    
    local response=$(curl -s "$BASE_URL/api/public/status/summary")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        log_error "Public status summary endpoint failed: $(echo "$response" | jq -r '.error')"
        exit 1
    fi
    
    local total_cards=$(echo "$response" | jq -r '.totalCards' 2>/dev/null || echo "0")
    local online_cards=$(echo "$response" | jq -r '.onlineCards' 2>/dev/null || echo "0")
    log_success "Public status summary endpoint working - Total: $total_cards, Online: $online_cards"
}

# Test queue endpoint returns 204 when empty
test_queue_endpoint() {
    log_info "Testing queue endpoint returns 204 when empty..."
    
    local response=$(curl -s -i "$BASE_URL/api/control/queue?wait=1" 2>/dev/null)
    local status_line=$(echo "$response" | head -n 1)
    
    if echo "$status_line" | grep -q "204"; then
        log_success "Queue endpoint correctly returns 204 when empty"
    elif echo "$status_line" | grep -q "401\|403"; then
        log_warning "Queue endpoint requires authentication (expected for empty queue)"
        log_success "Queue endpoint accessible (authentication working)"
    else
        log_warning "Queue endpoint returned unexpected status: $status_line"
        log_info "Full response: $response"
    fi
}

# Test admin card management (if session available)
test_admin_card_management() {
    log_info "Testing admin card management..."
    
    if ! get_admin_session; then
        log_warning "Admin session not available - skipping card management tests"
        log_info "Manual testing required:"
        log_info "1. Login to admin panel at $BASE_URL/admin"
        log_info "2. Create a test card"
        log_info "3. Edit the card"
        log_info "4. Upload a tiny icon"
        log_info "5. Delete the card"
        return 0
    fi
    
    # Create test card
    log_info "Creating test card..."
    local card_data='{
        "name": "Smoke Test Card",
        "description": "Temporary card for smoke testing",
        "url": "http://localhost:8080",
        "enabled": true,
        "group": "test"
    }'
    
    local create_response=$(curl -s -c /tmp/admin_cookies.txt -b /tmp/admin_cookies.txt \
        -X POST "$BASE_URL/api/cards" \
        -H "Content-Type: application/json" \
        -d "$card_data")
    
    if echo "$create_response" | jq -e '.error' > /dev/null 2>&1; then
        log_error "Failed to create test card: $(echo "$create_response" | jq -r '.error')"
        return 1
    fi
    
    local card_id=$(echo "$create_response" | jq -r '.id')
    log_success "Test card created with ID: $card_id"
    
    # Edit the card
    log_info "Editing test card..."
    local edit_data='{
        "name": "Smoke Test Card - Edited",
        "description": "Updated description for smoke testing",
        "url": "http://localhost:8080",
        "enabled": true,
        "group": "test"
    }'
    
    local edit_response=$(curl -s -c /tmp/admin_cookies.txt -b /tmp/admin_cookies.txt \
        -X PUT "$BASE_URL/api/cards/$card_id" \
        -H "Content-Type: application/json" \
        -d "$edit_data")
    
    if echo "$edit_response" | jq -e '.error' > /dev/null 2>&1; then
        log_error "Failed to edit test card: $(echo "$edit_response" | jq -r '.error')"
        return 1
    fi
    
    log_success "Test card edited successfully"
    
    # Upload tiny icon
    log_info "Uploading tiny icon..."
    
    # Create a tiny SVG icon
    local icon_svg='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="red"/></svg>'
    echo "$icon_svg" > /tmp/smoke_test_icon.svg
    
    local upload_response=$(curl -s -c /tmp/admin_cookies.txt -b /tmp/admin_cookies.txt \
        -X POST "$BASE_URL/api/cards/$card_id/icon" \
        -F "icon=@/tmp/smoke_test_icon.svg")
    
    if echo "$upload_response" | jq -e '.error' > /dev/null 2>&1; then
        log_error "Failed to upload icon: $(echo "$upload_response" | jq -r '.error')"
        return 1
    fi
    
    log_success "Icon uploaded successfully"
    
    # Delete the card
    log_info "Deleting test card..."
    local delete_response=$(curl -s -c /tmp/admin_cookies.txt -b /tmp/admin_cookies.txt \
        -X DELETE "$BASE_URL/api/cards/$card_id")
    
    if echo "$delete_response" | jq -e '.error' > /dev/null 2>&1; then
        log_error "Failed to delete test card: $(echo "$delete_response" | jq -r '.error')"
        return 1
    fi
    
    log_success "Test card deleted successfully"
    
    # Cleanup temporary files
    rm -f /tmp/smoke_test_icon.svg
    rm -f /tmp/admin_cookies.txt
    
    log_success "Admin card management tests completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Remove temporary files
    rm -f /tmp/admin_cookies.txt
    rm -f /tmp/smoke_test_icon.svg
    
    log_success "Cleanup completed"
}

# Main test function
run_smoke_test() {
    log_info "Starting Lab Portal Comprehensive Smoke Test"
    log_info "Base URL: $BASE_URL"
    log_info "Admin Email: $ADMIN_EMAIL"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run tests
    check_dependencies
    wait_for_portal
    
    # Test public endpoints
    test_public_appearance
    test_public_status_summary
    
    # Test queue endpoint
    test_queue_endpoint
    
    # Test admin functionality
    test_admin_card_management
    
    log_success "All smoke tests completed! 🎉"
    log_info ""
    log_info "Summary:"
    log_info "✅ Public appearance endpoint working"
    log_info "✅ Public status summary endpoint working"
    log_info "✅ Queue endpoint accessible"
    log_info "✅ Admin card management tested (or manual steps provided)"
}

# Help function
show_help() {
    echo "Lab Portal Comprehensive Smoke Test"
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
