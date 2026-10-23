#!/bin/bash
# ==============================================================================
# SettleTrack - Automated Nginx SSL Setup Script
# Usage: ./scripts/setup-ssl.sh <your-domain.com>
# Example: ./scripts/setup-ssl.sh settle.mycompany.com
# ==============================================================================

set -e

DOMAIN="${1:-169.58.239.109.sslip.io}"

echo "=============================================================================="
echo "🔒 SettleTrack SSL Setup for: $DOMAIN"
echo "=============================================================================="

# 1. Install certbot & python3-certbot-nginx if missing
if ! command -v certbot >/dev/null 2>&1; then
  echo "📦 Installing Certbot..."
  apt update -y && apt install -y certbot python3-certbot-nginx
fi

# 2. Create isolated Nginx reverse proxy block
echo "⚙️  Configuring Nginx reverse proxy..."
cat << EOF > /etc/nginx/sites-available/settletrack.conf
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 3. Enable site in Nginx
if [ ! -f /etc/nginx/sites-enabled/settletrack.conf ]; then
  ln -s /etc/nginx/sites-available/settletrack.conf /etc/nginx/sites-enabled/settletrack.conf
fi

# 4. Test Nginx syntax
echo "🔍 Testing Nginx syntax..."
nginx -t

# 5. Reload Nginx
echo "🔄 Reloading Nginx..."
systemctl reload nginx

# 6. Obtain official Let's Encrypt certificate
echo "📜 Generating Let's Encrypt SSL Certificate..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect

# 7. Update .env NEXTAUTH_URL to https://$DOMAIN
if [ -f .env ]; then
  echo "📝 Updating NEXTAUTH_URL to https://$DOMAIN..."
  sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"https://$DOMAIN\"|g" .env
fi

# 8. Restart SettleTrack cleanly in PM2
echo "🚀 Restarting SettleTrack with secure environment..."
pm2 restart settletrack

echo ""
echo "=============================================================================="
echo "🎉 SUCCESS! SettleTrack is now 100% SECURE with HTTPS & SSL!"
echo "Open in your browser: https://$DOMAIN"
echo "=============================================================================="
