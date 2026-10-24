import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import {
  User,
  Settlement,
  PlatformCollectionAccount,
  SettlementStats,
  Role,
  ProofType
} from '@/types';

// Storage path for local/fallback file persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'settlements-data.json');

// Optional PostgreSQL Pool for direct production hosting
let pgPool: Pool | null = null;
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && databaseUrl.trim().length > 0) {
  try {
    const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
    // Initialize PostgreSQL tables asynchronously in the background
    initPgSchema(pgPool).catch(err => {
      console.warn('[PostgreSQL Init Notice]: Direct PG table check failed, falling back to safe local persistence. Reason:', err.message);
    });
  } catch (err: any) {
    console.warn('[PostgreSQL Pool Notice]: Could not create PG Pool, fallback active:', err.message);
    pgPool = null;
  }
}

async function initPgSchema(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL,
      created_by VARCHAR(64),
      sub_admin_id VARCHAR(64),
      sub_admin_name VARCHAR(255),
      phone VARCHAR(64),
      business_name VARCHAR(255),
      default_upi_id VARCHAR(255),
      bank_details JSONB,
      status VARCHAR(32) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id VARCHAR(64) PRIMARY KEY,
      type VARCHAR(64) NOT NULL,
      requester_id VARCHAR(64) NOT NULL,
      requester_name VARCHAR(255) NOT NULL,
      requester_role VARCHAR(32) NOT NULL,
      requester_business VARCHAR(255),
      recipient_id VARCHAR(64) NOT NULL,
      recipient_name VARCHAR(255) NOT NULL,
      recipient_role VARCHAR(32) NOT NULL,
      amount NUMERIC(14, 2) NOT NULL,
      date_range JSONB NOT NULL,
      payout_details JSONB NOT NULL,
      merchant_notes TEXT,
      status VARCHAR(64) NOT NULL,
      clearing JSONB,
      confirmation JSONB,
      audit_trail JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platform_accounts (
      id VARCHAR(64) PRIMARY KEY,
      type VARCHAR(32) NOT NULL,
      title VARCHAR(255) NOT NULL,
      upi_id VARCHAR(255),
      account_holder VARCHAR(255) NOT NULL,
      account_number VARCHAR(128),
      ifsc_code VARCHAR(64),
      bank_name VARCHAR(255),
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

interface DatabaseSchema {
  version: number;
  users: User[];
  settlements: Settlement[];
  platformAccounts: PlatformCollectionAccount[];
  lastUpdated: string;
}

// Generate realistic SVG voucher screenshot for audit records
function createSampleProofVoucher(amount: number, utr: string, recipientName: string, upi: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">
    <rect width="600" height="750" rx="16" fill="#F7F7F4" stroke="#E6E5E0" stroke-width="2"/>
    <circle cx="300" cy="85" r="32" fill="#1F8A65" fill-opacity="0.12"/>
    <circle cx="300" cy="85" r="24" fill="#1F8A65"/>
    <path d="M293 85L298 90L308 80" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    
    <text x="300" y="145" fill="#26251E" font-family="system-ui, sans-serif" font-size="20" font-weight="600" text-anchor="middle">Transfer Cleared</text>
    <text x="300" y="168" fill="#807D72" font-family="system-ui, sans-serif" font-size="13" text-anchor="middle">Official Banking Settlement Voucher</text>
    
    <text x="300" y="225" fill="#26251E" font-family="system-ui, sans-serif" font-size="34" font-weight="400" letter-spacing="-1px" text-anchor="middle">₹${amount.toLocaleString('en-IN')}.00</text>
    
    <rect x="40" y="265" width="520" height="400" rx="12" fill="#FFFFFF" stroke="#E6E5E0" stroke-width="1"/>
    
    <text x="70" y="308" fill="#807D72" font-family="system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.5px">BENEFICIARY</text>
    <text x="70" y="332" fill="#26251E" font-family="system-ui, sans-serif" font-size="16" font-weight="500">${recipientName}</text>
    <text x="70" y="354" fill="#F54E00" font-family="ui-monospace, monospace" font-size="13">${upi}</text>
    
    <line x1="70" y1="375" x2="530" y2="375" stroke="#EFEEE8" stroke-width="1.5" stroke-dasharray="4 4"/>
    
    <text x="70" y="405" fill="#807D72" font-family="system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.5px">UTR / NPCI REFERENCE NUMBER</text>
    <text x="70" y="430" fill="#26251E" font-family="ui-monospace, monospace" font-size="17" font-weight="600" letter-spacing="1.5px">${utr}</text>
    
    <line x1="70" y1="455" x2="530" y2="455" stroke="#EFEEE8" stroke-width="1.5" stroke-dasharray="4 4"/>
    
    <text x="70" y="488" fill="#807D72" font-family="system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.5px">PAYMENT CHANNEL</text>
    <text x="70" y="510" fill="#26251E" font-family="system-ui, sans-serif" font-size="14">IMPS / Unified Payments Interface (UPI)</text>
    
    <rect x="70" y="545" width="460" height="32" rx="8" fill="#FAF9F5" stroke="#E6E5E0" stroke-width="1"/>
    <text x="300" y="566" fill="#1F8A65" font-family="system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">✓ BANK DEBIT VERIFIED &amp; PERMANENTLY LOGGED</text>
    
    <text x="300" y="640" fill="#807D72" font-family="ui-monospace, monospace" font-size="11" text-anchor="middle">TXN REF: NPCI-SETTLE-${utr.slice(0, 6)}</text>
    <text x="300" y="705" fill="#A09C92" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">Audit Ledger Electronic Proof · SettleTrack</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Default initial state with clean credentials and universal password: moremoneyhaha
const DEFAULT_PASSWORD = 'moremoneyhaha';
const defaultHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

const initialData: DatabaseSchema = {
  version: 2,
  lastUpdated: new Date().toISOString(),
  users: [
    {
      id: 'usr_admin',
      email: 'admin@platform.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
      name: 'Platform Treasury Admin',
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
    {
      id: 'usr_admin_alias',
      email: 'admin@settletrack.internal',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
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
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr_sub_1',
      email: 'subadmin@platform.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
      name: 'Regional Sub-Admin Desk',
      role: 'subadmin',
      createdBy: 'usr_admin',
      businessName: 'RD Referral Agency & Settlements',
      phone: '+91 98201 44521',
      defaultUpiId: 'subadmin.clearing@okaxis',
      bankDetails: {
        accountHolder: 'Regional Settlement Agency',
        accountNumber: '50100412891234',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank'
      },
      status: 'active',
      createdAt: '2026-01-05T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z'
    },
    {
      id: 'usr_sub_1_alias',
      email: 'subadmin.rahul@platform.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
      name: 'Rahul Deshmukh',
      role: 'subadmin',
      createdBy: 'usr_admin',
      businessName: 'RD Referral Agency & Settlements',
      phone: '+91 98201 44521',
      defaultUpiId: 'rahul.rd@okaxis',
      bankDetails: {
        accountHolder: 'Rahul Deshmukh Agency',
        accountNumber: '50100412891234',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank'
      },
      status: 'active',
      createdAt: '2026-01-05T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z'
    },
    {
      id: 'usr_sub_1_alias2',
      email: 'subadmin.rahul@example.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
      name: 'Rahul Deshmukh (Desk)',
      role: 'subadmin',
      createdBy: 'usr_admin',
      businessName: 'RD Referral Agency & Settlements',
      phone: '+91 98201 44521',
      defaultUpiId: 'rahul.rd@okaxis',
      bankDetails: {
        accountHolder: 'Rahul Deshmukh Agency',
        accountNumber: '50100412891234',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank'
      },
      status: 'active',
      createdAt: '2026-01-05T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z'
    },
    {
      id: 'usr_merch_1',
      email: 'merchant@platform.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
      name: 'Primary Merchant Store',
      role: 'merchant',
      createdBy: 'usr_sub_1',
      subAdminId: 'usr_sub_1',
      subAdminName: 'Regional Sub-Admin Desk',
      businessName: 'Sharma Electronics & Mobile Retail',
      phone: '+91 99200 44321',
      defaultUpiId: 'merchant.store@paytm',
      bankDetails: {
        accountHolder: 'Sharma Electronics Sole Prop',
        accountNumber: '112233445566',
        ifscCode: 'SBIN0001245',
        bankName: 'State Bank of India'
      },
      status: 'active',
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z'
    },
    {
      id: 'usr_merch_1_alias',
      email: 'merchant.sunil@example.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
      name: 'Sunil Sharma',
      role: 'merchant',
      createdBy: 'usr_sub_1',
      subAdminId: 'usr_sub_1',
      subAdminName: 'Regional Sub-Admin Desk',
      businessName: 'Sharma Electronics & Mobile Retail',
      phone: '+91 99200 44321',
      defaultUpiId: 'sunil.sharma@paytm',
      bankDetails: {
        accountHolder: 'Sharma Electronics Sole Prop',
        accountNumber: '112233445566',
        ifscCode: 'SBIN0001245',
        bankName: 'State Bank of India'
      },
      status: 'active',
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z'
    },
    {
      id: 'usr_merch_1_alias2',
      email: 'merchant.sunil@store.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
      name: 'Sunil Sharma (Store)',
      role: 'merchant',
      createdBy: 'usr_sub_1',
      subAdminId: 'usr_sub_1',
      subAdminName: 'Regional Sub-Admin Desk',
      businessName: 'Sharma Electronics & Mobile Retail',
      phone: '+91 99200 44321',
      defaultUpiId: 'sunil.sharma@paytm',
      bankDetails: {
        accountHolder: 'Sharma Electronics Sole Prop',
        accountNumber: '112233445566',
        ifscCode: 'SBIN0001245',
        bankName: 'State Bank of India'
      },
      status: 'active',
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z'
    },
    {
      id: 'usr_merch_direct',
      email: 'direct@platform.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
      name: 'Direct Wholesale Merchant',
      role: 'merchant',
      createdBy: 'usr_admin',
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
      createdAt: '2026-01-12T00:00:00.000Z',
      updatedAt: '2026-01-12T00:00:00.000Z'
    },
    {
      id: 'usr_merch_direct_alias',
      email: 'merchant.direct@example.com',
      password: DEFAULT_PASSWORD,
      passwordHash: defaultHash,
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
      createdAt: '2026-01-12T00:00:00.000Z',
      updatedAt: '2026-01-12T00:00:00.000Z'
    }
  ],
  settlements: [
    {
      id: 'stl_1001',
      type: 'merchant_to_subadmin',
      requesterId: 'usr_merch_1',
      requesterName: 'Sunil Sharma',
      requesterRole: 'merchant',
      requesterBusiness: 'Sharma Electronics & Mobile Retail',
      recipientId: 'usr_sub_1',
      recipientName: 'Rahul Deshmukh',
      recipientRole: 'subadmin',
      amount: 145000,
      dateRange: {
        startDate: '2026-02-01',
        startTime: '09:00',
        endDate: '2026-02-07',
        endTime: '22:00'
      },
      payoutDetails: {
        method: 'upi',
        upiId: 'sunil.sharma@paytm'
      },
      merchantNotes: 'Turnover settlement for first week of February. 112 UPI transactions verified on QR terminal.',
      status: 'completed',
      clearing: {
        clearedAt: '2026-02-08T11:45:00.000Z',
        clearedBy: 'usr_sub_1',
        clearedByName: 'Rahul Deshmukh',
        clearedByRole: 'subadmin',
        utrNumber: '603912884912',
        proofType: 'voucher',
        proofUrl: createSampleProofVoucher(145000, '603912884912', 'Sunil Sharma', 'sunil.sharma@paytm'),
        proofFileName: 'voucher-603912884912.svg',
        clearingRemarks: 'Transferred full settlement via IMPS/UPI banking portal. UTR logged into system.'
      },
      confirmation: {
        confirmedAt: '2026-02-08T14:20:00.000Z',
        confirmedBy: 'usr_merch_1',
        confirmedByName: 'Sunil Sharma',
        confirmationNotes: 'Amount received in State Bank account via UTR 603912884912. Matched ledger records.'
      },
      auditTrail: [
        {
          id: 'aud_1',
          action: 'CREATED',
          actorId: 'usr_merch_1',
          actorName: 'Sunil Sharma',
          actorRole: 'merchant',
          timestamp: '2026-02-08T08:30:00.000Z',
          details: 'Settlement raised for ₹1,45,000 across date range 2026-02-01 to 2026-02-07'
        },
        {
          id: 'aud_2',
          action: 'CLEARED_WITH_PROOF',
          actorId: 'usr_sub_1',
          actorName: 'Rahul Deshmukh',
          actorRole: 'subadmin',
          timestamp: '2026-02-08T11:45:00.000Z',
          details: 'Cleared payout with UTR 603912884912 and attached banking voucher'
        },
        {
          id: 'aud_3',
          action: 'CONFIRMED_AND_CLOSED',
          actorId: 'usr_merch_1',
          actorName: 'Sunil Sharma',
          actorRole: 'merchant',
          timestamp: '2026-02-08T14:20:00.000Z',
          details: 'Verified funds credited and permanently closed record'
        }
      ],
      createdAt: '2026-02-08T08:30:00.000Z',
      updatedAt: '2026-02-08T14:20:00.000Z'
    },
    {
      id: 'stl_1002',
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
        accountHolder: 'Rahul Deshmukh Agency',
        accountNumber: '50100412891234',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank'
      },
      merchantNotes: 'Aggregated payout request for Sub-Admin agent commission and sub-merchant pool collections.',
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
    },
    {
      id: 'stl_1003',
      type: 'merchant_to_subadmin',
      requesterId: 'usr_merch_2',
      requesterName: 'Priya Mehta',
      requesterRole: 'merchant',
      requesterBusiness: 'Mehta Supermarket & Provisions',
      recipientId: 'usr_sub_1',
      recipientName: 'Rahul Deshmukh',
      recipientRole: 'subadmin',
      amount: 98500,
      dateRange: {
        startDate: '2026-02-10',
        startTime: '10:00',
        endDate: '2026-02-14',
        endTime: '21:30'
      },
      payoutDetails: {
        method: 'upi',
        upiId: 'priya.mehta@ybl'
      },
      merchantNotes: 'Turnover settlement for mid-February festival sale.',
      status: 'paid_pending_confirmation',
      clearing: {
        clearedAt: '2026-02-15T09:30:00.000Z',
        clearedBy: 'usr_sub_1',
        clearedByName: 'Rahul Deshmukh',
        clearedByRole: 'subadmin',
        utrNumber: '604619482910',
        proofType: 'voucher',
        proofUrl: createSampleProofVoucher(98500, '604619482910', 'Priya Mehta', 'priya.mehta@ybl'),
        proofFileName: 'voucher-604619482910.svg',
        clearingRemarks: 'Paid via Axis corporate banking net banking IMPS.'
      },
      auditTrail: [
        {
          id: 'aud_7',
          action: 'CREATED',
          actorId: 'usr_merch_2',
          actorName: 'Priya Mehta',
          actorRole: 'merchant',
          timestamp: '2026-02-14T22:00:00.000Z',
          details: 'Raised settlement request for ₹98,500'
        },
        {
          id: 'aud_8',
          action: 'CLEARED_WITH_PROOF',
          actorId: 'usr_sub_1',
          actorName: 'Rahul Deshmukh',
          actorRole: 'subadmin',
          timestamp: '2026-02-15T09:30:00.000Z',
          details: 'Cleared payout with UTR 604619482910; waiting for merchant confirmation'
        }
      ],
      createdAt: '2026-02-14T22:00:00.000Z',
      updatedAt: '2026-02-15T09:30:00.000Z'
    },
    {
      id: 'stl_1004',
      type: 'merchant_to_subadmin',
      requesterId: 'usr_merch_3',
      requesterName: 'Amit Patel',
      requesterRole: 'merchant',
      requesterBusiness: 'Patel IT Hardware Hub',
      recipientId: 'usr_sub_2',
      recipientName: 'Ananya Verma',
      recipientRole: 'subadmin',
      amount: 276000,
      dateRange: {
        startDate: '2026-02-11',
        startTime: '10:00',
        endDate: '2026-02-18',
        endTime: '20:00'
      },
      payoutDetails: {
        method: 'bank',
        accountHolder: 'Patel IT Solutions',
        accountNumber: '445566778899',
        ifscCode: 'UTIB0000189',
        bankName: 'Axis Bank'
      },
      merchantNotes: 'Bulk component turnover. Please process to Axis current account.',
      status: 'pending',
      auditTrail: [
        {
          id: 'aud_9',
          action: 'CREATED',
          actorId: 'usr_merch_3',
          actorName: 'Amit Patel',
          actorRole: 'merchant',
          timestamp: '2026-02-18T21:00:00.000Z',
          details: 'Settlement raised for ₹2,76,000. Waiting for Sub-Admin clearing.'
        }
      ],
      createdAt: '2026-02-18T21:00:00.000Z',
      updatedAt: '2026-02-18T21:00:00.000Z'
    }
  ],
  platformAccounts: [
    {
      id: 'acc_001',
      type: 'upi',
      title: 'Platform Main Collection UPI QR',
      upiId: 'apexplatform.collect@icici',
      accountHolder: 'Apex Settlement Technologies Pvt Ltd',
      notes: 'Primary UPI QR channel for customer deposits and gateway collections',
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
  ]
};

// -------------------------------------------------------------
// INTERNAL STORAGE HELPERS
// -------------------------------------------------------------

export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseSchema;

    // Ensure all seed users have passwordHash initialized
    let updated = false;
    for (const u of parsed.users) {
      if (!u.passwordHash && u.password) {
        u.passwordHash = bcrypt.hashSync(u.password, 10);
        updated = true;
      }
    }
    if (updated) {
      writeDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, using initial data:', err);
    return initialData;
  }
}

export function writeDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

// -------------------------------------------------------------
// USER MANAGEMENT & PRODUCTION AUTH
// -------------------------------------------------------------

export function getUsers(): User[] {
  const db = readDb();
  return db.users;
}

export function getUserById(id: string): User | undefined {
  const db = readDb();
  return db.users.find(u => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  const db = readDb();
  const normalized = email.toLowerCase().trim();
  return db.users.find(u => u.email.toLowerCase().trim() === normalized);
}

export function verifyUserPassword(email: string, plainPassword: string): User | null {
  const user = getUserByEmail(email);
  if (!user || user.status === 'suspended') return null;

  // Verify bcrypt hash or plaintext fallback for seeded accounts
  if (user.passwordHash) {
    const isMatch = bcrypt.compareSync(plainPassword, user.passwordHash);
    if (isMatch) return user;
  }
  if (user.password && user.password === plainPassword) {
    return user;
  }
  return null;
}

export function createUser(userData: {
  email: string;
  password: string;
  name: string;
  role: Role;
  createdBy?: string;
  subAdminId?: string;
  businessName?: string;
  phone?: string;
  defaultUpiId?: string;
  bankDetails?: User['bankDetails'];
}): User {
  const db = readDb();
  const normalizedEmail = userData.email.toLowerCase().trim();
  if (db.users.some(u => u.email.toLowerCase().trim() === normalizedEmail)) {
    throw new Error('User with this email already exists');
  }

  let subAdminName: string | undefined = undefined;
  if (userData.subAdminId) {
    const subAdmin = db.users.find(u => u.id === userData.subAdminId);
    if (subAdmin) {
      subAdminName = subAdmin.name;
    }
  }

  const hashedPassword = bcrypt.hashSync(userData.password.trim(), 10);

  const newUser: User = {
    id: `usr_${Date.now().toString().slice(-6)}_${Math.random().toString(36).substring(2, 6)}`,
    email: normalizedEmail,
    password: userData.password.trim(),
    passwordHash: hashedPassword,
    name: userData.name.trim(),
    role: userData.role,
    createdBy: userData.createdBy,
    subAdminId: userData.subAdminId,
    subAdminName,
    businessName: userData.businessName?.trim(),
    phone: userData.phone?.trim(),
    defaultUpiId: userData.defaultUpiId?.trim(),
    bankDetails: userData.bankDetails,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);

  // Sync to PostgreSQL pool if active
  if (pgPool) {
    pgPool.query(
      `INSERT INTO users (id, email, password_hash, name, role, created_by, sub_admin_id, sub_admin_name, phone, business_name, default_upi_id, bank_details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (email) DO UPDATE SET password_hash = $3, updated_at = NOW()`,
      [
        newUser.id,
        newUser.email,
        newUser.passwordHash,
        newUser.name,
        newUser.role,
        newUser.createdBy,
        newUser.subAdminId,
        newUser.subAdminName,
        newUser.phone,
        newUser.businessName,
        newUser.defaultUpiId,
        JSON.stringify(newUser.bankDetails || {}),
        newUser.status
      ]
    ).catch((e: any) => console.warn('[PG Insert User Notice]:', e.message));
  }

  return newUser;
}

export function resetPassword(targetUserId: string, newPassword: string, requesterRole: Role, requesterId: string): User {
  const db = readDb();
  const user = db.users.find(u => u.id === targetUserId);
  if (!user) {
    throw new Error('User not found');
  }

  // Permission check: Admin can reset anyone; Subadmin can only reset their assigned merchants
  if (requesterRole === 'merchant') {
    throw new Error('Merchants are not authorized to reset passwords');
  }
  if (requesterRole === 'subadmin') {
    if (user.subAdminId !== requesterId && user.createdBy !== requesterId) {
      throw new Error('Sub-Admins can only reset passwords for their assigned merchants');
    }
  }

  const hashedPassword = bcrypt.hashSync(newPassword.trim(), 10);
  user.password = newPassword.trim();
  user.passwordHash = hashedPassword;
  user.updatedAt = new Date().toISOString();

  writeDb(db);

  if (pgPool) {
    pgPool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, targetUserId]
    ).catch((e: any) => console.warn('[PG Update Password Notice]:', e.message));
  }

  return user;
}

export function updateUserProfile(userId: string, updates: Partial<User>): User {
  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (updates.name) user.name = updates.name.trim();
  if (updates.phone) user.phone = updates.phone.trim();
  if (updates.businessName) user.businessName = updates.businessName.trim();
  if (updates.defaultUpiId) user.defaultUpiId = updates.defaultUpiId.trim();
  if (updates.bankDetails) user.bankDetails = updates.bankDetails;
  user.updatedAt = new Date().toISOString();

  writeDb(db);
  return user;
}

// -------------------------------------------------------------
// SETTLEMENTS & AUDIT LEDGER
// -------------------------------------------------------------

export function getSettlements(filters?: {
  role?: Role;
  userId?: string;
  status?: string;
  type?: string;
  search?: string;
}): Settlement[] {
  const db = readDb();
  let list = [...db.settlements];

  if (filters?.role && filters?.userId) {
    if (filters.role === 'merchant') {
      list = list.filter(s => s.requesterId === filters.userId);
    } else if (filters.role === 'subadmin') {
      list = list.filter(s => s.recipientId === filters.userId || s.requesterId === filters.userId);
    }
  }

  if (filters?.status && filters.status !== 'all') {
    list = list.filter(s => s.status === filters.status);
  }

  if (filters?.type && filters.type !== 'all') {
    list = list.filter(s => s.type === filters.type);
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(s =>
      s.id.toLowerCase().includes(q) ||
      s.requesterName.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q) ||
      (s.type === 'merchant_to_admin' && (q.includes('direct') || q.includes('platform'))) ||
      (s.clearing?.utrNumber && s.clearing.utrNumber.toLowerCase().includes(q)) ||
      (s.payoutDetails.upiId && s.payoutDetails.upiId.toLowerCase().includes(q)) ||
      (s.payoutDetails.accountNumber && s.payoutDetails.accountNumber.includes(q)) ||
      s.amount.toString().includes(q)
    );
  }

  // Sort newest first
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSettlementById(id: string): Settlement | undefined {
  const db = readDb();
  return db.settlements.find(s => s.id === id);
}

export function createSettlement(params: {
  requesterId: string;
  amount: number;
  dateRange: Settlement['dateRange'];
  payoutDetails: Settlement['payoutDetails'];
  merchantNotes?: string;
  recipientType?: 'admin' | 'subadmin';
}): Settlement {
  const db = readDb();
  const requester = db.users.find(u => u.id === params.requesterId);
  if (!requester) {
    throw new Error('Requester user not found');
  }

  let recipient: User | undefined;
  let settlementType: Settlement['type'];

  if (requester.role === 'merchant') {
    // If merchant explicitly chooses platform admin, or has no assigned subadmin, route directly to Admin HQ
    if (params.recipientType === 'admin' || !requester.subAdminId) {
      settlementType = 'merchant_to_admin';
      recipient = db.users.find(u => u.role === 'admin');
    } else {
      // Route to assigned regional subadmin desk
      settlementType = 'merchant_to_subadmin';
      recipient = db.users.find(u => u.id === requester.subAdminId);
      if (!recipient) {
        settlementType = 'merchant_to_admin';
        recipient = db.users.find(u => u.role === 'admin');
      }
    }
  } else if (requester.role === 'subadmin') {
    settlementType = 'subadmin_to_admin';
    recipient = db.users.find(u => u.role === 'admin');
  } else {
    throw new Error('Admins do not raise settlements to themselves');
  }

  if (!recipient) {
    throw new Error('No valid clearing agent/admin found for this request');
  }

  const settlementId = `stl_${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();

  const newSettlement: Settlement = {
    id: settlementId,
    type: settlementType,
    requesterId: requester.id,
    requesterName: requester.name,
    requesterRole: requester.role,
    requesterBusiness: requester.businessName,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientRole: recipient.role,
    amount: params.amount,
    dateRange: params.dateRange,
    payoutDetails: params.payoutDetails,
    merchantNotes: params.merchantNotes?.trim(),
    status: 'pending',
    auditTrail: [
      {
        id: `aud_${Date.now().toString().slice(-4)}_1`,
        action: 'CREATED',
        actorId: requester.id,
        actorName: requester.name,
        actorRole: requester.role,
        timestamp: now,
        details: `Settlement raised for ₹${params.amount.toLocaleString('en-IN')} covering ${params.dateRange.startDate} to ${params.dateRange.endDate}`
      }
    ],
    createdAt: now,
    updatedAt: now
  };

  db.settlements.unshift(newSettlement);
  writeDb(db);

  if (pgPool) {
    pgPool.query(
      `INSERT INTO settlements (id, type, requester_id, requester_name, requester_role, requester_business, recipient_id, recipient_name, recipient_role, amount, date_range, payout_details, merchant_notes, status, audit_trail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        newSettlement.id,
        newSettlement.type,
        newSettlement.requesterId,
        newSettlement.requesterName,
        newSettlement.requesterRole,
        newSettlement.requesterBusiness,
        newSettlement.recipientId,
        newSettlement.recipientName,
        newSettlement.recipientRole,
        newSettlement.amount,
        JSON.stringify(newSettlement.dateRange),
        JSON.stringify(newSettlement.payoutDetails),
        newSettlement.merchantNotes,
        newSettlement.status,
        JSON.stringify(newSettlement.auditTrail)
      ]
    ).catch((e: any) => console.warn('[PG Insert Settlement Notice]:', e.message));
  }

  return newSettlement;
}

