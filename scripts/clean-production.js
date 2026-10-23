const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'settlements-data.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Universal password specified by user
const PRODUCTION_PASSWORD = 'moremoneyhaha';
const passwordHash = bcrypt.hashSync(PRODUCTION_PASSWORD, 10);

// Clean Production Role Accounts
const cleanUsers = [
  // 1. Platform Admin HQ
  {
    id: 'usr_admin',
    email: 'admin@platform.com',
    password: PRODUCTION_PASSWORD,
    passwordHash: passwordHash,
    name: 'Platform Treasury Admin',
    role: 'admin',
    businessName: 'SettleTrack Platform Treasury HQ',
    phone: '+91 98200 11223',
    defaultUpiId: 'admin.apex@icici',
    bankDetails: {
      accountHolder: 'Apex Settlement Technologies Pvt Ltd',
      accountNumber: '184905001290',
      ifscCode: 'ICIC0001849',
      bankName: 'ICICI Bank'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'usr_admin_alias',
    email: 'admin@settletrack.internal',
    password: PRODUCTION_PASSWORD,
    passwordHash: passwordHash,
    name: 'Platform Admin (Internal)',
    role: 'admin',
    businessName: 'SettleTrack Internal HQ',
    phone: '+91 98200 11223',
    defaultUpiId: 'admin.apex@icici',
    bankDetails: {
      accountHolder: 'Apex Settlement Technologies Pvt Ltd',
      accountNumber: '184905001290',
      ifscCode: 'ICIC0001849',
      bankName: 'ICICI Bank'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 2. Regional Sub-Admin
  {
    id: 'usr_sub_1',
    email: 'subadmin@platform.com',
    password: PRODUCTION_PASSWORD,
    passwordHash: passwordHash,
    name: 'Regional Sub-Admin Desk',
    role: 'subadmin',
    createdBy: 'usr_admin',
    businessName: 'Regional Settlement Desk 01',
    phone: '+91 98201 44521',
    defaultUpiId: 'subadmin.clearing@okaxis',
    bankDetails: {
      accountHolder: 'Regional Settlement Agency',
      accountNumber: '50100412891234',
      ifscCode: 'HDFC0001042',
      bankName: 'HDFC Bank'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'usr_sub_1_alias',
    email: 'subadmin.rahul@example.com',
    password: PRODUCTION_PASSWORD,
    passwordHash: passwordHash,
    name: 'Rahul Deshmukh (Sub-Admin)',
    role: 'subadmin',
    createdBy: 'usr_admin',
    businessName: 'RD Referral Agency & Settlements',
    phone: '+91 98201 44521',
    defaultUpiId: 'rahul.rd@okaxis',
    bankDetails: {
      accountHolder: 'Rahul Deshmukh Agency',
      accountNumber: '50100412891234',
      ifscCode: 'HDFC0001042',
      bankName: 'HDFC Bank'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 3. Merchant (Assigned under Sub-Admin)
  {
    id: 'usr_merch_1',
    email: 'merchant@platform.com',
    password: PRODUCTION_PASSWORD,
    passwordHash: passwordHash,
    name: 'Primary Merchant Store',
    role: 'merchant',
    createdBy: 'usr_sub_1',
    subAdminId: 'usr_sub_1',
    subAdminName: 'Regional Sub-Admin Desk',
    businessName: 'Premier Merchant Retail & Tech',
    phone: '+91 98450 12390',
    defaultUpiId: 'merchant.store@paytm',
    bankDetails: {
      accountHolder: 'Premier Merchant Retail Store',
      accountNumber: '91802004512938',
      ifscCode: 'SBIN0004521',
      bankName: 'State Bank of India'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'usr_merch_1_alias',
    email: 'merchant.sunil@example.com',
    password: PRODUCTION_PASSWORD,
    passwordHash: passwordHash,
    name: 'Sunil Sharma',
    role: 'merchant',
    createdBy: 'usr_sub_1',
    subAdminId: 'usr_sub_1',
    subAdminName: 'Regional Sub-Admin Desk',
    businessName: 'Sharma Electronics & Mobile Mart',
    phone: '+91 98450 12390',
    defaultUpiId: 'sharma.electronics@paytm',
    bankDetails: {
      accountHolder: 'Sharma Electronics & Mobile',
      accountNumber: '91802004512938',
      ifscCode: 'SBIN0004521',
      bankName: 'State Bank of India'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 4. Direct Platform Merchant (Direct to Admin HQ)
  {
    id: 'usr_merch_direct',
    email: 'direct@platform.com',
    password: PRODUCTION_PASSWORD,
    passwordHash: passwordHash,
    name: 'Direct Wholesale Merchant',
    role: 'merchant',
    createdBy: 'usr_admin',
    // No subAdminId -> Clears directly with Admin HQ
    businessName: 'Direct Platform Wholesale & Exports',
    phone: '+91 98110 55678',
    defaultUpiId: 'direct.merchant@icici',
    bankDetails: {
      accountHolder: 'Direct Platform Wholesale Ltd',
      accountNumber: '002905001192',
      ifscCode: 'ICIC0000029',
      bankName: 'ICICI Bank'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'usr_merch_direct_alias',
    email: 'merchant.direct@example.com',
    password: PRODUCTION_PASSWORD,
    passwordHash: passwordHash,
    name: 'Rajesh Mehta (Direct)',
    role: 'merchant',
    createdBy: 'usr_admin',
    businessName: 'Mehta Direct Wholesale Exports',
    phone: '+91 98110 55678',
    defaultUpiId: 'mehta.exports@icici',
    bankDetails: {
      accountHolder: 'Mehta Wholesale Exports Ltd',
      accountNumber: '002905001192',
      ifscCode: 'ICIC0000029',
      bankName: 'ICICI Bank'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Clean Treasury Platform Accounts
const platformAccounts = [
  {
    id: 'acc_001',
    type: 'upi',
    title: 'Primary Platform Liquidity UPI VPA',
    upiId: 'settletrack.clearing@icici',
    accountHolder: 'Apex Settlement Technologies Pvt Ltd',
    notes: 'Master treasury collection handle for fast merchant UPI IMPS settlements',
    isActive: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'acc_002',
    type: 'bank',
    title: 'Corporate Clearing Treasury Current Account',
    accountHolder: 'Apex Settlement Technologies Pvt Ltd',
    accountNumber: '184905001290',
    ifscCode: 'ICIC0001849',
    bankName: 'ICICI Bank',
    branch: 'Nariman Point, Mumbai',
    notes: 'Designated corporate RTGS / NEFT settlement bank account for large volume settlements',
    isActive: true,
    updatedAt: new Date().toISOString()
  }
];

async function resetCleanProduction() {
  console.log('==============================================================================');
  console.log('🧹 SETTLETRACK - PRODUCTION DATA CLEANUP & CREDENTIALS RESET');
  console.log('==============================================================================');

  // 1. Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // 2. Clear dummy uploaded files (keep uploads folder clean)
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    let deletedCount = 0;
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
        deletedCount++;
      }
    }
    console.log(`✓ Cleaned uploads directory: removed ${deletedCount} dummy proof file(s).`);
  } catch (err) {
    console.warn(`! Note cleaning uploads directory: ${err.message}`);
  }

  // 3. Write Clean Ledger File with EMPTY settlements array: []
  const payload = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    users: cleanUsers,
    settlements: [], // <-- 100% CLEAN EMPTY SETTLEMENT LEDGER
    platformAccounts: platformAccounts
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`✓ Successfully reset ${DB_FILE}`);
  console.log(`✓ All dummy settlements and transactions REMOVED (Current count: 0)`);
  console.log(`✓ Configured ${cleanUsers.length} role accounts with password: "${PRODUCTION_PASSWORD}"`);

  // 4. Also handle PostgreSQL if configured in .env
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.trim().length > 0) {
    try {
      const { Pool } = require('pg');
      const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
      const pool = new Pool({
        connectionString: dbUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false }
      });

      console.log('⚡ Connecting to PostgreSQL database...');
      await pool.query('TRUNCATE TABLE audit_logs, settlements CASCADE;');
      console.log('✓ Truncated PostgreSQL audit_logs and settlements tables.');

      for (const u of cleanUsers) {
        await pool.query(`
          INSERT INTO users (id, email, password_hash, name, role, created_by, sub_admin_id, sub_admin_name, phone, business_name, default_upi_id, bank_details, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (email) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            status = 'active',
            updated_at = NOW();
        `, [
          u.id,
          u.email,
          u.passwordHash,
          u.name,
          u.role,
          u.createdBy || null,
          u.subAdminId || null,
          u.subAdminName || null,
          u.phone || null,
          u.businessName || null,
          u.defaultUpiId || null,
          JSON.stringify(u.bankDetails || {}),
          'active'
        ]);
      }
      console.log('✓ Synchronized PostgreSQL user credentials with new password.');
      await pool.end();
    } catch (pgErr) {
      console.log(`ℹ PostgreSQL sync note (skipped if not using direct PG): ${pgErr.message}`);
    }
  }

  console.log('\n==============================================================================');
  console.log('                   🎯 CLEAN PRODUCTION CREDENTIALS');
  console.log('==============================================================================');
  console.log(`Universal Password for ALL roles:  ${PRODUCTION_PASSWORD}\n`);
  console.log('┌───────────┬───────────────────────┬───────────────────────────────┬────────────────┐');
  console.log('│ Role      │ Role ID               │ Login Email                   │ Password       │');
  console.log('├───────────┼───────────────────────┼───────────────────────────────┼────────────────┤');
  console.log(`│ Admin HQ  │ usr_admin             │ admin@platform.com            │ ${PRODUCTION_PASSWORD} │`);
  console.log(`│ Sub-Admin │ usr_sub_1             │ subadmin@platform.com         │ ${PRODUCTION_PASSWORD} │`);
  console.log(`│ Merchant  │ usr_merch_1           │ merchant@platform.com         │ ${PRODUCTION_PASSWORD} │`);
  console.log(`│ Direct    │ usr_merch_direct      │ direct@platform.com           │ ${PRODUCTION_PASSWORD} │`);
  console.log('└───────────┴───────────────────────┴───────────────────────────────┴────────────────┘');
  console.log('\n(Legacy emails like admin@settletrack.internal and merchant.sunil@example.com also work with this password)');
  console.log('==============================================================================\n');
}

resetCleanProduction().catch(err => {
  console.error('Fatal cleanup error:', err);
  process.exit(1);
});
