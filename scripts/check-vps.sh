#!/bin/bash
# ==============================================================================
# SettleTrack — Safe Read-Only VPS Diagnostic & Port Inspector
# This script is 100% READ-ONLY. It modifies NO files and stops NO processes.
# It checks your system specs, existing processes, and port 3001 availability.
# ==============================================================================

echo "=============================================================================="
echo "          🔍 LINUX VPS PRE-FLIGHT SYSTEM & PORT DIAGNOSTIC"
echo "=============================================================================="
echo "Date / Time: $(date)"
echo ""

# 1. Operating System & Kernel
echo "--- [1] OS & SYSTEM INFO ---"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  echo "OS:            $PRETTY_NAME"
else
  echo "OS:            $(uname -s)"
fi
echo "Kernel:        $(uname -r)"
echo "Architecture:  $(uname -m)"
echo "Uptime:        $(uptime -p 2>/dev/null || uptime)"
echo ""

# 2. Public & Local IP Detection
echo "--- [2] NETWORK & IP ADDRESSES ---"
PUBLIC_IP=$(curl -s -4 --max-time 3 ifconfig.me 2>/dev/null || curl -s --max-time 3 icanhazip.com 2>/dev/null || echo "Unable to detect public IP")
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "Public IP:     $PUBLIC_IP"
echo "Local / LAN:   ${LOCAL_IP:-N/A}"
echo ""

# 3. Hardware Resources (RAM, CPU, Disk)
echo "--- [3] HARDWARE & STORAGE ---"
echo "CPU Cores:     $(nproc 2>/dev/null || echo 'Unknown')"
echo "Memory (RAM):"
free -h 2>/dev/null || free -m
echo ""
echo "Disk Usage (Root /):"
df -h / 2>/dev/null | grep -v 'Filesystem' | awk '{print "Total: "$2" | Used: "$3" ("$5") | Available: "$4}'
echo ""

# 4. Runtimes & Package Managers Installed
echo "--- [4] INSTALLED RUNTIMES & TOOLS ---"
command -v node >/dev/null 2>&1 && echo "Node.js:       $(node -v)" || echo "Node.js:       NOT INSTALLED"
command -v npm >/dev/null 2>&1 && echo "npm:           v$(npm -v)" || echo "npm:           NOT INSTALLED"
command -v pm2 >/dev/null 2>&1 && echo "PM2:           v$(pm2 -v)" || echo "PM2:           NOT INSTALLED"
command -v git >/dev/null 2>&1 && echo "Git:           $(git --version)" || echo "Git:           NOT INSTALLED"
command -v docker >/dev/null 2>&1 && echo "Docker:        $(docker -v)" || echo "Docker:        NOT INSTALLED"
command -v nginx >/dev/null 2>&1 && echo "Nginx:         INSTALLED ($(nginx -v 2>&1))" || echo "Nginx:         NOT INSTALLED"
echo ""

# 5. Currently Running PM2 Applications (if any)
echo "--- [5] EXISTING PM2 PROCESSES ---"
if command -v pm2 >/dev/null 2>&1; then
  pm2 list 2>/dev/null || echo "PM2 daemon is not running."
else
  echo "PM2 is not installed."
fi
echo ""

# 6. Specific Check for Port 3001 & Port 3000
echo "--- [6] PORT 3001 & 3000 AVAILABILITY CHECK ---"
PORT_3001_IN_USE=false
PORT_3000_IN_USE=false

if command -v ss >/dev/null 2>&1; then
  CHECK_3001=$(ss -tuln 2>/dev/null | grep ':3001 ')
  CHECK_3000=$(ss -tuln 2>/dev/null | grep ':3000 ')
elif command -v netstat >/dev/null 2>&1; then
  CHECK_3001=$(netstat -tuln 2>/dev/null | grep ':3001 ')
  CHECK_3000=$(netstat -tuln 2>/dev/null | grep ':3000 ')
elif command -v lsof >/dev/null 2>&1; then
  CHECK_3001=$(lsof -i :3001 2>/dev/null)
  CHECK_3000=$(lsof -i :3000 2>/dev/null)
fi

if [ -n "$CHECK_3001" ]; then
  PORT_3001_IN_USE=true
  echo "⚠️  PORT 3001 IS CURRENTLY IN USE by:"
  echo "$CHECK_3001"
  if command -v lsof >/dev/null 2>&1; then
    sudo lsof -i :3001 2>/dev/null
  fi
else
  echo "✅ PORT 3001 IS COMPLETELY FREE AND SAFE TO USE!"
fi

if [ -n "$CHECK_3000" ]; then
  PORT_3000_IN_USE=true
  echo "⚠️  PORT 3000 IS CURRENTLY IN USE by:"
  echo "$CHECK_3000"
else
  echo "✅ PORT 3000 is also free."
fi
echo ""

# 7. List of All Active Listening Ports (Top services)
echo "--- [7] ALL CURRENTLY LISTENING PORTS ON THIS VPS ---"
if command -v ss >/dev/null 2>&1; then
  ss -tulpn 2>/dev/null | grep LISTEN | awk '{print $1, $5, $7}' | column -t 2>/dev/null || ss -tulpn 2>/dev/null | grep LISTEN
elif command -v netstat >/dev/null 2>&1; then
  netstat -tulpn 2>/dev/null | grep LISTEN
else
  echo "Unable to list ports (requires ss or netstat)."
fi
echo ""

# 8. Firewall Status
echo "--- [8] FIREWALL STATUS ---"
if command -v ufw >/dev/null 2>&1; then
  sudo ufw status 2>/dev/null || echo "UFW requires sudo permissions to query."
elif command -v firewall-cmd >/dev/null 2>&1; then
  sudo firewall-cmd --state 2>/dev/null || echo "Firewalld inactive."
else
  echo "No standard UFW / Firewalld detected."
fi
echo ""

# 9. Summary Verdict
echo "=============================================================================="
echo "                           🎯 SUMMARY & RECOMMENDATION"
echo "=============================================================================="
if [ "$PORT_3001_IN_USE" = true ]; then
  echo "❌ PORT 3001 is already taken by another service on this VPS."
  echo "👉 DO NOT overwrite it. We can easily configure SettleTrack to run on another free port (e.g. 3002 or 3005)."
else
  echo "✅ SettleTrack can safely bind to Port 3001 without disturbing any existing apps!"
fi
echo "=============================================================================="