export function clearSettlement(params: {
  settlementId: string;
  actorId: string;
  utrNumber: string;
  proofUrl?: string;
  proofType?: ProofType;
  proofFileName?: string;
  proofFileSize?: string;
  proofMimeType?: string;
  proofLink?: string;
  remarks?: string;
  screenshotUrl?: string;
  screenshotFileName?: string;
  screenshotFileSize?: string;
  documentUrl?: string;
  documentFileName?: string;
  documentFileSize?: string;
  documentMimeType?: string;
}): Settlement {
  const db = readDb();
  const settlement = db.settlements.find(s => s.id === params.settlementId);
  if (!settlement) {
    throw new Error('Settlement record not found');
  }

  const actor = db.users.find(u => u.id === params.actorId);
  if (!actor) {
    throw new Error('Clearing actor not found');
  }

  // Permission: recipient or platform admin
  if (settlement.recipientId !== actor.id && actor.role !== 'admin') {
    throw new Error('Only the designated recipient agent or Platform Admin can clear this settlement');
  }

  // Duplicate UTR prevention check
  const trimmedUtr = params.utrNumber.trim();
  const duplicate = db.settlements.find(
    s => s.id !== params.settlementId && s.clearing?.utrNumber?.trim().toLowerCase() === trimmedUtr.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Duplicate UTR detected: ${trimmedUtr} has already been logged for settlement #${duplicate.id}`);
  }

  const now = new Date().toISOString();

  // If voucher type and no proofUrl provided, generate SVG voucher
  let finalProofUrl = params.proofUrl;
  if (!finalProofUrl && params.proofType === 'voucher') {
    const dest = settlement.payoutDetails.method === 'upi'
      ? settlement.payoutDetails.upiId || 'merchant@upi'
      : `${settlement.payoutDetails.bankName || 'Bank'} A/C: ${settlement.payoutDetails.accountNumber}`;
    finalProofUrl = createSampleProofVoucher(settlement.amount, params.utrNumber.trim(), settlement.requesterName, dest);
  }

  settlement.status = 'paid_pending_confirmation';
  settlement.clearing = {
    clearedAt: now,
    clearedBy: actor.id,
    clearedByName: actor.name,
    clearedByRole: actor.role,
    utrNumber: params.utrNumber.trim(),
    proofType: params.proofType || (params.screenshotUrl ? 'image' : params.documentUrl ? 'file_pdf' : 'voucher'),
    proofUrl: finalProofUrl,
    proofFileName: params.proofFileName || params.screenshotFileName || params.documentFileName || 'banking_clearance_proof.png',
    proofFileSize: params.proofFileSize || params.screenshotFileSize || params.documentFileSize,
    proofMimeType: params.proofMimeType || params.documentMimeType,
    proofLink: params.proofLink?.trim(),
    clearingRemarks: params.remarks?.trim(),
    screenshotUrl: params.screenshotUrl,
    screenshotFileName: params.screenshotFileName,
    screenshotFileSize: params.screenshotFileSize,
    documentUrl: params.documentUrl,
    documentFileName: params.documentFileName,
    documentFileSize: params.documentFileSize,
    documentMimeType: params.documentMimeType
  };
  settlement.updatedAt = now;

  settlement.auditTrail.push({
    id: `aud_${Date.now().toString().slice(-4)}_clr`,
    action: 'CLEARED_WITH_PROOF',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    timestamp: now,
    details: `Cleared with UTR / Reference: ${params.utrNumber.trim()}. Proof attached: ${params.proofType || 'voucher'}`
  });

  writeDb(db);

  if (pgPool) {
    pgPool.query(
      `UPDATE settlements SET status = $1, clearing = $2, audit_trail = $3, updated_at = NOW() WHERE id = $4`,
      [settlement.status, JSON.stringify(settlement.clearing), JSON.stringify(settlement.auditTrail), settlement.id]
    ).catch((e: any) => console.warn('[PG Clear Notice]:', e.message));
  }

  return settlement;
}

