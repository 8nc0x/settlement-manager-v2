#!/bin/bash
# ==============================================================================
# SettleTrack - Automated Linux Server Deployment Script
# Run this script on your Linux VPS (Ubuntu/Debian) to build and launch SettleTrack
# ==============================================================================

set -e

echo "🚀 [1/5] Checking environment..."
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Creating from .env.example..."
  cp .env.example .env
  
  # Detect public IP if possible
  SERVER_IP=$(curl -s -4 ifconfig.me || curl -s icanhazip.com || hostname -I | awk '{print $1}')
  if [ -n "$SERVER_IP" ]; then
    echo "💡 Detected Server IP: $SERVER_IP"
    sed -i "s|YOUR_SERVER_IP|$SERVER_IP|g" .env
  fi
fi

echo "📦 [2/5] Installing production dependencies..."
npm install

echo "🌱 [3/5] Seeding credentials & ledger data..."
npm run seed

echo "🔨 [4/5] Building production Next.js bundle..."
npm run build

echo "✅ [5/5] SettleTrack is production ready!"
echo ""
echo "=============================================================================="
echo "To run with PM2 (Recommended for 24/7 background operation):"
echo "  sudo npm install -g pm2"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save && pm2 startup"
echo ""
echo "Or run directly:"
echo "  npm run start"
echo ""
echo "Ensure port 3001 is open on your firewall:"
echo "  sudo ufw allow 3001/tcp"
echo "=============================================================================="
