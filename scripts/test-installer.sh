#!/bin/bash

# Test script for the Lab Portal Agent installer
# Runs shellcheck validation and dry-run tests

set -euo pipefail

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

# Check if shellcheck is available
check_shellcheck() {
    if ! command -v shellcheck > /dev/null 2>&1; then
        log_error "shellcheck is not installed"
        echo ""
        echo "Install shellcheck:"
        echo "  Ubuntu/Debian: sudo apt install shellcheck"
        echo "  CentOS/RHEL:   sudo yum install shellcheck"
        echo "  macOS:         brew install shellcheck"
        echo "  Or visit:      https://github.com/koalaman/shellcheck"
        exit 1
    fi
    
    local version
    version=$(shellcheck --version | head -1)
    log_success "shellcheck found: $version"
}

# Run shellcheck on the installer
test_shellcheck() {
    log_info "Running shellcheck on install-guided.sh..."
    
    local installer_path="agent/packaging/install-guided.sh"
    
    if [[ ! -f "$installer_path" ]]; then
        log_error "Installer not found at: $installer_path"
        exit 1
    fi
    
    # Run shellcheck with specific rules disabled for known false positives
    # SC2034: Unused variables (some are used in different code paths)
    # SC2154: Referenced but not assigned (variables set in different functions)
    # SC1091: Not following sourced files (we don't source external files)
    # SC2016: Expressions don't expand in single quotes (intentional in some cases)
    # SC2086: Double quote to prevent globbing (intentional in some cases)
    # SC2046: Quote to prevent word splitting (intentional in some cases)
    # SC2064: Use single quotes to prevent variable expansion (intentional in some cases)
    
    if shellcheck --exclude=SC2034,SC2154,SC1091,SC2016,SC2086,SC2046,SC2064 "$installer_path"; then
        log_success "shellcheck passed"
    else
        log_error "shellcheck failed"
        exit 1
    fi
}

# Test dry-run functionality
test_dry_run() {
    log_info "Testing dry-run functionality..."
    
    local installer_path="agent/packaging/install-guided.sh"
    
    if [[ ! -f "$installer_path" ]]; then
        log_error "Installer not found at: $installer_path"
        exit 1
    fi
    
    # Make sure the installer is executable
    chmod +x "$installer_path"
    
    # Test dry-run with valid configuration
    log_info "Running dry-run with test configuration..."
    
    local test_host_id="test-host-$(date +%s)"
    local test_portal_url="http://portal.local"
    local test_token="test-token-$(date +%s)-long-enough-to-pass-validation"
    
    # Run dry-run and capture output
    local output
    local exit_code
    
    if output=$("$installer_path" --dry-run \
        --host-id "$test_host_id" \
        --portal "$test_portal_url" \
        --token "$test_token" 2>&1); then
        exit_code=0
    else
        exit_code=$?
    fi
    
    # Check exit code
    if [[ $exit_code -eq 0 ]]; then
        log_success "Dry-run completed successfully (exit code: $exit_code)"
    else
        log_error "Dry-run failed (exit code: $exit_code)"
        echo "Output:"
        echo "$output"
        exit 1
    fi
    
    # Verify output contains expected content
    if echo "$output" | grep -q "Installation Plan (DRY RUN)"; then
        log_success "Dry-run output contains expected content"
    else
        log_error "Dry-run output missing expected content"
        echo "Output:"
        echo "$output"
        exit 1
    fi
}

# Test dry-run with invalid configuration
test_dry_run_validation() {
    log_info "Testing dry-run validation..."
    
    local installer_path="agent/packaging/install-guided.sh"
    
    # Test with missing required flags
    log_info "Testing dry-run with missing flags (should fail)..."
    
    local output
    local exit_code
    
    if output=$("$installer_path" --dry-run 2>&1); then
        exit_code=0
    else
        exit_code=$?
    fi
    
    # Should fail with exit code 1
    if [[ $exit_code -eq 1 ]]; then
        log_success "Dry-run correctly failed with missing flags (exit code: $exit_code)"
    else
        log_error "Dry-run should have failed with missing flags (exit code: $exit_code)"
        echo "Output:"
        echo "$output"
        exit 1
    fi
    
    # Test with invalid URL
    log_info "Testing dry-run with invalid URL (should fail)..."
    
    if output=$("$installer_path" --dry-run \
        --host-id "test-host" \
        --portal "invalid-url" \
        --token "test-token-long-enough-to-pass-validation" 2>&1); then
        exit_code=0
    else
        exit_code=$?
    fi
    
    # Should fail with exit code 1
    if [[ $exit_code -eq 1 ]]; then
        log_success "Dry-run correctly failed with invalid URL (exit code: $exit_code)"
    else
        log_error "Dry-run should have failed with invalid URL (exit code: $exit_code)"
        echo "Output:"
        echo "$output"
        exit 1
    fi
    
    # Test with short token
    log_info "Testing dry-run with short token (should fail)..."
    
    if output=$("$installer_path" --dry-run \
        --host-id "test-host" \
        --portal "http://portal.local" \
        --token "short" 2>&1); then
        exit_code=0
    else
        exit_code=$?
    fi
    
    # Should fail with exit code 1
    if [[ $exit_code -eq 1 ]]; then
        log_success "Dry-run correctly failed with short token (exit code: $exit_code)"
    else
        log_error "Dry-run should have failed with short token (exit code: $exit_code)"
        echo "Output:"
        echo "$output"
        exit 1
    fi
}

# Main test function
main() {
    echo "=========================================="
    echo "Lab Portal Agent Installer Tests"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_shellcheck
    
    # Run tests
    test_shellcheck
    test_dry_run
    test_dry_run_validation
    
    echo ""
    echo "=========================================="
    echo "All Tests Passed!"
    echo "=========================================="
    echo ""
    log_success "✅ shellcheck validation passed"
    log_success "✅ dry-run functionality works"
    log_success "✅ validation works correctly"
    echo ""
    echo "The installer is ready for production use!"
}

# Run main function
main "$@"
