import fs from 'fs';
import path from 'path';
import { 
  User, 
  Settlement, 
  PlatformCollectionAccount, 
  SettlementStats, 
  Role 
} from '@/types';

// Storage path: in production PM2 or local Next.js dev server, stored under ./data/settlements-data.json
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'settlements-data.json');

interface DatabaseSchema {
  version: number;
  users: User[];
  settlements: Settlement[];
  platformAccounts: PlatformCollectionAccount[];
  lastUpdated: string;
}

// Generate realistic SVG voucher screenshot for initial seed data
function createSampleProofVoucher(amount: number, utr: string, recipientName: string, upi: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="none">
    <rect width="600" height="750" rx="20" fill="#0F172A"/>
    <circle cx="300" cy="90" r="42" fill="#10B981" fill-opacity="0.2"/>
    <circle cx="300" cy="90" r="32" fill="#10B981"/>
    <path d="M290 90L297 97L311 83" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    
    <text x="300" y="155" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle">Payment Successful</text>
    <text x="300" y="180" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="14" text-anchor="middle">Transfer to Beneficiary Complete</text>
    
    <text x="300" y="240" fill="#F8FAFC" font-family="system-ui, sans-serif" font-size="38" font-weight="800" text-anchor="middle">₹${amount.toLocaleString('en-IN')}.00</text>
    
    <!-- Voucher Card -->
    <rect x="40" y="280" width="520" height="380" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    
    <text x="70" y="325" fill="#64748B" font-family="system-ui, sans-serif" font-size="13">PAID TO</text>
    <text x="70" y="348" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="17" font-weight="600">${recipientName}</text>
    <text x="70" y="370" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="14">${upi}</text>
    
    <line x1="70" y1="395" x2="530" y2="395" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>
    
    <text x="70" y="430" fill="#64748B" font-family="system-ui, sans-serif" font-size="13">UPI / BANK UTR NUMBER</text>
    <text x="70" y="455" fill="#F1F5F9" font-family="monospace" font-size="18" font-weight="700" letter-spacing="1">${utr}</text>
    
    <line x1="70" y1="480" x2="530" y2="480" stroke="#334155" stroke-width="1" stroke-dasharray="4 4"/>
    
    <text x="70" y="515" fill="#64748B" font-family="system-ui, sans-serif" font-size="13">PAYMENT MODE</text>
    <text x="70" y="538" fill="#F1F5F9" font-family="system-ui, sans-serif" font-size="15" font-weight="500">IMPS / Unified Payments Interface (UPI)</text>
    
    <text x="70" y="580" fill="#64748B" font-family="system-ui, sans-serif" font-size="13">SETTLEMENT AUDIT STATUS</text>
    <text x="70" y="605" fill="#10B981" font-family="system-ui, sans-serif" font-size="15" font-weight="600">✓ Debited &amp; Transferred by Agent</text>
    
    <rect x="70" y="625" width="460" height="20" rx="4" fill="#0F172A"/>
    <text x="300" y="639" fill="#94A3B8" font-family="monospace" font-size="11" text-anchor="middle">TXN REF: NPCI-SETTLE-${utr.slice(0, 6)}</text>
    
    <text x="300" y="700" fill="#64748B" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">Official Banking Settlement Screenshot Voucher</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Initial default seed state
const initialData: DatabaseSchema = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  users: [
    {
      id: 'usr_admin',
      email: 'admin@platform.com',
      password: 'admin123',
      name: 'Vikram Singhania',
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
      id: 'usr_sub_1',
      email: 'subadmin.rahul@platform.com',
      password: 'subadmin123',
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
      id: 'usr_sub_2',
      email: 'subadmin.priya@platform.com',
      password: 'subadmin123',
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
    {
      id: 'usr_merch_1',
      email: 'merchant.sharma@store.in',
      password: 'merchant123',
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
      id: 'usr_merch_2',
      email: 'merchant.gupta@mart.com',
      password: 'merchant123',
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
    {
      id: 'usr_merch_3',
      email: 'merchant.khan@fastpay.com',
      password: 'merchant123',
      name: 'Imran Khan',
      role: 'merchant',
      createdBy: 'usr_sub_2',
      subAdminId: 'usr_sub_2',
      subAdminName: 'Priya Verma',
      businessName: 'Khan Auto Spare Parts',
      phone: '+91 99100 44771',
      defaultUpiId: 'khan.spares@ybl',
      bankDetails: {
        accountHolder: 'Khan Auto Spares',
        accountNumber: '318492019482',
        ifscCode: 'BARB0VABAND',
        bankName: 'Bank of Baroda'
      },
      status: 'active',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z'
    }
  ],
  settlements: [
    {
      id: 'SET-9014',
      type: 'merchant_to_subadmin',
      requesterId: 'usr_merch_1',
      requesterName: 'Sunil Sharma',
      requesterRole: 'merchant',
      requesterBusiness: 'Sharma Electronics & Mobile Mart',
      recipientId: 'usr_sub_1',
      recipientName: 'Rahul Deshmukh',
      recipientRole: 'subadmin',
      amount: 84500,
      dateRange: {
        startDate: '2026-10-18',
        startTime: '00:00',
        endDate: '2026-10-21',
        endTime: '23:59'
      },
      payoutDetails: {
        method: 'upi',
        upiId: 'sharma.electronics@paytm'
      },
      merchantNotes: 'Festival sales settlement request for 18-21 Oct',
      status: 'paid_pending_confirmation',
      clearing: {
        clearedAt: '2026-10-22T14:32:00.000Z',
        clearedBy: 'usr_sub_1',
        clearedByName: 'Rahul Deshmukh',
        clearedByRole: 'subadmin',
        utrNumber: '429188402914',
        proofUrl: createSampleProofVoucher(84500, '429188402914', 'Sharma Electronics', 'sharma.electronics@paytm'),
        clearingRemarks: 'Transferred via HDFC netbanking IMPS. Screenshot voucher attached.'
      },
      auditTrail: [
        {
          id: 'aud_1',
          action: 'SETTLEMENT_CREATED',
          actorId: 'usr_merch_1',
          actorName: 'Sunil Sharma',
          actorRole: 'merchant',
          timestamp: '2026-10-22T10:15:00.000Z',
          details: 'Raised request for ₹84,500 (Date Range: 18 Oct to 21 Oct)'
        },
        {
          id: 'aud_2',
          action: 'PAYMENT_CLEARED_BY_SUBADMIN',
          actorId: 'usr_sub_1',
          actorName: 'Rahul Deshmukh',
          actorRole: 'subadmin',
          timestamp: '2026-10-22T14:32:00.000Z',
          details: 'Payment recorded with UTR: 429188402914 and payment proof screenshot. Awaiting merchant confirmation.'
        }
      ],
      createdAt: '2026-10-22T10:15:00.000Z',
      updatedAt: '2026-10-22T14:32:00.000Z'
    },
    {
      id: 'SET-9013',
      type: 'merchant_to_subadmin',
      requesterId: 'usr_merch_2',
      requesterName: 'Anita Gupta',
      requesterRole: 'merchant',
      requesterBusiness: 'Gupta Super General Store',
      recipientId: 'usr_sub_1',
      recipientName: 'Rahul Deshmukh',
      recipientRole: 'subadmin',
      amount: 42750,
      dateRange: {
        startDate: '2026-10-20',
        startTime: '09:00',
        endDate: '2026-10-22',
        endTime: '21:00'
      },
      payoutDetails: {
        method: 'upi',
        upiId: 'guptamart@upi'
      },
      merchantNotes: 'Store QR collections settlement',
      status: 'pending',
      auditTrail: [
        {
          id: 'aud_3',
          action: 'SETTLEMENT_CREATED',
          actorId: 'usr_merch_2',
          actorName: 'Anita Gupta',
          actorRole: 'merchant',
          timestamp: '2026-10-23T08:20:00.000Z',
          details: 'Requested settlement of ₹42,750 to UPI: guptamart@upi'
        }
      ],
      createdAt: '2026-10-23T08:20:00.000Z',
      updatedAt: '2026-10-23T08:20:00.000Z'
    },
    {
      id: 'SET-9012',
      type: 'merchant_to_subadmin',
      requesterId: 'usr_merch_1',
      requesterName: 'Sunil Sharma',
      requesterRole: 'merchant',
      requesterBusiness: 'Sharma Electronics & Mobile Mart',
      recipientId: 'usr_sub_1',
      recipientName: 'Rahul Deshmukh',
      recipientRole: 'subadmin',
      amount: 120000,
      dateRange: {
        startDate: '2026-10-14',
        startTime: '00:00',
        endDate: '2026-10-17',
        endTime: '23:59'
      },
      payoutDetails: {
        method: 'bank',
        accountHolder: 'Sharma Electronics & Mobile',
        accountNumber: '91802004512938',
        ifscCode: 'SBIN0004521',
        bankName: 'State Bank of India'
      },
      merchantNotes: 'Mid-month settlement to SBI Current Account',
      status: 'completed',
      clearing: {
        clearedAt: '2026-10-18T11:45:00.000Z',
        clearedBy: 'usr_sub_1',
        clearedByName: 'Rahul Deshmukh',
        clearedByRole: 'subadmin',
        utrNumber: '428901248910',
        proofUrl: createSampleProofVoucher(120000, '428901248910', 'Sharma Electronics (SBI)', '91802004512938'),
        clearingRemarks: 'Bank transfer completed via RTGS/NEFT'
      },
      confirmation: {
        confirmedAt: '2026-10-18T13:10:00.000Z',
        confirmedBy: 'usr_merch_1',
        confirmedByName: 'Sunil Sharma',
        confirmationNotes: 'Verified in SBI NetBanking. Funds received in full. Settlement closed.'
      },
      auditTrail: [
        {
          id: 'aud_4',
          action: 'SETTLEMENT_CREATED',
          actorId: 'usr_merch_1',
          actorName: 'Sunil Sharma',
          actorRole: 'merchant',
          timestamp: '2026-10-18T09:00:00.000Z',
          details: 'Raised request for ₹1,20,000 to SBI Account'
        },
        {
          id: 'aud_5',
          action: 'PAYMENT_CLEARED_BY_SUBADMIN',
          actorId: 'usr_sub_1',
          actorName: 'Rahul Deshmukh',
          actorRole: 'subadmin',
          timestamp: '2026-10-18T11:45:00.000Z',
          details: 'Payment recorded with UTR: 428901248910 and proof voucher'
        },
        {
          id: 'aud_6',
          action: 'SETTLEMENT_CONFIRMED_AND_CLOSED',
          actorId: 'usr_merch_1',
          actorName: 'Sunil Sharma',
          actorRole: 'merchant',
          timestamp: '2026-10-18T13:10:00.000Z',
          details: 'Merchant Sunil verified proof and credited account. Settlement closed permanently.'
        }
      ],
      createdAt: '2026-10-18T09:00:00.000Z',
      updatedAt: '2026-10-18T13:10:00.000Z'
    },
    {
      id: 'SET-9011',
      type: 'subadmin_to_admin',
      requesterId: 'usr_sub_1',
      requesterName: 'Rahul Deshmukh',
      requesterRole: 'subadmin',
      requesterBusiness: 'RD Referral Agency',
      recipientId: 'usr_admin',
      recipientName: 'Vikram Singhania (Platform Owner)',
      recipientRole: 'admin',
      amount: 247250,
      dateRange: {
        startDate: '2026-10-15',
        startTime: '00:00',
        endDate: '2026-10-21',
        endTime: '23:59'
      },
      payoutDetails: {
        method: 'upi',
        upiId: 'rahul.rd@okaxis'
      },
      merchantNotes: 'Agent aggregated settlement payout for 6 affiliated merchants',
      status: 'paid_pending_confirmation',
      clearing: {
        clearedAt: '2026-10-22T18:15:00.000Z',
        clearedBy: 'usr_admin',
        clearedByName: 'Vikram Singhania',
        clearedByRole: 'admin',
        utrNumber: '429104819203',
        proofUrl: createSampleProofVoucher(247250, '429104819203', 'Rahul Deshmukh Agency', 'rahul.rd@okaxis'),
        clearingRemarks: 'Platform clearance approved and sent via ICICI Corporate Payouts'
      },
      auditTrail: [
        {
          id: 'aud_7',
          action: 'SUBADMIN_SETTLEMENT_REQUESTED',
          actorId: 'usr_sub_1',
          actorName: 'Rahul Deshmukh',
          actorRole: 'subadmin',
          timestamp: '2026-10-22T11:00:00.000Z',
          details: 'Sub-Admin requested ₹2,47,250 platform payout from Admin'
        },
        {
          id: 'aud_8',
          action: 'PAYMENT_CLEARED_BY_ADMIN',
          actorId: 'usr_admin',
          actorName: 'Vikram Singhania',
          actorRole: 'admin',
          timestamp: '2026-10-22T18:15:00.000Z',
          details: 'Admin paid ₹2,47,250 with UTR: 429104819203 and uploaded banking screenshot'
        }
      ],
      createdAt: '2026-10-22T11:00:00.000Z',
      updatedAt: '2026-10-22T18:15:00.000Z'
    },
    {
      id: 'SET-9010',
      type: 'subadmin_to_admin',
      requesterId: 'usr_sub_1',
      requesterName: 'Rahul Deshmukh',
      requesterRole: 'subadmin',
      requesterBusiness: 'RD Referral Agency',
      recipientId: 'usr_admin',
      recipientName: 'Vikram Singhania (Platform Owner)',
      recipientRole: 'admin',
      amount: 510000,
      dateRange: {
        startDate: '2026-10-01',
        startTime: '00:00',
        endDate: '2026-10-14',
        endTime: '23:59'
      },
      payoutDetails: {
        method: 'bank',
        accountHolder: 'Rahul Deshmukh Agency',
        accountNumber: '50100412891234',
        ifscCode: 'HDFC0001042',
        bankName: 'HDFC Bank'
      },
      merchantNotes: 'First fortnight platform clearance',
      status: 'completed',
      clearing: {
        clearedAt: '2026-10-15T15:20:00.000Z',
        clearedBy: 'usr_admin',
        clearedByName: 'Vikram Singhania',
        clearedByRole: 'admin',
        utrNumber: '428801938210',
        proofUrl: createSampleProofVoucher(510000, '428801938210', 'Rahul Deshmukh Agency (HDFC)', '50100412891234'),
        clearingRemarks: 'Processed via Corporate CMS RTGS'
      },
      confirmation: {
        confirmedAt: '2026-10-15T16:00:00.000Z',
        confirmedBy: 'usr_sub_1',
        confirmedByName: 'Rahul Deshmukh',
        confirmationNotes: 'Received in HDFC Corporate Current Account. Fully reconciled.'
      },
      auditTrail: [
        {
          id: 'aud_9',
          action: 'SUBADMIN_SETTLEMENT_REQUESTED',
          actorId: 'usr_sub_1',
          actorName: 'Rahul Deshmukh',
          actorRole: 'subadmin',
          timestamp: '2026-10-15T10:00:00.000Z',
          details: 'Sub-Admin requested ₹5,10,000 from Admin'
        },
        {
          id: 'aud_10',
          action: 'PAYMENT_CLEARED_BY_ADMIN',
          actorId: 'usr_admin',
          actorName: 'Vikram Singhania',
          actorRole: 'admin',
          timestamp: '2026-10-15T15:20:00.000Z',
          details: 'Admin paid ₹5,10,000 with UTR: 428801938210'
        },
        {
          id: 'aud_11',
          action: 'SETTLEMENT_CONFIRMED_AND_CLOSED',
          actorId: 'usr_sub_1',
          actorName: 'Rahul Deshmukh',
          actorRole: 'subadmin',
          timestamp: '2026-10-15T16:00:00.000Z',
          details: 'Sub-Admin confirmed receipt from Admin. Reconciled.'
        }
      ],
      createdAt: '2026-10-15T10:00:00.000Z',
      updatedAt: '2026-10-15T16:00:00.000Z'
    }
  ],
  platformAccounts: [
    {
      id: 'acc_1',
      type: 'upi',
      title: 'Platform Primary UPI Gateway',
      upiId: 'apexplatform.collect@icici',
      accountHolder: 'Apex Settlement Technologies Pvt Ltd',
      notes: 'Primary UPI QR & VPA collecting all customer money for the platform',
      isActive: true,
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'acc_2',
      type: 'bank',
      title: 'Platform Corporate ICICI Current Account',
      accountHolder: 'Apex Settlement Technologies Pvt Ltd',
      accountNumber: '184905001290',
      ifscCode: 'ICIC0001849',
      bankName: 'ICICI Bank Nariman Point Branch',
      notes: 'Official platform bank account where merchant incoming collections are held',
      isActive: true,
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'acc_3',
      type: 'bank',
      title: 'Secondary Escrow Payout Account',
      accountHolder: 'Apex Settlement Escrow A/C',
      accountNumber: '00449460000124',
      ifscCode: 'YESB0000044',
      bankName: 'Yes Bank Treasury',
      notes: 'Used for peak volume settlement buffer transfers',
      isActive: true,
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
  ]
};

// In-memory fallback in case of read-only environments
let inMemoryData: DatabaseSchema | null = null;

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Could not create data dir, using in-memory store:', err);
  }
}

export function readDb(): DatabaseSchema {
  try {
    ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      writeDb(initialData);
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseSchema;
    return parsed;
  } catch (err) {
    console.warn('Error reading db file, falling back to in-memory store:', err);
    if (!inMemoryData) {
      inMemoryData = JSON.parse(JSON.stringify(initialData));
    }
    return inMemoryData!;
  }
}

export function writeDb(data: DatabaseSchema): void {
  data.lastUpdated = new Date().toISOString();
  inMemoryData = JSON.parse(JSON.stringify(data));
  try {
    ensureDataDir();
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn('Error writing db file, updated in-memory copy:', err);
  }
}

// -------------------------------------------------------------
// USER OPERATIONS
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
  return db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
}

