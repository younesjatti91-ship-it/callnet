'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  Plus,
  Upload,
  Phone,
  Truck,
  RotateCcw,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  ShoppingBag,
  MessageSquare,
  Package,
  Tag,
  Check,
  Sparkles,
  AlertTriangle,
  Layers,
  LayoutGrid,
  Table,
  Edit2,
  X,
  RefreshCw,
  ShieldAlert,
  User,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { StatusBadge } from '../../components/StatusBadge';
import { api, Order } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';

const ORDER_STATUS_GROUPS = [
  {
    code: 'NEW',
    label: 'NEW',
    substatuses: [
      { code: 'PENDING_REVIEW', label: 'PENDING_REVIEW' },
    ],
  },
  {
    code: 'CONFIRMATION',
    label: 'CONFIRMATION',
    substatuses: [
      { code: 'PENDING', label: 'PENDING' },
      { code: 'CALL_BACK', label: 'CALL_BACK', hasIterations: true },
      { code: 'NO_ANSWER', label: 'NO_ANSWER', hasIterations: true },
      { code: 'VOICEMAIL', label: 'VOICEMAIL', hasIterations: true },
      { code: 'UNREACHABLE', label: 'UNREACHABLE', hasIterations: true },
      { code: 'CONFIRMED', label: 'CONFIRMED' },
      { code: 'FAILED', label: 'FAILED' },
    ],
  },
  {
    code: 'FULFILLMENT',
    label: 'FULFILLMENT',
    substatuses: [
      { code: 'PREPARING', label: 'PREPARING' },
      { code: 'READY_TO_SHIP', label: 'READY_TO_SHIP' },
      { code: 'SHIPPED', label: 'SHIPPED' },
    ],
  },
  {
    code: 'DELIVERY',
    label: 'DELIVERY',
    substatuses: [
      { code: 'IN_TRANSIT', label: 'IN_TRANSIT' },
      { code: 'OUT_FOR_DELIVERY', label: 'OUT_FOR_DELIVERY' },
      { code: 'DELIVERY_ATTEMPTED', label: 'DELIVERY_ATTEMPTED' },
      { code: 'DELAYED', label: 'DELAYED' },
      { code: 'REFUSED', label: 'REFUSED' },
      { code: 'DELIVERED', label: 'DELIVERED' },
    ],
  },
  {
    code: 'RETURN',
    label: 'RETURN',
    substatuses: [
      { code: 'RETURN_REQUESTED', label: 'RETURN_REQUESTED' },
      { code: 'RETURN_IN_PROGRESS', label: 'RETURN_IN_PROGRESS' },
      { code: 'RETURNED', label: 'RETURNED' },
      { code: 'RETURN_RECEIVED', label: 'RETURN_RECEIVED' },
    ],
  },
  {
    code: 'CANCELLED',
    label: 'CANCELLED',
    substatuses: [
      { code: 'CUSTOMER_CANCELLED', label: 'CUSTOMER_CANCELLED' },
      { code: 'PRODUCT_UNAVAILABLE', label: 'PRODUCT_UNAVAILABLE' },
      { code: 'INVALID_PHONE', label: 'INVALID_PHONE' },
      { code: 'FAKE_ORDER', label: 'FAKE_ORDER' },
      { code: 'DUPLICATE_ORDER', label: 'DUPLICATE_ORDER' },
      { code: 'CUSTOMER_DID_NOT_ORDER', label: 'CUSTOMER_DID_NOT_ORDER' },
      { code: 'WRONG_ADDRESS', label: 'WRONG_ADDRESS' },
      { code: 'OTHER', label: 'OTHER' },
    ],
  },
];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams?.get('status');

  const [store, setStore] = useState<{ id: string; name: string; currency: string }>({
    id: '',
    name: 'Atlas Commerce Live',
    currency: 'MAD',
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(urlStatus || 'ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // 2 View Modes: 'detailed' (comprehensive table) vs 'card' (touch cards)
  const [viewMode, setViewMode] = useState<'detailed' | 'card'>('detailed');

  // Edit Order Instance state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    city: '',
    province: '',
    subtotal: 0,
    shippingFee: 0,
    codAmount: 0,
    status: '',
    statusCode: 'NEW',
    substatus: 'PENDING_REVIEW',
    contactIterations: 0,
    comment: '',
    courierAccountId: '',
    notes: '',
  });

  // Shipping Company Instance & City Filtering state
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [selectedCourierAccountId, setSelectedCourierAccountId] = useState('');
  const [dispatchingCourier, setDispatchingCourier] = useState(false);

  // Substatus Quick Form state in Drawer
  const [targetStatusCode, setTargetStatusCode] = useState('CONFIRMATION');
  const [targetSubstatus, setTargetSubstatus] = useState('CONFIRMED');
  const [contactAttempts, setContactAttempts] = useState(0);
  const [statusComment, setStatusComment] = useState('');
  const [updatingSubstatus, setUpdatingSubstatus] = useState(false);

  // Mandatory Confirmation Box modal state
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    orderNumber: string;
    description: string;
    changes: Array<{ label: string; from: string; to: string }>;
    confirmButtonText?: string;
    action: () => Promise<void>;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Initialize View Mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('codflow_orders_view_mode') as 'detailed' | 'card';
      if (saved && (saved === 'detailed' || saved === 'card')) {
        setViewMode(saved);
      } else if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    }
  }, []);

  const handleSetViewMode = (mode: 'detailed' | 'card') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('codflow_orders_view_mode', mode);
    }
  };

  // Initialize active store from user session
  useEffect(() => {
    const initStore = async () => {
      const current = api.getCurrentStore();
      if (current) {
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

  // Sync with URL status parameter when clicked from sidebar
  useEffect(() => {
    if (urlStatus) {
      setStatusFilter(urlStatus);
    } else {
      setStatusFilter('ALL');
    }
  }, [urlStatus]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [orderSource, setOrderSource] = useState('manual');
  const [productsList, setProductsList] = useState<any[]>([]);

  // Form states
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    city: '',
    shippingAddress: '',
    subtotal: 0,
    shippingFee: 0,
    productName: '',
  });

  // Searchable Product Catalog Lookup
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  // Load products catalog for selection
  useEffect(() => {
    const fetchCatalog = async () => {
      if (!store.id) return;
      try {
        const res = await api.getProducts(store.id);
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setProductsList(list);

        // If a product name or SKU was specified in URL, auto-match from DB
        const cProduct = searchParams?.get('product');
        if (cProduct && list.length > 0) {
          const match = list.find(
            (p: any) =>
              (p.name && p.name.toLowerCase() === cProduct.toLowerCase()) ||
              (p.sku && p.sku.toLowerCase() === cProduct.toLowerCase())
          );
          if (match) {
            setSelectedProduct(match);
            setProductSearchQuery(match.name || match.title);
            setNewOrder((prev) => ({
              ...prev,
              productName: match.name || match.title,
              subtotal: Number(match.price || match.salePrice || prev.subtotal),
              shippingFee: Number(match.shippingPrice !== undefined ? match.shippingPrice : prev.shippingFee),
            }));
          }
        }
      } catch {}
    };
    fetchCatalog();
  }, [store.id, searchParams]);

  // Pre-fill order details from URL query params (e.g. sent from WhatsApp Live Chat / Inbox)
  useEffect(() => {
    const isCreate = searchParams?.get('create') === 'true';
    const cName = searchParams?.get('customerName');
    const cPhone = searchParams?.get('customerPhone');
    const cCity = searchParams?.get('city');
    const cAddress = searchParams?.get('address');
    const cProduct = searchParams?.get('product');
    const src = searchParams?.get('source');

    if (isCreate || cPhone) {
      if (src) setOrderSource(src);
      setNewOrder((prev) => ({
        ...prev,
        customerName: cName ? decodeURIComponent(cName) : prev.customerName,
        customerPhone: cPhone ? decodeURIComponent(cPhone) : prev.customerPhone,
        city: cCity ? decodeURIComponent(cCity) : prev.city,
        shippingAddress: cAddress ? decodeURIComponent(cAddress) : prev.shippingAddress,
        productName: cProduct ? decodeURIComponent(cProduct) : prev.productName,
      }));
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const [csvText, setCsvText] = useState(
    `customerName,customerPhone,city,shippingAddress,subtotal,shippingFee,productName\nSalim Tazi,+212677112233,Casablanca,Maarif Rue 4,490,0,Wireless Earbuds Pro\nNadia El Fassi,+212688445566,Rabat,Agdal Avenue de France,320,35,Mini Blender USB`
  );

  const loadOrders = async () => {
    if (!store.id) return;
    setLoadingOrders(true);
    try {
      const res = await api.getOrders(store.id, {
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      if (res?.orders && Array.isArray(res.orders)) {
        setOrders(res.orders);
        if (res.orders.length > 0) {
          setSelectedOrder(res.orders[0]);
        } else {
          setSelectedOrder(null);
        }
      } else {
        setOrders([]);
        setSelectedOrder(null);
      }
    } catch {
      setOrders([]);
      setSelectedOrder(null);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (store.id) {
      loadOrders();
    }
  }, [store.id, statusFilter]);

  // Load city-filtered integrated couriers when selected order changes
  useEffect(() => {
    const activeStoreId = selectedOrder?.storeId || store.id;
    if (selectedOrder && activeStoreId) {
      setTargetStatusCode(selectedOrder.statusCode || 'CONFIRMATION');
      setTargetSubstatus(selectedOrder.substatus || 'CONFIRMED');
      setContactAttempts(selectedOrder.contactIterations || selectedOrder.callAttemptsCount || 0);
      setStatusComment('');

      setLoadingCouriers(true);
      const cleanCity = (selectedOrder.city || '').trim();
      api
        .getAvailableCouriersForCity(activeStoreId, cleanCity)
        .then((res) => {
          const list = res?.data || (Array.isArray(res) ? res : []);
          setAvailableCouriers(list);
          if (list.length > 0) {
            const matched = list.find((c: any) => c.id === selectedOrder.courierAccountId);
            setSelectedCourierAccountId(matched ? matched.id : list[0].id);
          } else {
            setSelectedCourierAccountId('');
          }
        })
        .catch(() => setAvailableCouriers([]))
        .finally(() => setLoadingCouriers(false));
    }
  }, [selectedOrder?.id, selectedOrder?.city, selectedOrder?.storeId, store.id]);

  // Dispatch order with selected city-capable courier
  const handleDispatchOrder = async (order: Order) => {
    if (!selectedCourierAccountId) {
      alert(`No integrated shipping company selected for ${order.city || 'this city'}.`);
      return;
    }

    const courier = availableCouriers.find((c: any) => c.id === selectedCourierAccountId);
    const courierName = courier?.courierCompany?.name || courier?.accountName || 'Selected Carrier';

    setConfirmModalData({
      title: 'Confirm Shipping Creation & Courier Dispatch',
      orderNumber: order.orderNumber,
      description: `Create official waybill/tracking and dispatch order with ${courierName} for delivery to ${order.city || 'destination'}?`,
      changes: [
        { label: 'Carrier Company', from: order.courierName || 'Unassigned', to: courierName },
        { label: 'Serviced Destination', from: order.city || 'Standard', to: `${order.city || 'Casablanca'} (Confirmed Serviced)` },
        { label: 'Status Transition', from: (order.statusCode || order.status).toUpperCase(), to: 'FULFILLMENT / SHIPPED' },
      ],
      confirmButtonText: 'Yes, Create Shipping with Carrier',
      action: async () => {
        setDispatchingCourier(true);
        try {
          const activeStoreId = order.storeId || store.id;
          const res = await api.dispatchOrderWithCourier(activeStoreId, order.id, {
            courierAccountId: selectedCourierAccountId,
          });
          const trackingNo = res.data?.trackingNumber || 'GENERATED';
          alert(`Successfully dispatched with ${courierName}! Tracking Number: ${trackingNo}`);
          await loadOrders();
          if (selectedOrder?.id === order.id) {
            setSelectedOrder((prev) => (prev ? {
              ...prev,
              trackingNumber: trackingNo,
              courierName,
              courierAccountId: selectedCourierAccountId,
              statusCode: 'FULFILLMENT',
              substatus: 'SHIPPED',
              status: 'shipped',
            } : null));
          }
        } catch (err: any) {
          alert(`Dispatch error: ${err.message || 'Carrier API returned an error'}`);
        } finally {
          setDispatchingCourier(false);
        }
      },
    });
  };

  // Quick substatus update from drawer
  const handleApplySubstatusUpdate = (order: Order) => {
    setConfirmModalData({
      title: 'Confirm Order Substatus & Comment',
      orderNumber: order.orderNumber,
      description: `Apply status update to ${targetStatusCode} / ${targetSubstatus}?`,
      changes: [
        { label: 'Status Code', from: order.statusCode || order.status.toUpperCase(), to: targetStatusCode },
        { label: 'Substatus', from: order.substatus || 'None', to: targetSubstatus },
        { label: 'Contact Iterations', from: String(order.contactIterations || 0), to: String(contactAttempts) },
        { label: 'Comment Log', from: order.lastComment || 'None', to: statusComment || 'No comment provided' },
      ],
      confirmButtonText: 'Apply & Record in History',
      action: async () => {
        setUpdatingSubstatus(true);
        try {
          await api.updateOrderStatus(store.id, order.id, {
            statusCode: targetStatusCode,
            substatus: targetSubstatus,
            contactIterations: contactAttempts,
            comment: statusComment || undefined,
            notes: statusComment || undefined,
          });
          await loadOrders();
          if (selectedOrder?.id === order.id) {
            setSelectedOrder((prev) => (prev ? {
              ...prev,
              statusCode: targetStatusCode,
              substatus: targetSubstatus,
              contactIterations: contactAttempts,
              lastComment: statusComment || prev.lastComment,
            } : null));
          }
          setStatusComment('');
        } catch (err: any) {
          alert(`Update error: ${err.message}`);
        } finally {
          setUpdatingSubstatus(false);
        }
      },
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOrder(store.id, {
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        city: newOrder.city,
        shippingAddress: newOrder.shippingAddress,
        subtotal: Number(newOrder.subtotal),
        shippingFee: Number(newOrder.shippingFee),
        codAmount: Number(newOrder.subtotal) + Number(newOrder.shippingFee),
        source: orderSource || 'manual',
        items: [
          {
            productName: newOrder.productName,
            quantity: 1,
            unitPrice: Number(newOrder.subtotal),
            totalPrice: Number(newOrder.subtotal),
          },
        ],
      });
      setShowCreateModal(false);
      loadOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleImportCSV = async () => {
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) return;
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = vals[idx];
      });
      rows.push(row);
    }

    try {
      await api.importCSV(store.id, rows);
      setShowCSVModal(false);
      loadOrders();
    } catch (err: any) {
      alert(`CSV import error: ${err.message}`);
    }
  };

  // Open Edit Instance Modal
  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      customerEmail: order.customerEmail || '',
      shippingAddress: order.shippingAddress || '',
      city: order.city || '',
      province: order.province || '',
      subtotal: Number(order.subtotal || 0),
      shippingFee: Number(order.shippingFee || 0),
      codAmount: Number(order.codAmount || (Number(order.subtotal || 0) + Number(order.shippingFee || 0))),
      status: order.status || 'pending_verification',
      statusCode: order.statusCode || 'NEW',
      substatus: order.substatus || 'PENDING_REVIEW',
      contactIterations: order.contactIterations || 0,
      comment: order.lastComment || '',
      courierAccountId: order.courierAccountId || '',
      notes: order.notes || '',
    });
  };

  // Submit edits - Triggers the MANDATORY Confirmation Box!
  const handleEditFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    const changes: Array<{ label: string; from: string; to: string }> = [];
    if (editForm.customerName.trim() !== (editingOrder.customerName || '').trim()) {
      changes.push({ label: 'Customer Name', from: editingOrder.customerName || 'None', to: editForm.customerName });
    }
    if (editForm.customerPhone.trim() !== (editingOrder.customerPhone || '').trim()) {
      changes.push({ label: 'Customer Phone', from: editingOrder.customerPhone || 'None', to: editForm.customerPhone });
    }
    if ((editForm.customerEmail || '').trim() !== (editingOrder.customerEmail || '').trim()) {
      changes.push({ label: 'Email', from: editingOrder.customerEmail || 'None', to: editForm.customerEmail || 'None' });
    }
    if (editForm.shippingAddress.trim() !== (editingOrder.shippingAddress || '').trim()) {
      changes.push({ label: 'Shipping Address', from: editingOrder.shippingAddress || 'None', to: editForm.shippingAddress });
    }
    if (editForm.city.trim() !== (editingOrder.city || '').trim()) {
      changes.push({ label: 'City', from: editingOrder.city || 'None', to: editForm.city });
    }
    if (editForm.province.trim() !== (editingOrder.province || '').trim()) {
      changes.push({ label: 'Province', from: editingOrder.province || 'None', to: editForm.province });
    }
    if (Number(editForm.subtotal) !== Number(editingOrder.subtotal || 0)) {
      changes.push({ label: 'Subtotal', from: `${editingOrder.subtotal || 0} ${store.currency}`, to: `${editForm.subtotal} ${store.currency}` });
    }
    if (Number(editForm.shippingFee) !== Number(editingOrder.shippingFee || 0)) {
      changes.push({ label: 'Shipping Fee', from: `${editingOrder.shippingFee || 0} ${store.currency}`, to: `${editForm.shippingFee} ${store.currency}` });
    }
    const computedCod = Number(editForm.subtotal) + Number(editForm.shippingFee);
    if (computedCod !== Number(editingOrder.codAmount || 0)) {
      changes.push({ label: 'Total COD Amount', from: `${editingOrder.codAmount || 0} ${store.currency}`, to: `${computedCod} ${store.currency}` });
    }
    if (editForm.statusCode !== (editingOrder.statusCode || 'NEW')) {
      changes.push({ label: 'Status Code', from: editingOrder.statusCode || 'NEW', to: editForm.statusCode });
    }
    if (editForm.substatus !== (editingOrder.substatus || 'PENDING_REVIEW')) {
      changes.push({ label: 'Substatus', from: editingOrder.substatus || 'PENDING_REVIEW', to: editForm.substatus });
    }
    if (Number(editForm.contactIterations) !== Number(editingOrder.contactIterations || 0)) {
      changes.push({ label: 'Contact Attempts', from: String(editingOrder.contactIterations || 0), to: String(editForm.contactIterations) });
    }
    if (editForm.comment.trim() && editForm.comment.trim() !== (editingOrder.lastComment || '').trim()) {
      changes.push({ label: 'Comment', from: editingOrder.lastComment || 'None', to: editForm.comment });
    }
    if ((editForm.notes || '').trim() !== (editingOrder.notes || '').trim()) {
      changes.push({ label: 'Internal Notes', from: editingOrder.notes || 'None', to: editForm.notes || 'None' });
    }

    if (changes.length === 0) {
      alert('No changes were made to this order instance.');
      return;
    }

    // Trigger MANDATORY confirmation box!
    setConfirmModalData({
      title: 'Confirm Order Instance Updates',
      orderNumber: editingOrder.orderNumber,
      description: 'You are about to modify this live order instance in the database. Please review the parameter changes below before applying.',
      changes,
      confirmButtonText: 'Yes, Confirm & Update Instance',
      action: async () => {
        await api.updateOrder(store.id, editingOrder.id, {
          customerName: editForm.customerName,
          customerPhone: editForm.customerPhone,
          customerEmail: editForm.customerEmail || undefined,
          shippingAddress: editForm.shippingAddress,
          city: editForm.city,
          province: editForm.province,
          subtotal: Number(editForm.subtotal),
          shippingFee: Number(editForm.shippingFee),
          codAmount: computedCod,
          status: editForm.status,
          statusCode: editForm.statusCode,
          substatus: editForm.substatus,
          contactIterations: Number(editForm.contactIterations),
          comment: editForm.comment || undefined,
          courierAccountId: editForm.courierAccountId || undefined,
          notes: editForm.notes,
        });
        setEditingOrder(null);
        await loadOrders();
        if (selectedOrder?.id === editingOrder.id) {
          setSelectedOrder((prev) => (prev ? {
            ...prev,
            customerName: editForm.customerName,
            customerPhone: editForm.customerPhone,
            customerEmail: editForm.customerEmail,
            shippingAddress: editForm.shippingAddress,
            city: editForm.city,
            province: editForm.province,
            subtotal: Number(editForm.subtotal),
            shippingFee: Number(editForm.shippingFee),
            codAmount: computedCod,
            status: editForm.status,
            statusCode: editForm.statusCode,
            substatus: editForm.substatus,
            contactIterations: Number(editForm.contactIterations),
            lastComment: editForm.comment || prev.lastComment,
            notes: editForm.notes,
          } : null));
        }
      },
    });
  };

  // Status transitions - also guarded by the MANDATORY Confirmation Box!
  const requestStatusUpdate = (order: Order, newStatus: string) => {
    setConfirmModalData({
      title: 'Confirm Order Status Transition',
      orderNumber: order.orderNumber,
      description: `Are you sure you want to transition this order status from "${order.status.replace(/_/g, ' ')}" to "${newStatus.replace(/_/g, ' ')}"?`,
      changes: [
        { label: 'Status Transition', from: order.status.toUpperCase(), to: newStatus.toUpperCase() },
      ],
      confirmButtonText: 'Yes, Update Status',
      action: async () => {
        await api.updateOrderStatus(store.id, order.id, { status: newStatus });
        await loadOrders();
        if (selectedOrder?.id === order.id) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      },
    });
  };

  const tabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'pending_verification', label: 'Pending Verification' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'returned', label: 'Returned' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar currentStore={store} onSelectStore={setStore} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          title="Orders Center"
          subtitle="Multi-channel order intake, lifecycle progression, and verification states"
        >
          <button
            onClick={() => setShowCSVModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
        </Header>

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl pb-24 lg:pb-8">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === tab.key
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar & 2 View Modes Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                  placeholder="Search by order #, phone, customer name, or tracking..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button
                onClick={loadOrders}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium transition-colors shrink-0"
              >
                Apply
              </button>
            </div>

            {/* View Mode Switcher: Detailed vs Card */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0 shadow-md">
              <button
                type="button"
                onClick={() => handleSetViewMode('detailed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'detailed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Detailed Table View - Inspect instances"
              >
                <Table className="w-3.5 h-3.5" />
                <span>Detailed View</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'card'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Card View - Mobile/Tablet optimized"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Card View</span>
              </button>
            </div>
          </div>

          {/* Main Layout: Orders (Detailed or Card View) & Selected Order Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders Panel */}
            <div className="lg:col-span-2 space-y-4">
              {orders.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingBag className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">No Orders Found</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Your store &quot;{store.name}&quot; currently has 0 orders in this view.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <a
                      href="/integrations/stores"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Connect Store APIs
                    </a>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700"
                    >
                      Create Manual Order
                    </button>
                  </div>
                </div>
              ) : viewMode === 'detailed' ? (
                /* 1. DETAILED VIEW: High-density Table */
                <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <p className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <span>Detailed Instances ({orders.length})</span>
                    </p>
                    <span className="text-[11px] text-slate-400">Click row or Edit to update instance</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/60">
                          <th className="p-3">Order #</th>
                          <th className="p-3">Customer</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Items</th>
                          <th className="p-3">COD Total</th>
                          <th className="p-3">Source</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {orders.map((o) => (
                          <tr
                            key={o.id}
                            onClick={() => setSelectedOrder(o)}
                            className={`cursor-pointer transition-colors ${
                              selectedOrder?.id === o.id
                                ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                                : 'hover:bg-slate-900/60'
                            }`}
                          >
                            <td className="p-3 font-semibold text-white font-mono">{o.orderNumber}</td>
                            <td className="p-3">
                              <p className="font-medium text-slate-200">{o.customerName}</p>
                              <p className="text-[11px] text-emerald-400 font-mono">{o.customerPhone}</p>
                              <p className="text-[10px] text-slate-500">{o.city || 'City N/A'}</p>
                            </td>
                            <td className="p-3">
                              <StatusBadge status={o.status} />
                            </td>
                            <td className="p-3 max-w-[150px] truncate text-slate-300">
                              {o.items && o.items.length > 0 ? (
                                <span title={o.items.map((it) => it.productName).join(', ')}>
                                  {o.items[0].productName} {o.items.length > 1 ? `(+${o.items.length - 1} more)` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-500">1 Item</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-white font-mono">
                              {formatCurrency(o.codAmount, o.currency || store.currency)}
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {o.source}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(o)}
                                  className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                                  title="Edit Order Instance"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(o)}
                                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                                  title="View Drawer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* 2. CARD VIEW: Touch & Tablet Optimized Cards */
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-emerald-400" />
                      <span>Order Cards ({orders.length})</span>
                    </p>
                    <span className="text-[11px] text-slate-400">1-tap call, WhatsApp & instance editing</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className={`rounded-2xl border bg-slate-900/90 p-4 transition-all hover:border-emerald-500/40 shadow-lg flex flex-col justify-between space-y-3 ${
                          selectedOrder?.id === o.id
                            ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'border-slate-800'
                        }`}
                      >
                        {/* Header: Order Number & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order</span>
                            <h4 className="text-base font-extrabold text-white font-mono tracking-tight flex items-center gap-1.5">
                              {o.orderNumber}
                            </h4>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(o.createdAt)} • <span className="uppercase text-emerald-400 font-mono">{o.source}</span>
                            </span>
                          </div>
                          <StatusBadge status={o.status} />
                        </div>

                        {/* Customer Info Box */}
                        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                                {o.customerName ? o.customerName.slice(0, 1).toUpperCase() : 'C'}
                              </span>
                              <span>{o.customerName}</span>
                            </p>
                            <div className="flex items-center gap-1">
                              {o.customerPhone && (
                                <>
                                  <a
                                    href={`tel:${o.customerPhone}`}
                                    title="Call Customer"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={`https://wa.me/${o.customerPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="WhatsApp Customer"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] text-emerald-400 font-mono font-medium">{o.customerPhone}</p>
                          <p className="text-[11px] text-slate-300 truncate">
                            {o.shippingAddress || 'No shipping address provided'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            📍 {o.city || 'City N/A'}{o.province ? `, ${o.province}` : ''}
                          </p>
                        </div>

                        {/* Items preview & COD amount */}
                        <div className="space-y-1.5">
                          {o.items && o.items.length > 0 && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                              <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate text-slate-300">
                                {o.items.map((it) => `${it.productName || 'Item'} (x${it.quantity})`).join(', ')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                            <span className="text-[11px] text-slate-400 font-medium">COD To Collect:</span>
                            <span className="text-sm font-extrabold text-emerald-400 font-mono">
                              {formatCurrency(o.codAmount, o.currency || store.currency)}
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => openEditModal(o)}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Instance</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Order Detail Drawer */}
            <div className="glass-panel p-5 rounded-2xl space-y-5 h-fit shadow-xl">
              {selectedOrder ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 font-mono">Order Details</span>
                      <h3 className="text-lg font-bold text-white font-mono mt-0.5">
                        {selectedOrder.orderNumber}
                      </h3>
                    </div>
                    <StatusBadge status={selectedOrder.status} />
                  </div>

                  {/* Prominent Edit Instance Button */}
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedOrder)}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Order Instance</span>
                  </button>

                  {/* Customer details */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                      Customer & Delivery Address
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                      <p className="font-semibold text-white text-sm">{selectedOrder.customerName}</p>
                      <p className="text-emerald-400 font-mono font-medium">{selectedOrder.customerPhone}</p>
                      <p className="text-slate-300 mt-1">{selectedOrder.shippingAddress || 'No address specified'}</p>
                      <p className="text-slate-500 text-[11px]">{selectedOrder.city}, {selectedOrder.province}</p>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                      Cash Collection Breakdown
                    </p>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Items Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.subtotal, store.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Delivery Fee:</span>
                        <span>{formatCurrency(selectedOrder.shippingFee, store.currency)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-white text-sm">
                        <span>Total COD To Collect:</span>
                        <span className="text-emerald-400">
                          {formatCurrency(selectedOrder.codAmount, store.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hierarchical Status & Contact Iterations Badge */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Lifecycle & Substatus
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Attempts: {selectedOrder.contactIterations || selectedOrder.callAttemptsCount || 0}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold font-mono">
                        {selectedOrder.statusCode || 'CONFIRMATION'}
                      </span>
                      <span className="text-slate-500">/</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-bold border border-slate-700">
                        {selectedOrder.substatus || 'CONFIRMED'}
                      </span>
                    </div>

                    {/* Quick Iteration Incrementer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400">Call / WhatsApp Attempt:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextCount = (selectedOrder.contactIterations || 0) + 1;
                          api.updateOrderStatus(store.id, selectedOrder.id, {
                            contactIterations: nextCount,
                            comment: `Contact attempt #${nextCount} logged`,
                          }).then(() => {
                            setSelectedOrder((prev) => (prev ? { ...prev, contactIterations: nextCount } : null));
                            loadOrders();
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold transition-all flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>+1 Call Attempt</span>
                      </button>
                    </div>

                    {/* Last Comment Log */}
                    {selectedOrder.lastComment && (
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 italic">
                        "{selectedOrder.lastComment}"
                      </div>
                    )}
                  </div>

                  {/* Substatus & Comment Update Form */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Update Substatus & Comment
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Status Code</label>
                        <select
                          value={targetStatusCode}
                          onChange={(e) => {
                            const newGroup = e.target.value;
                            setTargetStatusCode(newGroup);
                            const groupObj = ORDER_STATUS_GROUPS.find((g) => g.code === newGroup);
                            if (groupObj && groupObj.substatuses.length > 0) {
                              setTargetSubstatus(groupObj.substatuses[0].code);
                            }
                          }}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs font-semibold"
                        >
                          {ORDER_STATUS_GROUPS.map((g) => (
                            <option key={g.code} value={g.code}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Substatus</label>
                        <select
                          value={targetSubstatus}
                          onChange={(e) => setTargetSubstatus(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs font-semibold"
                        >
                          {ORDER_STATUS_GROUPS.find((g) => g.code === targetStatusCode)?.substatuses.map((sub) => (
                            <option key={sub.code} value={sub.code}>
                              {sub.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Comment / Notes</label>
                      <input
                        type="text"
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        placeholder="Add operator remark or call result..."
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={updatingSubstatus}
                      onClick={() => handleApplySubstatusUpdate(selectedOrder)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{updatingSubstatus ? 'Saving...' : 'Apply Status & Substatus'}</span>
                    </button>
                  </div>

                  {/* Shipping Carrier Instance (City-Filtered) & Dispatch */}
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Shipping Company Instance</span>
                      </p>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {selectedOrder.city || 'Casablanca'}
                      </span>
                    </div>

                    {selectedOrder.trackingNumber ? (
                      <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{selectedOrder.courierName || 'Integrated Carrier'}</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">MANIFESTED</span>
                        </div>
                        <div className="font-mono text-xs text-blue-300 font-bold flex items-center justify-between">
                          <span>{selectedOrder.trackingNumber}</span>
                          <a
                            href={`/tracking?q=${selectedOrder.trackingNumber}`}
                            className="text-[11px] underline text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                          >
                            Live Tracking <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="pt-1.5 border-t border-blue-900/40 flex justify-end">
                          <a
                            href={`http://localhost:4000/api/couriers/shipments/${selectedOrder.id}/label`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-colors"
                          >
                            Print AWB Label
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">
                            Select Carrier Servicing {selectedOrder.city || 'destination'}:
                          </label>
                          {loadingCouriers ? (
                            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 text-xs flex items-center gap-1.5">
                              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                              Filtering carriers for {selectedOrder.city}...
                            </div>
                          ) : availableCouriers.length === 0 ? (
                            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs space-y-1.5">
                              <div>
                                No integrated shipping companies currently cover <span className="font-semibold text-white">{selectedOrder.city || 'this city'}</span> for active store <span className="font-semibold text-white">{store.name}</span>.
                              </div>
                              <a
                                href="/integrations/shipping"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 underline font-semibold"
                              >
                                Connect accounts in Logistics settings &rarr;
                              </a>
                            </div>
                          ) : (
                            <select
                              value={selectedCourierAccountId}
                              onChange={(e) => setSelectedCourierAccountId(e.target.value)}
                              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-semibold text-xs cursor-pointer"
                            >
                              {availableCouriers.map((acc: any) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.courierCompany?.name || acc.accountName} (Servicing {selectedOrder.city || 'All Cities'})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={dispatchingCourier || availableCouriers.length === 0}
                          onClick={() => handleDispatchOrder(selectedOrder)}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-950/30 flex items-center justify-center gap-2"
                        >
                          <Truck className="w-4 h-4" />
                          <span>{dispatchingCourier ? 'Sending Carrier API Request...' : 'Create Shipping & Dispatch with Carrier'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Select an order from the list to view comprehensive details
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* New Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-4 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                {orderSource === 'whatsapp' ? 'Convert WhatsApp Client to Order' : 'Create Manual COD Order'}
              </h3>
              {orderSource === 'whatsapp' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  WhatsApp Origin
                </span>
              )}
            </div>

            {orderSource === 'whatsapp' && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Client details imported from active WhatsApp conversation. Select the product they inquired about to confirm order.
                </span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  placeholder="e.g. Mehdi Chraibi"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newOrder.customerPhone}
                    onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    placeholder="+212600000000"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newOrder.city}
                    onChange={(e) => setNewOrder({ ...newOrder, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    placeholder="e.g. Marrakech"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Shipping Address</label>
                <input
                  type="text"
                  required
                  value={newOrder.shippingAddress}
                  onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  placeholder="Street, Quartier, Residence"
                />
              </div>

              {/* 1-Click Product Search & Retrieval from DB by Name or SKU */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold text-xs">
                    Search Product from DB by Name or SKU
                  </label>
                  {selectedProduct && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <Check className="h-3 w-3" /> Auto-Retrieved from DB
                    </span>
                  )}
                </div>

                {/* Search input for Name or SKU */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Type Product Name or SKU (e.g. Smart Lamp or SKU-102)..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setIsProductSearchOpen(true);
                      }}
                      onFocus={() => setIsProductSearchOpen(true)}
                      className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none"
                    />
                    {productSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchQuery('');
                          setSelectedProduct(null);
                          setNewOrder((prev) => ({ ...prev, productName: '', subtotal: 0, shippingFee: 0 }));
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {isProductSearchOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 space-y-1">
                      {(() => {
                        const term = productSearchQuery.toLowerCase().trim();
                        const matches = productsList.filter((p: any) => {
                          if (!term) return true;
                          const name = (p.name || p.title || '').toLowerCase();
                          const sku = (p.sku || '').toLowerCase();
                          const cat = (p.category || '').toLowerCase();
                          return name.includes(term) || sku.includes(term) || cat.includes(term);
                        });

                        if (matches.length === 0) {
                          return (
                            <div className="p-3 text-center text-slate-400 text-xs">
                              No products found matching "{productSearchQuery}".
                            </div>
                          );
                        }

                        return matches.map((p: any) => {
                          const pName = p.name || p.title;
                          const pPrice = Number(p.price || p.salePrice || p.regularPrice || 0);
                          const pBarred = p.barredPrice ? Number(p.barredPrice) : (p.regularPrice && p.regularPrice > pPrice ? Number(p.regularPrice) : null);
                          const pShipping = Number(p.shippingPrice !== undefined ? p.shippingPrice : ((store as any).settings?.defaultShippingFee || 0));
                          const pImg = p.imageUrl || (p.images && p.images[0]) || null;
                          const isSelected = selectedProduct?.id === p.id;

                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedProduct(p);
                                setProductSearchQuery(pName);
                                setIsProductSearchOpen(false);
                                setNewOrder((prev) => ({
                                  ...prev,
                                  productName: pName,
                                  subtotal: pPrice,
                                  shippingFee: pShipping,
                                }));
                              }}
                              className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                                  : 'hover:bg-slate-800/80 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {pImg ? (
                                  <img src={pImg} alt={pName} className="h-8 w-8 rounded-md object-cover bg-slate-950 shrink-0 border border-slate-800" />
                                ) : (
                                  <div className="h-8 w-8 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                    <Package className="h-4 w-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs truncate text-white">{pName}</span>
                                    {p.sku && (
                                      <span className="text-[10px] font-mono bg-slate-800 text-cyan-400 px-1.5 py-0.2 rounded border border-slate-700">
                                        {p.sku}
                                      </span>
                                    )}
                                    {p.isFragile && (
                                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">
                                        Fragile
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span>Stock: {p.stockQuantity ?? 'Available'}</span>
                                    {p.category && <span>• {p.category}</span>}
                                    {p.shippingPrice !== undefined && <span>• Ship: {p.shippingPrice} {store.currency}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0 pl-2">
                                <div className="font-bold text-emerald-400 font-mono text-xs">
                                  {pPrice} {store.currency}
                                </div>
                                {pBarred && (
                                  <div className="text-[10px] text-slate-500 line-through font-mono">
                                    {pBarred} {store.currency}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Selected Product Card Retrieved from DB */}
                {selectedProduct && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-3 min-w-0">
                      {(selectedProduct.imageUrl || (selectedProduct.images && selectedProduct.images[0])) ? (
                        <img
                          src={selectedProduct.imageUrl || selectedProduct.images[0]}
                          alt={selectedProduct.name}
                          className="h-10 w-10 rounded-lg object-cover bg-slate-950 border border-emerald-500/20 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate">
                            {selectedProduct.name || selectedProduct.title}
                          </span>
                          {selectedProduct.sku && (
                            <span className="text-[10px] font-mono bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-slate-700">
                              {selectedProduct.sku}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Unit Price: <strong className="text-emerald-400 font-mono">{newOrder.subtotal} {store.currency}</strong>
                          {' '}• Shipping: <strong className="text-slate-200 font-mono">{newOrder.shippingFee} {store.currency}</strong>
                          {' '}• COD Total: <strong className="text-white font-mono">{newOrder.subtotal + newOrder.shippingFee} {store.currency}</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProductSearchOpen(true)}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown Fields (Auto-filled from DB product info) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Product Price ({store.currency}) <span className="text-[10px] text-emerald-400 font-normal">Auto-filled</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newOrder.subtotal}
                    onChange={(e) => setNewOrder({ ...newOrder, subtotal: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Shipping Fee ({store.currency}) <span className="text-[10px] text-emerald-400 font-normal">Auto-filled</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newOrder.shippingFee}
                    onChange={(e) => setNewOrder({ ...newOrder, shippingFee: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setOrderSource('manual');
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg"
                >
                  Save & Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-xl w-full space-y-4 border border-slate-700">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Import Orders via CSV</span>
            </h3>
            <p className="text-xs text-slate-400">
              Paste comma-separated rows with columns: customerName, customerPhone, city, shippingAddress, subtotal, shippingFee, productName
            </p>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowCSVModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCSV}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg"
              >
                Start Bulk Ingestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT ORDER INSTANCE MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl max-w-xl w-full space-y-4 border border-slate-700 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <span>Edit Order Instance</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Order #{editingOrder.orderNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditFormSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none"
                    placeholder="e.g. Salim Tazi"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Customer Phone</label>
                  <input
                    type="text"
                    required
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white font-mono outline-none"
                    placeholder="+212600000000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Customer Email (Optional)</label>
                <input
                  type="email"
                  value={editForm.customerEmail}
                  onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Shipping Address</label>
                <input
                  type="text"
                  required
                  value={editForm.shippingAddress}
                  onChange={(e) => setEditForm({ ...editForm, shippingAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none"
                  placeholder="Street, Quartier, Residence, Floor/Apt"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">City</label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none"
                    placeholder="e.g. Casablanca"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Province / Region</label>
                  <input
                    type="text"
                    value={editForm.province}
                    onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none"
                    placeholder="e.g. Grand Casablanca"
                  />
                </div>
              </div>

              {/* Price & COD Calculation Breakdown */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Cash Collection & Pricing ({store.currency})
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Subtotal</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={editForm.subtotal}
                      onChange={(e) => setEditForm({ ...editForm, subtotal: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Shipping Fee</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={editForm.shippingFee}
                      onChange={(e) => setEditForm({ ...editForm, shippingFee: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Calculated COD Amount:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {formatCurrency(Number(editForm.subtotal) + Number(editForm.shippingFee), store.currency)}
                  </span>
                </div>
              </div>

              {/* Hierarchical Order Status & Substatus */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Status Group (Code)</label>
                  <select
                    value={editForm.statusCode}
                    onChange={(e) => {
                      const newCode = e.target.value;
                      const grp = ORDER_STATUS_GROUPS.find((g) => g.code === newCode);
                      setEditForm({
                        ...editForm,
                        statusCode: newCode,
                        substatus: grp?.substatuses[0]?.code || 'PENDING_REVIEW',
                      });
                    }}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white font-semibold outline-none cursor-pointer font-mono"
                  >
                    {ORDER_STATUS_GROUPS.map((g) => (
                      <option key={g.code} value={g.code}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Order Substatus</label>
                  <select
                    value={editForm.substatus}
                    onChange={(e) => setEditForm({ ...editForm, substatus: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white font-semibold outline-none cursor-pointer font-mono"
                  >
                    {ORDER_STATUS_GROUPS.find((g) => g.code === editForm.statusCode)?.substatuses.map((sub) => (
                      <option key={sub.code} value={sub.code}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Iterations & Comment Log */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Contact Attempts</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={editForm.contactIterations}
                      onChange={(e) => setEditForm({ ...editForm, contactIterations: Number(e.target.value) })}
                      className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, contactIterations: Number(editForm.contactIterations) + 1 })}
                      className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
                      title="Increment call attempt"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-medium">Status Transition Comment</label>
                  <input
                    type="text"
                    value={editForm.comment}
                    onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none"
                    placeholder="e.g. Client confirmed delivery time for tomorrow"
                  />
                </div>
              </div>

              {/* Shipping Carrier Instance */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Assigned Shipping Company (City: {editForm.city || 'Standard'})
                </label>
                <select
                  value={editForm.courierAccountId}
                  onChange={(e) => setEditForm({ ...editForm, courierAccountId: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white font-semibold outline-none cursor-pointer"
                >
                  <option value="">-- Select Shipping Company Instance --</option>
                  {availableCouriers.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.courierCompany?.name || acc.accountName} (Servicing {editForm.city || 'Casablanca'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Internal Notes & Remarks</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-white outline-none"
                  placeholder="Special instructions or customer request..."
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Confirmation box required before saving</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    Review & Apply Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MANDATORY CONFIRMATION BOX MODAL */}
      {confirmModalData && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{confirmModalData.title}</h3>
                <p className="text-xs text-amber-400 font-mono mt-0.5">
                  Order #{confirmModalData.orderNumber}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {confirmModalData.description}
            </p>

            {/* Changes Breakdown Table */}
            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 max-h-52 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/80">
                <span>Field</span>
                <div className="flex items-center gap-3">
                  <span>Previous</span>
                  <span>New</span>
                </div>
              </div>
              {confirmModalData.changes.map((ch, idx) => (
                <div
                  key={idx}
                  className="text-xs flex items-center justify-between gap-2 border-b border-slate-800/50 pb-1.5 last:border-0 last:pb-0"
                >
                  <span className="text-slate-300 font-medium">{ch.label}</span>
                  <div className="flex items-center gap-2 text-right font-mono text-[11px]">
                    <span className="text-rose-400/90 line-through truncate max-w-[120px]">{ch.from}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-emerald-400 font-bold truncate max-w-[140px]">{ch.to}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>This update will be recorded in the audit log and synced with COD collection.</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={confirmLoading}
                onClick={() => setConfirmModalData(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel & Review
              </button>
              <button
                type="button"
                disabled={confirmLoading}
                onClick={async () => {
                  setConfirmLoading(true);
                  try {
                    await confirmModalData.action();
                    setConfirmModalData(null);
                  } catch (err: any) {
                    alert(`Operation failed: ${err.message}`);
                  } finally {
                    setConfirmLoading(false);
                  }
                }}
                className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                {confirmLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmModalData.confirmButtonText || 'Yes, Confirm & Apply'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
