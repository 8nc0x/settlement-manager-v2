export type Role = 'admin' | 'subadmin' | 'merchant';

export interface BankAccountDetails {
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface User {
  id: string;
  email: string;
  password: string; // Plaintext or hashed; remembered without forget-password flow
  name: string;
  role: Role;
  createdBy?: string; // Sub-admin or admin who created this user
  subAdminId?: string; // Assigned agent for merchants
  subAdminName?: string;
  phone?: string;
  businessName?: string;
  defaultUpiId?: string;
  bankDetails?: BankAccountDetails;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export type SettlementStatus = 
  | 'pending'                  // Requested by merchant/subadmin, waiting for payer to clear
  | 'paid_pending_confirmation' // Cleared by subadmin/admin with proof & UTR, waiting for requester to verify
  | 'completed'                // Verified and permanently closed by requester
  | 'disputed'                 // Requester flagged missing funds or incorrect UTR
  | 'rejected';                // Payer rejected request with reason

export type SettlementType = 
  | 'merchant_to_subadmin' 
  | 'subadmin_to_admin';

export interface SettlementDateRange {
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (optional time constraint)
  endDate: string;   // YYYY-MM-DD
  endTime?: string;   // HH:mm
}

export interface SettlementPayoutDetails {
  method: 'upi' | 'bank';
  upiId?: string;
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
}

export type ProofType = 'image' | 'file_excel_csv' | 'file_pdf' | 'web_link' | 'voucher';

export interface SettlementClearingInfo {
  clearedAt?: string;
  clearedBy?: string;
  clearedByName?: string;
  clearedByRole?: Role;
  utrNumber?: string; // 12-digit UPI / IMPS UTR or Bank Ref
  proofType?: ProofType;
  proofUrl?: string; // Base64 or image URL or document data URL
  proofFileName?: string; // e.g. settlement_statement.xlsx, oct_recon.csv
  proofFileSize?: string;
  proofMimeType?: string;
  proofLink?: string; // Cloud or banking portal reference link
  clearingRemarks?: string;
}

export interface SettlementConfirmationInfo {
  confirmedAt?: string;
  confirmedBy?: string;
  confirmedByName?: string;
  confirmationNotes?: string;
  isDisputed?: boolean;
  disputeReason?: string;
  disputedAt?: string;
}

export interface SettlementAuditLog {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  timestamp: string;
  details?: string;
}

export interface Settlement {
  id: string;
  type: SettlementType;
  requesterId: string;
  requesterName: string;
  requesterRole: Role;
  requesterBusiness?: string;
  
  recipientId: string;
  recipientName: string;
  recipientRole: Role;
  
  amount: number;
  dateRange: SettlementDateRange;
  payoutDetails: SettlementPayoutDetails;
  merchantNotes?: string;
  
  status: SettlementStatus;
  clearing?: SettlementClearingInfo;
  confirmation?: SettlementConfirmationInfo;
  auditTrail: SettlementAuditLog[];
  
  createdAt: string;
  updatedAt: string;
}

export interface PlatformCollectionAccount {
  id: string;
  type: 'upi' | 'bank';
  title: string;
  upiId?: string;
  accountHolder: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  notes?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface SettlementStats {
  totalSettledAmount: number;
  totalPendingAmount: number;
  totalPendingCount: number;
  totalAwaitingReviewCount: number;
  totalCompletedCount: number;
  totalDisputedCount: number;
  merchantsCount: number;
  subAdminsCount: number;
}
