'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  TrendingUp,
  PhoneCall,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  DollarSign,
  Users,
  Store as StoreIcon,
  Headphones,
  UserX,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  Send,
  Sparkles,
  Package,
  Activity,
  Layers,
  Crown,
  Shield,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';
import { formatCurrency, cn } from '../../lib/utils';

export default function RoleDashboardPage() {
  const [store, setStore] = useState<any>({ id: 'default', name: 'Atlas Commerce Live', currency: 'MAD' });
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('Loading');
  const [loading, setLoading] = useState(true);

  // Analytics Metrics
  const [metrics, setMetrics] = useState<any>({
    totalOrders: 0,
    pendingVerification: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    totalRevenue: 0,
    confirmationRate: 0,
    deliveryRate: 0,
  });

  // Assigned Agents (for Sellers)
  const [assignedAgents, setAssignedAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Agent Change Request Modal
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [changeReason, setChangeReason] = useState('SLA_DELAY');
  const [changeCriteria, setChangeCriteria] = useState('DARIJA_CLOSER');
  const [changeNotes, setChangeNotes] = useState('');
  const [submittingChange, setSubmittingChange] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  // Platform Accounts Count (for SuperAdmin/Admin)
  const [userCounts, setUserCounts] = useState({
    total: 0,
    sellers: 0,
    agents: 0,
    couriers: 0,
    admins: 0,
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const me = await api.getMe();
      if (me?.user) {
        setUser(me.user);
        setRole(me.user.role || 'Seller');
      }

      let active = api.getCurrentStore();
      if (!active && me?.stores && me.stores.length > 0) {
        active = me.stores[0];
        api.setCurrentStore(me.stores[0]);
      }
      if (active) setStore(active);

      const targetStoreId = active?.id || (me?.stores?.[0]?.id);

      if (targetStoreId && targetStoreId !== 'default') {
        // Load store metrics
        const m = await api.getMetrics(targetStoreId);
        if (m) setMetrics(m);

        // If seller, load assigned agents
        if (me?.user?.role === 'Seller') {
          setLoadingAgents(true);
          try {
            const agentsRes = await api.getStoreAgents(targetStoreId);
            const aList = Array.isArray(agentsRes?.data) ? agentsRes.data : (Array.isArray(agentsRes) ? agentsRes : []);
            setAssignedAgents(aList);
            if (aList.length > 0 && !selectedAgentId) {
              setSelectedAgentId(aList[0].user?.id || aList[0].id);
            }
          } catch {
            setAssignedAgents([]);
          } finally {
            setLoadingAgents(false);
          }
        }
      }

      // If SuperAdmin or Admin, load platform totals
      if (me?.user?.role === 'SuperAdmin' || me?.user?.role === 'Admin') {
        try {
          const allUsers = await api.getAdminUsers();
          const uList = Array.isArray(allUsers?.data?.users)
            ? allUsers.data.users
            : Array.isArray(allUsers?.users)
            ? allUsers.users
            : Array.isArray(allUsers?.data)
            ? allUsers.data
            : Array.isArray(allUsers)
            ? allUsers
            : [];
          setUserCounts({
            total: uList.length,
            sellers: uList.filter((u: any) => u.role === 'Seller').length,
            agents: uList.filter((u: any) => u.role === 'Agent').length,
            couriers: uList.filter((u: any) => u.role === 'Courier').length,
            admins: uList.filter((u: any) => u.role === 'Admin' || u.role === 'SuperAdmin').length,
          });
        } catch {}
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleRequestAgentChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    setSubmittingChange(true);
    try {
      const res = await api.requestAgentChange({
        storeId: store.id,
        agentId: selectedAgentId,
        reason: `${changeReason}: ${changeNotes || 'Seller requested replacement'}`,
        preferredCriteria: changeCriteria,
        notes: changeNotes,
      });

      const ticket = res?.data?.ticketId || res?.ticketId || `REQ-AGT-${Date.now().toString().slice(-4)}`;
      setTicketSuccess(ticket);
      setTimeout(() => {
        setShowChangeModal(false);
        setTicketSuccess(null);
        setChangeNotes('');
      }, 3500);
    } catch (err: any) {
      alert(`Failed to submit request: ${err.message}`);
    } finally {
      setSubmittingChange(false);
    }
  };

  const isSeller = role === 'Seller';
  const isAgent = role === 'Agent';
  const isCourier = role === 'Courier';
  const isSuperAdmin = role === 'SuperAdmin' || role?.toLowerCase() === 'superadmin';
  const isAdmin = isSuperAdmin || role === 'Admin' || role?.toLowerCase() === 'admin';

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar activeStore={store} onStoreChange={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header activeStore={store} />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {isSeller && 'Merchant Business Command Dashboard'}
                      {isAgent && 'Call Representative Verification Portal'}
                      {isCourier && 'Courier Last-Mile Dispatch Dashboard'}
                      {isAdmin && 'Executive System Operations Dashboard'}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                      {role} Scope
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isSeller && `Operational metrics, order confirmation funnel, and assigned agent team for ${store.name}.`}
                    {isAgent && 'Daily calling queues, confirmation performance, and earned order payout commissions.'}
                    {isCourier && 'Assigned parcel runs, delivery completion rates, and collected COD remittance.'}
                    {isAdmin && 'Platform-wide GMV, systemic confirmation health, discrepancy monitors, and user directories.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadDashboard}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {isSeller && (
                <button
                  onClick={() => setShowChangeModal(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 shadow-sm transition-all"
                >
                  <UserX className="w-4 h-4 text-amber-400" />
                  <span>Request Agent Change</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. SELLER DASHBOARD VIEW                                                  */}
          {/* ========================================================================= */}
          {isSeller && (
            <div className="space-y-6">
              {/* Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Revenue
                  </span>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(metrics.totalRevenue || 0, store.currency)}
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Live confirmed pipeline
                  </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Ingested Orders
                  </span>
                  <p className="text-2xl font-bold text-indigo-300 mt-1">
                    {metrics.totalOrders || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {metrics.pendingVerification || 0} waiting for agent call
                  </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Confirmation Rate
                  </span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {metrics.totalOrders > 0
                      ? Math.round(((metrics.confirmed || 0) / metrics.totalOrders) * 100)
                      : 0}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {metrics.confirmed || 0} orders approved by phone
                  </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Delivery Success
                  </span>
                  <p className="text-2xl font-bold text-teal-400 mt-1">
                    {metrics.shipped > 0
                      ? Math.round(((metrics.delivered || 0) / (metrics.shipped + metrics.delivered + (metrics.returned || 0))) * 100)
                      : 0}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {metrics.delivered || 0} successfully delivered
                  </p>
                </div>
              </div>

              {/* Order Status Funnel Pipeline */}
              <div className="glass-panel p-6 rounded-2xl border-slate-800 bg-slate-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      COD Funnel Velocity & Status Breakdown
                    </h3>
                    <p className="text-xs text-slate-400">Real-time lifecycle of leads through confirmation and shipping</p>
                  </div>
                  <Link href="/orders" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    View Orders <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase block">Pending Call</span>
                    <span className="text-xl font-bold text-white mt-1 block">{metrics.pendingVerification || 0}</span>
                    <span className="text-[10px] text-slate-400">Queue for agents</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/30">
                    <span className="text-[11px] font-semibold text-blue-400 uppercase block">Confirmed</span>
                    <span className="text-xl font-bold text-white mt-1 block">{metrics.confirmed || 0}</span>
                    <span className="text-[10px] text-slate-400">Ready for courier</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30">
                    <span className="text-[11px] font-semibold text-indigo-400 uppercase block">In Transit</span>
                    <span className="text-xl font-bold text-white mt-1 block">{metrics.shipped || 0}</span>
                    <span className="text-[10px] text-slate-400">Out for delivery</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase block">Delivered (COD)</span>
                    <span className="text-xl font-bold text-emerald-400 mt-1 block">{metrics.delivered || 0}</span>
                    <span className="text-[10px] text-slate-400">Cash collected</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30">
                    <span className="text-[11px] font-semibold text-rose-400 uppercase block">Returned / Cancel</span>
                    <span className="text-xl font-bold text-rose-400 mt-1 block">
                      {(metrics.returned || 0) + (metrics.cancelled || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400">Refused or returned</span>
                  </div>
                </div>
              </div>

              {/* Assigned Agents Section with Request to Change Agent */}
              <div className="glass-panel p-6 rounded-2xl border-slate-800 bg-slate-900/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-cyan-400" />
                      Assigned Call Agents for {store.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Trained operators assigned to call your store customers, verify addresses, and upsell orders.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowChangeModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all self-start sm:self-auto"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Request Agent Change</span>
                  </button>
                </div>

                {loadingAgents ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading assigned agents...
                  </div>
                ) : assignedAgents.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 rounded-xl bg-slate-950 border border-slate-800">
                    <Headphones className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-white">No dedicated agents assigned yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Platform administrators automatically allocate certified calling representatives to your store.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedAgents.map((a: any) => {
                      const agentUser = a.user || a;
                      return (
                        <div
                          key={a.assignmentId || agentUser.id}
                          className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                                {agentUser.name?.slice(0, 2).toUpperCase() || 'AG'}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">{agentUser.name}</h4>
                                <p className="text-[11px] text-slate-400">{agentUser.email}</p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              Active
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                            {agentUser.phone && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Contact Line:</span>
                                <span className="font-mono text-slate-200">{agentUser.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Language:</span>
                              <span className="text-slate-200">Moroccan Darija / French</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Avg. Call SLA:</span>
                              <span className="text-emerald-400 font-semibold">&lt; 15 mins</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                            <button
                              onClick={() => {
                                setSelectedAgentId(agentUser.id);
                                setShowChangeModal(true);
                              }}
                              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Request Reassignment</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. CALL AGENT DASHBOARD VIEW                                              */}
          {/* ========================================================================= */}
          {isAgent && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Orders in Call Queue
                  </span>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    {metrics.pendingVerification || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Ready for dialing right now</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Confirmed by Me
                  </span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {metrics.confirmed || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Leads verified & approved</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    My Confirmation Rate
                  </span>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">
                    {metrics.totalOrders > 0 ? Math.round(((metrics.confirmed || 0) / metrics.totalOrders) * 100) : 0}%
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-1">Target SLA: &gt;70%</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Estimated Commissions
                  </span>
                  <p className="text-2xl font-bold text-amber-300 mt-1">
                    +{((metrics.confirmed || 0) * (store?.agentCommissionPerConfirmedOrder || 5))} {store.currency}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    +{store?.agentCommissionPerConfirmedOrder || 5} {store.currency} / confirmed order
                  </p>
                </div>
              </div>

              {/* Call Center Queue Jump */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-cyan-400" />
                    Live Call Verification Queue Ready
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {metrics.pendingVerification || 0} orders are currently awaiting phone confirmation for {store.name}.
                  </p>
                </div>
                <Link
                  href="/call-center"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-600/20"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Start Calling Queue</span>
                </Link>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. COURIER DASHBOARD VIEW                                                 */}
          {/* ========================================================================= */}
          {isCourier && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Parcels Out For Delivery
                  </span>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">
                    {metrics.shipped || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Active on delivery route</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Delivered & Collected
                  </span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {metrics.delivered || 0}
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-1">COD Cash Collected</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Returned / Postponed
                  </span>
                  <p className="text-2xl font-bold text-rose-400 mt-1">
                    {metrics.returned || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Failed delivery attempts</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Cash in Hand to Remit
                  </span>
                  <p className="text-2xl font-bold text-amber-300 mt-1">
                    {formatCurrency(metrics.totalRevenue || 0, store.currency)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Subject to bank statement remittance</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/30 border border-orange-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-orange-400" />
                    Last-Mile Dispatch Operations
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Track shipments, print airway bills, and record delivery statuses across Moroccan couriers.
                  </p>
                </div>
                <Link
                  href="/couriers"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/20"
                >
                  <Truck className="w-4 h-4" />
                  <span>Open Couriers Hub</span>
                </Link>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. SUPERADMIN & ADMIN DASHBOARD VIEW                                      */}
          {/* ========================================================================= */}
          {isAdmin && (
            <div className="space-y-6">
              {/* Platform Executive KPI Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Platform User Directory
                  </span>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">{userCounts.total} Accounts</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {userCounts.sellers} sellers • {userCounts.agents} agents • {userCounts.couriers} couriers
                  </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Active System Pipeline
                  </span>
                  <p className="text-2xl font-bold text-white mt-1">{metrics.totalOrders || 0} Orders</p>
                  <p className="text-[11px] text-emerald-400 mt-1">
                    {metrics.confirmed || 0} confirmed platform-wide
                  </p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Global Gross COD
                  </span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {formatCurrency(metrics.totalRevenue || 0, 'MAD')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Carrier remitted funds</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Remittance Reconciliation
                  </span>
                  <p className="text-2xl font-bold text-amber-300 mt-1">Bank Statement Audit</p>
                  <p className="text-[11px] text-slate-400 mt-1">Automated discrepancy checks</p>
                </div>
              </div>

              {/* Admin Quick Access Panels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/admin/users"
                  className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Manage Accounts & Roles</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Group users by SuperAdmin, Admin, Moderator, Seller, Agent, and Courier roles.
                  </p>
                </Link>

                <Link
                  href="/stores"
                  className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <StoreIcon className="w-5 h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Stores Master Directory</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspect all merchant stores, currencies, fulfillment modes, and status controls.
                  </p>
                </Link>

                {isSuperAdmin ? (
                  <Link
                    href="/finance"
                    className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Carrier Remittances & Finance</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Audit courier bank statements, resolve CRBT discrepancies, and approve agent payouts.
                    </p>
                  </Link>
                ) : (
                  <div className="glass-panel p-5 rounded-2xl border-slate-800/40 bg-slate-900/30 opacity-70">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                        <Lock className="w-5 h-5" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-300">Finance (SuperAdmin Only)</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Financial accounting and payout calibration are strictly restricted to SuperAdmins.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL: REQUEST AGENT CHANGE (FOR SELLERS)                                 */}
          {/* ========================================================================= */}
          {showChangeModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <UserX className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Request Call Agent Reassignment</h3>
                      <p className="text-[11px] text-slate-400">Submit an official agent change request to platform administration</p>
                    </div>
                  </div>
                  <button onClick={() => setShowChangeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {ticketSuccess ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Change Request Ticket Generated</h4>
                    <p className="text-xs text-slate-300">
                      Ticket Reference: <span className="font-mono text-emerald-400 font-bold">{ticketSuccess}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Our platform supervisor will review your store metrics and assign a new certified call representative within 2-4 business hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRequestAgentChange} className="p-5 space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Select Current Agent to Replace *</label>
                      {assignedAgents.length > 0 ? (
                        <select
                          value={selectedAgentId}
                          onChange={(e) => setSelectedAgentId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        >
                          {assignedAgents.map((a: any) => {
                            const u = a.user || a;
                            return (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.email})
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="Agent name or identifier"
                          value={selectedAgentId}
                          onChange={(e) => setSelectedAgentId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Primary Reason for Request *</label>
                      <select
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="SLA_DELAY">Slow Verification / High Call Response Time</option>
                        <option value="LANGUAGE_MISMATCH">Language / Regional Dialect Mismatch</option>
                        <option value="LOW_CONVERSION">Low Confirmation Conversion Rate</option>
                        <option value="CAPACITY_SCALING">Need High-Volume Scaling Agent</option>
                        <option value="QUALITY_DISPUTE">Customer Service / Conduct Issue</option>
                        <option value="OTHER">Other Operational Requirement</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Preferred Replacement Profile</label>
                      <select
                        value={changeCriteria}
                        onChange={(e) => setChangeCriteria(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="DARIJA_CLOSER">Moroccan Darija Native High-Velocity Closer</option>
                        <option value="FRENCH_ARABIC_BILINGUAL">French & Arabic Bilingual Specialist</option>
                        <option value="GULF_ARABIC_SPECIALIST">Gulf / GCC Dialect Closer (Saudi/UAE)</option>
                        <option value="NIGHT_WEEKEND_RUSH">Night Shift & Weekend Rush Agent</option>
                        <option value="UPSELL_MAXIMIZER">Order Value & Upselling Specialist</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Additional Context or Feedback</label>
                      <textarea
                        rows={3}
                        placeholder="Provide details for our administrative supervisor to expedite replacement..."
                        value={changeNotes}
                        onChange={(e) => setChangeNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowChangeModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingChange}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-amber-600/20"
                      >
                        {submittingChange && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Change Request</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
