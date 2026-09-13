'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store as StoreIcon,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  User,
  Phone,
  Coins,
  Globe,
  Truck,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X,
  Save,
  Check,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

export default function StoresPage() {
  const [currentStore, setCurrentStore] = useState({ id: 'default', name: 'Store', currency: 'MAD' });
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('Loading');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCurrency, setFormCurrency] = useState('MAD');
  const [formCountry, setFormCountry] = useState('Morocco');
  const [formPhone, setFormPhone] = useState('');
  const [formFulfillment, setFormFulfillment] = useState('STANDARD');
  const [formConfirmComm, setFormConfirmComm] = useState<number>(5);
  const [formDeliverComm, setFormDeliverComm] = useState<number>(15);
  const [formIsActive, setFormIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadStores = async () => {
    try {
      setLoading(true);
      const me = await api.getMe();
      if (me?.user) {
        setUser(me.user);
        setRole(me.user.role || 'Seller');
      }

      const active = api.getCurrentStore();
      if (active) {
        setCurrentStore(active);
      } else if (me?.stores && me.stores.length > 0) {
        setCurrentStore(me.stores[0]);
        api.setCurrentStore(me.stores[0]);
      }

      const userRole = me?.user?.role;
      if (userRole === 'SuperAdmin' || userRole === 'Admin') {
        const all = await api.getAllStores();
        setStores(Array.isArray(all) ? all : []);
      } else if (userRole === 'Agent') {
        // Agent sees stores assigned to them
        setStores(Array.isArray(me?.assignedStores) ? me.assignedStores : Array.isArray(me?.stores) ? me.stores : []);
      } else {
        // Seller sees their stores
        const sellerStores = await api.getStores();
        if (Array.isArray(sellerStores) && sellerStores.length > 0) {
          setStores(sellerStores);
        } else if (Array.isArray(me?.stores)) {
          setStores(me.stores);
        } else {
          setStores([]);
        }
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const openCreateModal = () => {
    setFormName('');
    setFormSlug('');
    setFormCurrency('MAD');
    setFormCountry('Morocco');
    setFormPhone('');
    setFormFulfillment('STANDARD');
    setFormConfirmComm(5);
    setFormDeliverComm(15);
    setFormIsActive(true);
    setActionError('');
    setShowCreateModal(true);
  };

  const openEditModal = (s: any) => {
    setEditingStore(s);
    setFormName(s.name || '');
    setFormSlug(s.slug || '');
    setFormCurrency(s.currency || 'MAD');
    setFormCountry(s.country || 'Morocco');
    setFormPhone(s.phone || '');
    setFormFulfillment(s.fulfillmentType || 'STANDARD');
    setFormConfirmComm(Number(s.agentCommissionPerConfirmedOrder ?? 5));
    setFormDeliverComm(Number(s.agentCommissionPerDeliveredOrder ?? 15));
    setFormIsActive(s.status === 'ACTIVE' || s.isActive !== false);
    setActionError('');
    setShowEditModal(true);
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError('');

    try {
      const created = await api.createStore({
        name: formName,
        currency: formCurrency,
        country: formCountry,
        phone: formPhone,
        fulfillmentType: formFulfillment,
        agentCommissionPerConfirmedOrder: Number(formConfirmComm),
        agentCommissionPerDeliveredOrder: Number(formDeliverComm),
      });

      setShowCreateModal(false);
      setActionSuccess(`Store "${formName}" created successfully!`);
      setTimeout(() => setActionSuccess(''), 4000);
      await loadStores();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create store');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    setSaving(true);
    setActionError('');

    try {
      await api.updateStore(editingStore.id, {
        name: formName,
        slug: formSlug,
        currency: formCurrency,
        country: formCountry,
        phone: formPhone,
        fulfillmentType: formFulfillment,
        agentCommissionPerConfirmedOrder: Number(formConfirmComm),
        agentCommissionPerDeliveredOrder: Number(formDeliverComm),
        status: formIsActive ? 'ACTIVE' : 'PAUSED',
        isActive: formIsActive,
      });

      setShowEditModal(false);
      setActionSuccess(`Store "${formName}" updated successfully!`);
      setTimeout(() => setActionSuccess(''), 4000);

      // If updating active store, update local selection
      if (currentStore.id === editingStore.id) {
        const updated = { ...currentStore, name: formName, currency: formCurrency };
        setCurrentStore(updated);
        api.setCurrentStore(updated);
      }

      await loadStores();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update store');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (!confirm(`Are you sure you want to delete store "${storeName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteStore(storeId);
      setActionSuccess(`Store "${storeName}" deleted.`);
      setTimeout(() => setActionSuccess(''), 4000);
      await loadStores();
    } catch (err: any) {
      alert(`Failed to delete store: ${err.message}`);
    }
  };

  const handleToggleStatus = async (s: any) => {
    const isCurrentlyActive = s.status === 'ACTIVE' || s.isActive !== false;
    const newStatus = isCurrentlyActive ? 'PAUSED' : 'ACTIVE';
    try {
      await api.updateStore(s.id, { status: newStatus, isActive: !isCurrentlyActive });
      setActionSuccess(`Store "${s.name}" set to ${newStatus}.`);
      setTimeout(() => setActionSuccess(''), 3000);
      await loadStores();
    } catch (err: any) {
      alert(`Failed to toggle status: ${err.message}`);
    }
  };

  const handleSelectActiveStore = (s: any) => {
    const updated = { id: s.id, name: s.name, currency: s.currency || 'MAD' };
    setCurrentStore(updated);
    api.setCurrentStore(updated);
    setActionSuccess(`Switched active workspace to "${s.name}".`);
    setTimeout(() => setActionSuccess(''), 2500);
  };

  // Filtered stores
  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.seller?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const isStoreActive = s.status === 'ACTIVE' || s.isActive !== false;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isStoreActive) ||
      (statusFilter === 'PAUSED' && !isStoreActive);

    const matchesCurrency = currencyFilter === 'ALL' || s.currency === currencyFilter;

    return matchesSearch && matchesStatus && matchesCurrency;
  });

  const isSuperAdmin = role === 'SuperAdmin' || role?.toLowerCase() === 'superadmin';
  const isSuperAdminOrAdmin = isSuperAdmin || role === 'Admin';
  const isSeller = role === 'Seller';
  const isAgent = role === 'Agent';

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar activeStore={currentStore} onStoreChange={setCurrentStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header activeStore={currentStore} />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Banner & Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    {isSuperAdminOrAdmin && 'Platform Stores Master Directory'}
                    {isSeller && 'My Stores & Channels'}
                    {isAgent && 'Assigned Stores & Commission Rates'}
                  </h1>
                  <p className="text-xs text-slate-400">
                    {isSuperAdminOrAdmin && 'Comprehensive directory of every registered store, merchant owner, and regional fulfillment configuration.'}
                    {isSeller && 'Manage your store brand profiles, currencies, country targeting, and call agent commission incentives.'}
                    {isAgent && 'Stores and merchants you are actively assigned to confirm orders and earn commissions.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadStores}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                title="Refresh Stores"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {isSeller && (
                <Link
                  href="/integrations/stores"
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 hover:text-white text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all shadow-sm"
                >
                  <Layers className="w-4 h-4" />
                  <span>Integrate Store (Shopify / YouCan)</span>
                </Link>
              )}

              {(isSeller || isSuperAdminOrAdmin) && (
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Store</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback Messages */}
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Search & Filters Bar */}
          <div className="glass-panel p-4 rounded-2xl border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSuperAdminOrAdmin ? "Filter by store name, slug, seller email..." : "Search stores..."}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({stores.length})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('PAUSED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === 'PAUSED' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Paused
                </button>
              </div>

              {/* Currency Filter */}
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Currencies</option>
                <option value="MAD">MAD (Morocco)</option>
                <option value="SAR">SAR (Saudi Arabia)</option>
                <option value="AED">AED (UAE)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Stores List Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-xs">Loading stores directory...</p>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border-slate-800 text-slate-400">
              <StoreIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No stores found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'Try adjusting your search criteria or filter tags.' : 'No stores match your current selection.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStores.map((s) => {
                const isActive = s.status === 'ACTIVE' || s.isActive !== false;
                const isSelectedStore = currentStore.id === s.id;
                const integration = s.integrations && s.integrations.length > 0 ? s.integrations[0] : null;
                const platformName = integration?.provider?.name || integration?.accountName || (s.settings?.platform ? s.settings.platform.toUpperCase() : 'Integrated Store');
                const externalDomain = integration?.externalShopDomain || s.settings?.externalDomain || s.settings?.storeUrl;

                return (
                  <div
                    key={s.id}
                    className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelectedStore
                        ? 'border-emerald-500/50 bg-emerald-950/10 ring-1 ring-emerald-500/30'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base shrink-0">
                            {s.name?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate max-w-[170px]" title={s.name}>
                                {s.name}
                              </h3>
                              {isSelectedStore && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500 text-slate-950">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" />
                                {platformName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                /{s.slug || s.name?.toLowerCase().replace(/\s+/g, '-')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <button
                          onClick={() => (isSuperAdminOrAdmin || isSeller) && handleToggleStatus(s)}
                          disabled={isAgent}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                          } ${isAgent ? 'cursor-default' : 'cursor-pointer'}`}
                          title={isAgent ? 'Store status' : 'Click to toggle status'}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{isActive ? 'Active' : 'Paused'}</span>
                        </button>
                      </div>

                      {/* Store Meta Details */}
                      <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs">
                        {externalDomain && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Globe className="w-3.5 h-3.5" /> Shop Domain:
                            </span>
                            <a
                              href={externalDomain.startsWith('http') ? externalDomain : `https://${externalDomain}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <span>{externalDomain}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {/* Seller Owner Info (Visible to Admins and Agents) */}
                        {(isSuperAdminOrAdmin || isAgent) && s.seller && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <User className="w-3.5 h-3.5" /> Merchant Owner:
                            </span>
                            <span className="font-semibold text-slate-200">
                              {s.seller?.name || s.seller?.email || 'Registered Merchant'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Globe className="w-3.5 h-3.5" /> Market & Currency:
                          </span>
                          <span className="font-semibold text-white">
                            {s.country || 'Morocco'} • <span className="font-mono text-emerald-400">{s.currency || 'MAD'}</span>
                          </span>
                        </div>

                        {s.phone && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="w-3.5 h-3.5" /> Support Line:
                            </span>
                            <span className="font-mono text-slate-300">{s.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Truck className="w-3.5 h-3.5" /> Fulfillment:
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                            {s.fulfillmentType || 'STANDARD'}
                          </span>
                        </div>

                        {/* Agent Commission Rates */}
                        <div className="flex items-center justify-between text-slate-400 pt-1">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Coins className="w-3.5 h-3.5 text-amber-400" /> Agent Payout:
                          </span>
                          <span className="text-[11px] font-semibold text-amber-300">
                            +{s.agentCommissionPerConfirmedOrder ?? 5} {s.currency || 'MAD'} conf. / +{s.agentCommissionPerDeliveredOrder ?? 15} {s.currency || 'MAD'} deliv.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/stores/${s.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 hover:text-white text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all"
                        >
                          <span>Store Page</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        {!isSelectedStore && (
                          <button
                            type="button"
                            onClick={() => handleSelectActiveStore(s)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors"
                            title="Set as active workspace"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">Use</span>
                          </button>
                        )}
                      </div>

                      {(isSuperAdminOrAdmin || isSeller) && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title="Edit Store Parameters"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isSeller && stores.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStore(s.id, s.name)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                              title="Delete Store"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal: Create Store */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Create New Store</h3>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateStore} className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Store Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Beauty Marrakech"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Currency *</label>
                      <select
                        value={formCurrency}
                        onChange={(e) => setFormCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="MAD">MAD (Moroccan Dirham)</option>
                        <option value="SAR">SAR (Saudi Riyal)</option>
                        <option value="AED">AED (UAE Dirham)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Country *</label>
                      <input
                        type="text"
                        value={formCountry}
                        onChange={(e) => setFormCountry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        placeholder="+212 600 000 000"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Fulfillment Mode</label>
                      <select
                        value={formFulfillment}
                        onChange={(e) => setFormFulfillment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="STANDARD">Standard COD (24h-48h)</option>
                        <option value="EXPRESS">Same-Day Express</option>
                        <option value="SELF_DELIVERY">Self Fulfillment</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" /> Call Agent Commission Rates ({formCurrency})
                      </span>
                      {!isSuperAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <Lock className="w-3 h-3" /> SuperAdmin Only
                        </span>
                      )}
                    </div>
                    {!isSuperAdmin && (
                      <p className="text-[10px] text-slate-500">
                        Only platform SuperAdmins can calibrate call agent payouts. Default system rates will be applied.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Per Confirmed Order</label>
                        <input
                          type="number"
                          disabled={!isSuperAdmin}
                          min="0"
                          step="0.5"
                          value={formConfirmComm}
                          onChange={(e) => setFormConfirmComm(Number(e.target.value))}
                          className={cn(
                            "w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white",
                            !isSuperAdmin && "opacity-60 cursor-not-allowed bg-slate-950 text-slate-400"
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Per Delivered Order</label>
                        <input
                          type="number"
                          disabled={!isSuperAdmin}
                          min="0"
                          step="0.5"
                          value={formDeliverComm}
                          onChange={(e) => setFormDeliverComm(Number(e.target.value))}
                          className={cn(
                            "w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white",
                            !isSuperAdmin && "opacity-60 cursor-not-allowed bg-slate-950 text-slate-400"
                          )}
                        />
                      </div>
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
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-emerald-600/20"
                    >
                      {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>Create Store</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Edit Store (Modify Everything) */}
          {showEditModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Modify Store Parameters</h3>
                      <p className="text-[11px] text-slate-400">Editing store settings, currency, rates & profile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateStore} className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Store Name *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Slug / Identifier</label>
                      <input
                        type="text"
                        value={formSlug}
                        onChange={(e) => setFormSlug(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Currency *</label>
                      <select
                        value={formCurrency}
                        onChange={(e) => setFormCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="MAD">MAD (Moroccan Dirham)</option>
                        <option value="SAR">SAR (Saudi Riyal)</option>
                        <option value="AED">AED (UAE Dirham)</option>
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Country</label>
                      <input
                        type="text"
                        value={formCountry}
                        onChange={(e) => setFormCountry(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Support Phone</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Fulfillment Mode</label>
                      <select
                        value={formFulfillment}
                        onChange={(e) => setFormFulfillment(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="STANDARD">Standard COD (24h-48h)</option>
                        <option value="EXPRESS">Same-Day Express</option>
                        <option value="SELF_DELIVERY">Self Fulfillment</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5" /> Call Agent Commission Rates ({formCurrency})
                      </span>
                      {!isSuperAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <Lock className="w-3 h-3" /> SuperAdmin Only
                        </span>
                      )}
                    </div>
                    {!isSuperAdmin && (
                      <p className="text-[10px] text-slate-500">
                        Only platform SuperAdmins have permission to calibrate call agent payouts. Payout adjustments must be approved by administration.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Per Confirmed Order</label>
                        <input
                          type="number"
                          disabled={!isSuperAdmin}
                          min="0"
                          step="0.5"
                          value={formConfirmComm}
                          onChange={(e) => setFormConfirmComm(Number(e.target.value))}
                          className={cn(
                            "w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white",
                            !isSuperAdmin && "opacity-60 cursor-not-allowed bg-slate-950 text-slate-400"
                          )}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Per Delivered Order</label>
                        <input
                          type="number"
                          disabled={!isSuperAdmin}
                          min="0"
                          step="0.5"
                          value={formDeliverComm}
                          onChange={(e) => setFormDeliverComm(Number(e.target.value))}
                          className={cn(
                            "w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white",
                            !isSuperAdmin && "opacity-60 cursor-not-allowed bg-slate-950 text-slate-400"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="font-semibold text-white block">Active Operational Status</span>
                      <span className="text-[11px] text-slate-400">Enable or pause order processing for this store</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
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
