'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  Crown,
  Store,
  Headphones,
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Mail,
  Phone,
  UserCheck,
  AlertCircle,
  RefreshCw,
  X,
  Save,
  Check,
  Building,
  KeyRound,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; badge: string }> = {
  SuperAdmin: { label: 'SuperAdmin', icon: Crown, color: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  Admin: { label: 'Admin', icon: Shield, color: 'text-indigo-400', badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },
  Moderator: { label: 'Moderator', icon: Shield, color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  Manager: { label: 'Manager', icon: Users, color: 'text-purple-400', badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  Seller: { label: 'Seller', icon: Store, color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  Agent: { label: 'Agent', icon: Headphones, color: 'text-cyan-400', badge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
  Courier: { label: 'Courier', icon: Truck, color: 'text-orange-400', badge: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
};

const ALL_ROLES = ['SuperAdmin', 'Admin', 'Moderator', 'Manager', 'Seller', 'Agent', 'Courier'];

export default function AdminUsersPage() {
  const [store, setStore] = useState({ id: 'default', name: 'Platform Control', currency: 'MAD' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('Loading');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleTab, setSelectedRoleTab] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cRole, setCRole] = useState<string>('Agent');
  const [cPhone, setCPhone] = useState('');

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [eName, setEName] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eRole, setERole] = useState<string>('Agent');
  const [ePhone, setEPhone] = useState('');
  const [ePassword, setEPassword] = useState('');
  const [eIsActive, setEIsActive] = useState(true);

  // Status message
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const me = await api.getMe();
      if (me?.user) {
        setCurrentUser(me.user);
        setUserRole(me.user.role || 'Admin');
      }
      const res = await api.getAdminUsers();
      const list = Array.isArray(res?.data?.users) ? res.data.users : (Array.isArray(res?.users) ? res.users : (Array.isArray(res) ? res : []));
      setUsers(list);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const isSuperAdmin = userRole === 'SuperAdmin' || userRole?.toLowerCase() === 'superadmin';
  const isAdmin = isSuperAdmin || userRole === 'Admin' || userRole?.toLowerCase() === 'admin';

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createAdminUser({
        name: cName,
        email: cEmail,
        password: cPassword,
        role: cRole,
        phoneNumber: cPhone || undefined,
      });
      showToast('success', `Account for ${cName} (${cRole}) created successfully!`);
      setShowCreateModal(false);
      setCName('');
      setCEmail('');
      setCPassword('');
      setCPhone('');
      await loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEName(u.name || '');
    setEEmail(u.email || '');
    setERole(u.role || 'Agent');
    setEPhone(u.phoneNumber || '');
    setEPassword('');
    setEIsActive(u.isActive !== false);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await api.updateAdminUser(editingUser.id, {
        name: eName,
        email: eEmail,
        role: eRole,
        phoneNumber: ePhone,
        password: ePassword ? ePassword : undefined,
        isActive: eIsActive,
      });
      showToast('success', `Account ${eName} updated successfully!`);
      setShowEditModal(false);
      await loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: any) => {
    const nextState = !u.isActive;
    try {
      await api.toggleUserStatus(u.id, nextState);
      showToast('success', `Account ${u.name} set to ${nextState ? 'Active' : 'Disabled'}.`);
      await loadUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to change account status');
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber?.includes(searchQuery);

    const matchesRole = selectedRoleTab === 'ALL' || u.role === selectedRoleTab;
    return matchesSearch && matchesRole;
  });

  // Role Grouping
  const groupedByRole = ALL_ROLES.reduce((acc, r) => {
    acc[r] = filteredUsers.filter((u) => u.role === r);
    return acc;
  }, {} as Record<string, any[]>);

  // Access Control Guard
  if (userRole !== 'Loading' && !isAdmin) {
    return (
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar currentStore={store} onSelectStore={setStore} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header title="Account Management" subtitle="Platform User Directory" />
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center min-h-[500px]">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Restricted: Administrators Only</h2>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              Account directory and role assignment controls are restricted strictly to platform <strong>SuperAdmins</strong> and <strong>Admins</strong>.
            </p>
            <a
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar activeStore={store} onStoreChange={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header activeStore={store} />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Platform Accounts & Roles Directory</h1>
                  <p className="text-xs text-slate-400">
                    Manage and audit every account on the system grouped by administrative and operational roles.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadUsers}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Refresh Accounts"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Account</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{toast.text}</span>
            </div>
          )}

          {/* Search & Role Filter Tabs */}
          <div className="glass-panel p-4 rounded-2xl border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    viewMode === 'grouped' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  Grouped by Role
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  Flat List ({filteredUsers.length})
                </button>
              </div>
            </div>
          </div>

          {/* Role Filter Tabs Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedRoleTab('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all',
                selectedRoleTab === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
              )}
            >
              All Accounts ({users.length})
            </button>
            {ALL_ROLES.map((roleKey) => {
              const count = users.filter((u) => u.role === roleKey).length;
              const config = ROLE_CONFIG[roleKey];
              const Icon = config.icon;
              return (
                <button
                  key={roleKey}
                  onClick={() => setSelectedRoleTab(roleKey)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all',
                    selectedRoleTab === roleKey
                      ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', config.color)} />
                  <span>{config.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main User List Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs">Loading platform accounts...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border-slate-800 text-slate-400">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No accounts found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No accounts match your selected filter or search query.
              </p>
            </div>
          ) : viewMode === 'grouped' ? (
            /* Grouped View */
            <div className="space-y-6">
              {ALL_ROLES.filter((r) => selectedRoleTab === 'ALL' || selectedRoleTab === r).map((roleKey) => {
                const groupUsers = groupedByRole[roleKey] || [];
                if (groupUsers.length === 0 && selectedRoleTab === 'ALL') return null;
                const config = ROLE_CONFIG[roleKey];
                const Icon = config.icon;

                return (
                  <div key={roleKey} className="glass-panel p-5 rounded-2xl border-slate-800 bg-slate-900/60 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn('w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center', config.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {config.label}s
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                              {groupUsers.length} accounts
                            </span>
                          </h3>
                        </div>
                      </div>
                    </div>

                    {groupUsers.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 italic">No {config.label} accounts found.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupUsers.map((u) => (
                          <div
                            key={u.id}
                            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-white truncate" title={u.name}>
                                    {u.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5" title={u.email}>
                                    {u.email}
                                  </p>
                                </div>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0',
                                    u.isActive !== false
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  )}
                                >
                                  {u.isActive !== false ? 'Active' : 'Disabled'}
                                </span>
                              </div>

                              {u.phoneNumber && (
                                <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-600" />
                                  <span>{u.phoneNumber}</span>
                                </p>
                              )}
                            </div>

                            <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {u.id?.slice(0, 8)}...
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleToggleActive(u)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-200 text-[10px]"
                                  title={u.isActive !== false ? 'Disable Account' : 'Activate Account'}
                                >
                                  {u.isActive !== false ? (
                                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  )}
                                </button>
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="p-1 rounded text-slate-400 hover:text-indigo-400"
                                  title="Edit User"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat Table View */
            <div className="glass-panel rounded-2xl border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Account Name & Email</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Phone Number</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => {
                      const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.Agent;
                      const Icon = config.icon;
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-semibold text-white block">{u.name}</span>
                              <span className="text-[11px] text-slate-400 block font-mono">{u.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border', config.badge)}>
                              <Icon className="w-3 h-3" />
                              <span>{config.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {u.phoneNumber || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                                u.isActive !== false
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              )}
                            >
                              {u.isActive !== false ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>{u.isActive !== false ? 'Active' : 'Disabled'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit Account"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(u)}
                                className={cn(
                                  'p-1.5 rounded-lg border transition-colors',
                                  u.isActive !== false
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                )}
                                title={u.isActive !== false ? 'Disable Account' : 'Activate Account'}
                              >
                                {u.isActive !== false ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal: Create User */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Create New Platform User</h3>
                      <p className="text-[11px] text-slate-400">Provision an operational or administrative account</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Youssef El Amrani"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="user@domain.com"
                        value={cEmail}
                        onChange={(e) => setCEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Initial Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={cPassword}
                        onChange={(e) => setCPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Assigned Role *</label>
                      <select
                        value={cRole}
                        onChange={(e) => setCRole(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        {isSuperAdmin && <option value="SuperAdmin">SuperAdmin (Master Platform Admin)</option>}
                        <option value="Admin">Admin (Operations Manager)</option>
                        <option value="Moderator">Moderator (Oversight)</option>
                        <option value="Manager">Manager (Store Team Lead)</option>
                        <option value="Seller">Seller (Merchant Store Owner)</option>
                        <option value="Agent">Agent (Call Center Representative)</option>
                        <option value="Courier">Courier (Delivery Driver)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+212 600 000 000"
                        value={cPhone}
                        onChange={(e) => setCPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-indigo-600/20"
                    >
                      {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Create Account</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Edit User */}
          {showEditModal && editingUser && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Modify User Account</h3>
                      <p className="text-[11px] text-slate-400">Updating account details and role permissions</p>
                    </div>
                  </div>
                  <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={eName}
                      onChange={(e) => setEName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={eEmail}
                        onChange={(e) => setEEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={ePhone}
                        onChange={(e) => setEPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Assigned Role</label>
                      <select
                        value={eRole}
                        onChange={(e) => setERole(e.target.value)}
                        disabled={!isSuperAdmin && editingUser.role === 'SuperAdmin'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        {isSuperAdmin && <option value="SuperAdmin">SuperAdmin</option>}
                        <option value="Admin">Admin</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Manager">Manager</option>
                        <option value="Seller">Seller</option>
                        <option value="Agent">Agent</option>
                        <option value="Courier">Courier</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Reset Password (Optional)</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep"
                        value={ePassword}
                        onChange={(e) => setEPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="font-semibold text-white block">Account Status</span>
                      <span className="text-[11px] text-slate-400">Allow this user to log into the platform</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={eIsActive}
                      onChange={(e) => setEIsActive(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-indigo-600/20"
                    >
                      {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
