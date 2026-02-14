#!/bin/bash
# Test if the board API is returning isFavorite field

echo "Testing board API..."
echo ""

# Try to fetch a board (you'll need to be authenticated)
response=$(curl -s http://localhost:8088/api/boards/board-product-launch)

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Check if isFavorite field exists
if echo "$response" | grep -q "isFavorite"; then
    echo "✅ isFavorite field is present in the response"
else
    echo "❌ isFavorite field is MISSING from the response"
fi
