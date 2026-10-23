const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'settlements-data.json');

const universalPassword = 'moremoneyhaha';
const adminHash = bcrypt.hashSync(universalPassword, 10);
const subAdminHash = bcrypt.hashSync(universalPassword, 10);
const merchantHash = bcrypt.hashSync(universalPassword, 10);

const users = [
  // 1. Platform Admin HQ
  {
    id: 'usr_admin',
    email: 'admin@settletrack.internal',
    password: 'admin123',
    passwordHash: adminHash,
    name: 'Vikram Singhania',
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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_admin_alias',
    email: 'admin@platform.com',
    password: 'admin123',
    passwordHash: adminHash,
    name: 'Vikram Singhania (HQ)',
    role: 'admin',
    businessName: 'Apex Settlement Platform HQ',
    phone: '+91 98200 11223',
    defaultUpiId: 'admin.apex@icici',
    bankDetails: {
      accountHolder: 'Apex Settlement Technologies Pvt Ltd',
      accountNumber: '184905001290',
      ifscCode: 'ICIC0001849',
      bankName: 'ICICI Bank'
    },
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },

  // 2. Regional Sub-Admin Desk (Rahul)
  {
    id: 'usr_sub_1',
    email: 'subadmin.rahul@example.com',
    password: 'subadmin123',
    passwordHash: subAdminHash,
    name: 'Rahul Deshmukh',
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
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z'
  },
  {
    id: 'usr_sub_1_alias',
    email: 'subadmin.rahul@platform.com',
    password: 'subadmin123',
    passwordHash: subAdminHash,
    name: 'Rahul Deshmukh (Desk)',
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
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z'
  },

  // 3. Regional Sub-Admin Desk (Priya)
  {
    id: 'usr_sub_2',
    email: 'subadmin.priya@platform.com',
    password: 'subadmin123',
    passwordHash: subAdminHash,
    name: 'Priya Verma',
    role: 'subadmin',
    createdBy: 'usr_admin',
    businessName: 'PV Merchant Alliance',
    phone: '+91 97112 88410',
    defaultUpiId: 'priyaverma@icici',
    bankDetails: {
      accountHolder: 'Priya Verma',
      accountNumber: '001201552341',
      ifscCode: 'ICIC0000012',
      bankName: 'ICICI Bank'
    },
    status: 'active',
    createdAt: '2026-01-08T00:00:00.000Z',
    updatedAt: '2026-01-08T00:00:00.000Z'
  },

  // 4. Merchant: Sunil Sharma (Assigned to Rahul)
  {
    id: 'usr_merch_1',
    email: 'merchant.sunil@example.com',
    password: 'merchant123',
    passwordHash: merchantHash,
    name: 'Sunil Sharma',
    role: 'merchant',
    createdBy: 'usr_sub_1',
    subAdminId: 'usr_sub_1',
    subAdminName: 'Rahul Deshmukh',
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
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'usr_merch_1_alias',
    email: 'merchant.sharma@store.in',
    password: 'merchant123',
    passwordHash: merchantHash,
    name: 'Sunil Sharma (Store)',
    role: 'merchant',
    createdBy: 'usr_sub_1',
    subAdminId: 'usr_sub_1',
    subAdminName: 'Rahul Deshmukh',
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
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z'
  },

  // 5. Merchant: Direct Platform Merchant (No intermediary agent)
  {
    id: 'usr_merch_direct',
    email: 'merchant.direct@example.com',
    password: 'merchant123',
    passwordHash: merchantHash,
    name: 'Rajesh Mehta',
    role: 'merchant',
    createdBy: 'usr_admin',
    // Intentionally no subAdminId -> Directly clears with Platform Admin Treasury
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
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-01-12T00:00:00.000Z'
  },

  // 6. Merchant: Anita Gupta (Assigned to Rahul)
  {
    id: 'usr_merch_2',
    email: 'merchant.gupta@mart.com',
    password: 'merchant123',
    passwordHash: merchantHash,
    name: 'Anita Gupta',
    role: 'merchant',
    createdBy: 'usr_sub_1',
    subAdminId: 'usr_sub_1',
    subAdminName: 'Rahul Deshmukh',
    businessName: 'Gupta Super General Store',
    phone: '+91 98210 99882',
    defaultUpiId: 'guptamart@upi',
    bankDetails: {
      accountHolder: 'Anita Gupta Retail',
      accountNumber: '1203000192847',
      ifscCode: 'PUNB0120300',
      bankName: 'Punjab National Bank'
    },
    status: 'active',
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-01-12T00:00:00.000Z'
  },

  // 7. Merchant: Imran Khan (Assigned to Priya)
  {
    id: 'usr_merch_3',
    email: 'merchant.khan@fastpay.com',
    password: 'merchant123',
    passwordHash: merchantHash,
    name: 'Imran Khan',
    role: 'merchant',
    createdBy: 'usr_sub_2',
    subAdminId: 'usr_sub_2',
    subAdminName: 'Priya Verma',
    businessName: 'Khan QuickPay Supermarket',
    phone: '+91 99100 44321',
    defaultUpiId: 'imran.khan@okaxis',
    bankDetails: {
      accountHolder: 'Khan QuickPay Store',
      accountNumber: '556677889900',
      ifscCode: 'UTIB0000412',
      bankName: 'Axis Bank'
    },
    status: 'active',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z'
  }
];

