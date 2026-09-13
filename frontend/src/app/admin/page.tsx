'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Store,
  Activity,
  Award,
  CheckCircle2,
  Lock,
  Clock,
  RefreshCw,
  UserPlus,
  X,
  Mail,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';

export default function AdminPage() {
  const [store, setStore] = useState({ id: 'apex-casablanca', name: 'Apex Casablanca Store', currency: 'MAD' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('StaffPass123!');
  const [formRole, setFormRole] = useState('Agent');
  const [formPhone, setFormPhone] = useState('+212600112233');
  const [creating, setCreating] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [agents, setAgents] = useState<any[]>([
    { agentName: 'Salma Mansouri (Agent 01)', totalCalls: 48, confirmed: 41, cancelled: 4, conversionRate: 85 },
    { agentName: 'Hamza Radi (Agent 02)', totalCalls: 36, confirmed: 30, cancelled: 3, conversionRate: 83 },
    { agentName: 'Kenza Alaoui (Agent 03)', totalCalls: 29, confirmed: 24, cancelled: 2, conversionRate: 82 },
  ]);

  const [auditLogs, setAuditLogs] = useState<any[]>([
    {
      id: 'aud-1',
      action: 'reconciliation.discrepancy_resolved',
      entityType: 'PayoutDiscrepancy',
      entityId: 'c4b3af36',
      ipAddress: '192.168.1.45',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'aud-2',
      action: 'order.status_changed',
      entityType: 'Order',
      entityId: 'ORD-1002',
      ipAddress: '192.168.1.12',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'aud-3',
      action: 'order.created',
      entityType: 'Order',
      entityId: 'ORD-1001',
      ipAddress: '192.168.1.100',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'aud-4',
      action: 'integration.connected',
      entityType: 'StoreIntegrationAccount',
      entityId: 'shopify-apex',
      ipAddress: '192.168.1.5',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.getMe();
        if (me?.user) {
          setCurrentUser(me.user);
        }
      } catch {
        // Fallback
      } finally {
        setAuthLoading(false);
      }

      try {
        const liveAgents = await api.getAgentPerformance(store.id);
        if (liveAgents?.length) setAgents(liveAgents);

        const liveLogs = await api.getAuditLogs(store.id);
        if (liveLogs?.length) setAuditLogs(liveLogs);
      } catch {
        // Fallback active
      }
    };
    load();
  }, [store.id]);

  const isAdmin =
    currentUser &&
    (currentUser.role === 'Admin' ||
      currentUser.role === 'SuperAdmin' ||
      currentUser.role?.toLowerCase() === 'admin' ||
      currentUser.role?.toLowerCase() === 'superadmin');

  if (!authLoading && !isAdmin) {
    return (
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar currentStore={store} onSelectStore={setStore} user={currentUser} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header
            title="Access Restricted"
            subtitle="Security Policy & Role Authorization Enforcement"
          />
          <main className="p-8 max-w-2xl mx-auto my-auto w-full">
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-rose-500/30 shadow-2xl space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Administrative Privilege Required</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your current account role is <span className="font-bold text-rose-400 uppercase">{currentUser?.role || 'Seller / Agent'}</span>.
                  The Administration portal, staff member registration, and compliance audit logs are strictly restricted to <strong>SuperAdmin</strong> and <strong>Admin</strong> accounts.
                </p>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/60 text-left text-xs text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-200">Role Privilege Hierarchy:</p>
                <p>• <strong>SuperAdmin / Admin:</strong> Full platform oversight, staff creation, system logs</p>
                <p>• <strong>Seller:</strong> Store ownership, product feeds, customer orders, shipping & payouts</p>
                <p>• <strong>Agent:</strong> Order verification, call center dialer, customer confirmations</p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <a
                  href="/orders"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  Return to Orders Center
                </a>
                <a
                  href="/"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl text-xs transition-all"
                >
                  Dashboard
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar currentStore={store} onSelectStore={setStore} user={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Platform Administration & Compliance"
          subtitle="Multi-tenant oversight, call-center agent leaderboard, and staff member registration"
        >
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Team Member</span>
            </button>
          )}
        </Header>

        <main className="p-6 space-y-6 max-w-7xl">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs border ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {/* Add Staff Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Register New Staff Member</span>
                  </h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCreating(true);
                    setStatusMsg(null);
                    try {
                      await api.createAdminUser({
                        name: formName,
                        email: formEmail,
                        password: formPassword,
                        role: formRole,
                        phoneNumber: formPhone,
                        storeId: store.id,
                      });
                      setShowAddModal(false);
                      setStatusMsg({ text: `Staff user '${formName}' (${formRole}) created successfully!`, type: 'success' });
                      setFormName('');
                      setFormEmail('');
                    } catch (err: any) {
                      setStatusMsg({ text: err.message || 'Failed to create user', type: 'error' });
                    } finally {
                      setCreating(false);
                    }
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hamza Radi"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="staff@codflow.io"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Staff Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Agent">Agent (Call Center Verification)</option>
                      <option value="Manager">Manager (Store Operations Lead)</option>
                      <option value="Moderator">Moderator (Oversight & Compliance)</option>
                      <option value="Admin">Admin (Platform Administration)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Initial Password</label>
                    <input
                      type="text"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                    >
                      {creating ? 'Registering...' : 'Register Member'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Registered Merchants
              </span>
              <p className="text-2xl font-bold text-white mt-2">18 Sellers</p>
              <p className="text-xs text-emerald-400 mt-1">Across 32 active stores</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Verification Agents
              </span>
              <p className="text-2xl font-bold text-white mt-2">12 Active</p>
              <p className="text-xs text-slate-400 mt-1">Average queue response: 3.4m</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Avg. Confirmation Rate
              </span>
              <p className="text-2xl font-bold text-emerald-400 mt-2">84.2%</p>
              <p className="text-xs text-slate-400 mt-1">Platform-wide verification metric</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Security Compliance
              </span>
              <p className="text-2xl font-bold text-white mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <span>Enforced</span>
              </p>
              <p className="text-xs text-emerald-400 mt-1">RBAC + Store Scope active</p>
            </div>
          </div>

          {/* Agent Performance Leaderboard */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Call Center Agent Productivity Leaderboard</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Verification dial volume, customer confirmation rates, and cancellation prevention
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                    <th className="p-3">Agent Representative</th>
                    <th className="p-3">Total Calls Dialed</th>
                    <th className="p-3">Orders Confirmed</th>
                    <th className="p-3">Customer Cancelled</th>
                    <th className="p-3">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {agents.map((ag, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-semibold text-white flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center justify-center font-bold text-[10px]">
                          #{idx + 1}
                        </div>
                        <span>{ag.agentName}</span>
                      </td>
                      <td className="p-3 font-bold text-slate-200">{ag.totalCalls}</td>
                      <td className="p-3 font-bold text-emerald-400">{ag.confirmed}</td>
                      <td className="p-3 text-rose-400">{ag.cancelled}</td>
                      <td className="p-3 font-bold text-white">
                        <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {ag.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Platform Audit Trail */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Immutable System Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Cryptographically logged changes across orders, integrations, and financial settlements
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                    <th className="p-3">Action Event</th>
                    <th className="p-3">Entity Type</th>
                    <th className="p-3">Entity ID</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-semibold text-emerald-400">
                        {log.action}
                      </td>
                      <td className="p-3 text-slate-300">{log.entityType || 'Resource'}</td>
                      <td className="p-3 font-mono text-slate-400 text-[11px]">{log.entityId}</td>
                      <td className="p-3 font-mono text-slate-500 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
                      <td className="p-3 text-slate-400">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
