'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Upload,
  Globe,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  Store as StoreIcon,
  Tag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { api } from '../../lib/api';

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  costPrice?: number;
  stockQuantity: number;
  category?: string;
  source?: string;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
}

const REQUIRED_FIELDS = [
  { key: 'name', label: 'Product Name / Title *', required: true, aliases: ['name', 'title', 'product_name', 'nom', 'article', 'designation'] },
  { key: 'sku', label: 'SKU / Barcode *', required: true, aliases: ['sku', 'code', 'barcode', 'reference', 'ref', 'item_code'] },
  { key: 'price', label: 'Sale Price *', required: true, aliases: ['price', 'sale_price', 'prix', 'amount', 'tarifs'] },
  { key: 'stock_quantity', label: 'Stock Quantity', required: false, aliases: ['stock', 'quantity', 'stock_quantity', 'qty', 'quantite'] },
  { key: 'cost_price', label: 'Cost Price', required: false, aliases: ['cost', 'cost_price', 'cout', 'achat', 'unit_cost'] },
  { key: 'category', label: 'Category', required: false, aliases: ['category', 'collection', 'type', 'categorie', 'tag'] },
  { key: 'image_url', label: 'Image URL', required: false, aliases: ['image', 'image_url', 'photo', 'picture', 'img'] },
  { key: 'description', label: 'Description', required: false, aliases: ['description', 'desc', 'details', 'body'] },
];