const platformAccounts = [
  {
    id: 'acc_001',
    type: 'upi',
    title: 'Primary Platform Liquidity UPI VPA',
    upiId: 'settletrack.clearing@icici',
    accountHolder: 'Apex Settlement Technologies Pvt Ltd',
    notes: 'Master treasury automated collection handle for fast merchant UPI IMPS settlements',
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc_002',
    type: 'bank',
    title: 'Corporate Clearing Treasury Current Account',
    accountHolder: 'Apex Settlement Technologies Pvt Ltd',
    accountNumber: '184905001290',
    ifscCode: 'ICIC0001849',
    bankName: 'ICICI Bank Nariman Point Branch',
    notes: 'Treasury reserve account used for high-ticket RTGS/IMPS settlement payouts',
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'acc_003',
    type: 'upi',
    title: 'Secondary Reserve UPI VPA',
    upiId: 'settletrack.reserve@hdfcbank',
    accountHolder: 'Apex Settlement Technologies Pvt Ltd',
    notes: 'Secondary backup UPI VPA for peak turnover hours',
    isActive: true,
    updatedAt: '2026-01-15T00:00:00.000Z'
  }
];

// Realistic Sample Settlements
const settlements = [
  // 1. Direct Merchant to Platform Admin (Completed)
  {
    id: 'stl_396716',
    type: 'merchant_to_admin',
    requesterId: 'usr_merch_1',
    requesterName: 'Sunil Sharma',
    requesterRole: 'merchant',
    requesterBusiness: 'Sharma Electronics & Mobile Mart',
    recipientId: 'usr_admin',
    recipientName: 'Vikram Singhania',
    recipientRole: 'admin',
    amount: 72000,
    dateRange: {
      startDate: '2026-10-21',
      startTime: '00:00',
      endDate: '2026-10-23',
      endTime: '23:59'
    },
    payoutDetails: {
      method: 'upi',
      upiId: 'sharma.electronics@paytm'
    },
    merchantNotes: 'Direct festive clearance with Platform HQ Treasury',
    status: 'completed',
    clearing: {
      clearedAt: '2026-10-23T20:16:04.318Z',
      clearedBy: 'usr_admin',
      clearedByName: 'Vikram Singhania',
      clearedByRole: 'admin',
      utrNumber: 'UTRDIRECT999888',
      proofType: 'voucher',
      proofUrl: 'https://example.com/proof.pdf',
      proofFileName: 'banking_clearance_proof.png',
      clearingRemarks: 'Direct platform settlement cleared by Treasury'
    },
    confirmation: {
      confirmedAt: '2026-10-23T20:16:09.608Z',
      confirmedBy: 'usr_merch_1',
      confirmedByName: 'Sunil Sharma',
      confirmationNotes: 'Received funds directly in account from Platform Admin Treasury',
      isDisputed: false
    },
    auditTrail: [
      {
        id: 'aud_d1',
        action: 'CREATED',
        actorId: 'usr_merch_1',
        actorName: 'Sunil Sharma',
        actorRole: 'merchant',
        timestamp: '2026-10-23T20:13:16.716Z',
        details: 'Raised Direct Platform Settlement for ₹72,000'
      },
      {
        id: 'aud_d2',
        action: 'CLEARED_WITH_PROOF',
        actorId: 'usr_admin',
        actorName: 'Vikram Singhania',
        actorRole: 'admin',
        timestamp: '2026-10-23T20:16:04.318Z',
        details: 'Cleared by Platform Admin with UTR: UTRDIRECT999888'
      },
      {
        id: 'aud_d3',
        action: 'CONFIRMED_AND_CLOSED',
        actorId: 'usr_merch_1',
        actorName: 'Sunil Sharma',
        actorRole: 'merchant',
        timestamp: '2026-10-23T20:16:09.608Z',
        details: 'Confirmed and permanently closed by Sunil Sharma'
      }
    ],
    createdAt: '2026-10-23T20:13:16.716Z',
    updatedAt: '2026-10-23T20:16:09.608Z'
  },

  // 2. Direct Merchant to Platform Admin (Pending)
  {
    id: 'stl_direct_pending',
    type: 'merchant_to_admin',
    requesterId: 'usr_merch_direct',
    requesterName: 'Rajesh Mehta',
    requesterRole: 'merchant',
    requesterBusiness: 'Mehta Direct Wholesale Exports',
    recipientId: 'usr_admin',
    recipientName: 'Vikram Singhania',
    recipientRole: 'admin',
    amount: 145000,
    dateRange: {
      startDate: '2026-10-18',
      startTime: '09:00',
      endDate: '2026-10-22',
      endTime: '21:00'
    },
    payoutDetails: {
      method: 'bank',
      bankName: 'ICICI Bank',
      accountHolder: 'Mehta Wholesale Exports Ltd',
      accountNumber: '002905001192',
      ifscCode: 'ICIC0000029'
    },
    merchantNotes: 'Direct export turnover settlement batch #04',
    status: 'pending',
    auditTrail: [
      {
        id: 'aud_dp1',
        action: 'CREATED',
        actorId: 'usr_merch_direct',
        actorName: 'Rajesh Mehta',
        actorRole: 'merchant',
        timestamp: '2026-10-23T18:00:00.000Z',
        details: 'Direct platform settlement raised for ₹1,45,000'
      }
    ],
    createdAt: '2026-10-23T18:00:00.000Z',
    updatedAt: '2026-10-23T18:00:00.000Z'
  },

  // 3. Merchant to Sub-Admin (Pending clearance)
  {
    id: 'stl_1001',
    type: 'merchant_to_subadmin',
    requesterId: 'usr_merch_1',
    requesterName: 'Sunil Sharma',
    requesterRole: 'merchant',
    requesterBusiness: 'Sharma Electronics & Mobile Mart',
    recipientId: 'usr_sub_1',
    recipientName: 'Rahul Deshmukh',
    recipientRole: 'subadmin',
    amount: 45000,
    dateRange: {
      startDate: '2026-02-12',
      startTime: '00:00',
      endDate: '2026-02-15',
      endTime: '23:59'
    },
    payoutDetails: {
      method: 'upi',
      upiId: 'sharma.electronics@paytm'
    },
    merchantNotes: 'Settlement for weekend electronics and mobile accessories turnover.',
    status: 'pending',
    auditTrail: [
      {
        id: 'aud_1',
        action: 'CREATED',
        actorId: 'usr_merch_1',
        actorName: 'Sunil Sharma',
        actorRole: 'merchant',
        timestamp: '2026-02-16T08:30:00.000Z',
        details: 'Raised settlement request for ₹45,000'
      }
    ],
    createdAt: '2026-02-16T08:30:00.000Z',
    updatedAt: '2026-02-16T08:30:00.000Z'
  },

  // 4. Merchant to Sub-Admin (Cleared, waiting confirmation)
  {
    id: 'stl_1002',
    type: 'merchant_to_subadmin',
    requesterId: 'usr_merch_2',
    requesterName: 'Anita Gupta',
    requesterRole: 'merchant',
    requesterBusiness: 'Gupta Super General Store',
    recipientId: 'usr_sub_1',
    recipientName: 'Rahul Deshmukh',
    recipientRole: 'subadmin',
    amount: 82500,
    dateRange: {
      startDate: '2026-02-10',
      startTime: '08:00',
      endDate: '2026-02-14',
      endTime: '22:00'
    },
    payoutDetails: {
      method: 'upi',
      upiId: 'guptamart@upi'
    },
    merchantNotes: 'Weekly grocery batch reconciliation.',
    status: 'paid_pending_confirmation',
    clearing: {
      clearedAt: '2026-02-15T11:45:00.000Z',
      clearedBy: 'usr_sub_1',
      clearedByName: 'Rahul Deshmukh',
      clearedByRole: 'subadmin',
      utrNumber: '504618294012',
      proofType: 'voucher',
      proofFileName: 'voucher-504618294012.svg',
      clearingRemarks: 'Disbursed via HDFC Corporate IMPS. Reference #504618294012.'
    },
    auditTrail: [
      {
        id: 'aud_2',
        action: 'CREATED',
        actorId: 'usr_merch_2',
        actorName: 'Anita Gupta',
        actorRole: 'merchant',
        timestamp: '2026-02-14T23:00:00.000Z',
        details: 'Settlement request submitted'
      },
      {
        id: 'aud_3',
        action: 'CLEARED_WITH_PROOF',
        actorId: 'usr_sub_1',
        actorName: 'Rahul Deshmukh',
        actorRole: 'subadmin',
        timestamp: '2026-02-15T11:45:00.000Z',
        details: 'Sub-admin issued payment proof and UTR 504618294012'
      }
    ],
    createdAt: '2026-02-14T23:00:00.000Z',
    updatedAt: '2026-02-15T11:45:00.000Z'
  },

  // 5. Sub-Admin to Platform Admin (Completed Aggregated Clearance)
  {
    id: 'stl_sub_admin_agg',
    type: 'subadmin_to_admin',
    requesterId: 'usr_sub_1',
    requesterName: 'Rahul Deshmukh',
    requesterRole: 'subadmin',
    requesterBusiness: 'RD Referral Agency & Settlements',
    recipientId: 'usr_admin',
    recipientName: 'Vikram Singhania',
    recipientRole: 'admin',
    amount: 485000,
    dateRange: {
      startDate: '2026-02-01',
      startTime: '00:00',
      endDate: '2026-02-07',
      endTime: '23:59'
    },
    payoutDetails: {
      method: 'bank',
      bankName: 'HDFC Bank',
      accountHolder: 'Rahul Deshmukh Agency',
      accountNumber: '50100412891234',
      ifscCode: 'HDFC0001042'
    },
    merchantNotes: 'Aggregated merchant portfolio clearance for Week 1 Feb.',
    status: 'completed',
    clearing: {
      clearedAt: '2026-02-09T10:15:00.000Z',
      clearedBy: 'usr_admin',
      clearedByName: 'Vikram Singhania',
      clearedByRole: 'admin',
      utrNumber: 'CMS982104928190',
      proofType: 'file_excel_csv',
      proofFileName: 'clearing_statement_feb_week1.xlsx',
      proofFileSize: '342 KB',
      clearingRemarks: 'Corporate CMS Batch #982 processed from ICICI current account.'
    },
    confirmation: {
      confirmedAt: '2026-02-09T16:00:00.000Z',
      confirmedBy: 'usr_sub_1',
      confirmedByName: 'Rahul Deshmukh',
      confirmationNotes: 'CMS batch verified and reconciled with sub-admin ledger.'
    },
    auditTrail: [
      {
        id: 'aud_4',
        action: 'CREATED',
        actorId: 'usr_sub_1',
        actorName: 'Rahul Deshmukh',
        actorRole: 'subadmin',
        timestamp: '2026-02-08T16:00:00.000Z',
        details: 'Sub-admin aggregated settlement raised for ₹4,85,000'
      },
      {
        id: 'aud_5',
        action: 'CLEARED_WITH_PROOF',
        actorId: 'usr_admin',
        actorName: 'Vikram Singhania',
        actorRole: 'admin',
        timestamp: '2026-02-09T10:15:00.000Z',
        details: 'Admin issued corporate batch clearance with UTR CMS982104928190'
      },
      {
        id: 'aud_6',
        action: 'CONFIRMED_AND_CLOSED',
        actorId: 'usr_sub_1',
        actorName: 'Rahul Deshmukh',
        actorRole: 'subadmin',
        timestamp: '2026-02-09T16:00:00.000Z',
        details: 'Funds verified and permanently closed'
      }
    ],
    createdAt: '2026-02-08T16:00:00.000Z',
    updatedAt: '2026-02-09T16:00:00.000Z'
  }
];

function seedDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const payload = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    users,
    settlements,
    platformAccounts
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`✓ Seeded ${users.length} users into ${DB_FILE}`);
  console.log(`✓ Seeded ${settlements.length} settlements (including direct platform & sub-admin routes)`);
  console.log(`✓ Seeded ${platformAccounts.length} platform collection accounts`);
  console.log('\n--- Credentials Summary ---');
  console.log('1. Admin:      admin@settletrack.internal (or admin@platform.com) / admin123');
  console.log('2. Sub-Admin:  subadmin.rahul@example.com (or subadmin.rahul@platform.com) / subadmin123');
  console.log('3. Merchant:   merchant.sunil@example.com (or merchant.sharma@store.in) / merchant123');
  console.log('4. Direct Merch: merchant.direct@example.com / merchant123 (Direct to Admin)');
}

seedDatabase();
