'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Printer,
  RefreshCw,
  Phone,
  User,
  ShieldCheck,
  Calendar,
  Building2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

interface ShipmentTracking {
  id: string;
  trackingNumber: string;
  status: string;
  codAmountToCollect: number;
  shippingCost: number;
  recipientName: string;
  recipientPhone: string;
  destinationAddress: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    city?: string;
    statusCode?: string;
    substatus?: string;
    store?: {
      id: string;
      name: string;
      currency: string;
    };
  };
  courierAccount?: {
    id: string;
    accountName: string;
    courierCompany?: {
      name: string;
      code: string;
      trackingUrlTemplate?: string;
    };
  };
  snapshots?: Array<{
    id: string;
    normalizedStatus: string;
    rawStatus?: string;
    location?: string;
    description?: string;
    eventTimestamp: string;
  }>;
}

export default function LiveTrackingPage() {
  const searchParams = useSearchParams();
  const initialTracking = searchParams?.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialTracking);
  const [shipments, setShipments] = useState<ShipmentTracking[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchTrackingData = async (query = searchQuery) => {
    try {
      setLoading(true);
      const res = await api.lookupTracking(query);
      const data: ShipmentTracking[] = res.data || [];
      setShipments(data);
      if (data.length > 0) {
        // If an initial tracking was given or none currently selected, pick first match
        if (query) {
          const exact = data.find(
            (s) =>
              s.trackingNumber?.toLowerCase() === query.toLowerCase() ||
              s.order?.orderNumber?.toLowerCase() === query.toLowerCase()
          );
          setSelectedShipment(exact || data[0]);
        } else if (!selectedShipment || !data.some((s) => s.id === selectedShipment.id)) {
          setSelectedShipment(data[0]);
        }
      } else {
        setSelectedShipment(null);
      }
    } catch (err) {
      console.error('Failed to load tracking data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrackingData(initialTracking);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrackingData(searchQuery);
  };

  // Filter shipments
  const filteredShipments = shipments.filter((s) => {
    if (statusFilter === 'ALL') return true;
    const norm = (s.status || '').toLowerCase();
    if (statusFilter === 'DELIVERED') return norm.includes('deliver');
    if (statusFilter === 'IN_TRANSIT') return norm.includes('transit') || norm.includes('out_for_delivery') || norm.includes('created');
    if (statusFilter === 'RETURN') return norm.includes('return');
    return true;
  });

  // Calculate metrics
  const totalCount = shipments.length;
  const inTransitCount = shipments.filter((s) =>
    ['in_transit', 'out_for_delivery', 'created'].some((st) => (s.status || '').toLowerCase().includes(st))
  ).length;
  const deliveredCount = shipments.filter((s) => (s.status || '').toLowerCase().includes('deliver')).length;
  const returnedCount = shipments.filter((s) => (s.status || '').toLowerCase().includes('return')).length;

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (s.includes('out_for_delivery')) return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    if (s.includes('transit')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    if (s.includes('return')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  };

  const getCheckpointSteps = (shipment: ShipmentTracking) => {
    const s = (shipment.status || '').toLowerCase();
    const isDelivered = s.includes('deliver');
    const isOutForDelivery = isDelivered || s.includes('out_for_delivery');
    const isInTransit = isOutForDelivery || s.includes('in_transit');
    const isCreated = true; // Always created
    const isReturned = s.includes('return');

    if (isReturned) {
      return [
        { title: 'Dispatched', desc: 'Order processed & picked up', done: true },
        { title: 'Delivery Attempted', desc: 'Driver arrived at destination', done: true },
        { title: 'Return Initiated', desc: 'Package returning to hub', done: true, isAlert: true },
      ];
    }

    return [
      { title: 'Label Created', desc: 'Manifested & Picked up by Carrier', done: isCreated },
      { title: 'In Transit', desc: 'Sorted at Logistics Hub', done: isInTransit },
      { title: 'Out For Delivery', desc: 'On courier vehicle for final drop', done: isOutForDelivery },
      { title: 'Delivered', desc: 'Confirmed delivery & COD Collected', done: isDelivered },
    ];
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header & Stats Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <Truck className="w-4 h-4 text-emerald-400 animate-pulse" />
                Live Logistics & Parcels
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
                Live Shipment Tracking
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-time carrier event checkpoints, airway bills, and city-level parcel movement
              </p>
            </div>

            <button
              onClick={() => {
                setRefreshing(true);
                fetchTrackingData();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium transition-all shadow-sm self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              Sync Carrier Feeds
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div
              onClick={() => setStatusFilter('ALL')}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Shipments</div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1">{totalCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">All integrated parcels</div>
            </div>

            <div
              onClick={() => setStatusFilter('IN_TRANSIT')}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'IN_TRANSIT'
                  ? 'bg-slate-900 border-blue-500/50 shadow-md shadow-blue-950/20'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">In Transit</div>
              <div className="text-xl sm:text-2xl font-black text-blue-300 mt-1">{inTransitCount}</div>
              <div className="text-[10px] text-blue-400/70 mt-0.5">Hub sorting & out for delivery</div>
            </div>

            <div
              onClick={() => setStatusFilter('DELIVERED')}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'DELIVERED'
                  ? 'bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Delivered</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">{deliveredCount}</div>
              <div className="text-[10px] text-emerald-400/70 mt-0.5">Confirmed & COD collected</div>
            </div>

            <div
              onClick={() => setStatusFilter('RETURN')}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'RETURN'
                  ? 'bg-slate-900 border-rose-500/50 shadow-md shadow-rose-950/20'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Returned</div>
              <div className="text-xl sm:text-2xl font-black text-rose-300 mt-1">{returnedCount}</div>
              <div className="text-[10px] text-rose-400/70 mt-0.5">Refused or return in progress</div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Tracking # (e.g. IRS-9281), Order # (ORD-2026), Customer Phone, City..."
                className="w-full pl-12 pr-28 py-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 shadow-inner transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/40"
              >
                Track Now
              </button>
            </div>
          </form>

          {/* Main 2-Column Content */}
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-300">Querying carrier logistics networks...</div>
            </div>
          ) : shipments.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">No active shipments found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Dispatch orders from the Orders page to automatically generate carrier tracking numbers and live event checkpoints.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Shipments List (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Shipments ({filteredShipments.length})</span>
                  <span>Select to inspect</span>
                </div>

                <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                  {filteredShipments.map((s) => {
                    const isSelected = selectedShipment?.id === s.id;
                    const courierName = s.courierAccount?.courierCompany?.name || 'COD Express';

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedShipment(s)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/20'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-white tracking-wide">
                                {s.trackingNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(
                                  s.status
                                )}`}
                              >
                                {s.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-slate-300 font-semibold mt-1">
                              {s.order?.orderNumber} • {s.recipientName}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-400">
                              {formatCurrency(s.codAmountToCollect || 0, s.order?.store?.currency || 'MAD')}
                            </div>
                            <div className="text-[10px] text-slate-500">COD</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span className="font-medium text-slate-300">{courierName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{s.order?.city || 'Morocco'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Shipment Detail & Checkpoints (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {selectedShipment ? (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-6">
                    {/* Top Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-white font-mono">{selectedShipment.trackingNumber}</h2>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(
                              selectedShipment.status
                            )}`}
                          >
                            {selectedShipment.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Assigned Carrier:{' '}
                          <span className="text-slate-200 font-semibold">
                            {selectedShipment.courierAccount?.courierCompany?.name || 'COD Integrated Partner'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:4000/api/couriers/shipments/${selectedShipment.id}/label`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          Airway Bill (AWB)
                        </a>
                      </div>
                    </div>

                    {/* Checkpoint Progress Stepper */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Delivery Progress
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {getCheckpointSteps(selectedShipment).map((step, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-center relative ${
                              step.done
                                ? step.isAlert
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-slate-900/40 border-slate-800 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              {step.done ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-slate-600" />
                              )}
                            </div>
                            <div className="text-xs font-bold leading-tight">{step.title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{step.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recipient & Destination Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      <div className="space-y-2 text-xs">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recipient Details</div>
                        <div className="flex items-center gap-2 text-slate-200 font-semibold">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {selectedShipment.recipientName}
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {selectedShipment.recipientPhone}
                        </div>
                        <div className="flex items-start gap-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                          <span>
                            {selectedShipment.destinationAddress || 'Standard Destination'},{' '}
                            <strong className="text-slate-200">{selectedShipment.order?.city || 'Morocco'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-4">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Order & Financials</div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Linked Order:</span>
                          <span className="font-mono text-slate-200 font-semibold">{selectedShipment.order?.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">COD to Collect:</span>
                          <span className="font-bold text-emerald-400">
                            {formatCurrency(selectedShipment.codAmountToCollect || 0, selectedShipment.order?.store?.currency || 'MAD')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Carrier Fee:</span>
                          <span className="text-slate-300">
                            {formatCurrency(selectedShipment.shippingCost || 35, selectedShipment.order?.store?.currency || 'MAD')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Dispatched:</span>
                          <span className="text-slate-300">{formatDate(selectedShipment.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chronological Event Log */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Checkpoint Event History
                      </div>

                      <div className="space-y-2.5">
                        {selectedShipment.snapshots && selectedShipment.snapshots.length > 0 ? (
                          selectedShipment.snapshots.map((snap) => (
                            <div
                              key={snap.id}
                              className="flex items-start gap-3 p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs"
                            >
                              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                                <Truck className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-slate-200">
                                    {snap.rawStatus || snap.normalizedStatus.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {formatDate(snap.eventTimestamp)}
                                  </span>
                                </div>
                                <div className="text-slate-400 text-[11px] mt-0.5">
                                  {snap.description || 'Status registered at carrier sorting checkpoint'}
                                </div>
                                {snap.location && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>{snap.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span>Initial dispatch registered with carrier. Checkpoints update automatically upon driver scans.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-10 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                    Select a shipment from the left list to view checkpoint timeline.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
