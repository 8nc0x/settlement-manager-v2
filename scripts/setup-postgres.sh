#!/bin/bash
# ==============================================================================
# SettleTrack - Automated PostgreSQL Setup Script
# Connects SettleTrack directly to your VPS's live PostgreSQL database
# ==============================================================================

set -e

echo "=============================================================================="
echo "🐘 Setting up dedicated PostgreSQL Database for SettleTrack..."
echo "=============================================================================="

DB_USER="settletrack_user"
DB_PASS="moremoneyhaha"
DB_NAME="settletrack_db"

# 1. Create user and database in PostgreSQL
sudo -u postgres psql << EOF
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASS';
  ELSE
    ALTER ROLE $DB_USER WITH PASSWORD '$DB_PASS';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF

# Grant schema permissions (Postgres 15+)
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" >/dev/null 2>&1 || true

echo "✓ PostgreSQL database '$DB_NAME' and user '$DB_USER' are ready."

# 2. Update .env with DATABASE_URL
DB_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"

if [ ! -f .env ]; then
  cp .env.example .env
fi

if grep -q "DATABASE_URL=" .env; then
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DB_URL\"|g" .env
else
  echo "DATABASE_URL=\"$DB_URL\"" >> .env
fi

echo "✓ Added DATABASE_URL to .env."

# 3. Run production reset to create SQL tables and default admin/merchant accounts
node scripts/clean-production.js

# 4. Restart PM2 process
pm2 restart settletrack

echo ""
echo "=============================================================================="
echo "🎉 SUCCESS! SettleTrack is now running on LIVE PostgreSQL!"
echo "Database: $DB_NAME on 127.0.0.1:5432"
echo "Persistence: 100% permanent in PostgreSQL database (never lost on git pulls)."
echo "=============================================================================="