export function confirmSettlement(params: {
  settlementId: string;
  actorId: string;
  notes?: string;
}): Settlement {
  const db = readDb();
  const settlement = db.settlements.find(s => s.id === params.settlementId);
  if (!settlement) {
    throw new Error('Settlement not found');
  }

  const actor = db.users.find(u => u.id === params.actorId);
  if (!actor) {
    throw new Error('Confirming actor not found');
  }

  if (settlement.requesterId !== actor.id && actor.role !== 'admin') {
    throw new Error('Only the requester or Platform Admin can verify and close this record');
  }

  const now = new Date().toISOString();
  settlement.status = 'completed';
  settlement.confirmation = {
    confirmedAt: now,
    confirmedBy: actor.id,
    confirmedByName: actor.name,
    confirmationNotes: params.notes?.trim() || 'Funds verified in destination account and matched with UTR proof.',
    isDisputed: false
  };
  settlement.updatedAt = now;

  settlement.auditTrail.push({
    id: `aud_${Date.now().toString().slice(-4)}_close`,
    action: 'CONFIRMED_AND_CLOSED',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    timestamp: now,
    details: 'Verified receipt of funds and permanently closed settlement ledger record'
  });

  writeDb(db);

  if (pgPool) {
    pgPool.query(
      `UPDATE settlements SET status = $1, confirmation = $2, audit_trail = $3, updated_at = NOW() WHERE id = $4`,
      [settlement.status, JSON.stringify(settlement.confirmation), JSON.stringify(settlement.auditTrail), settlement.id]
    ).catch((e: any) => console.warn('[PG Confirm Notice]:', e.message));
  }

  return settlement;
}

