'use client';

import React, { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { StatusBadge } from '../../components/StatusBadge';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function CouriersPage() {
  const [store, setStore] = useState<any>({ id: '', name: 'Loading...', currency: 'MAD' });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initialize store dynamically from user session
  useEffect(() => {
    const initStore = async () => {
      const current = api.getCurrentStore();
      if (current && current.id) {
        setStore(current);
      } else {
        try {
          const me = await api.getMe();
          if (me?.stores && me.stores.length > 0) {
            setStore(me.stores[0]);
            api.setCurrentStore(me.stores[0]);
          }
        } catch {}
      }
    };
    initStore();
  }, []);

  const loadData = async () => {
    if (!store.id || store.id === 'default') return;
    setLoading(true);
    try {
      const liveAccs = await api.getCourierAccounts(store.id);
      if (Array.isArray(liveAccs)) {
        setAccounts(liveAccs);
      } else {
        setAccounts([]);
      }

      const liveShips = await api.getShipments(store.id);
      if (Array.isArray(liveShips)) {
        setShipments(liveShips);
        if (liveShips.length > 0) {
          setSelectedShipment(liveShips[0]);
        } else {
          setSelectedShipment(null);
        }
      } else {
        setShipments([]);
        setSelectedShipment(null);
      }
    } catch {
      setAccounts([]);
      setShipments([]);
      setSelectedShipment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (store.id) {
      loadData();
    }
  }, [store.id]);

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 antialiased overflow-hidden">
      <Sidebar activeStore={store} onStoreChange={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header activeStore={store} />

        <main className="p-6 space-y-6 max-w-7xl">
          {/* Top Title */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Courier & Logistics Hub
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                  Live Dispatch
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-carrier integrations, unified tracking snapshots, and delivery exception control.
              </p>
            </div>

            <Link
              href="/integrations/shipping"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Shipping Company</span>
            </Link>
          </div>

          {/* Connected Carrier Accounts */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Configured Courier Accounts
                </h3>
                <p className="text-xs text-slate-400">Carrier API credentials encrypted via AES-256-GCM</p>
              </div>

              <Link
                href="/integrations/shipping"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <span>Manage 10 Moroccan Couriers</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                Loading courier accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center">
                <Truck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">No Carrier Accounts Connected</p>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                  Connect your IRSALIYAT, ONESSTA, FORCELOG, CATHEDIS, CHRONO DIALI, or SENDIT accounts to automate waybill generation.
                </p>
                <Link
                  href="/integrations/shipping"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  Connect Courier Account
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-sm">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{acc.accountName}</p>
                          {acc.isDefault && (
                            <span className="text-[10px] uppercase font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono">Account #{acc.accountNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Shipments Table & Detail Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Shipments List */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl space-y-4 border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Live Shipments & Parcels
                  </h3>
                  <p className="text-xs text-slate-400">{shipments.length} Active Waybills</p>
                </div>
                <button
                  onClick={loadData}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Refresh
                </button>
              </div>

              {shipments.length === 0 ? (
                <div className="p-16 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  <h4 className="text-sm font-bold text-slate-300">No Shipments Dispatched Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    When you confirm and dispatch orders to couriers from the Order Center, waybills and real-time tracking checkpoints will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[500px]">
                  {shipments.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedShipment?.id === s.id
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400 text-xs">{s.trackingNumber}</span>
                          <span className="text-xs text-slate-400">({s.courierAccount?.courierCompany?.name || 'Courier'})</span>
                        </div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <p className="font-semibold text-slate-200">{s.recipientName}</p>
                        <p className="font-mono font-bold text-white">COD: {formatCurrency(s.codAmountToCollect || 0, store.currency)}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">{s.destinationAddress}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Tracking Snapshots Timeline */}
            <div className="glass-panel p-5 rounded-2xl space-y-4 border border-slate-800 bg-slate-900/60">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800">
                Tracking Audit Trail
              </h3>

              {selectedShipment ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <p className="text-xs text-slate-400">Waybill</p>
                    <p className="text-sm font-mono font-bold text-emerald-400 mt-0.5">{selectedShipment.trackingNumber}</p>
                    <p className="text-xs text-slate-300 mt-2 font-semibold">{selectedShipment.recipientName}</p>
                    <p className="text-[11px] text-slate-400">{selectedShipment.destinationAddress}</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-semibold text-slate-300">Carrier Checkpoints</p>
                    {selectedShipment.snapshots && selectedShipment.snapshots.length > 0 ? (
                      selectedShipment.snapshots.map((snap: any, idx: number) => (
                        <div key={idx} className="flex gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            {idx !== selectedShipment.snapshots.length - 1 && <span className="w-0.5 flex-1 bg-slate-800 my-1" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 uppercase text-[11px]">{snap.normalizedStatus}</p>
                            <p className="text-slate-400 text-[11px]">{snap.description}</p>
                            <span className="text-[10px] text-slate-500 font-mono">{formatDate(snap.eventTimestamp)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No checkpoints recorded yet for this waybill.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  Select a shipment to inspect its tracking checkpoints.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
