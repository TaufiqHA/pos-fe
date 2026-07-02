import React, { useState } from 'react';
import { usePosStore } from '../store';
import { formatRupiah } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { HandCoins, ShoppingCart, Activity, ArrowUpRight, ArrowDownRight, Package, TrendingUp, DollarSign, X, Check, Building2, Store, Search, Filter, Plus, AlertTriangle, AlertCircle, Bell, User, Database, Users, HelpCircle, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

const HandMoneyBagIcon = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14">
    {/* Center Bag (brownish) */}
    <path d="M50 30 C38 30, 36 50, 36 67 C36 82, 64 82, 64 67 C64 50, 62 30, 50 30 Z" fill="#7d4f2a" />
    <path d="M42 30 C45 22, 55 22, 58 30 Z" fill="#9c663c" />
    {/* Ribbon */}
    <rect x="42" y="32" width="16" height="4" rx="1" fill="#f59e0b" />
    {/* Dollar sign inside bag */}
    <text x="50" y="60" fontSize="18" fontWeight="bold" fill="#f59e0b" textAnchor="middle" fontFamily="sans-serif" className="select-none">$</text>
    {/* Hands holding the bag */}
    {/* Left Hand */}
    <path d="M22 46 C25 46, 28 54, 34 49 L34 55 C28 57, 26 50, 22 50 Z" fill="#fed7aa" />
    <rect x="25" y="54" width="6" height="5" fill="#15803d" />
    {/* Right Hand */}
    <path d="M78 46 C75 46, 72 54, 66 49 L66 55 C72 57, 74 50, 78 50 Z" fill="#fed7aa" />
    <rect x="69" y="54" width="6" height="5" fill="#15803d" />
  </svg>
);