export function disputeSettlement(params: {
  settlementId: string;
  actorId: string;
  reason: string;
}): Settlement {
  const db = readDb();
  const settlement = db.settlements.find(s => s.id === params.settlementId);
  if (!settlement) {
    throw new Error('Settlement not found');
  }

  const actor = db.users.find(u => u.id === params.actorId);
  if (!actor) {
    throw new Error('Actor not found');
  }

  const now = new Date().toISOString();
  settlement.status = 'disputed';
  settlement.confirmation = {
    isDisputed: true,
    disputeReason: params.reason.trim(),
    disputedAt: now,
    confirmedBy: actor.id,
    confirmedByName: actor.name
  };
  settlement.updatedAt = now;

  settlement.auditTrail.push({
    id: `aud_${Date.now().toString().slice(-4)}_disp`,
    action: 'FLAGGED_DISPUTE',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    timestamp: now,
    details: `Dispute raised: ${params.reason.trim()}`
  });

  writeDb(db);

  if (pgPool) {
    pgPool.query(
      `UPDATE settlements SET status = $1, confirmation = $2, audit_trail = $3, updated_at = NOW() WHERE id = $4`,
      [settlement.status, JSON.stringify(settlement.confirmation), JSON.stringify(settlement.auditTrail), settlement.id]
    ).catch((e: any) => console.warn('[PG Dispute Notice]:', e.message));
  }

  return settlement;
}

