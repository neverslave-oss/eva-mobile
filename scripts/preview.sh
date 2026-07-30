#!/bin/bash
# Preview script: start Expo if not running, open Cloudflare tunnel
set -e

APP_PORT=8081

# Check if Expo is already running
if curl -sf "http://localhost:$APP_PORT/status" > /dev/null 2>&1; then
  echo "✅ Expo already running on port $APP_PORT"
else
  echo "Starting Expo..."
  npx expo start --web &
  EXPO_PID=$!
  echo "⏳ Waiting for Expo to be ready..."
  for i in $(seq 1 15); do
    if curl -sf "http://localhost:$APP_PORT/status" > /dev/null 2>&1; then
      echo "✅ Expo ready"
      break
    fi
    sleep 2
  done
fi

echo "Opening Cloudflare tunnel..."
cloudflared tunnel --url "http://localhost:$APP_PORT"