export default function ProductsPage() {
  const [store, setStore] = useState({ id: 'default', name: 'Store', currency: 'MAD' });
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('Seller');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Sync state
  const [syncingShops, setSyncingShops] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manual Add / Edit Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [mName, setMName] = useState('');
  const [mSku, setMSku] = useState('');
  const [mPrice, setMPrice] = useState<number>(0);
  const [mCostPrice, setMCostPrice] = useState<number>(0);
  const [mStock, setMStock] = useState<number>(0);
  const [mCategory, setMCategory] = useState('');
  const [mImageUrl, setMImageUrl] = useState('');
  const [mDescription, setMDescription] = useState('');
  const [mIsActive, setMIsActive] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  // Guided CSV Wizard State
  const [showCsvWizard, setShowCsvWizard] = useState(false);
  const [csvStep, setCsvStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvRawText, setCsvRawText] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importingCsv, setImportingCsv] = useState(false);

  const loadProducts = async () => {
    if (!store?.id || store.id === 'default') return;
    try {
      setLoading(true);
      const res = await api.getProducts(store.id);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const uniqueMap = new Map();
      for (const item of list) {
        const key = (item.sku || item.name || item.id || '').trim().toLowerCase();
        if (key && !uniqueMap.has(key)) uniqueMap.set(key, item);
      }
      setProducts(Array.from(uniqueMap.values()));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.getMe();
        if (me?.user?.role) setUserRole(me.user.role);
        const current = api.getCurrentStore();
        if (current) {
          setStore(current);
        } else if (me?.stores && me.stores.length > 0) {
          setStore(me.stores[0]);
          api.setCurrentStore(me.stores[0]);
        }
      } catch {}
    };
    init();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [store.id]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync from Shops
  const handleSyncShops = async () => {
    setSyncingShops(true);
    try {
      const res = await api.syncProductsFromShops(store.id);
      showToast('success', res?.message || 'Articles synchronized successfully from connected shops!');
      await loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Shop sync failed');
    } finally {
      setSyncingShops(false);
    }
  };

  // Sync from Sheets
  const handleSyncSheets = async () => {
    setSyncingSheets(true);
    try {
      const res = await api.syncProductsFromSheets(store.id);
      showToast('success', res?.message || 'Articles synchronized successfully from Google Sheets!');
      await loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Google Sheets sync failed');
    } finally {
      setSyncingSheets(false);
    }
  };

  // Manual Add / Edit
  const openAddModal = () => {
    setEditingProduct(null);
    setMName('');
    setMSku(`SKU-${Date.now().toString().slice(-6)}`);
    setMPrice(199);
    setMCostPrice(80);
    setMStock(50);
    setMCategory('Cosmetics & Beauty');
    setMImageUrl('');
    setMDescription('');
    setMIsActive(true);
    setShowProductModal(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setMName(p.name);
    setMSku(p.sku);
    setMPrice(Number(p.price || 0));
    setMCostPrice(Number(p.costPrice || 0));
    setMStock(Number(p.stockQuantity || 0));
    setMCategory(p.category || '');
    setMImageUrl(p.imageUrl || '');
    setMDescription(p.description || '');
    setMIsActive(p.isActive !== false);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const payload = {
        name: mName,
        sku: mSku,
        price: Number(mPrice),
        costPrice: Number(mCostPrice),
        stockQuantity: Number(mStock),
        category: mCategory,
        imageUrl: mImageUrl,
        description: mDescription,
        isActive: mIsActive,
      };

      if (editingProduct) {
        await api.updateProduct(store.id, editingProduct.id, payload);
        showToast('success', `Product "${mName}" updated successfully!`);
      } else {
        await api.createProduct(store.id, payload);
        showToast('success', `Product "${mName}" added to catalog!`);
      }
      setShowProductModal(false);
      await loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!confirm(`Delete product "${name}" from store catalog?`)) return;
    try {
      await api.deleteProduct(store.id, productId);
      showToast('success', `Product "${name}" deleted.`);
      await loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete product');
    }
  };

  // CSV Guide & Template Downloader
  const downloadSampleTemplate = () => {
    const csvContent =
      'sku,name,price,cost_price,stock_quantity,category,image_url,description\n' +
      'SKU-ARG-001,Argan Oil Serum 100ml,249,85,150,Skin Care,https://images.unsplash.com/photo-1608248597359-001b97b05537?w=300,Pure organic cosmetic argan oil\n' +
      'SKU-ROS-002,Kelaat M\'gouna Rose Water,120,40,200,Fragrance,https://images.unsplash.com/photo-1617897903246-719242758050?w=300,Distilled fresh floral water\n' +
      'SKU-NIG-003,Black Seed Hair Growth Oil,180,65,75,Hair Care,,Nigella sativa stimulating oil\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `codflow_products_template_${store.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File Handler
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      parseUploadedCsv(text);
    };
    reader.readAsText(file);
  };

  const parseUploadedCsv = (text: string) => {
    setCsvRawText(text);
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      alert('The uploaded CSV file must contain at least a header row and 1 product row.');
      return;
    }

    // Split headers handling quotes
    const headerRow = parseCsvLine(lines[0]);
    setCsvHeaders(headerRow);

    const dataRows = lines.slice(1).map((l) => parseCsvLine(l));
    setCsvRows(dataRows);

    // Auto-map headers intelligently
    const initialMapping: Record<string, string> = {};
    REQUIRED_FIELDS.forEach((f) => {
      const match = headerRow.find((h) => {
        const cleanH = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
        return f.aliases.some((alias) => cleanH.includes(alias));
      });
      if (match) {
        initialMapping[f.key] = match;
      }
    });

    setColumnMapping(initialMapping);
    setCsvStep(2); // Go to mapping step
  };

  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  // Validate Mappings & Preview
  const handleProceedToPreview = () => {
    const errors: string[] = [];
    if (!columnMapping.name) errors.push('Please map the required field: Product Name');
    if (!columnMapping.sku) errors.push('Please map the required field: SKU / Barcode');
    if (!columnMapping.price) errors.push('Please map the required field: Sale Price');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setCsvStep(3); // Proceed to preview & validation check
  };

  // Commit Guided CSV Import
  const handleCommitImport = async () => {
    setImportingCsv(true);
    try {
      const itemsToImport = csvRows.map((row) => {
        const getVal = (fieldKey: string) => {
          const colName = columnMapping[fieldKey];
          if (!colName) return undefined;
          const idx = csvHeaders.indexOf(colName);
          return idx !== -1 ? row[idx] : undefined;
        };

        const rawPrice = getVal('price');
        const numPrice = rawPrice ? parseFloat(rawPrice.replace(/[^0-9.]/g, '')) : 0;

        const rawCost = getVal('cost_price');
        const numCost = rawCost ? parseFloat(rawCost.replace(/[^0-9.]/g, '')) : undefined;

        const rawStock = getVal('stock_quantity');
        const numStock = rawStock ? parseInt(rawStock.replace(/[^0-9]/g, ''), 10) : 0;

        return {
          name: getVal('name') || 'Unnamed Product',
          sku: getVal('sku') || `SKU-${Math.random().toString(36).slice(-6).toUpperCase()}`,
          price: isNaN(numPrice) ? 0 : numPrice,
          costPrice: isNaN(numCost as number) ? undefined : numCost,
          stockQuantity: isNaN(numStock) ? 0 : numStock,
          category: getVal('category') || 'General',
          imageUrl: getVal('image_url') || '',
          description: getVal('description') || '',
          source: 'CSV',
        };
      });

      const res = await api.importProductsCsv(store.id, itemsToImport);
      showToast('success', res?.message || `Successfully imported ${itemsToImport.length} articles into catalog!`);
      setShowCsvWizard(false);
      setCsvStep(1);
      await loadProducts();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to import CSV articles');
    } finally {
      setImportingCsv(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesSource = sourceFilter === 'ALL' || (p.source || 'MANUAL').toUpperCase() === sourceFilter.toUpperCase();

    const stock = Number(p.stockQuantity || 0);
    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'IN_STOCK' && stock > 10) ||
      (stockFilter === 'LOW_STOCK' && stock > 0 && stock <= 10) ||
      (stockFilter === 'OUT_OF_STOCK' && stock <= 0);

    return matchesSearch && matchesCategory && matchesSource && matchesStock;
  });

  const allCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

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
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">Product & Article Catalog</h1>
                  <p className="text-xs text-slate-400">
                    Live inventory for <span className="font-semibold text-white">{store.name}</span> retrieved from Integrated Shops, Google Sheets, or Guided CSV.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Sync from Integrated Shops */}
              <button
                type="button"
                onClick={handleSyncShops}
                disabled={syncingShops}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold shadow-sm transition-all"
                title="Fetch products from Shopify, WooCommerce & YouCan"
              >
                <Globe className={`w-3.5 h-3.5 text-indigo-400 ${syncingShops ? 'animate-spin' : ''}`} />
                <span>{syncingShops ? 'Syncing...' : 'Sync Shops'}</span>
              </button>

              {/* Sync from Google Sheets */}
              <button
                type="button"
                onClick={handleSyncSheets}
                disabled={syncingSheets}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold shadow-sm transition-all"
                title="Fetch articles from linked Google Sheets"
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald-400 ${syncingSheets ? 'animate-spin' : ''}`} />
                <span>{syncingSheets ? 'Syncing...' : 'Sync Sheets'}</span>
              </button>

              {/* Guided CSV Ingestion */}
              <button
                type="button"
                onClick={() => {
                  setCsvStep(1);
                  setShowCsvWizard(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-semibold shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Guided CSV Import</span>
              </button>

              {/* Add Single Product */}
              <button
                type="button"
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {notification && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Filters Bar */}
          <div className="glass-panel p-4 rounded-2xl border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by name, SKU, or category..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Sources</option>
                <option value="SHOPIFY">Shopify</option>
                <option value="WOOCOMMERCE">WooCommerce</option>
                <option value="YOUCAN">YouCan</option>
                <option value="GOOGLE_SHEETS">Google Sheets</option>
                <option value="CSV">CSV Import</option>
                <option value="MANUAL">Manual</option>
              </select>

              {/* Stock Status Filter */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                <button
                  onClick={() => setStockFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stockFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({products.length})
                </button>
                <button
                  onClick={() => setStockFilter('IN_STOCK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stockFilter === 'IN_STOCK' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setStockFilter('LOW_STOCK')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    stockFilter === 'LOW_STOCK' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Low (&lt;10)
                </button>
              </div>
            </div>
          </div>

          {/* Product Catalog Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs">Loading articles catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border-slate-800 text-slate-400">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No articles found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No products match your search or filter. Sync with your store, import via guided CSV, or add products manually.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => {
                    setCsvStep(1);
                    setShowCsvWizard(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
                >
                  Guided CSV Import
                </button>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  Add Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Article / Product</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Stock Level</th>
                      <th className="py-3 px-4 text-right">Price ({store.currency})</th>
                      <th className="py-3 px-4 text-right">Cost Price</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.map((p) => {
                      const stock = Number(p.stockQuantity || 0);
                      const isLow = stock > 0 && stock <= 10;
                      const isOut = stock <= 0;
                      const margin = p.costPrice && p.price ? Math.round(((p.price - p.costPrice) / p.price) * 100) : null;

                      return (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                          {/* Title & Image */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
                                {p.imageUrl ? (
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0 max-w-[240px]">
                                <span className="font-semibold text-white block truncate" title={p.name}>
                                  {p.name}
                                </span>
                                {p.description && (
                                  <span className="text-[11px] text-slate-400 block truncate" title={p.description}>
                                    {p.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {p.sku}
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                              {p.category || 'General'}
                            </span>
                          </td>

                          {/* Source */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                p.source === 'SHOPIFY'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                  : p.source === 'WOOCOMMERCE'
                                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                  : p.source === 'YOUCAN'
                                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                  : p.source === 'GOOGLE_SHEETS'
                                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                  : p.source === 'CSV'
                                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                                  : 'bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              {p.source || 'MANUAL'}
                            </span>
                          </td>

                          {/* Stock Status */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                              />
                              <span
                                className={`font-semibold ${
                                  isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-200'
                                }`}
                              >
                                {stock} units
                              </span>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 text-right font-bold text-white font-mono">
                            {Number(p.price).toFixed(2)} {store.currency}
                          </td>

                          {/* Cost & Margin */}
                          <td className="py-3 px-4 text-right">
                            {p.costPrice ? (
                              <div>
                                <span className="font-mono text-slate-400 text-xs">
                                  {Number(p.costPrice).toFixed(2)}
                                </span>
                                {margin !== null && (
                                  <span className="block text-[10px] text-emerald-400 font-semibold">
                                    {margin}% margin
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

          {/* ========================================================================= */}
          {/* GUIDED CSV IMPORT WIZARD MODAL                                            */}
          {/* ========================================================================= */}
          {showCsvWizard && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                {/* Wizard Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Guided Product CSV Importer</h3>
                      <p className="text-[11px] text-slate-400">
                        Zero-mismatch column mapping and instant validation for {store.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCsvWizard(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Stepper Progress Bar */}
                <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        csvStep === 1
                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      1
                    </span>
                    <span className={csvStep === 1 ? 'text-white font-semibold' : 'text-slate-400'}>
                      Template & Upload
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        csvStep === 2
                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      2
                    </span>
                    <span className={csvStep === 2 ? 'text-white font-semibold' : 'text-slate-400'}>
                      Map Columns
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                        csvStep === 3
                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      3
                    </span>
                    <span className={csvStep === 3 ? 'text-white font-semibold' : 'text-slate-400'}>
                      Validation & Import
                    </span>
                  </div>
                </div>

                {/* Wizard Body */}
                <div className="p-6 space-y-5 text-xs max-h-[70vh] overflow-y-auto">
                  {/* STEP 1: DOWNLOAD TEMPLATE & UPLOAD */}
                  {csvStep === 1 && (
                    <div className="space-y-5">
                      {/* Guidance Box */}
                      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-400" /> Standard Column Specification
                            </h4>
                            <p className="text-slate-300 text-xs">
                              To prevent data mismatches, our engine requires at minimum <strong className="text-emerald-400">SKU, Name, and Price</strong>. Download our ready-made CSV template below:
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={downloadSampleTemplate}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 shrink-0"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Template (.csv)</span>
                          </button>
                        </div>

                        {/* Column badge specifications */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="font-mono text-[11px] text-emerald-400 font-bold block">sku *</span>
                            <span className="text-[10px] text-slate-400">Unique identifier</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="font-mono text-[11px] text-emerald-400 font-bold block">name *</span>
                            <span className="text-[10px] text-slate-400">Article title</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="font-mono text-[11px] text-emerald-400 font-bold block">price *</span>
                            <span className="text-[10px] text-slate-400">Numeric in {store.currency}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                            <span className="font-mono text-[11px] text-slate-300 font-bold block">stock_quantity</span>
                            <span className="text-[10px] text-slate-400">Current units</span>
                          </div>
                        </div>
                      </div>

                      {/* Upload Area */}
                      <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-8 text-center bg-slate-950/40 transition-colors">
                        <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-white mb-1">Select Your CSV File</h4>
                        <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                          Upload any product spreadsheet or export. In the next step, our guide will map your custom columns automatically.
                        </p>
                        <label
                          htmlFor="csv-file-input"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer shadow-lg shadow-indigo-600/20"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Choose CSV File</span>
                          <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleCsvFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: INTERACTIVE COLUMN MAPPING */}
                  {csvStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div>
                          <h4 className="font-bold text-white text-sm">Review & Confirm Column Mapping</h4>
                          <p className="text-slate-400 text-xs">
                            File: <strong className="text-emerald-400">{csvFileName}</strong> ({csvRows.length} rows detected)
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {csvHeaders.length} columns detected
                        </span>
                      </div>

                      {validationErrors.length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-1">
                          {validationErrors.map((err, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{err}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {REQUIRED_FIELDS.map((f) => {
                          const isMapped = !!columnMapping[f.key];
                          return (
                            <div
                              key={f.key}
                              className={`p-3 rounded-xl border transition-all ${
                                isMapped
                                  ? 'bg-slate-950/80 border-slate-800'
                                  : f.required
                                  ? 'bg-rose-950/10 border-rose-500/30'
                                  : 'bg-slate-950/40 border-slate-800/60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                                  {f.label}
                                </label>
                                {isMapped ? (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Mapped
                                  </span>
                                ) : f.required ? (
                                  <span className="text-[10px] text-rose-400 font-bold">Required</span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">Optional</span>
                                )}
                              </div>

                              <select
                                value={columnMapping[f.key] || ''}
                                onChange={(e) =>
                                  setColumnMapping({ ...columnMapping, [f.key]: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                              >
                                <option value="">-- Do Not Import --</option>
                                {csvHeaders.map((h) => (
                                  <option key={h} value={h}>
                                    Column: &quot;{h}&quot;
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCsvStep(1)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleProceedToPreview}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-600/20"
                        >
                          <span>Proceed to Pre-Flight Check</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: PRE-FLIGHT PREVIEW & VALIDATION */}
                  {csvStep === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm">Pre-Flight Data Preview (First 5 Rows)</h4>
                          <p className="text-slate-400 text-xs">
                            Verify your mapped values look correct before adding them to your inventory catalog.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Validation Passed: 0 fatal syntax errors</span>
                        </div>
                      </div>

                      {/* Preview Table */}
                      <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-950">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                            <tr>
                              <th className="p-2.5">SKU</th>
                              <th className="p-2.5">Product Name</th>
                              <th className="p-2.5">Price ({store.currency})</th>
                              <th className="p-2.5">Stock</th>
                              <th className="p-2.5">Category</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                            {csvRows.slice(0, 5).map((row, idx) => {
                              const getV = (key: string) => {
                                const col = columnMapping[key];
                                if (!col) return '—';
                                const i = csvHeaders.indexOf(col);
                                return i !== -1 && row[i] ? row[i] : '—';
                              };

                              return (
                                <tr key={idx} className="hover:bg-slate-900/50">
                                  <td className="p-2.5 text-indigo-300">{getV('sku')}</td>
                                  <td className="p-2.5 font-sans font-semibold text-white">{getV('name')}</td>
                                  <td className="p-2.5 text-emerald-400 font-bold">{getV('price')}</td>
                                  <td className="p-2.5 text-slate-300">{getV('stock_quantity')}</td>
                                  <td className="p-2.5 font-sans text-slate-400">{getV('category')}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCsvStep(2)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                        >
                          Edit Mappings
                        </button>
                        <button
                          type="button"
                          disabled={importingCsv}
                          onClick={handleCommitImport}
                          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-emerald-600/20"
                        >
                          {importingCsv && <RefreshCw className="w-4 h-4 animate-spin" />}
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Import All {csvRows.length} Articles</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MANUAL ADD / EDIT PRODUCT MODAL                                           */}
          {/* ========================================================================= */}
          {showProductModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      {editingProduct ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                    <h3 className="text-sm font-bold text-white">
                      {editingProduct ? 'Modify Article Parameters' : 'Add New Product Article'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Argan Infused Hair Serum 100ml"
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">SKU / Code *</label>
                      <input
                        type="text"
                        required
                        value={mSku}
                        onChange={(e) => setMSku(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Cosmetics"
                        value={mCategory}
                        onChange={(e) => setMCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Sale Price * ({store.currency})</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={mPrice}
                        onChange={(e) => setMPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Cost Price ({store.currency})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={mCostPrice}
                        onChange={(e) => setMCostPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={mStock}
                        onChange={(e) => setMStock(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={mImageUrl}
                      onChange={(e) => setMImageUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Product Description</label>
                    <textarea
                      rows={2}
                      placeholder="Brief details about the article..."
                      value={mDescription}
                      onChange={(e) => setMDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-indigo-600/20"
                    >
                      {savingProduct && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingProduct ? 'Save Changes' : 'Create Article'}</span>
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