// -------------------------------------------------------------
// PLATFORM COLLECTION ACCOUNTS
// -------------------------------------------------------------

export function getPlatformAccounts(): PlatformCollectionAccount[] {
  const db = readDb();
  return db.platformAccounts;
}

export function savePlatformAccount(accountData: Omit<PlatformCollectionAccount, 'id' | 'updatedAt'> & { id?: string }): PlatformCollectionAccount {
  const db = readDb();
  const existingIndex = accountData.id ? db.platformAccounts.findIndex(a => a.id === accountData.id) : -1;

  if (existingIndex >= 0) {
    const updated = {
      ...db.platformAccounts[existingIndex],
      ...accountData,
      id: db.platformAccounts[existingIndex].id,
      updatedAt: new Date().toISOString()
    };
    db.platformAccounts[existingIndex] = updated;
    writeDb(db);
    return updated;
  } else {
    const newAccount: PlatformCollectionAccount = {
      id: `acc_${Date.now().toString().slice(-6)}`,
      type: accountData.type,
      title: accountData.title.trim(),
      upiId: accountData.upiId?.trim(),
      accountHolder: accountData.accountHolder.trim(),
      accountNumber: accountData.accountNumber?.trim(),
      ifscCode: accountData.ifscCode?.trim(),
      bankName: accountData.bankName?.trim(),
      notes: accountData.notes?.trim(),
      isActive: accountData.isActive ?? true,
      updatedAt: new Date().toISOString()
    };
    db.platformAccounts.push(newAccount);
    writeDb(db);
    return newAccount;
  }
}

