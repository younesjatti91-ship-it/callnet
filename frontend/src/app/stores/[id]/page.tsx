'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store as StoreIcon,
  Globe,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Coins,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Search,
  Copy,
  Check,
  Truck,
  Phone,
  ShieldCheck,
  Tag,
  AlertCircle,
  Plus,
  Edit2,
  Calendar,
} from 'lucide-react';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'integration' | 'agents' | 'settings'>('catalog');

  // Products state for this store
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Agents state
  const [agents, setAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Syncing state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Load Store Data
  const loadStoreData = async () => {
    if (!storeId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.getStore(storeId);
      const s = res?.data || res;
      setStore(s);

      // Load products for this store
      loadProducts(storeId);
      // Load agents for this store
      loadAgents(storeId);
    } catch (err: any) {
      setError(err.message || 'Failed to load store profile');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (id: string) => {
    setLoadingProducts(true);
    try {
      const res = await api.getProducts(id);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const uniqueMap = new Map();
      for (const item of list) {
        const key = (item.sku || item.name || item.id || '').trim().toLowerCase();
        if (key && !uniqueMap.has(key)) uniqueMap.set(key, item);
      }
      setProducts(Array.from(uniqueMap.values()));
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadAgents = async (id: string) => {
    setLoadingAgents(true);
    try {
      const res = await api.getStoreAgents(id);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setAgents(list);
    } catch {
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [storeId]);

  const handleSyncProducts = async () => {
    if (!storeId) return;
    setIsSyncing(true);
    setSyncFeedback('');
    try {
      const res = await api.syncProductsFromShops(storeId);
      setSyncFeedback(res?.message || 'Products synchronized successfully with integrated store!');
      await loadProducts(storeId);
      setTimeout(() => setSyncFeedback(''), 4000);
    } catch (err: any) {
      setSyncFeedback(`Sync failed: ${err.message}`);
      setTimeout(() => setSyncFeedback(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSetAsActiveStore = () => {
    if (!store) return;
    const active = { id: store.id, name: store.name, currency: store.currency || 'MAD' };
    api.setCurrentStore(active);
    setSyncFeedback(`"${store.name}" is now your active workspace.`);
    setTimeout(() => setSyncFeedback(''), 3000);
  };

  const webhookUrl = `https://api.callnetsaas.com/api/webhooks/orders/${storeId}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  // Filter products by search
  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const term = productSearch.toLowerCase();
    const name = (p.name || p.title || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();
    return name.includes(term) || sku.includes(term) || cat.includes(term);
  });

  const integration = store?.integrations && store.integrations.length > 0 ? store.integrations[0] : null;
  const platformName = integration?.provider?.name || integration?.accountName || (store?.settings?.platform ? store.settings.platform.toUpperCase() : 'Integrated Storefront');
  const shopDomain = integration?.externalShopDomain || store?.settings?.externalDomain || store?.settings?.storeUrl;

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar activeStore={store || { id: storeId, name: 'Store', currency: 'MAD' }} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header activeStore={store || { id: storeId, name: 'Store', currency: 'MAD' }} />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/stores"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Stores Directory</span>
            </Link>

            <button
              onClick={loadStoreData}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              title="Refresh Store Profile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {syncFeedback && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {loading && !store ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-xs">Loading store profile & integrated catalog...</p>
            </div>
          ) : store ? (
            <>
              {/* Store Hero Banner */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/30 p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                      {store.name?.slice(0, 2).toUpperCase() || 'ST'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-xl font-bold text-white tracking-tight">{store.name}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {platformName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            store.isActive !== false
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}
                        >
                          {store.isActive !== false ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="font-mono text-slate-300">/{store.slug}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          {store.country || 'Morocco'}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400 font-semibold">{store.currency || 'MAD'}</span>
                        {shopDomain && (
                          <>
                            <span>•</span>
                            <a
                              href={shopDomain.startsWith('http') ? shopDomain : `https://${shopDomain}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span>{shopDomain}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={handleSetAsActiveStore}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Set as Workspace</span>
                    </button>

                    <button
                      onClick={handleSyncProducts}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Sync Catalog from Shop'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Products in Catalog</span>
                    <span className="text-lg font-bold text-white font-mono">{products.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Assigned Call Agents</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono">{agents.length}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Agent Confirmation Payout</span>
                    <span className="text-lg font-bold text-amber-300 font-mono">
                      +{store.agentCommissionPerConfirmedOrder ?? 5} {store.currency || 'MAD'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Agent Delivery Payout</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">
                      +{store.agentCommissionPerDeliveredOrder ?? 15} {store.currency || 'MAD'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Store Page Tabs */}
              <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold text-slate-400">
                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'catalog' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Store Catalog ({products.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('integration')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'integration' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Integration & Webhooks</span>
                </button>

                <button
                  onClick={() => setActiveTab('agents')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'agents' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Assigned Verification Agents ({agents.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'settings' ? 'border-emerald-500 text-emerald-400' : 'border-transparent hover:text-slate-200'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Configuration & Payouts</span>
                </button>
              </div>

              {/* TAB 1: STORE CATALOG (PRODUCTS) */}
              {activeTab === 'catalog' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products by Name or SKU..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders?create=true`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition-all"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Create Order for this Store</span>
                      </Link>
                    </div>
                  </div>

                  {loadingProducts ? (
                    <div className="p-12 text-center text-slate-500 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading catalog articles...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
                      <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-white font-bold text-sm">No products in this store yet</h4>
                      <p className="text-slate-500 text-xs mt-1">
                        Sync with your integrated shop (Shopify, YouCan, WooCommerce) or import articles via CSV.
                      </p>
                      <button
                        onClick={handleSyncProducts}
                        disabled={isSyncing}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Sync Products from Integrated Shop</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((p) => {
                        const img = p.imageUrl || (p.images && p.images[0]) || null;
                        const price = p.price || p.salePrice || p.regularPrice || 0;
                        const barred = p.barredPrice ? Number(p.barredPrice) : (p.regularPrice && p.regularPrice > price ? Number(p.regularPrice) : null);

                        return (
                          <div
                            key={p.id}
                            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-3">
                              {img ? (
                                <img
                                  src={img}
                                  alt={p.name || p.title}
                                  className="w-12 h-12 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-white truncate" title={p.name || p.title}>
                                  {p.name || p.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {p.sku && (
                                    <span className="text-[10px] font-mono bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700">
                                      SKU: {p.sku}
                                    </span>
                                  )}
                                  {p.category && (
                                    <span className="text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded">
                                      {p.category}
                                    </span>
                                  )}
                                  {p.isFragile && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">
                                      Fragile
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 block">Stock Level</span>
                                <span className="font-mono text-slate-200 font-semibold">
                                  {p.stockQuantity !== undefined ? `${p.stockQuantity} units` : 'Available'}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 block">Selling Price</span>
                                <div className="flex items-center gap-1.5 justify-end">
                                  {barred && (
                                    <span className="text-[11px] text-slate-500 line-through font-mono">
                                      {barred} {store.currency}
                                    </span>
                                  )}
                                  <span className="font-bold text-emerald-400 font-mono text-sm">
                                    {price} {store.currency}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INTEGRATION & WEBHOOKS */}
              {activeTab === 'integration' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Connected Storefront Card */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Integrated Platform Details</h3>
                        <p className="text-xs text-slate-400">Direct synchronization credentials and live status</p>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Platform Type</span>
                        <span className="font-bold text-emerald-400">{platformName}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Shop Domain / URL</span>
                        <span className="font-mono text-white text-[11px]">{shopDomain || 'Not set'}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Auto-Sync Orders</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Last Synced</span>
                        <span className="text-slate-300 font-mono">
                          {integration?.lastSyncedAt ? new Date(integration.lastSyncedAt).toLocaleString() : 'Recently'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleSyncProducts}
                        disabled={isSyncing}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Force Synchronize Now</span>
                      </button>
                    </div>
                  </div>

                  {/* Webhook Endpoint Configuration */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Live Order Webhook Endpoint</h3>
                        <p className="text-xs text-slate-400">Paste into Shopify, YouCan, or WooCommerce Webhook Settings</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <label className="block text-slate-400 font-medium">Store Webhook URL</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono text-[11px] focus:outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyWebhook}
                          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                        >
                          {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                        Any order placed in this store will trigger instant lead generation and routing to your assigned confirmation call agents.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ASSIGNED AGENTS */}
              {activeTab === 'agents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Assigned Verification Agents</h3>
                      <p className="text-xs text-slate-400">Call agents allocated to verify and confirm orders for {store.name}</p>
                    </div>
                  </div>

                  {loadingAgents ? (
                    <div className="p-12 text-center text-slate-500 text-xs">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                      Loading assigned agents...
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
                      <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-white font-bold text-sm">No agents assigned yet</h4>
                      <p className="text-slate-500 text-xs mt-1">
                        SuperAdmins and Admins allocate verification agents to handle incoming call queues.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {agents.map((agent) => (
                        <div
                          key={agent.id}
                          className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xs">
                              {agent.name?.slice(0, 2).toUpperCase() || 'AG'}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                              <p className="text-[11px] text-slate-400">{agent.email}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Role</span>
                              <span className="font-semibold text-white">{agent.role}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Status</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Active on Queue
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SETTINGS & COMMISSIONS */}
              {activeTab === 'settings' && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 max-w-2xl">
                  <div>
                    <h3 className="text-sm font-bold text-white">Store Parameters & Call Agent Payouts</h3>
                    <p className="text-xs text-slate-400">Core operational configuration for {store.name}</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Operating Currency</span>
                      <span className="font-bold text-white font-mono">{store.currency || 'MAD'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Fulfillment Mode</span>
                      <span className="font-bold text-white uppercase">{store.fulfillmentType || 'STANDARD'}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Agent Commission (Per Confirmed Order)</span>
                      <span className="font-bold text-amber-400 font-mono">
                        +{store.agentCommissionPerConfirmedOrder ?? 5} {store.currency || 'MAD'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Agent Commission (Per Delivered Order)</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        +{store.agentCommissionPerDeliveredOrder ?? 15} {store.currency || 'MAD'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-500">
                    ℹ️ Agent commission payout rates are managed and calibrated exclusively by platform SuperAdmins to guarantee system-wide reconciliation integrity.
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
