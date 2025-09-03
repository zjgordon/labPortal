#!/bin/bash

# Simple test script to verify the smoke test script
# This doesn't run the actual tests, just validates the script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SMOKE_SCRIPT="$SCRIPT_DIR/control-smoke.sh"

echo "🧪 Testing Lab Portal Smoke Test Script"
echo "========================================"

# Check if smoke test script exists
if [ ! -f "$SMOKE_SCRIPT" ]; then
    echo "❌ Smoke test script not found: $SMOKE_SCRIPT"
    exit 1
fi

echo "✅ Smoke test script found"

# Check if it's executable
if [ ! -x "$SMOKE_SCRIPT" ]; then
    echo "❌ Smoke test script is not executable"
    exit 1
fi

echo "✅ Smoke test script is executable"

# Test help functionality
echo "📖 Testing help functionality..."
if "$SMOKE_SCRIPT" --help > /dev/null 2>&1; then
    echo "✅ Help functionality works"
else
    echo "❌ Help functionality failed"
    exit 1
fi

# Test syntax check
echo "🔍 Testing script syntax..."
if bash -n "$SMOKE_SCRIPT" 2>/dev/null; then
    echo "✅ Script syntax is valid"
else
    echo "❌ Script syntax errors found"
    exit 1
fi

# Check for required dependencies in script
echo "🔧 Checking for dependency checks..."
if grep -q "check_dependencies" "$SMOKE_SCRIPT"; then
    echo "✅ Dependency checking is implemented"
else
    echo "❌ Dependency checking not found"
    exit 1
fi

# Check for cleanup functionality
echo "🧹 Checking for cleanup functionality..."
if grep -q "cleanup" "$SMOKE_SCRIPT"; then
    echo "✅ Cleanup functionality is implemented"
else
    echo "❌ Cleanup functionality not found"
    exit 1
fi

echo ""
echo "🎉 All smoke test script validations passed!"
echo ""
echo "To run the actual smoke test:"
echo "  $SMOKE_SCRIPT"
echo ""
echo "To see all options:"
echo "  $SMOKE_SCRIPT --help"