export function deletePlatformAccount(id: string): void {
  const db = readDb();
  db.platformAccounts = db.platformAccounts.filter(a => a.id !== id);
  writeDb(db);
}

// -------------------------------------------------------------
// STATS CALCULATION
// -------------------------------------------------------------

export function getStats(role: Role, userId: string): SettlementStats {
  const db = readDb();
  let settlements = [...db.settlements];

  if (role === 'merchant') {
    settlements = settlements.filter(s => s.requesterId === userId);
  } else if (role === 'subadmin') {
    settlements = settlements.filter(s => s.recipientId === userId || s.requesterId === userId);
  }

  const totalSettledAmount = settlements
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const totalPendingAmount = settlements
    .filter(s => s.status === 'pending' || s.status === 'paid_pending_confirmation')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const totalPendingCount = settlements.filter(s => s.status === 'pending').length;
  const totalAwaitingReviewCount = settlements.filter(s => s.status === 'paid_pending_confirmation').length;
  const totalCompletedCount = settlements.filter(s => s.status === 'completed').length;
  const totalDisputedCount = settlements.filter(s => s.status === 'disputed').length;

  let merchantsCount = 0;
  let subAdminsCount = 0;

  if (role === 'admin') {
    merchantsCount = db.users.filter(u => u.role === 'merchant').length;
    subAdminsCount = db.users.filter(u => u.role === 'subadmin').length;
  } else if (role === 'subadmin') {
    merchantsCount = db.users.filter(u => u.role === 'merchant' && (u.subAdminId === userId || u.createdBy === userId)).length;
    subAdminsCount = 1;
  } else {
    merchantsCount = 1;
    subAdminsCount = 1;
  }

  return {
    totalSettledAmount,
    totalPendingAmount,
    totalPendingCount,
    totalAwaitingReviewCount,
    totalCompletedCount,
    totalDisputedCount,
    merchantsCount,
    subAdminsCount
  };
}

export function checkUtrAvailability(utr: string, excludeSettlementId?: string): { isAvailable: boolean; existingSettlementId?: string } {
  const db = readDb();
  const trimmed = utr.trim().toLowerCase();
  if (!trimmed) return { isAvailable: true };
  const found = db.settlements.find(
    s => s.id !== excludeSettlementId && s.clearing?.utrNumber?.trim().toLowerCase() === trimmed
  );
  return {
    isAvailable: !found,
    existingSettlementId: found?.id
  };
}

