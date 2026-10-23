# SettleTrack — Linux Server Hosting Guide (Direct IP & Port)

This guide walks you through deploying **SettleTrack** on any Linux VPS or server (Ubuntu, Debian, CentOS, AlmaLinux, AWS EC2, DigitalOcean, Linode, Hetzner, GCP Compute Engine) accessed directly via **IP and Port** (e.g. `http://YOUR_SERVER_IP:3001`), with no domain or reverse proxy required.

---

## 1. Prerequisites on Linux

Ensure **Node.js (v20+ LTS)** and **npm** are installed on your Linux server:

```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git build-essential

# Verify installation
node -v   # Should be v20.x or higher
npm -v
```

---

## 2. Transfer Code to Linux Server

Choose either method:

### Method A: Git Clone (Recommended)
```bash
cd /var/www  # or /home/youruser
git clone <your-repository-url> settletrack
cd settletrack
```

### Method B: SCP / Rsync from your local machine
```bash
# Run from your local terminal
scp -r "c:/CODE PROJECTS/settlement-manager-v2/settlement-manager-v2-main/settlement-manager-v2-main" user@YOUR_SERVER_IP:/var/www/settletrack
```

---

## 3. Configure `.env` for Your Server IP

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` using `nano .env` and replace `YOUR_SERVER_IP` with your actual Linux server's public or local IP:

```ini
# SettleTrack Environment Configuration

# Replace with your actual Server IP and Port
NEXTAUTH_URL="http://192.168.1.150:3001"   # Or your Public IP: http://143.110.22.45:3001

# Production Secret Key
NEXTAUTH_SECRET="settletrack-production-secret-key-32chars-min-change-in-prod"

# Production Port & Network Interface
PORT=3001
HOST="0.0.0.0"

# Optional: PostgreSQL Database URL
# If omitted, SettleTrack automatically uses the zero-downtime resilient file ledger!
# DATABASE_URL="postgresql://postgres:password@localhost:5432/settletrack?sslmode=prefer"
```

---

## 4. One-Command Automated Setup (`deploy.sh`)

We have included a turnkey deployment script that installs dependencies, seeds the database, and compiles the production bundle:

```bash
chmod +x deploy.sh
./deploy.sh
```

Or run manually:
```bash
# 1. Install dependencies
npm install

# 2. Seed initial users, accounts, and ledger records
npm run seed

# 3. Build optimized production bundle
npm run build
```

---

## 5. Allow Port in Linux Firewall

Open port `3001` so incoming browser traffic can reach the server:

```bash
# If using UFW (Ubuntu/Debian)
sudo ufw allow 3001/tcp
sudo ufw reload

# If using Firewalld (CentOS/AlmaLinux/RHEL)
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# If on AWS / GCP / Azure:
# Ensure port 3001 is allowed in your Security Group / Firewall Rules (Inbound TCP 3001 from 0.0.0.0/0).
```

---

## 6. Run 24/7 in Background

### Option A: Using PM2 Process Manager (Recommended)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start SettleTrack using pre-configured ecosystem file
pm2 start ecosystem.config.js

# Configure PM2 to auto-start on server reboots
pm2 save
pm2 startup
```

Useful PM2 commands:
```bash
pm2 status            # Check application status
pm2 logs settletrack  # View live application logs
pm2 restart settletrack # Restart application
pm2 stop settletrack    # Stop application
```

---

### Option B: Using Native Linux systemd Service

Copy the included `settletrack.service` unit file:

```bash
# Adjust WorkingDirectory in settletrack.service if needed
sudo cp settletrack.service /etc/systemd/system/settletrack.service
sudo systemctl daemon-reload
sudo systemctl enable --now settletrack

# Check status
sudo systemctl status settletrack
```

---

## 7. Access in Browser

Open your browser and navigate to:
```
http://YOUR_SERVER_IP:3001
```

### Seeded Credentials for Testing

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Platform Admin HQ** | `admin@settletrack.internal` | `admin123` | Direct clearance, Treasury payouts, full ledger oversight |
| **Regional Sub-Admin Desk** | `subadmin.rahul@example.com` | `subadmin123` | Regional merchant clearance, aggregate settlement requests |
| **Store Merchant** | `merchant.sunil@example.com` | `merchant123` | Can raise to Platform Admin HQ or Regional Agent |
| **Direct Merchant** | `merchant.direct@example.com` | `merchant123` | Direct-to-admin unassigned merchant |

---

## 8. Verification Checklist

- [x] Production build passes cleanly (`npm run build`).
- [x] Server binds to `0.0.0.0:3001` across all network interfaces.
- [x] Cookies configured with `useSecureCookies: false` for plain HTTP IP hosting.
- [x] Dual file uploads (screenshots & banking documents) persist to `public/uploads/`.
- [x] Reviewer can view high-res images in lightbox and download files directly.
