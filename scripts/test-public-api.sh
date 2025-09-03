#!/bin/bash

# Test script for public API endpoints
# Usage: ./test-public-api.sh [base_url] [token]

BASE_URL=${1:-"http://localhost:3000"}
TOKEN=${2:-"your-public-readonly-token-here"}

echo "Testing public API endpoints at $BASE_URL"
echo "Using token: $TOKEN"
echo ""

# Test 1: Public cards endpoint
echo "1. Testing GET /api/public/cards"
echo "   With query parameter:"
curl -s "$BASE_URL/api/public/cards?token=$TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/public/cards?token=$TOKEN"
echo ""
echo "   With Authorization header:"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/public/cards" | jq '.' 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/public/cards"
echo ""

# Test 2: Public status summary endpoint
echo "2. Testing GET /api/public/status/summary"
echo "   With query parameter:"
curl -s "$BASE_URL/api/public/status/summary?token=$TOKEN" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/public/status/summary?token=$TOKEN"
echo ""
echo "   With Authorization header:"
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/public/status/summary" | jq '.' 2>/dev/null || curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/public/status/summary"
echo ""

# Test 3: Public status history endpoint (requires a valid cardId)
echo "3. Testing GET /api/public/status/history"
echo "   Note: This requires a valid cardId from the cards endpoint"
echo "   Example: curl '$BASE_URL/api/public/status/history?token=$TOKEN&cardId=YOUR_CARD_ID&range=24h'"
echo ""

# Test 4: Test without token (should fail)
echo "4. Testing without token (should fail):"
curl -s "$BASE_URL/api/public/cards" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/public/cards"
echo ""

# Test 5: Test with invalid token (should fail)
echo "5. Testing with invalid token (should fail):"
curl -s "$BASE_URL/api/public/cards?token=invalid-token" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/public/cards?token=invalid-token"
echo ""

# Test 6: Test with cookies (should fail)
echo "6. Testing with cookies (should fail):"
curl -s -H "Cookie: test=value" "$BASE_URL/api/public/cards?token=$TOKEN" | jq '.' 2>/dev/null || curl -s -H "Cookie: test=value" "$BASE_URL/api/public/cards?token=$TOKEN"
echo ""

echo "Public API testing complete!"
echo ""
echo "To test with a specific cardId for history:"
echo "1. First get a cardId from the cards endpoint"
echo "2. Then test: curl '$BASE_URL/api/public/status/history?token=$TOKEN&cardId=YOUR_CARD_ID&range=24h'"
