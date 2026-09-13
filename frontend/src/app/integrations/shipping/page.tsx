'use client';

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Package,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Plus,
  Lock,
  RefreshCw,
  Clock,
  ArrowRight,
  Settings2,
  X,
  ShieldAlert,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Sidebar } from '../../../components/Sidebar';
import { Header } from '../../../components/Header';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';

export default function ShippingCompaniesPage() {
  const [store, setStore] = useState({ id: 'apex-casablanca', name: 'Apex Casablanca Store', currency: 'MAD' });
  const [userRole, setUserRole] = useState<string>('Loading');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal for adding a courier account
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Testing Carrier Connection
  const [testingCarrier, setTestingCarrier] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    courierCode: string;
    success: boolean;
    message: string;
    latencyMs?: number;
    carrierName?: string;
  } | null>(null);

  const handleTestConnection = async (courierCode: string, creds?: { apiKey?: string; apiSecret?: string; accountNumber?: string }) => {
    setTestingCarrier(courierCode);
    setTestResult(null);
    try {
      const res = await api.testCourierConnection(store.id, {
        courierCode,
        apiKey: creds?.apiKey || apiKey || 'test_demo_key',
        apiSecret: creds?.apiSecret || apiSecret,
        accountNumber: creds?.accountNumber || accountNumber,
      });
      const data = res?.data || res;
      setTestResult({
        courierCode,
        success: data.success,
        message: data.message,
        latencyMs: data.latencyMs,
        carrierName: data.carrierName,
      });
    } catch (err: any) {
      setTestResult({
        courierCode,
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTestingCarrier(null);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const shippingCompanies = [
    {
      code: 'irsaliyat',
      name: 'IRSALIYAT',
      coverage: 'Morocco Nationwide (48h)',
      type: 'Cash On Delivery / Parcel Network',
      features: ['Automated Airway Bill', 'CRBT Remittance', 'Inspection Allowed'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/irsaliyat`,
      statusVocabulary: 'Nouveau -> En cours de livraison -> Livré / Retourné',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    {
      code: 'onessta',
      name: 'ONESSTA',
      coverage: 'Grand Casablanca & Inter-City',
      type: 'Express Courier & Last-Mile',
      features: ['Live GPS Tracking', 'Same-Day Dispatch', 'Instant Status Hook'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/onessta`,
      statusVocabulary: 'ENREGISTRE -> DISTRIBUTION -> LIVRE / RETOUR',
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    },
    {
      code: 'forcelog',
      name: 'FORCELOG',
      coverage: 'Kingdom of Morocco All Hubs',
      type: 'Enterprise Logistics & Warehousing',
      features: ['Fulfillment Hubs', 'Bulk Label Printing', 'Automated Reconciliation'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/forcelog`,
      statusVocabulary: 'Received at Hub -> Out for Delivery -> Delivered / Returned',
      badgeColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
    },
    {
      code: 'ameex',
      name: 'AMEEX',
      coverage: 'National Moroccan Network',
      type: 'COD Logistics Specialist',
      features: ['CRBT Daily Payouts', 'Failed Attempt Retry', 'SMS Alerts'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/ameex`,
      statusVocabulary: 'NOUVEAU_COLIS -> EN_DISTRIBUTION -> LIVRE / RETOUR',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
    {
      code: 'cathedis',
      name: 'CATHEDIS',
      coverage: 'Fast Inter-City Logistics',
      type: 'E-commerce Courier',
      features: ['Digital Proof of Delivery', 'Return Slip Generator', 'REST API v2'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/cathedis`,
      statusVocabulary: 'Created -> PickedUp -> Delivered / Returned',
      badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    },
    {
      code: 'chrono_diali',
      name: 'CHRONO DIALI',
      coverage: 'Major Metros & Remote Regions',
      type: 'COD Last Mile Express',
      features: ['Reverse Logistics', 'Darija Call Confirmation', 'Direct Barcoding'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/chrono_diali`,
      statusVocabulary: 'CMD_CREEE -> EN_COURS -> LIVREE / NON_ABOUTI',
      badgeColor: 'border-teal-500/40 text-teal-400 bg-teal-500/10',
    },
    {
      code: 'sendit',
      name: 'SENDIT',
      coverage: 'Smart Last-Mile Network',
      type: 'Modern E-commerce Delivery',
      features: ['Webhook Callbacks', 'Multi-Parcel Handling', 'Instant Cash In'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/sendit`,
      statusVocabulary: 'draft -> out_for_delivery -> delivered / returned',
      badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    },
    {
      code: 'ozon_express',
      name: 'OZON EXPRESS',
      coverage: 'Rapid Delivery Morocco',
      type: 'High Velocity Courier',
      features: ['High Delivery Success SLA', 'Package Inspection', 'Live Dashboard'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/ozon_express`,
      statusVocabulary: 'created -> delivery_in_progress -> delivered / refused',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    },
    {
      code: 'digylog',
      name: 'DIGYLOG',
      coverage: 'Regional Delivery & Pick-up Hubs',
      type: 'Digital Logistics Solutions',
      features: ['Custom Shipping Labels', 'Remittance Sync', 'Batch Booking'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/digylog`,
      statusVocabulary: 'ACHEMINEMENT -> LIVRAISON -> LIVRE / RETOUR',
      badgeColor: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
    },
    {
      code: 'kargo_express',
      name: 'KARGO EXPRESS',
      coverage: 'Kingdom-wide Cargo & Packets',
      type: 'Heavy & Lightweight Express',
      features: ['COD Collection', 'Insurance & Declared Value', 'Automated Webhooks'],
      webhookUrl: `http://localhost:4000/api/couriers/webhook/kargo_express`,
      statusVocabulary: 'booking_created -> in_transit -> completed / returned',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
  ];

  const loadAccounts = async () => {
    try {
      const res = await api.getCourierAccounts(store.id);
      if (res) setAccounts(res);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.getMe();
        if (me?.user?.role) {
          setUserRole(me.user.role);
        }
        const current = api.getCurrentStore();
        if (current) {
          setStore(current);
        } else if (me?.stores && me.stores.length > 0) {
          setStore(me.stores[0]);
          api.setCurrentStore(me.stores[0]);
        }
      } catch {
        setUserRole('Unauthorized');
      }
    };
    init();
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [store.id]);

  const handleOpenConnect = (company: any) => {
    setSelectedCourier(company);
    setAccountName(`${company.name} Live Account`);
    setAccountNumber(`ACC-${company.code.slice(0, 3).toUpperCase()}-01`);
    setApiKey('');
    setApiSecret('');
    setShowAddModal(true);
    setStatusMsg(null);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      // Find company id
      const companies = await api.getCourierCompanies();
      const matched = companies?.find((c: any) => c.code === selectedCourier.code);

      await api.createCourierAccount(store.id, {
        courierCompanyId: matched?.id || 'd3011a43-69be-4cf2-8321-c452e8964d41',
        accountName,
        accountNumber,
        apiKey: apiKey || 'test-key-enc',
        apiSecret: apiSecret || 'test-secret-enc',
        isDefault: true,
      });

      setStatusMsg({ text: `Account for ${selectedCourier.name} connected successfully!`, type: 'success' });
      await loadAccounts();
      setTimeout(() => setShowAddModal(false), 1200);
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to save courier account', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (userRole !== 'Loading' && userRole?.toLowerCase() !== 'seller') {
    return (
      <div className="flex min-h-screen bg-slate-900">
        <Sidebar currentStore={store} onSelectStore={setStore} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header
            title="Shipping Integrations"
            subtitle="Logistics carrier API configuration"
          />
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-center min-h-[500px]">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Access Restricted: Sellers Only</h2>
            <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
              Shipping company API credentials and automated courier accounts are managed exclusively by <strong>Sellers</strong>. Platform administrators, agents, and other roles cannot access or configure carrier accounts.
            </p>
            <a
              href="/"
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
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar currentStore={store} onSelectStore={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Shipping Companies & Couriers"
          subtitle="Configure direct integrations for all 10 Moroccan & MENA logistics carriers with unified status mapping"
        />

        <main className="p-6 space-y-6 max-w-7xl">
          {/* Architecture Banner */}
          <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-emerald-500/30 bg-emerald-950/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Unified Logistics Status Normalizer (10 Couriers Active)
                </p>
                <p className="text-[11px] text-slate-400">
                  Carrier-specific status codes (e.g., &quot;CMD_CREEE&quot;, &quot;DISTRIBUTION&quot;, &quot;LIVRE&quot;, &quot;RETOUR&quot;) are normalized automatically into standard lifecycle states.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>AES-256 API Encryption</span>
            </span>
          </div>

          {/* Couriers Grid (10 Companies) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {shippingCompanies.map((c) => {
              const configured = accounts.some((a) => a.courierCompany?.code === c.code);

              return (
                <div
                  key={c.code}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
                          <Truck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            {c.name}
                            <span className={cn('text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase', c.badgeColor)}>
                              {configured ? 'Connected' : 'Available'}
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-400">{c.coverage}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestConnection(c.code)}
                          disabled={testingCarrier === c.code}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1 border border-emerald-500/20 transition-all cursor-pointer"
                          title="Test carrier API latency & connectivity"
                        >
                          {testingCarrier === c.code ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Activity className="w-3.5 h-3.5" />
                          )}
                          <span>Test API</span>
                        </button>

                        <button
                          onClick={() => handleOpenConnect(c)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Configure</span>
                        </button>
                      </div>
                    </div>

                    {testResult && testResult.courierCode === c.code && (
                      <div
                        className={cn(
                          'p-2.5 rounded-xl text-xs border flex items-center justify-between',
                          testResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {testResult.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          )}
                          <span className="truncate">{testResult.message}</span>
                        </div>
                        {testResult.latencyMs !== undefined && (
                          <span className="font-mono text-[10px] shrink-0 ml-2 px-1.5 py-0.5 rounded bg-black/40">
                            {testResult.latencyMs}ms
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Status Normalization:</span>
                        <span className="font-mono text-emerald-300 truncate max-w-[240px]">{c.statusVocabulary}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-400">
                        Inbound Webhook URL (Paste into {c.name} merchant portal):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          readOnly
                          value={c.webhookUrl}
                          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-emerald-300 focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(c.webhookUrl, c.code)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs"
                          title="Copy webhook URL"
                        >
                          {copiedKey === c.code ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {c.features.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-md"
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal for connecting a courier account */}
          {showAddModal && selectedCourier && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full bg-slate-900 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Connect {selectedCourier.name} Account
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {statusMsg && (
                  <div
                    className={cn(
                      'p-3 rounded-xl text-xs border',
                      statusMsg.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    )}
                  >
                    {statusMsg.text}
                  </div>
                )}

                <form onSubmit={handleSaveAccount} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Account Label</label>
                    <input
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Merchant / Account Number</label>
                    <input
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. ACC-12345"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">API Key / Token</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste your courier API Key"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">API Secret Key (Optional)</label>
                    <input
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Paste your courier Secret Key"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Credentials will be encrypted with AES-256-GCM hardware cipher before persistence.</span>
                  </div>

                  {testResult && testResult.courierCode === selectedCourier.code && (
                    <div
                      className={cn(
                        'p-2.5 rounded-xl text-xs border flex items-center justify-between',
                        testResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {testResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        )}
                        <span className="truncate">{testResult.message}</span>
                      </div>
                      {testResult.latencyMs !== undefined && (
                        <span className="font-mono text-[10px] shrink-0 ml-2 px-1.5 py-0.5 rounded bg-black/40">
                          {testResult.latencyMs}ms
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleTestConnection(selectedCourier.code, { apiKey, apiSecret, accountNumber })}
                      disabled={testingCarrier === selectedCourier.code}
                      className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      {testingCarrier === selectedCourier.code ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Activity className="w-3.5 h-3.5" />
                      )}
                      <span>Test Credentials</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Encrypting & Saving...</span>
                        </>
                      ) : (
                        <span>Save & Connect</span>
                      )}
                    </button>
                    </div>
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
