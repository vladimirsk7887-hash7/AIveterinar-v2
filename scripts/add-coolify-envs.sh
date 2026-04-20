#!/bin/bash

# Coolify Environment Variables Auto-Add Script
# ===============================================

API_TOKEN="1|vlOv1KAHztRm0THcn5ne6ujOVPF2LoRm1uFxEoBL385287a5"
COOLIFY_URL="http://188.225.87.99:8000"
APP_UUID="w4cwwc4wckc4gkoko8cgsks0"
ENV_FILE=".env.coolify"

echo "🚀 Adding environment variables to Coolify..."
echo ""

# Read .env.coolify and add each variable
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^#.* ]] && continue

    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)

    echo "➕ Adding: $key"

    # Try to add via API (endpoint might vary)
    response=$(curl -s -X POST \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"$key\",\"value\":\"$value\"}" \
        "$COOLIFY_URL/api/v1/applications/$APP_UUID/envs" 2>&1)

    if echo "$response" | grep -q "uuid\|success\|created"; then
        echo "   ✅ Success"
    else
        echo "   ⚠️  Response: $response"
    fi

    sleep 0.2
done < "$ENV_FILE"

echo ""
echo "✅ Done! Check Coolify UI to verify."
