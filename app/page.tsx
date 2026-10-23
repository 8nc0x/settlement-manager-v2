'use client';

import React from 'react';
import { User, Settlement, Role, SettlementStats, PlatformCollectionAccount } from '@/types';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import SettlementCard from '@/components/SettlementCard';
import RaiseSettlementModal from '@/components/RaiseSettlementModal';
import ClearSettlementModal from '@/components/ClearSettlementModal';
import ReviewProofModal from '@/components/ReviewProofModal';
import MerchantManagementModal from '@/components/MerchantManagementModal';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import PlatformAccountsModal from '@/components/PlatformAccountsModal';
import AuthView from '@/components/AuthView';
import { 
  PlusCircle, 
  Search, 
  Download, 
  Users, 
  Building2, 
  KeyRound, 
  CheckCircle2, 
  Clock3, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  Filter, 
  Smartphone,
  ShieldCheck,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loadingUser, setLoadingUser] = React.useState<boolean>(true);
  const [currentTab, setCurrentTab] = React.useState<string>('dashboard');

  // Settlements data
  const [settlements, setSettlements] = React.useState<Settlement[]>([]);
  const [stats, setStats] = React.useState<SettlementStats | null>(null);
  const [loadingData, setLoadingData] = React.useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  // Users data for sub-admin / admin
  const [userList, setUserList] = React.useState<User[]>([]);
  const [platformAccounts, setPlatformAccounts] = React.useState<PlatformCollectionAccount[]>([]);

  // Modals state
  const [isRaiseModalOpen, setIsRaiseModalOpen] = React.useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = React.useState<boolean>(false);
  const [selectedSettlementToClear, setSelectedSettlementToClear] = React.useState<Settlement | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = React.useState<boolean>(false);
  const [selectedSettlementToReview, setSelectedSettlementToReview] = React.useState<Settlement | null>(null);

  const [isAddMerchantModalOpen, setIsAddMerchantModalOpen] = React.useState<boolean>(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = React.useState<boolean>(false);
  const [selectedUserToReset, setSelectedUserToReset] = React.useState<User | null>(null);

  const [isPlatformAccountsModalOpen, setIsPlatformAccountsModalOpen] = React.useState<boolean>(false);

  // Load session
  React.useEffect(() => {
    let isMounted = true;
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
        setLoadingUser(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Session error', err);
        setCurrentUser(null);
        setLoadingUser(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch settlements and statistics
  const reloadData = React.useCallback(async () => {
    if (!currentUser) return;
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('role', currentUser.role);
      queryParams.set('userId', currentUser.id);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (typeFilter !== 'all') queryParams.set('type', typeFilter);
      if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());

      const [settleRes, statsRes] = await Promise.all([
        fetch(`/api/settlements?${queryParams.toString()}`),
        fetch(`/api/stats?role=${currentUser.role}&userId=${currentUser.id}`)
      ]);

      const settleData = await settleRes.json();
      const statsData = await statsRes.json();

      if (settleData.success) setSettlements(settleData.settlements);
      if (statsData.success) setStats(statsData.stats);

      if (currentUser.role === 'subadmin') {
        const usersRes = await fetch(`/api/users?subAdminId=${currentUser.id}&requesterId=${currentUser.id}`);
        const uData = await usersRes.json();
        if (uData.success) setUserList(uData.users);
      } else if (currentUser.role === 'admin') {
        const [usersRes, accRes] = await Promise.all([
          fetch(`/api/users?requesterId=${currentUser.id}`),
          fetch('/api/platform-accounts')
        ]);
        const uData = await usersRes.json();
        const aData = await accRes.json();
        if (uData.success) setUserList(uData.users);
        if (aData.success) setPlatformAccounts(aData.accounts);
      } else if (currentUser.role === 'merchant') {
        const accRes = await fetch('/api/platform-accounts');
        const aData = await accRes.json();
        if (aData.success) setPlatformAccounts(aData.accounts);
      }
    } catch (err) {
      console.error('Error reloading data', err);
    }
  }, [currentUser, statusFilter, typeFilter, searchQuery]);

  React.useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    const queryParams = new URLSearchParams();
    queryParams.set('role', currentUser.role);
    queryParams.set('userId', currentUser.id);
    if (statusFilter !== 'all') queryParams.set('status', statusFilter);
    if (typeFilter !== 'all') queryParams.set('type', typeFilter);
    if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());

    Promise.all([
      fetch(`/api/settlements?${queryParams.toString()}`).then((r) => r.json()),
      fetch(`/api/stats?role=${currentUser.role}&userId=${currentUser.id}`).then((r) => r.json()),
      currentUser.role === 'subadmin'
        ? fetch(`/api/users?subAdminId=${currentUser.id}&requesterId=${currentUser.id}`).then((r) => r.json())
        : currentUser.role === 'admin'
        ? fetch(`/api/users?requesterId=${currentUser.id}`).then((r) => r.json())
        : Promise.resolve({ success: false, users: [] }),
      currentUser.role === 'admin' || currentUser.role === 'merchant'
        ? fetch('/api/platform-accounts').then((r) => r.json())
        : Promise.resolve({ success: false, accounts: [] })
    ])
      .then(([settleData, statsData, usersData, accData]) => {
        if (!isMounted) return;
        if (settleData.success) setSettlements(settleData.settlements);
        if (statsData.success) setStats(statsData.stats);
        if (usersData.success) setUserList(usersData.users);
        if (accData.success) setPlatformAccounts(accData.accounts);
        setLoadingData(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading data', err);
        setLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser, statusFilter, typeFilter, searchQuery]);

  // Switch demo persona
  const handleSwitchRole = async (targetRole: Role) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch-role', targetRole })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setCurrentTab('dashboard');
      }
    } catch (err) {
      console.error('Switch error', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setCurrentUser(null);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">Loading SettleTrack Portal...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onLoginSuccess={(u) => { setCurrentUser(u); setCurrentTab('dashboard'); }} />;
  }

  // Count items requiring action
  const pendingClearCount = settlements.filter(s => {
    if (s.status !== 'pending') return false;
    if (currentUser.role === 'subadmin') return s.recipientId === currentUser.id && s.type === 'merchant_to_subadmin';
    if (currentUser.role === 'admin') return s.type === 'subadmin_to_admin' || s.type === 'merchant_to_subadmin';
    return false;
  }).length;

  const awaitingReviewCount = settlements.filter(s => {
    if (s.status !== 'paid_pending_confirmation') return false;
    if (currentUser.role === 'merchant') return s.requesterId === currentUser.id;
    if (currentUser.role === 'subadmin') return s.type === 'subadmin_to_admin' && s.requesterId === currentUser.id;
    if (currentUser.role === 'admin') return true;
    return false;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col pb-20 md:pb-10">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
        {/* ========================================================= */}
        {/* VIEW 1: DASHBOARD OVERVIEW */}
        {/* ========================================================= */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Role Header Banner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="capitalize">{currentUser.role} Workspace</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentUser.businessName || 'Settlement Portal'}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                  Welcome, {currentUser.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  {currentUser.role === 'merchant' &&
                    'Request settlements from your Agent for any date range with custom UPI or Bank payout. Review proof vouchers and confirm receipt once credited.'}
                  {currentUser.role === 'subadmin' &&
                    'Manage your affiliated merchants, clear their settlement requests with manual payment + screenshot voucher & UTR, or request platform clearance from the Admin.'}
                  {currentUser.role === 'admin' &&
                    'Platform Owner control: oversee platform collections, clear Sub-Admin settlement payouts, manage collection UPI/bank accounts, and administer passwords.'}
                </p>
              </div>

              {/* Primary Actions based on Role */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {currentUser.role === 'merchant' && (
                  <button
                    onClick={() => setIsRaiseModalOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Raise Settlement Request</span>
                  </button>
                )}

                {currentUser.role === 'subadmin' && (
                  <>
                    <button
                      onClick={() => setIsAddMerchantModalOpen(true)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Add Merchant</span>
                    </button>
                    <button
                      onClick={() => setIsRaiseModalOpen(true)}
                      className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Request Payout from Admin</span>
                    </button>
                  </>
                )}

                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={() => setIsPlatformAccountsModalOpen(true)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Building2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Collection Banks &amp; UPI</span>
                    </button>
                    <a
                      href="/api/export?format=csv"
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Action Required Alert Cards */}
            {awaitingReviewCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                      {awaitingReviewCount} Settlement{awaitingReviewCount > 1 ? 's' : ''} Awaiting Your Verification &amp; Closure
                    </h3>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                      The payer has transferred the funds, attached payment screenshots, and recorded the bank UTR. Inspect the proof and confirm receipt to permanently reconcile.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('paid_pending_confirmation');
                    setCurrentTab('settlements');
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg whitespace-nowrap transition-colors"
                >
                  Review Proofs Now →
                </button>
              </div>
            )}

            {pendingClearCount > 0 && (
              <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-sky-950 dark:text-sky-200">
                      {pendingClearCount} Pending Settlement Request{pendingClearCount > 1 ? 's' : ''} to Clear
                    </h3>
                    <p className="text-xs text-sky-800/90 dark:text-sky-300/80 mt-0.5">
                      Pay manually to requested UPI / Bank accounts, attach screenshot proof, enter UTR number, and mark cleared.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('pending');
                    setCurrentTab('settlements');
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg whitespace-nowrap transition-colors"
                >
                  Clear Settlements →
                </button>
              </div>
            )}

            {/* Financial KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Metric 1: Settled Volume */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Total Reconciled
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                  ₹{(stats?.totalSettledAmount || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{stats?.totalCompletedCount || 0} completed records</span>
                </div>
              </div>

              {/* Metric 2: Pending Clearance */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Pending Volume
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-1">
                  ₹{(stats?.totalPendingAmount || 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5 text-sky-500" />
                  <span>{stats?.totalPendingCount || 0} requests awaiting pay</span>
                </div>
              </div>

              {/* Metric 3: Awaiting Review */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  Proof Verification
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                  {stats?.totalAwaitingReviewCount || 0}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Paid with UTR · Pending Payee confirmation
                </div>
              </div>

              {/* Metric 4: Role Counts */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                  {currentUser.role === 'admin' ? 'Network Entities' : currentUser.role === 'subadmin' ? 'My Merchants' : 'Assigned Agent'}
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-1">
                  {currentUser.role === 'admin'
                    ? `${stats?.merchantsCount || 0} Merch / ${stats?.subAdminsCount || 0} Agents`
                    : currentUser.role === 'subadmin'
                    ? `${stats?.merchantsCount || userList.length} Merchants`
                    : currentUser.subAdminName || 'Rahul Deshmukh'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {currentUser.role === 'merchant' ? 'Referral Agent' : 'Active accounts'}
                </div>
              </div>
            </div>

            {/* Recent Settlements List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Recent Settlements
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live settlement record feed with real-time audit logs
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('settlements')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View Full Ledger →
                </button>
              </div>

              {settlements.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No settlements recorded yet. Click &quot;Raise Settlement Request&quot; to begin.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {settlements.slice(0, 5).map((settlement) => (
                    <SettlementCard
                      key={settlement.id}
                      settlement={settlement}
                      currentUser={currentUser}
                      onClear={(s) => {
                        setSelectedSettlementToClear(s);
                        setIsClearModalOpen(true);
                      }}
                      onReview={(s) => {
                        setSelectedSettlementToReview(s);
                        setIsReviewModalOpen(true);
                      }}
                      onViewDetails={(s) => {
                        setSelectedSettlementToReview(s);
                        setIsReviewModalOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SETTLEMENTS LEDGER (ALL RECORDS WITH FILTERS) */}
        {/* ========================================================= */}
        {currentTab === 'settlements' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Settlements Permanent Ledger
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Complete audit records of settlement requests, UTR submissions, proofs, and receipts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/export?role=${currentUser.role}&userId=${currentUser.id}&format=csv`}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </a>
                <button
                  onClick={reloadData}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search and Status Tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Settlement ID, UTR, Merchant, or Amount..."
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-slate-900 dark:text-white outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({settlements.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Pending Clear
                </button>
                <button
                  onClick={() => setStatusFilter('paid_pending_confirmation')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === 'paid_pending_confirmation'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Awaiting Review
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    statusFilter === 'completed'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Reconciled / Closed
                </button>
              </div>
            </div>

            {/* List */}
            {settlements.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No matching settlements found
                </p>
                <p className="text-xs text-slate-400">
                  Try adjusting your filters or search terms.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((settlement) => (
                  <SettlementCard
                    key={settlement.id}
                    settlement={settlement}
                    currentUser={currentUser}
                    onClear={(s) => {
                      setSelectedSettlementToClear(s);
                      setIsClearModalOpen(true);
                    }}
                    onReview={(s) => {
                      setSelectedSettlementToReview(s);
                      setIsReviewModalOpen(true);
                    }}
                    onViewDetails={(s) => {
                      setSelectedSettlementToReview(s);
                      setIsReviewModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: MY MERCHANTS (FOR SUB-ADMIN & ADMIN) */}
        {/* ========================================================= */}
        {(currentTab === 'merchants' || currentTab === 'all-users') && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {currentUser.role === 'admin' ? 'All Platform Users & Agents' : 'My Affiliated Merchants'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Create merchant accounts, manage credentials, and reset merchant passwords
                </p>
              </div>

              {(currentUser.role === 'subadmin' || currentUser.role === 'admin') && (
                <button
                  onClick={() => setIsAddMerchantModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add New Merchant</span>
                </button>
              )}
            </div>

            {/* Merchant Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {userList.map((usr) => (
                <div
                  key={usr.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {usr.role} · ID: {usr.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {usr.name}
                        </h3>
                        <div className="text-xs text-slate-500 font-medium">
                          {usr.businessName || 'Merchant'}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </div>

                    <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Login ID:</span>
                        <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[170px]">{usr.email}</span>
                      </div>
                      {usr.password && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Password:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{usr.password}</span>
                        </div>
                      )}
                      {usr.defaultUpiId && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Default UPI:</span>
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[170px]">{usr.defaultUpiId}</span>
                        </div>
                      )}
                      {usr.phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Phone:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-sans">{usr.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Reset Password */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Created {new Date(usr.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserToReset(usr);
                        setIsResetPasswordModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <KeyRound className="w-3 h-3 text-amber-500" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: AGENT & PLATFORM BANK INFO (FOR MERCHANT) */}
        {/* ========================================================= */}
        {currentTab === 'agent-info' && (
          <div className="space-y-5 max-w-3xl">
            <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Agent &amp; Platform Banking Information
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Details of your referral Sub-Admin and Platform collection accounts
              </p>
            </div>

            {/* My Sub-Admin card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Your Assigned Referral Agent (Sub-Admin)</span>
              </h2>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Agent Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{currentUser.subAdminName || 'Rahul Deshmukh'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Agency:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">RD Referral Agency &amp; Settlements</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settlement Role:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Clears your settlement requests &amp; uploads UTR proof</span>
                </div>
              </div>
            </div>

            {/* Platform Collection Accounts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>Official Platform Collection Accounts (Admin HQ)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Where platform money is collected by Admin via UPI and Bank accounts:
              </p>

              <div className="space-y-2.5">
                {platformAccounts.map((acc) => (
                  <div key={acc.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between font-sans font-bold text-slate-900 dark:text-white">
                      <span>{acc.title}</span>
                      <span className="text-[10px] text-emerald-500 uppercase">{acc.type}</span>
                    </div>
                    {acc.type === 'upi' ? (
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">{acc.upiId}</div>
                    ) : (
                      <div className="text-slate-700 dark:text-slate-300">
                        {acc.bankName} · A/C: {acc.accountNumber} · IFSC: {acc.ifscCode}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: PLATFORM COLLECTION ACCOUNTS (FOR ADMIN) */}
        {/* ========================================================= */}
        {currentTab === 'accounts' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Platform Collection Bank Accounts &amp; UPI
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official bank accounts and UPI IDs where platform deposits are collected
                </p>
              </div>
              <button
                onClick={() => setIsPlatformAccountsModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Manage Accounts</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformAccounts.map((acc) => (
                <div key={acc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {acc.type === 'upi' ? (
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Building2 className="w-4 h-4 text-blue-500" />
                      )}
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{acc.title}</h3>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-500 uppercase">{acc.type}</span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-1">
                    <div className="text-slate-500 font-sans">Entity: {acc.accountHolder}</div>
                    {acc.type === 'upi' ? (
                      <div className="text-emerald-500 font-bold">{acc.upiId}</div>
                    ) : (
                      <>
                        <div className="text-slate-800 dark:text-slate-200">Bank: {acc.bankName}</div>
                        <div className="text-slate-800 dark:text-slate-200 font-bold">A/C: {acc.accountNumber}</div>
                        <div className="text-slate-500">IFSC: {acc.ifscCode}</div>
                      </>
                    )}
                  </div>
                  {acc.notes && <p className="text-[11px] text-slate-400">{acc.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: PROFILE & PERMANENT RECORDS BACKUP */}
        {/* ========================================================= */}
        {currentTab === 'profile' && (
          <div className="space-y-5 max-w-2xl">
            <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Account &amp; Permanent Ledger Records
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Session info, credentials policy, and permanent ledger data exports
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Account Details</h2>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold capitalize text-emerald-600 dark:text-emerald-400">{currentUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email / Login ID:</span>
                  <span className="font-mono text-slate-900 dark:text-white">{currentUser.email}</span>
                </div>
                {currentUser.businessName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Business / Store:</span>
                    <span className="text-slate-900 dark:text-white">{currentUser.businessName}</span>
                  </div>
                )}
                {currentUser.defaultUpiId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Default UPI:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{currentUser.defaultUpiId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Permanent Storage & Export */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Permanent Ledger Exports</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All settlements, UTR numbers, payment proofs, and audit timestamps are permanently stored in the system database. You can export the ledger anytime for offline compliance.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <a
                  href="/api/export?format=csv"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Ledger as CSV</span>
                </a>

                <a
                  href="/api/export?format=json"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download Raw JSON Backup</span>
                </a>
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/60"
              >
                Log Out of SettleTrack
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        role={currentUser.role}
        onOpenNewAction={() => {
          if (currentUser.role === 'merchant') {
            setIsRaiseModalOpen(true);
          } else if (currentUser.role === 'subadmin') {
            setIsRaiseModalOpen(true);
          } else {
            setIsPlatformAccountsModalOpen(true);
          }
        }}
        pendingClearCount={pendingClearCount}
        awaitingReviewCount={awaitingReviewCount}
      />

      {/* MODALS */}
      {/* 1. Raise Settlement Modal */}
      <RaiseSettlementModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          reloadData();
          setCurrentTab('settlements');
        }}
      />

      {/* 2. Clear Settlement (Payer) Modal */}
      <ClearSettlementModal
        isOpen={isClearModalOpen}
        settlement={selectedSettlementToClear}
        onClose={() => {
          setIsClearModalOpen(false);
          setSelectedSettlementToClear(null);
        }}
        currentUser={currentUser}
        onSuccess={() => {
          reloadData();
        }}
      />

      {/* 3. Review Proof & Close (Payee) Modal */}
      <ReviewProofModal
        isOpen={isReviewModalOpen}
        settlement={selectedSettlementToReview}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedSettlementToReview(null);
        }}
        currentUser={currentUser}
        onSuccess={() => {
          reloadData();
        }}
      />

      {/* 4. Add Merchant Modal */}
      <MerchantManagementModal
        isOpen={isAddMerchantModalOpen}
        onClose={() => setIsAddMerchantModalOpen(false)}
        currentUser={currentUser}
        onSuccess={() => {
          reloadData();
        }}
      />

      {/* 5. Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        targetUser={selectedUserToReset}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setSelectedUserToReset(null);
        }}
        currentUser={currentUser}
        onSuccess={() => {
          reloadData();
        }}
      />

      {/* 6. Platform Accounts Modal */}
      <PlatformAccountsModal
        isOpen={isPlatformAccountsModalOpen}
        onClose={() => setIsPlatformAccountsModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