export default function Dashboard() {
  const store = usePosStore();
  const user = store.user;
  const users = Array.isArray(store.users) ? store.users : [];
  const sales = Array.isArray(store.sales) ? store.sales : [];
  const purchases = Array.isArray(store.purchases) ? store.purchases : [];
  const products = Array.isArray(store.products) ? store.products : [];
  const branches = Array.isArray(store.branches) ? store.branches : [];
  const customers = Array.isArray(store.customers) ? store.customers : [];
  const suppliers = Array.isArray(store.suppliers) ? store.suppliers : [];
  const promoBannerUrls = Array.isArray(store.promoBannerUrls) ? store.promoBannerUrls : [];
  const addProduct = store.addProduct;
  const setPromoBanners = store.setPromoBanners;
  const updatePurchase = store.updatePurchase;
  const adjustStock = store.adjustStock;
  const navigate = useNavigate();

  const [selectedPoForValidation, setSelectedPoForValidation] = useState<any>(null);
  const [isValidationSubmitting, setIsValidationSubmitting] = useState(false);

  const pendingPOCount = purchases.filter(p => {
    if (p.isProcessed) return false;
    if (user?.role === 'Admin') {
      const creator = users?.find(u => u.id === p.userId);
      if (creator?.role === 'Outlet' || creator?.role === 'Cust') return false;
      return p.destinationAdminId === user?.id || !p.destinationAdminId;
    } else if (user?.role === 'Cabang') {
      const creator = users?.find(u => u.id === p.userId);
      if (creator?.role === 'Outlet' || creator?.role === 'Cust') {
        return p.branchId === user?.branchId;
      }
      return false;
    }
    return false;
  }).length;

  const pendingDeliveryCount = purchases.filter(p => 
    user?.role === 'Cabang' && p.branchId === user?.branchId && p.deliveryStatus === 'Dikirim'
  ).length;

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategoryAnalytics, setSelectedCategoryAnalytics] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isPoStatusModalOpen, setIsPoStatusModalOpen] = useState(false);
  const [poModalTab, setPoModalTab] = useState<'request' | 'push'>('request');

  // Form state for banner
  const [bannerUrl, setBannerUrl] = useState('');
  const [editingBannerIndex, setEditingBannerIndex] = useState<number | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  React.useEffect(() => {
    if (promoBannerUrls && promoBannerUrls.length > 1) {
      const timer = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % promoBannerUrls.length);
      }, 3000); // Auto slide every 3 seconds
      return () => clearInterval(timer);
    }
  }, [promoBannerUrls?.length]);

  // Interactive Live Status Bar Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTimeStr = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toUpperCase();

  if (!user) return null;

  const handleTerimaSelesai = async () => {
    if (!selectedPoForValidation) return;
    setIsValidationSubmitting(true);
    try {
      // 1. Update status PO menjadi selesai
      await updatePurchase(selectedPoForValidation.id, { 
        deliveryStatus: 'Selesai', 
        status: 'Selesai' 
      });
      
      // 2. Tambahkan stok barang dan riwayat berdasarkan item di PO
      for (const item of selectedPoForValidation.items) {
        await adjustStock(
          item.productId, 
          'Tambah', 
          item.qty, 
          `Penerimaan PO Pusat (${selectedPoForValidation.invoice})`
        );
      }
      
      setSuccessToast('Penerimaan barang berhasil divalidasi!');
      setTimeout(() => setSuccessToast(null), 3000);
      setSelectedPoForValidation(null);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat memvalidasi barang.');
    } finally {
      setIsValidationSubmitting(false);
    }
  };



  // Filter based on role
  let visibleSales = sales;
  let visiblePurchases = purchases;
  
  if ((user.role as string) === 'Cabang') {
    visibleSales = sales.filter(s => s.branchId === user.branchId);
    visiblePurchases = purchases.filter(p => p.branchId === user.branchId);
  } else if (user.role === 'Sales') {
    visibleSales = sales.filter(s => s.userId === user.id);
    visiblePurchases = [];
  } else if (user.role === 'Cust' || user.role === 'Outlet') {
    const targetCustomer = user.outletName || user.name;
    visibleSales = sales.filter(s => s.customer === targetCustomer);
    visiblePurchases = [];
  }

  // Kumpulkan semua ID produk yang pernah dibeli atau memiliki riwayat stok di cabang
  const branchPurchasedProductIds = new Set(
    visiblePurchases.flatMap(purchase => purchase.items.map(item => item.productId))
  );
  (Array.isArray(store.stockHistory) ? store.stockHistory : []).forEach(h => {
    if (h.branchId === user.branchId) {
      branchPurchasedProductIds.add(h.productId);
    }
  });

  const displayProducts = user.role === 'Cabang'
    ? products.filter(p => branchPurchasedProductIds.has(p.id))
    : products;

  // Get current indonesian month name
  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long' }).toUpperCase();
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Monthly metrics
  const isCancelledStatus = (st?: string) => {
    const s = (st || '').toLowerCase();
    return s === 'dibatalkan' || s === 'batal' || s === 'ditolak';
  };

  const isUnpaidDebtStatus = (st?: string) => {
    const s = (st || '').toLowerCase();
    return s !== 'lunas' && s !== 'selesai' && !isCancelledStatus(st);
  };

  const currentMonthSales = visibleSales
    .filter(s => {
      const d = new Date(s.date);
      return !isCancelledStatus(s.status) && d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    })
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const currentMonthHutang = visiblePurchases
    .filter(p => {
      const d = new Date(p.date);
      const isReceived = user?.role === 'Cabang' ? p.deliveryStatus === 'Selesai' : true;
      return isUnpaidDebtStatus(p.status) && isReceived && d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    })
    .reduce((acc, p) => acc + (p.total - (p.cashGiven || 0)), 0);

  const customerUnpaidSum = visibleSales
    .filter(s => isUnpaidDebtStatus(s.status))
    .reduce((acc, s) => acc + (s.grandTotal - (s.cashGiven || 0)), 0);

  // Admin specific hutang
  const adminHutangKeSupplier = purchases
    .filter(p => {
      const d = new Date(p.date);
      return !p.branchId && (p.supplier || '').toLowerCase() !== 'kantor pusat' && isUnpaidDebtStatus(p.status) && d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    })
    .reduce((acc, p) => acc + (p.total - (p.cashGiven || 0)), 0);

  const adminHutangDariCabang = visibleSales
    .filter(s => isUnpaidDebtStatus(s.status) && !(s.invoice || '').toUpperCase().startsWith('PO'))
    .reduce((acc, s) => acc + (s.grandTotal - (s.cashGiven || 0)), 0);

  // No mock data fallbacks
  const salesDisplayVal = currentMonthSales;
  const debtDisplayVal = user.role === 'Outlet'
    ? customerUnpaidSum
    : user.role === 'Cust'
      ? customerUnpaidSum
      : user.role === 'Admin'
        ? adminHutangKeSupplier
        : currentMonthHutang;

  const activeBranch = branches?.find(b => b.id === user.branchId);
  const branchName = activeBranch ? activeBranch.name.toUpperCase() : 'BANYUWANGI';

  const navCards = React.useMemo(() => {
    if ((user.role as string) === 'Cabang') {
      return [
        { label: 'TRANSAKSI', to: '/penjualan', subtitle: 'Catat transaksi penjualan & kasir pelayanan.' },
        { label: 'PRODUK & STOK', to: '/stok', subtitle: 'Katalog produk, update & level stok toko.' },
        { label: 'OUTLET', to: '/pengaturan/pelanggan', subtitle: 'Manajemen data outlet & sales.' },
        { label: 'KEUANGAN', to: '/laporan', subtitle: 'Pantau laporan keuangan & performance cabang.' },
      ];
    }
    if (user.role === 'Sales') {
      return [
        { label: 'TRANSAKSI', to: '/penjualan', subtitle: 'Catat order sales lapangan secara mobile.' },
        { label: 'CUSTOMER', to: '/pengaturan/pelanggan', subtitle: 'Kelola list database customer Anda.' },
        { label: 'STOK LIVE', to: '/stok', subtitle: 'Informasi database stok barang terkini.' },
        { label: 'KEUANGAN', to: '/laporan', subtitle: 'Lihat data stat total komisi & penjualan saya.' },
      ];
    }
    if (user.role === 'Cust') {
      return [
        { label: 'BELANJA BARU', to: '/penjualan/buat', subtitle: 'Buat order belanja grosir & ecer baru.' },
        { label: 'RIWAYAT SAYA', to: '/penjualan', subtitle: 'Cek transaksi history pemesanan Anda.' },
        { label: 'HARGA LIVE', to: '/stok', subtitle: 'Cek pricelist produk & keaktifan barang.' },
        { label: 'KEUANGAN', to: '/laporan', subtitle: 'Laporan tagihan sisa & riwayat pembayaran.' },
      ];
    }
    if (user.role === 'Outlet') {
      return [
        { label: 'ORDER', to: '/penjualan/buat', subtitle: 'Buat order belanja / purchase order baru.' },
        { label: 'HISTORY', to: '/penjualan', subtitle: 'Cek riwayat transaksi pemesanan Anda.' },
      ];
    }
    // Admin / Fallback
    return [
      { label: 'PRODUK & STOK', to: '/pengaturan/produk', subtitle: 'Kelola katalog produk, minimal stok & import.' },
      { label: 'TRANSAKSI', to: '/penjualan', subtitle: 'Catat transaksi penjualan & pembuatan invoice.' },
      { label: 'DATA CABANG', to: '/laporan-cabang', subtitle: 'Pantau cabang ritel & kelola staf retail.' },
      { label: 'KEUANGAN', to: '/laporan', subtitle: 'Laporan profit margin, omset & trend performansi.' },
    ];
  }, [user.role]);

  const labelOmset = (user.role === 'Cust' || user.role === 'Outlet')
    ? 'TOTAL BELANJA' 
    : user.role === 'Sales' 
      ? 'PENJUALAN SAYA' 
      : 'OMSET PENJUALAN';

  const labelHutang = user.role === 'Outlet'
    ? 'PO BELUM TERKIRIM'
    : user.role === 'Cust' 
      ? 'SISA TAGIHAN' 
      : user.role === 'Sales' 
        ? 'TOTAL TAGIHAN' 
        : (user.role as string) === 'Cabang'
          ? 'HUTANG (KE PUSAT)'
          : 'HUTANG (KE SUPPLIER)';

  const labelBrandSub = user.role === 'Admin' 
    ? 'KANTOR PUSAT' 
    : (user.role as string) === 'Cabang'
      ? `CABANG ( ${branchName} )`
      : user.role === 'Cust' 
        ? 'OUTLET MITRA' 
        : user.role === 'Outlet'
          ? 'LUCIFER OUTLET'
          : user.role === 'Sales' 
            ? 'SALES CABANG' 
            : 'CABANG UTAMA';

  const newProducts = React.useMemo(() => {
    return [...products].reverse().slice(0, 3);
  }, [products]);

  // Quick action handling for 4 grid items
  const handleGridClick = (dest: string) => {
    navigate(dest);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerUrl) return;

    if (editingBannerIndex !== null) {
      const newBanners = [...(promoBannerUrls || [])];
      newBanners[editingBannerIndex] = bannerUrl;
      setPromoBanners(newBanners);
      setEditingBannerIndex(null);
    } else {
      setPromoBanners([...(promoBannerUrls || []), bannerUrl]);
      setCurrentBannerIndex((promoBannerUrls || []).length); // focus on newly added
    }

    // Reset Form
    setBannerUrl('');

    setIsUploadModalOpen(false);
    setSuccessToast(`Banner promosi berhasil diperbarui`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBannerUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Process monthly sales from visibleSales
  const monthlySalesChartData = React.useMemo(() => {
    const data = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const monthSales = visibleSales
        .filter(s => {
          const sd = new Date(s.date);
          return sd.getMonth() === m && sd.getFullYear() === y;
        })
        .reduce((sum, s) => sum + s.grandTotal, 0);

      const finalVal = monthSales;
      
      data.push({
        name: monthNames[m],
        sales: finalVal,
      });
    }
    return data;
  }, [visibleSales]);

  // Product stock per category chart data
  const categoryChartData = React.useMemo(() => {
    const categories: Record<string, number> = {};
    products.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + p.stock;
    });

    // No mock categories

    return Object.entries(categories).map(([name, stock]) => ({
      name,
      stock,
    }));
  }, [products]);

  // Total stock sum
  const totalStockSum = React.useMemo(() => {
    return displayProducts.reduce((sum, p) => sum + p.stock, 0);
  }, [displayProducts]);

  // Kategori Analytics Data (Top Produk, Worst Produk & Wilayah)
  const categoryAnalyticsData = React.useMemo(() => {
    if (!selectedCategoryAnalytics) return null;

    const productSales: Record<string, { name: string, qty: number, branches: Record<string, number> }> = {};
    const branchSales: Record<string, { name: string, qty: number, outlets: Record<string, number> }> = {};

    // Initialize all products in this category with 0 sales
    products.filter(p => p.category === selectedCategoryAnalytics).forEach(p => {
      productSales[p.id] = { name: p.name, qty: 0, branches: {} };
    });

    visibleSales.forEach(sale => {
      const locationName = sale.branchId 
        ? (branches?.find(b => b.id === sale.branchId)?.name || 'Cabang Lainnya') 
        : (sale.customer || 'Pelanggan Umum');

      sale.items?.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && product.category === selectedCategoryAnalytics) {
          // Top & Worst Produk
          if (!productSales[product.id]) {
            productSales[product.id] = { name: product.name, qty: 0, branches: {} };
          }
          productSales[product.id].qty += item.qty;
          
          if (!productSales[product.id].branches[locationName]) {
            productSales[product.id].branches[locationName] = 0;
          }
          productSales[product.id].branches[locationName] += item.qty;

          // Top Wilayah/Cabang & Outlet
          if (!branchSales[locationName]) {
            branchSales[locationName] = { name: locationName, qty: 0, outlets: {} };
          }
          branchSales[locationName].qty += item.qty;
          
          if (sale.branchId && sale.customer) {
            const outletName = sale.customer;
            if (!branchSales[locationName].outlets[outletName]) {
              branchSales[locationName].outlets[outletName] = 0;
            }
            branchSales[locationName].outlets[outletName] += item.qty;
          }
        }
      });
    });

    const enrichedProductSales = Object.values(productSales).map(p => {
      const topBranch = Object.entries(p.branches).sort((a, b) => b[1] - a[1])[0];
      return {
        ...p,
        bestBranch: topBranch ? topBranch[0] : null
      };
    });

    const topProducts = [...enrichedProductSales].sort((a, b) => b.qty - a.qty).slice(0, 5);
    const worstProducts = [...enrichedProductSales].sort((a, b) => a.qty - b.qty).slice(0, 5);
    
    const topBranches = Object.values(branchSales).map(b => ({
      ...b,
      topOutlets: Object.entries(b.outlets).sort((a, x) => x[1] - a[1]).slice(0, 3).map(([name, qty]) => ({ name, qty }))
    })).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return { topProducts, worstProducts, topBranches };
  }, [selectedCategoryAnalytics, visibleSales, products, branches]);

  const { logout } = usePosStore();

  const handleLogout = () => {
     logout();
     navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-white relative">
      
      {/* Toast notification message */}
      {successToast && (
        <div className="fixed top-20 right-4 bg-lime-400 text-black px-4 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 z-50 transition-all border border-white animate-bounce">
          <Check size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. MOBILE VIEW (Visible on screens < md) */}
      <div className="md:hidden flex flex-col items-center justify-start p-4 sm:p-6">
        <div className="w-full max-w-md flex flex-col justify-between space-y-8 py-4">
          


          {/* History Box - Navy blue gradient card */}
          <div className="bg-gradient-to-b from-[#182352] to-[#0c143a] border border-[#1d2a57] rounded-3xl p-6 shadow-2xl transform hover:scale-[1.01] transition-transform">
            <div className="text-center mb-5">
              <h2 className="text-xs font-bold tracking-widest text-slate-300 uppercase">HISTORY</h2>
              <p className="text-[#b4f56b] font-black text-sm tracking-wider uppercase">BULAN : {currentMonthName}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">{labelOmset}</span>
                <span className="text-sm font-extrabold text-white">{formatRupiah(salesDisplayVal)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">{labelHutang}</span>
                <span className="text-sm font-extrabold text-[#b4f56b]">{formatRupiah(debtDisplayVal)}</span>
              </div>
            </div>
          </div>

          {/* 2x2 Grid Menu Items with Hand-Moneybag custom high-fidelity icons */}
          <div className="grid grid-cols-2 gap-6 my-4 w-full">
            {navCards.map((card, index) => (
              <div 
                key={index}
                onClick={() => handleGridClick(card.to)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="bg-white rounded-3xl w-28 h-28 flex items-center justify-center shadow-2xl border border-slate-100 group-hover:scale-105 transition-all duration-200 active:scale-95">
                  <HandMoneyBagIcon />
                </div>
                <span className="text-xs font-black tracking-widest text-white mt-3 text-center group-hover:text-[#b4f56b] transition-colors uppercase">{card.label}</span>
              </div>
            ))}
          </div>

          {/* Large Lime-Green Action Button at the bottom */}
          {user.role === 'Admin' ? (
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => navigate('/penjualan/po')}
                className="relative bg-transparent border-2 border-[#b4f56b] text-[#b4f56b] hover:bg-[#b4f56b]/10 font-extrabold text-sm py-4 px-6 rounded-2xl w-full tracking-widest text-center cursor-pointer transition-all uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                PERMINTAAN PO
                {/* Notifikasi PO Baru */}
                {pendingPOCount > 0 && (
                  <span className="absolute top-2 right-2 sm:top-1 sm:right-1 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#070b19]">
                    {pendingPOCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { setEditingBannerIndex(null); setBannerUrl(''); setIsUploadModalOpen(true); }}
                className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-extrabold text-sm py-4 px-6 rounded-2xl w-full tracking-widest text-center cursor-pointer transition-all uppercase shadow-xl hover:shadow-[#b4f56b]/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:scale-95"
              >
                <Plus size={18} strokeWidth={3} />
                UPLOAD PRODUK BARU
              </button>
            </div>
          ) : (user.role as string) === 'Cabang' ? (
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => navigate('/penjualan/po')}
                className="relative bg-transparent border-2 border-[#b4f56b] text-[#b4f56b] hover:bg-[#b4f56b]/10 font-extrabold text-sm py-4 px-6 rounded-2xl w-full tracking-widest text-center cursor-pointer transition-all uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                PERMINTAAN PO DARI OUTLET
                {pendingPOCount > 0 && (
                  <span className="absolute top-2 right-2 sm:top-1 sm:right-1 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#070b19]">
                    {pendingPOCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsPoStatusModalOpen(true)}
                className="relative bg-transparent border-2 border-sky-400 text-sky-400 hover:bg-sky-400/10 font-extrabold text-sm py-4 px-6 rounded-2xl w-full tracking-widest text-center cursor-pointer transition-all uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95"
              >
                STATUS PENGIRIMAN
                {pendingDeliveryCount > 0 && (
                  <span className="absolute top-2 right-2 sm:top-1 sm:right-1 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#070b19]">
                    {pendingDeliveryCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => navigate('/pembelian/buat')}
                className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-extrabold text-sm py-4 px-6 rounded-2xl w-full tracking-widest text-center cursor-pointer transition-all uppercase shadow-xl hover:shadow-[#b4f56b]/20 flex items-center justify-center gap-2 hover:translate-y-[-2px]"
              >
                <Plus size={18} strokeWidth={3} />
                PO KE PUSAT
              </button>
            </div>
          ) : null}

          {/* Informasi Produk Baru Block (Banner Promo) */}
          {(user.role as string) === 'Cabang' || user.role === 'Cust' || user.role === 'Outlet' ? (
            <div className="w-full flex flex-col min-h-[140px] select-none mt-6">
              <h3 className="text-[10px] font-black tracking-widest text-slate-300 text-center uppercase mb-2.5">
                INFORMASI PRODUK BARU
              </h3>
              
              <div className="bg-gradient-to-b from-[#11193c] to-[#090f2b] border border-[#1d2a57] rounded-3xl p-3.5 flex-grow flex flex-col justify-center gap-2.5 overflow-hidden">
                {(!promoBannerUrls || promoBannerUrls.length === 0) ? (
                  <p className="m-auto text-slate-500 text-xs tracking-wider uppercase font-bold py-6 text-center">
                    Belum ada banner promosi terbaru
                  </p>
                ) : (
                  <div className="relative group w-full h-48 sm:h-56 md:h-64 rounded-2xl overflow-hidden flex-shrink-0">
                    <img 
                      src={promoBannerUrls[currentBannerIndex]} 
                      alt={`Banner Promosi ${currentBannerIndex + 1}`} 
                      className="w-full h-full object-cover object-center border border-[#1d2a57] shadow-xl animate-fadeIn transition-opacity duration-300 cursor-pointer"
                      key={currentBannerIndex}
                      onClick={() => {
                        setPreviewIndex(currentBannerIndex);
                        setIsPreviewModalOpen(true);
                      }}
                    />
                    {promoBannerUrls.length > 1 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                        {promoBannerUrls.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'w-4 bg-[#b4f56b]' : 'w-1.5 bg-white/40'}`} 
                          />
                        ))}
                      </div>
                    )}
                    {user?.role === 'Admin' && (
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                        <button
                          onClick={() => {
                            setBannerUrl(promoBannerUrls[currentBannerIndex]);
                            setEditingBannerIndex(currentBannerIndex);
                            setIsUploadModalOpen(true);
                          }}
                          className="p-1.5 bg-[#1d2a57] hover:bg-[#2a3c78] text-[#b4f56b] rounded-lg shadow-lg border border-[#2a3c78] transition-colors"
                          title="Edit Banner"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Hapus banner promosi ini?')) {
                              const newBanners = [...promoBannerUrls];
                              newBanners.splice(currentBannerIndex, 1);
                              setPromoBanners(newBanners);
                              if (currentBannerIndex >= newBanners.length) {
                                setCurrentBannerIndex(Math.max(0, newBanners.length - 1));
                              }
                              setSuccessToast('Banner promosi berhasil dihapus');
                              setTimeout(() => setSuccessToast(null), 3000);
                            }
                          }}
                          className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-lg border border-rose-600 transition-colors"
                          title="Hapus Banner"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 2. DESKTOP VIEW (Visible on screens >= md) */}
      <div className="hidden md:flex flex-col w-full max-w-7xl mx-auto p-6 lg:p-8 space-y-8 animate-fadeIn">
        
        {/* Desktop Quick Actions */}
        {(user.role === 'Admin' || (user.role as string) === 'Cabang') && (
          <div className="flex justify-end items-center gap-4">
            {user.role === 'Admin' && (
              <>
                <button
                  onClick={() => navigate('/penjualan/po')}
                  className="relative inline-flex items-center px-4 py-2.5 border-2 border-[#b4f56b] text-xs font-extrabold rounded-2xl shadow-lg text-[#b4f56b] hover:bg-[#b4f56b]/10 transition-colors active:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  Permintaan PO
                  {/* Notifikasi PO Baru */}
                  {pendingPOCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#070b19] shadow-lg">
                      {pendingPOCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-extrabold text-xs py-3 px-5 rounded-2xl tracking-widest transition-all uppercase shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} />
                  UPLOAD PRODUK BARU
                </button>
              </>
            )}

            {(user.role as string) === 'Cabang' && (
              <>
                <button
                  onClick={() => navigate('/penjualan/po')}
                  className="relative inline-flex items-center px-4 py-2.5 border-2 border-[#b4f56b] text-xs font-extrabold rounded-2xl shadow-lg text-[#b4f56b] hover:bg-[#b4f56b]/10 transition-colors active:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  Permintaan PO Dari Outlet
                  {pendingPOCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#070b19] shadow-lg">
                      {pendingPOCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsPoStatusModalOpen(true)}
                  className="relative inline-flex items-center px-4 py-2.5 border-2 border-sky-400 text-xs font-extrabold rounded-2xl shadow-lg text-sky-400 hover:bg-sky-400/10 transition-colors active:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  Status Pengiriman
                  {pendingDeliveryCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#070b19] shadow-lg">
                      {pendingDeliveryCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => navigate('/pembelian/buat')}
                  className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-extrabold text-xs py-3 px-5 rounded-2xl tracking-widest transition-all uppercase shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} />
                  PO KE PUSAT
                </button>
              </>
            )}
          </div>
        )}

        {/* Metric Grid (4 or 5 cards) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${user.role === 'Admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
          {/* Card 1: Omset Penjualan */}
          <div className="bg-gradient-to-br from-[#121a3e] to-[#0a0f26] border border-[#1d2a57] rounded-3xl p-4 xl:p-5 shadow-xl relative overflow-hidden group hover:border-[#b4f56b]/40 transition-all">
            <div className="absolute top-4 right-4 p-2 bg-[#b4f56b]/10 text-[#b4f56b] rounded-2xl">
              <TrendingUp size={20} />
            </div>
            <p className="text-[10px] xl:text-xs font-bold text-slate-400 uppercase tracking-wider truncate pr-10">{labelOmset}</p>
            <p className="text-lg xl:text-xl font-black text-white mt-2 font-mono truncate tracking-tight">{formatRupiah(salesDisplayVal)}</p>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] xl:text-xs text-[#b4f56b] font-bold truncate">
              <span className="shrink-0">+14.2%</span>
              <span className="text-slate-400 font-normal truncate">Dari bulan lalu</span>
            </div>
          </div>

          {/* Card 2: Total Hutang */}
          <div className="bg-gradient-to-br from-[#121a3e] to-[#0a0f26] border border-[#1d2a57] rounded-3xl p-4 xl:p-5 shadow-xl relative overflow-hidden group hover:border-yellow-500/40 transition-all">
            <div className="absolute top-4 right-4 p-2 bg-[#f59e0b]/10 text-[#f59e0b] rounded-2xl">
              <AlertCircle size={20} />
            </div>
            <p className="text-[10px] xl:text-xs font-bold text-slate-400 uppercase tracking-wider truncate pr-10">{labelHutang}</p>
            <p className="text-lg xl:text-xl font-black text-yellow-400 mt-2 font-mono truncate tracking-tight">{formatRupiah(debtDisplayVal)}</p>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] xl:text-xs text-slate-400 font-bold truncate">
              <span className="text-yellow-400 shrink-0">Penting</span>
              <span className="font-normal truncate">{user.role === 'Cust' ? 'Jatuh tempo segera' : 'Bulan ini'}</span>
            </div>
          </div>

          {/* Card 2.5: Hutang Cabang (Hanya Admin) */}
          {user.role === 'Admin' && (() => {
            const totalHutangCabang = adminHutangDariCabang;
            return (
              <div className="bg-gradient-to-br from-[#121a3e] to-[#0a0f26] border border-[#1d2a57] rounded-3xl p-4 xl:p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className={`absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-400 rounded-2xl`}>
                  <Building2 size={20} />
                </div>
                <p className="text-[10px] xl:text-xs font-bold text-slate-400 uppercase tracking-wider truncate pr-10">HUTANG (DARI CABANG)</p>
                <p className={`text-lg xl:text-xl font-black mt-2 font-mono truncate tracking-tight text-rose-400`}>
                  {formatRupiah(totalHutangCabang)}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] xl:text-xs text-slate-400 font-bold truncate">
                  <span className={`shrink-0 text-rose-400`}>
                    Net Hutang
                  </span>
                  <span className="font-normal truncate">Sisa saldo</span>
                </div>
              </div>
            );
          })()}

          {/* Card 3: Total Produk & Stok */}
          <div className="bg-gradient-to-br from-[#121a3e] to-[#0a0f26] border border-[#1d2a57] rounded-3xl p-4 xl:p-5 shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
            <div className="absolute top-4 right-4 p-2 bg-sky-500/10 text-sky-400 rounded-2xl">
              <Database size={20} />
            </div>
            <p className="text-[10px] xl:text-xs font-bold text-slate-400 uppercase tracking-wider truncate pr-10">TOTAL SKU PRODUK</p>
            <p className="text-lg xl:text-xl font-black text-sky-400 mt-2 font-mono truncate tracking-tight">{displayProducts.length} Item</p>
            <div className="flex items-center gap-1.5 mt-3 text-[10px] xl:text-xs text-slate-400 font-semibold truncate">
              <span className="text-sky-400 shrink-0">{totalStockSum} Unit</span>
              <span className="font-normal truncate">Siap jual</span>
            </div>
          </div>


        </div>

        {/* Graphics Grid (Charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart 1 : Tren Penjualan */}
          <div className={`${user.role === 'Admin' || (user.role as string) === 'Cabang' ? 'lg:col-span-12' : 'lg:col-span-8'} bg-[#0b1330] border border-[#1d2a57] rounded-3xl p-6 shadow-xl flex flex-col space-y-4`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
                <h3 className="text-md font-extrabold tracking-wide uppercase">TREN OMSET PENJUALAN BULANAN</h3>
              </div>
              <span className="text-xs text-[#b4f56b] font-mono uppercase bg-[#b4f56b]/5 px-2.5 py-1 rounded-lg">Update Otomatis</span>
            </div>
            
            <div className="w-full h-80 pt-2 font-mono text-xs">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart
                  data={monthlySalesChartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b4f56b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#b4f56b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1d2a57" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => `Rp ${v / 1000000}M`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#131d42', border: '1px solid #1d2a57', borderRadius: '12px' }}
                    labelStyle={{ color: '#b4f56b', fontWeight: 'bold' }}
                    formatter={(value: any) => [formatRupiah(Number(value)), "Omset"]}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#b4f56b" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Pie Chart */}
          {user.role !== 'Admin' && (user.role as string) !== 'Cabang' && (
            <div className="lg:col-span-4 bg-[#0b1330] border border-[#1d2a57] rounded-3xl p-6 shadow-xl flex flex-col space-y-4">
              <div className="flex items-center gap-2.5 pb-1 border-b border-white/5">
                <div className="w-2.5 h-6 bg-sky-400 rounded-full"></div>
                <h3 className="text-md font-extrabold tracking-wide uppercase">STOK PER KATEGORI</h3>
              </div>
              
              <div className="w-full h-56 pt-2 font-mono text-xs relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={categoryChartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d2a57" opacity={0.2} vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                    <YAxis stroke="#64748b" tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#131d42', border: '1px solid #1d2a57', borderRadius: '12px' }}
                      labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value} UNIT`, "Stok"]}
                    />
                    <Bar dataKey="stock" fill="#38bdf8" radius={[8, 8, 0, 0]}>
                      {categoryChartData.map((entry, index) => {
                        const colors = ["#38bdf8", "#b4f56b", "#eab308", "#ec4899", "#a855f7"];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} cursor="pointer" onClick={() => setSelectedCategoryAnalytics(entry.name)} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                {categoryChartData.map((item, idx) => {
                  const colors = ["bg-sky-400", "bg-[#b4f56b]", "bg-yellow-500", "bg-pink-500", "bg-purple-500"];
                  return (
                    <div 
                      key={item.name} 
                      onClick={() => setSelectedCategoryAnalytics(item.name)}
                      className="flex items-center gap-2 bg-[#131d42] px-3 py-2 rounded-xl border border-[#21306b]/40 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 group"
                      title="Klik untuk melihat Analitik Penjualan Kategori"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`}></span>
                      <div className="truncate">
                        <p className="font-bold text-slate-300 truncate uppercase text-[10px]">{item.name}</p>
                        <p className="text-[11px] font-black font-mono text-white mt-0.5">{item.stock} Unit</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
        </div>

        {/* Navigasi Dan Manajemen Cepat */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-white rounded-full"></div>
            <h3 className="text-md font-extrabold tracking-wide uppercase">NAVIGASI & MANAJEMEN SISTEM</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {navCards.map((card, index) => (
              <div 
                key={index}
                onClick={() => handleGridClick(card.to)}
                className="bg-[#0b1330] border border-[#1d2a57] hover:border-[#b4f56b]/50 rounded-3xl p-5 shadow-lg flex items-center justify-between cursor-pointer group hover:bg-[#131d42] transition-colors duration-200"
              >
                <div className="space-y-1 pr-2">
                  <p className="text-xs font-black tracking-widest text-[#b4f56b] uppercase">{card.label.split(' ')[0]}</p>
                  <h4 className="text-md font-bold text-white group-hover:text-[#b4f56b] transition-colors font-sans uppercase">{card.label}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mt-1">{card.subtitle}</p>
                </div>
                <div className="bg-white rounded-2xl w-16 h-16 shrink-0 flex items-center justify-center shadow-md border border-slate-100 group-hover:scale-105 transition-all">
                  <HandMoneyBagIcon />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts & Fast Stats Bottom Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          
          {/* Stock Warns Panel */}
          <div className="lg:col-span-7 bg-[#0b1330] border border-[#1d2a57] rounded-3xl p-6 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-500" />
              <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">PRODUK DENGAN STOK KRITIS (&lt; MINIMAL STOK)</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1d2a57] text-slate-400 pb-2">
                    <th className="pb-3 uppercase">SKU</th>
                    <th className="pb-3 uppercase">NAMA PRODUK</th>
                    <th className="pb-3 text-center uppercase">MIN STOK</th>
                    <th className="pb-3 text-right uppercase">STOK AKTIF</th>
                    <th className="pb-3 text-right uppercase">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProducts.filter(p => p.stock <= p.minStock).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">Semua produk memiliki tingkat stok yang aman.</td>
                    </tr>
                  ) : (
                    displayProducts.filter(p => p.stock <= p.minStock).map(p => (
                      <tr key={p.id} className="border-b border-[#1d2a57]/30 hover:bg-[#131d42]/30">
                        <td className="py-3 text-[#b4f56b] font-bold">{p.sku}</td>
                        <td className="py-3 font-sans font-bold text-white max-w-[150px] truncate">{p.name}</td>
                        <td className="py-3 text-center text-slate-400">{p.minStock}</td>
                        <td className="py-3 text-right text-red-400 font-bold">{p.stock} {p.unit}</td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => navigate('/pengaturan/produk')} 
                            className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-[10px] px-3 py-1.5 rounded-xl tracking-wider uppercase cursor-pointer transition-transform active:scale-95 duration-100"
                          >
                            TAMBAH STOK
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Help & Analytics Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#182352] to-[#0c143a] border border-[#1d2a57] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-end mb-3 border-b border-white/5 pb-3">
              <h3 className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
                INFORMASI PRODUK BARU
              </h3>
              <div className="flex flex-col items-end text-right">
                <p className="text-slate-400 text-[9px] whitespace-nowrap uppercase tracking-widest">TOTAL OUTLET MITRA</p>
                <p className="text-xs font-black text-yellow-400 mt-0.5 whitespace-nowrap">
                  {customers.filter((c: any) => c.type === 'Outlet' || c.role === 'Store').length} Outlet
                </p>
              </div>
            </div>
            <div className="bg-[#0b1330] border border-[#1d2a57] rounded-2xl p-2 flex-grow flex flex-col justify-center overflow-hidden min-h-0">
              {(!promoBannerUrls || promoBannerUrls.length === 0) ? (
                <p className="m-auto text-slate-500 text-xs tracking-wider uppercase font-bold py-6 text-center">
                  Belum ada banner promosi terbaru
                </p>
              ) : (
                <div className="relative group w-full h-56 sm:h-64 lg:h-72 rounded-xl overflow-hidden flex-shrink-0">
                  <img 
                    src={promoBannerUrls[currentBannerIndex]} 
                    alt={`Banner Promosi ${currentBannerIndex + 1}`} 
                    className="w-full h-full object-cover object-center shadow-xl animate-fadeIn transition-opacity duration-300 cursor-pointer"
                    key={currentBannerIndex}
                    onClick={() => {
                      setPreviewIndex(currentBannerIndex);
                      setIsPreviewModalOpen(true);
                    }}
                  />
                  {promoBannerUrls.length > 1 && (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {promoBannerUrls.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'w-4 bg-[#b4f56b]' : 'w-1.5 bg-white/40'}`} 
                        />
                      ))}
                    </div>
                  )}
                  {user?.role === 'Admin' && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                      <button
                        onClick={() => {
                          setBannerUrl(promoBannerUrls[currentBannerIndex]);
                          setEditingBannerIndex(currentBannerIndex);
                          setIsUploadModalOpen(true);
                        }}
                        className="p-1.5 bg-[#1d2a57] hover:bg-[#2a3c78] text-[#b4f56b] rounded-lg shadow-lg border border-[#2a3c78] transition-colors"
                        title="Edit Banner"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Hapus banner promosi ini?')) {
                            const newBanners = [...promoBannerUrls];
                            newBanners.splice(currentBannerIndex, 1);
                            setPromoBanners(newBanners);
                            if (currentBannerIndex >= newBanners.length) {
                              setCurrentBannerIndex(Math.max(0, newBanners.length - 1));
                            }
                            setSuccessToast('Banner promosi berhasil dihapus');
                            setTimeout(() => setSuccessToast(null), 3000);
                          }
                        }}
                        className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-lg border border-rose-600 transition-colors"
                        title="Hapus Banner"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* Widget Hutang Cabang (Hanya untuk Admin) */}
        {user.role === 'Admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl p-6 shadow-xl flex flex-col space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Building2 className="text-[#b4f56b] w-5 h-5" />
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">HUTANG (DARI CABANG)</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-[#131d42] border border-[#21306b]/40 rounded-2xl p-4 flex flex-col justify-center">
                   <div className="flex items-center gap-2 text-rose-500 mb-1">
                      <ArrowDownRight size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Hutang Keseluruhan</span>
                   </div>
                   <span className="text-lg font-black text-rose-400 font-mono">
                     {formatRupiah(adminHutangDariCabang)}
                   </span>
                </div>
              </div>

              <div className="space-y-2 mt-2 text-center text-xs text-slate-500 py-4">
                Tidak ada hutang cabang
              </div>
            </div>
          </div>
        )}


      </div>

      {/* QUICK UPLOAD PRODUCT MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div 
            className="bg-[#0e1531] w-full max-w-md rounded-2xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d2a57]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#b4f56b]" />
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">Upload Banner Promo Baru</h3>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleQuickAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">URL GAMBAR BANNER</label>
                <input 
                  type="text" 
                  placeholder="https://example.com/banner-promo.jpg" 
                  value={bannerUrl.startsWith('data:image') ? '[ FILE LOKAL TERPILIH ]' : bannerUrl} 
                  onChange={e => setBannerUrl(e.target.value)} 
                  disabled={bannerUrl.startsWith('data:image')}
                  className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm placeholder-slate-400 font-mono disabled:opacity-50"
                />
              </div>

              <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-[#1d2a57]"></div>
                 <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] font-bold tracking-widest uppercase">ATAU</span>
                 <div className="flex-grow border-t border-[#1d2a57]"></div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">UPLOAD DARI KOMPUTER</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange} 
                  className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1d2a57] file:text-white hover:file:bg-[#21306b] cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-wide">
                  * Maksimal 2MB. Banner ini akan tampil eksklusif di halaman Dashboard Cabang dan Outlet.
                </p>
                {bannerUrl.startsWith('data:image') && (
                  <button 
                    type="button" 
                    onClick={() => setBannerUrl('')} 
                    className="text-[10px] text-rose-400 font-bold mt-2 uppercase tracking-wide hover:text-rose-300"
                  >
                    X Hapus File Lokal
                  </button>
                )}
              </div>

              <div className="pt-2 flex gap-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold text-sm py-4 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-sm py-4 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer flex flex-col items-center justify-center"
                >
                  <span>Upload</span>
                  <span>Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KATEGORI ANALYTICS MODAL */}
      {selectedCategoryAnalytics && categoryAnalyticsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedCategoryAnalytics(null)}>
          <div 
            className="bg-[#0e1531] w-full max-w-2xl rounded-3xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#1d2a57] bg-[#090f26]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#b4f56b]" />
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">Analitik Kategori: <span className="text-[#b4f56b]">{selectedCategoryAnalytics}</span></h3>
              </div>
              <button 
                onClick={() => setSelectedCategoryAnalytics(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto">
              {/* Bagian 1: Top Produk */}
              <div className="bg-[#131d42] border border-[#21306b]/40 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
                  <Package className="w-4 h-4 text-[#38bdf8]" />
                  <h4 className="text-xs font-black tracking-widest text-[#38bdf8] uppercase">Produk Terlaris</h4>
                </div>
                <div className="space-y-3 flex-grow">
                  {categoryAnalyticsData.topProducts.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold text-center py-4 uppercase">Belum ada data penjualan.</p>
                  ) : (
                    categoryAnalyticsData.topProducts.map((p, i) => (
                      <div key={i} className="flex flex-col bg-[#0b1330] p-3 rounded-xl border border-[#1d2a57] hover:bg-[#0c143a] transition-colors gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white uppercase truncate pr-3">{i + 1}. {p.name}</span>
                          <span className="text-xs font-black text-[#b4f56b] font-mono shrink-0">{p.qty} Unit</span>
                        </div>
                        {p.bestBranch ? (
                          <div className="text-[10px] text-slate-400 italic pl-3 border-l-2 border-[#1d2a57]">
                            Paling laris di: <span className="text-sky-300 font-semibold">{p.bestBranch}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic pl-3">Belum ada transaksi di cabang</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bagian 2: Produk Kurang Laku */}
              <div className="bg-[#131d42] border border-[#21306b]/40 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-black tracking-widest text-rose-400 uppercase">Produk Kurang Laku</h4>
                </div>
                <div className="space-y-3 flex-grow">
                  {categoryAnalyticsData.worstProducts.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold text-center py-4 uppercase">Tidak ada produk.</p>
                  ) : (
                    categoryAnalyticsData.worstProducts.map((p, i) => (
                      <div key={i} className="flex flex-col bg-[#0b1330] p-3 rounded-xl border border-[#1d2a57] hover:bg-[#0c143a] transition-colors gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white uppercase truncate pr-3">{i + 1}. {p.name}</span>
                          <span className="text-xs font-black text-rose-400 font-mono shrink-0">{p.qty} Unit</span>
                        </div>
                        {p.bestBranch ? (
                          <div className="text-[10px] text-slate-400 italic pl-3 border-l-2 border-[#1d2a57]">
                            Tercatat terjual di: <span className="text-rose-300 font-semibold">{p.bestBranch}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic pl-3">Belum ada transaksi di cabang</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bagian 3: Top Wilayah/Cabang (Span full width) */}
              <div className="bg-[#131d42] border border-[#21306b]/40 rounded-2xl p-4 flex flex-col md:col-span-2">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
                  <Building2 className="w-4 h-4 text-pink-400" />
                  <h4 className="text-xs font-black tracking-widest text-pink-400 uppercase">Distribusi Cabang & Outlet</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryAnalyticsData.topBranches.length === 0 ? (
                    <p className="text-xs text-slate-500 font-bold text-center py-4 uppercase col-span-full">Belum ada data distribusi.</p>
                  ) : (
                    categoryAnalyticsData.topBranches.map((b, i) => (
                      <div key={i} className="bg-[#0b1330] p-3 rounded-xl border border-[#1d2a57] flex flex-col">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                          <span className="text-xs font-extrabold text-white uppercase truncate pr-2">{i + 1}. {b.name}</span>
                          <span className="text-xs font-black text-[#b4f56b] font-mono shrink-0 bg-[#b4f56b]/10 px-2 py-0.5 rounded-lg">{b.qty} Total</span>
                        </div>
                        {b.topOutlets.length > 0 ? (
                          <div className="space-y-1.5 pl-1">
                            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Top Outlet:</span>
                            {b.topOutlets.map((outlet: any, oIdx: number) => (
                              <div key={oIdx} className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 truncate pr-2">• {outlet.name}</span>
                                <span className="text-slate-300 font-mono">{outlet.qty} Unit</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-600 italic">Tidak ada spesifikasi outlet.</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-[#090f26] border-t border-[#1d2a57] p-4 flex justify-end">
              <button 
                onClick={() => setSelectedCategoryAnalytics(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-2 px-6 rounded-xl transition-transform active:scale-95 uppercase tracking-widest cursor-pointer shadow-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Status Modal for Cabang */}
      {isPoStatusModalOpen && user?.role === 'Cabang' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
            onClick={() => setIsPoStatusModalOpen(false)}
          />
          
          <div className="relative bg-[#0a0f26] border border-[#1d2a57] rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#121a3e] to-[#0a0f26] border-b border-[#1d2a57] p-6 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[#b4f56b]/5 pointer-events-none" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shadow-inner border border-sky-500/30">
                    <Package size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-widest uppercase">Status Pengiriman PO</h3>
                    <p className="text-sm text-slate-400 font-medium">Lacak pengiriman barang ke cabang Anda</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPoStatusModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 relative z-10 mt-2">
                <button 
                  onClick={() => setPoModalTab('request')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer ${poModalTab === 'request' ? 'bg-[#b4f56b] text-[#0a0f26]' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  Riwayat PO (Pengajuan)
                </button>
                <button 
                  onClick={() => setPoModalTab('push')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-colors cursor-pointer ${poModalTab === 'push' ? 'bg-[#b4f56b] text-[#0a0f26]' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  Distribusi Pusat (Otomatis)
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {purchases.filter(p => p.branchId === user.branchId && (poModalTab === 'request' ? p.userId === user.id : p.userId !== user.id)).length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-2">
                    <Package size={32} className="text-slate-500" />
                  </div>
                  <p className="font-bold tracking-widest">BELUM ADA PO DIAJUKAN</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#1d2a57]">
                        <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Total</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status PO</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status Pengiriman</th>
                        <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1d2a57]">
                      {purchases
                        .filter(p => p.branchId === user.branchId && (poModalTab === 'request' ? p.userId === user.id : p.userId !== user.id))
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((po) => (
                        <tr key={po.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-4 px-4 font-bold text-[#b4f56b] font-mono text-sm">
                            <button 
                              type="button" 
                              onClick={() => store.openInvoiceModal(po.invoice)}
                              className="hover:underline hover:text-white transition-colors cursor-pointer text-left focus:outline-none flex items-center gap-1 group"
                              title="Klik untuk lihat rincian barang"
                            >
                              {po.invoice}
                            </button>
                          </td>
                          <td className="py-4 px-4 text-slate-300 text-sm">
                            {new Date(po.date).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-[#b4f56b]">
                            {formatRupiah(po.total)}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                              po.isProcessed 
                                ? 'bg-[#b4f56b]/10 text-[#b4f56b] border-[#b4f56b]/30'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            }`}>
                              {po.isProcessed ? 'Disetujui' : 'Menunggu'}
                            </span>
                            {!po.isProcessed && (() => {
                              const isOut = po.items?.some((item: any) => {
                                const prod = products.find(p => p.id === item.productId || p.name === item.name);
                                return prod && (prod.centralStock ?? prod.stock) < item.qty;
                              });
                              if (isOut) {
                                return (
                                  <span className="block mt-1.5 text-[9px] font-extrabold text-rose-400 tracking-wider animate-pulse">
                                    ⚠️ Stok Pusat Tidak Cukup
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                              po.deliveryStatus === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              po.deliveryStatus === 'Dikirim' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                              po.deliveryStatus === 'Diproses' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/30'
                            }`}>
                              {po.deliveryStatus || 'Menunggu'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {po.deliveryStatus !== 'Selesai' && (
                              <button
                                onClick={() => setSelectedPoForValidation(po)}
                                disabled={po.deliveryStatus !== 'Dikirim'}
                                className={`font-bold text-[10px] py-1.5 px-3 rounded-full transition-colors uppercase tracking-wider border ${
                                  po.deliveryStatus === 'Dikirim' 
                                    ? 'bg-[#b4f56b]/10 hover:bg-[#b4f56b]/20 text-[#b4f56b] border-[#b4f56b]/30' 
                                    : 'bg-slate-800/50 text-slate-500 border-slate-700/50 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                Terima & Cek
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-[#090f26] border-t border-[#1d2a57] p-4 flex justify-end">
              <button 
                onClick={() => setIsPoStatusModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-transform active:scale-95 uppercase tracking-widest cursor-pointer shadow-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Validation PO Modal */}
      {selectedPoForValidation && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" 
            onClick={() => !isValidationSubmitting && setSelectedPoForValidation(null)}
          />
          <div className="relative bg-[#0a0f26] border border-[#1d2a57] rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden animate-zoomIn max-h-[90vh]">
            <div className="bg-gradient-to-r from-[#121a3e] to-[#0a0f26] border-b border-[#1d2a57] p-6 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[#b4f56b]/5 pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#b4f56b]/20 text-[#b4f56b] flex items-center justify-center shadow-inner border border-[#b4f56b]/30">
                  <Check size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-widest uppercase">Validasi Penerimaan Barang</h3>
                  <p className="text-sm text-slate-400 font-medium">
                    Invoice: <span className="text-white font-bold">{selectedPoForValidation.invoice}</span> &bull; 
                    Tanggal: <span className="text-white font-bold">{new Date(selectedPoForValidation.date).toLocaleDateString('id-ID')}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => !isValidationSubmitting && setSelectedPoForValidation(null)}
                className="w-10 h-10 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#1d2a57]">
                      <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Nama Barang</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Jumlah</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Harga Pusat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1d2a57]">
                    {selectedPoForValidation.items.map((item: any, idx: number) => {
                      const product = products.find((p) => p.id === item.productId);
                      const hargaPusat = item.price;
                      const hargaJualCabang = product ? (product.branchPrices?.[user.branchId as string] || product.sellPrice) : 0;
                      const profit = (hargaJualCabang - hargaPusat) * item.qty;
                      
                      return (
                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-4 px-4 font-bold text-white text-sm">{item.name}</td>
                          <td className="py-4 px-4 text-slate-300 font-mono text-center">{item.qty}</td>
                          <td className="py-4 px-4 text-slate-300 font-mono text-right">{formatRupiah(hargaPusat)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-[#090f26] border-t border-[#1d2a57] p-4 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPoForValidation(null)}
                disabled={isValidationSubmitting}
                className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-transform active:scale-95 uppercase tracking-widest disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleTerimaSelesai}
                disabled={isValidationSubmitting}
                className="bg-[#b4f56b] hover:bg-[#a0eb52] text-[#0a0f26] font-extrabold text-xs py-3 px-8 rounded-xl transition-transform active:scale-95 uppercase tracking-widest shadow-[0_0_20px_rgba(180,245,107,0.3)] flex items-center gap-2 disabled:opacity-50"
              >
                {isValidationSubmitting ? 'Memproses...' : 'Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Lightbox Modal */}
      {isPreviewModalOpen && promoBannerUrls && promoBannerUrls.length > 0 && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4" onClick={() => setIsPreviewModalOpen(false)}>
          <button 
            className="absolute top-4 right-4 text-white hover:text-rose-500 z-50 p-2 transition-colors cursor-pointer"
            onClick={() => setIsPreviewModalOpen(false)}
          >
            <X size={32} />
          </button>
          
          {promoBannerUrls.length > 1 && (
            <>
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 z-50 transition-colors cursor-pointer bg-black/30 rounded-full hover:bg-black/50"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((prev) => (prev - 1 + promoBannerUrls.length) % promoBannerUrls.length);
                }}
              >
                <ChevronLeft size={36} />
              </button>
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 z-50 transition-colors cursor-pointer bg-black/30 rounded-full hover:bg-black/50"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((prev) => (prev + 1) % promoBannerUrls.length);
                }}
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}
          
          <img 
            src={promoBannerUrls[previewIndex]} 
            alt={`Preview ${previewIndex + 1}`} 
            className="max-w-full max-h-[90vh] object-contain animate-zoomIn rounded-xl shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
          
          {promoBannerUrls.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center text-white/70 text-sm font-bold tracking-widest z-50">
              {previewIndex + 1} / {promoBannerUrls.length}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