export function createUser(userData: {
  email: string;
  password: string;
  name: string;
  role: Role;
  createdBy: string;
  subAdminId?: string;
  businessName?: string;
  phone?: string;
  defaultUpiId?: string;
  bankDetails?: User['bankDetails'];
}): User {
  const db = readDb();
  const existing = db.users.find(u => u.email.toLowerCase() === userData.email.trim().toLowerCase());
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const prefix = userData.role === 'admin' ? 'usr_admin_' : userData.role === 'subadmin' ? 'usr_sub_' : 'usr_merch_';
  const newId = `${prefix}${Date.now().toString().slice(-6)}`;

  let subAdminName = undefined;
  if (userData.subAdminId) {
    const parentSub = db.users.find(u => u.id === userData.subAdminId);
    if (parentSub) {
      subAdminName = parentSub.name;
    }
  }

  const newUser: User = {
    id: newId,
    email: userData.email.trim().toLowerCase(),
    password: userData.password,
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
  return newUser;
}

export function resetPassword(targetUserId: string, newPassword: string, requesterRole: Role, requesterId: string): User {
  const db = readDb();
  const user = db.users.find(u => u.id === targetUserId);
  if (!user) {
    throw new Error('User not found');
  }

  // Authorization: Admin can reset anyone's password. Sub-admin can reset password of merchants created by or assigned to them.
  if (requesterRole === 'admin') {
    // Admin has full control
  } else if (requesterRole === 'subadmin') {
    if (user.role !== 'merchant' || (user.subAdminId !== requesterId && user.createdBy !== requesterId)) {
      throw new Error('Sub-Admins can only reset passwords for their assigned merchants');
    }
  } else {
    throw new Error('Unauthorized to reset passwords');
  }

  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  return user;
}

export function updateUserProfile(userId: string, updates: Partial<User>): User {
  const db = readDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');

  if (updates.name) user.name = updates.name.trim();
  if (updates.businessName) user.businessName = updates.businessName.trim();
  if (updates.phone) user.phone = updates.phone.trim();
  if (updates.defaultUpiId) user.defaultUpiId = updates.defaultUpiId.trim();
  if (updates.bankDetails) user.bankDetails = updates.bankDetails;
  if (updates.status && ['active', 'suspended'].includes(updates.status)) {
    user.status = updates.status;
  }
  user.updatedAt = new Date().toISOString();
  writeDb(db);
  return user;
}

// -------------------------------------------------------------
// SETTLEMENT OPERATIONS
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

  if (!filters) return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const { role, userId, status, type, search } = filters;

  if (role === 'merchant' && userId) {
    list = list.filter(s => s.requesterId === userId);
  } else if (role === 'subadmin' && userId) {
    // Sub-Admin can see:
    // 1) Settlements where they are the recipient (clearing payouts for merchants)
    // 2) Settlements where they are the requester (asking settlement from Admin)
    list = list.filter(s => s.recipientId === userId || s.requesterId === userId);
  } else if (role === 'admin') {
    // Admin sees all, but can filter by sub-admin or platform requests
  }

  if (status && status !== 'all') {
    list = list.filter(s => s.status === status);
  }

  if (type && type !== 'all') {
    list = list.filter(s => s.type === type);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(s => 
      s.id.toLowerCase().includes(q) ||
      s.requesterName.toLowerCase().includes(q) ||
      s.amount.toString().includes(q) ||
      (s.clearing?.utrNumber && s.clearing.utrNumber.toLowerCase().includes(q)) ||
      (s.payoutDetails.upiId && s.payoutDetails.upiId.toLowerCase().includes(q))
    );
  }

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
}): Settlement {
  const db = readDb();
  const requester = db.users.find(u => u.id === params.requesterId);
  if (!requester) throw new Error('Requester not found');

  if (params.amount <= 0) {
    throw new Error('Settlement amount must be greater than zero');
  }

  let recipientId = '';
  let recipientName = '';
  let recipientRole: Role = 'admin';
  let type: Settlement['type'] = 'merchant_to_subadmin';

  if (requester.role === 'merchant') {
    type = 'merchant_to_subadmin';
    recipientRole = 'subadmin';
    if (!requester.subAdminId) {
      // Fallback to first available subadmin or admin
      const subAdmin = db.users.find(u => u.role === 'subadmin') || db.users.find(u => u.role === 'admin')!;
      recipientId = subAdmin.id;
      recipientName = subAdmin.name;
    } else {
      const subAdmin = db.users.find(u => u.id === requester.subAdminId);
      if (!subAdmin) throw new Error('Assigned Sub-Admin not found');
      recipientId = subAdmin.id;
      recipientName = subAdmin.name;
    }
  } else if (requester.role === 'subadmin') {
    type = 'subadmin_to_admin';
    recipientRole = 'admin';
    const admin = db.users.find(u => u.role === 'admin');
    if (!admin) throw new Error('Platform Admin not found');
    recipientId = admin.id;
    recipientName = admin.name;
  } else {
    throw new Error('Admins do not raise settlements to themselves');
  }

  const count = db.settlements.length + 1;
  const newId = `SET-${9000 + count}`;

  const newSettlement: Settlement = {
    id: newId,
    type,
    requesterId: requester.id,
    requesterName: requester.name,
    requesterRole: requester.role,
    requesterBusiness: requester.businessName,
    recipientId,
    recipientName,
    recipientRole,
    amount: Math.round(params.amount),
    dateRange: params.dateRange,
    payoutDetails: params.payoutDetails,
    merchantNotes: params.merchantNotes?.trim(),
    status: 'pending',
    auditTrail: [
      {
        id: `aud_${Date.now()}_1`,
        action: requester.role === 'merchant' ? 'SETTLEMENT_REQUEST_CREATED' : 'PLATFORM_SETTLEMENT_REQUESTED',
        actorId: requester.id,
        actorName: requester.name,
        actorRole: requester.role,
        timestamp: new Date().toISOString(),
        details: `Settlement request created for ₹${params.amount.toLocaleString('en-IN')} (${params.dateRange.startDate} to ${params.dateRange.endDate})`
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.settlements.unshift(newSettlement);
  writeDb(db);
  return newSettlement;
}

export function clearSettlement(params: {
  settlementId: string;
  actorId: string;
  utrNumber: string;
  proofUrl?: string;
  proofType?: 'image' | 'file_excel_csv' | 'file_pdf' | 'web_link' | 'voucher';
  proofFileName?: string;
  proofFileSize?: string;
  proofMimeType?: string;
  proofLink?: string;
  remarks?: string;
}): Settlement {
  const db = readDb();
  const settlement = db.settlements.find(s => s.id === params.settlementId);
  if (!settlement) throw new Error('Settlement not found');

  const actor = db.users.find(u => u.id === params.actorId);
  if (!actor) throw new Error('Actor not found');

  // Verify actor has right to clear:
  // If merchant_to_subadmin: actor must be recipient (subadmin) or admin
  // If subadmin_to_admin: actor must be admin
  if (actor.role === 'merchant') {
    throw new Error('Merchants cannot clear settlements');
  }
  if (settlement.type === 'subadmin_to_admin' && actor.role !== 'admin') {
    throw new Error('Only the Platform Admin can clear sub-admin platform settlements');
  }

  const cleanUtr = params.utrNumber.trim();
  if (!cleanUtr || cleanUtr.length < 6) {
    throw new Error('Please provide a valid UTR or Bank Transaction Reference number (min 6 characters)');
  }

  settlement.status = 'paid_pending_confirmation';
  settlement.clearing = {
    clearedAt: new Date().toISOString(),
    clearedBy: actor.id,
    clearedByName: actor.name,
    clearedByRole: actor.role,
    utrNumber: cleanUtr,
    proofUrl: params.proofUrl,
    proofType: params.proofType || 'image',
    proofFileName: params.proofFileName,
    proofFileSize: params.proofFileSize,
    proofMimeType: params.proofMimeType,
    proofLink: params.proofLink,
    clearingRemarks: params.remarks?.trim()
  };

  settlement.auditTrail.push({
    id: `aud_${Date.now()}_2`,
    action: actor.role === 'admin' ? 'PAYMENT_CLEARED_BY_ADMIN' : 'PAYMENT_CLEARED_BY_SUBADMIN',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    timestamp: new Date().toISOString(),
    details: `Transferred payment manually. Recorded UTR: ${cleanUtr} with screenshot proof attached. Marked as Awaiting Confirmation.`
  });

  settlement.updatedAt = new Date().toISOString();
  writeDb(db);
  return settlement;
}

export function confirmSettlement(params: {
  settlementId: string;
  actorId: string;
  notes?: string;
}): Settlement {
  const db = readDb();
  const settlement = db.settlements.find(s => s.id === params.settlementId);
  if (!settlement) throw new Error('Settlement not found');

  const actor = db.users.find(u => u.id === params.actorId);
  if (!actor) throw new Error('Actor not found');

  // Authorization: Requester confirms receipt (merchant for merchant_to_subadmin, subadmin for subadmin_to_admin). Admin can also close if acting as overall overseer.
  if (actor.role !== 'admin' && actor.id !== settlement.requesterId) {
    throw new Error('Only the payee / requester who received the money can verify proof and close the settlement');
  }

  if (settlement.status !== 'paid_pending_confirmation') {
    throw new Error(`Cannot confirm settlement in '${settlement.status}' status`);
  }

  settlement.status = 'completed';
  settlement.confirmation = {
    confirmedAt: new Date().toISOString(),
    confirmedBy: actor.id,
    confirmedByName: actor.name,
    confirmationNotes: params.notes?.trim() || 'Payment verified in bank account and confirmed received.',
    isDisputed: false
  };

  settlement.auditTrail.push({
    id: `aud_${Date.now()}_3`,
    action: 'SETTLEMENT_CONFIRMED_AND_CLOSED',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    timestamp: new Date().toISOString(),
    details: `${actor.name} reviewed payment proof & UTR, verified funds in bank, and permanently closed the settlement.`
  });

  settlement.updatedAt = new Date().toISOString();
  writeDb(db);
  return settlement;
}

export function disputeSettlement(params: {
  settlementId: string;
  actorId: string;
  reason: string;
}): Settlement {
  const db = readDb();
  const settlement = db.settlements.find(s => s.id === params.settlementId);
  if (!settlement) throw new Error('Settlement not found');

  const actor = db.users.find(u => u.id === params.actorId);
  if (!actor) throw new Error('Actor not found');

  if (actor.role !== 'admin' && actor.id !== settlement.requesterId) {
    throw new Error('Only the requester or admin can raise a dispute');
  }

  settlement.status = 'disputed';
  settlement.confirmation = {
    isDisputed: true,
    disputeReason: params.reason.trim(),
    disputedAt: new Date().toISOString()
  };

  settlement.auditTrail.push({
    id: `aud_${Date.now()}_4`,
    action: 'SETTLEMENT_DISPUTED',
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    timestamp: new Date().toISOString(),
    details: `Dispute raised: ${params.reason.trim()}`
  });

  settlement.updatedAt = new Date().toISOString();
  writeDb(db);
  return settlement;
}

// -------------------------------------------------------------
// PLATFORM COLLECTION ACCOUNTS (Admin's Bank & UPI)
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
  const settlements = getSettlements({ role, userId });
  const allUsers = getUsers();

  let totalSettledAmount = 0;
  let totalPendingAmount = 0;
  let totalPendingCount = 0;
  let totalAwaitingReviewCount = 0;
  let totalCompletedCount = 0;
  let totalDisputedCount = 0;

  for (const s of settlements) {
    if (s.status === 'completed') {
      totalSettledAmount += s.amount;
      totalCompletedCount++;
    } else if (s.status === 'pending') {
      totalPendingAmount += s.amount;
      totalPendingCount++;
    } else if (s.status === 'paid_pending_confirmation') {
      totalPendingAmount += s.amount;
      totalAwaitingReviewCount++;
    } else if (s.status === 'disputed') {
      totalDisputedCount++;
    }
  }

  const merchantsCount = allUsers.filter(u => {
    if (role === 'admin') return u.role === 'merchant';
    if (role === 'subadmin') return u.role === 'merchant' && (u.subAdminId === userId || u.createdBy === userId);
    return false;
  }).length;

  const subAdminsCount = allUsers.filter(u => u.role === 'subadmin').length;

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
