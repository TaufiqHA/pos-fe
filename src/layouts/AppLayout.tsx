import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePosStore } from '../store';
import { Menu, X, Box, ShoppingCart, Activity, Settings, LogOut, LayoutDashboard, Truck, PackagePlus, Users, Banknote, BarChart3, MapPin, Store, UserCircle, ChevronDown, ChevronRight, Bell } from 'lucide-react';
import InvoiceDetailModal from '../components/InvoiceDetailModal';

export default function AppLayout() {
  const { user, logout, branches, fetchAllData } = usePosStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'PRODUK & STOK': true,
    'TRANSAKSI': true,
    'DATA CABANG': true,
    'KEUANGAN': true,
  });

  React.useEffect(() => {
    if (user) {
      // 1. Ambil data saat komponen pertama kali dimuat (saat user berhasil login)
      fetchAllData();
      
      // Polling agresif setiap 5 detik telah dihentikan karena membebani server dan browser.
      // Sinkronisasi data sekarang akan dipicu oleh aksi pengguna (seperti menyimpan transaksi)
      // atau saat halaman dimuat ulang.
    }
  }, [user, fetchAllData]);

  if (!user) {
    return null;
  }

  const activeBranch = branches?.find(b => b.id === user.branchId);
  const branchName = activeBranch ? activeBranch.name.toUpperCase() : 'CABANG';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Grouped Menus for Admin & Cabang, matching target styles and structures exactly
  const menuGroups = React.useMemo(() => {
    if (user.role === 'Admin') {
      return [
        {
          title: 'PRODUK & STOK',
          icon: Box,
          items: [
            { to: '/pengaturan/produk', label: 'Daftar Produk' },
            { to: '/stok', label: 'Monitoring Stok' },
          ]
        },
        {
          title: 'TRANSAKSI',
          icon: ShoppingCart,
          items: [
            { to: '/penjualan', label: 'Penjualan' },
            { to: '/pembelian', label: 'Pembelian' },
            { to: '/pengiriman', label: 'Pengiriman' },
          ]
        },
        {
          title: 'DATA CABANG',
          icon: Store,
          items: [
            { to: '/laporan-cabang', label: 'Laporan Cabang' },
            { to: '/pengaturan/pengguna', label: 'Pengguna' },
            { to: '/pengaturan/pelanggan', label: 'Outlet' },
            { to: '/pengaturan/supplier', label: 'Supplier' },
          ]
        },
        {
          title: 'KEUANGAN',
          icon: Banknote,
          items: [
            { to: '/laporan', label: 'Laporan Keuangan' },
            { to: '/hutang-piutang', label: 'Hutang & Piutang' },
          ]
        }
      ];
    } else if (user.role === 'Cabang') {
      return [
        {
          title: 'PRODUK & STOK',
          icon: Box,
          items: [
            { to: '/stok', label: 'Monitoring Stok' },
            { to: '/stok/riwayat', label: 'Riwayat Stok' },
            { to: '/pengaturan/harga-cabang', label: 'Atur Harga Cabang' },
          ]
        },
        {
          title: 'TRANSAKSI',
          icon: ShoppingCart,
          items: [
            { to: '/penjualan', label: 'Penjualan' },
            { to: '/pembelian', label: 'Daftar PO' },
            { to: '/pembelian/buat', label: 'PO Ke Pusat' },
            { to: '/pengiriman', label: 'Pengiriman' },
          ]
        },
        {
          title: 'DATA CABANG',
          icon: Store,
          items: [
            { to: '/pengaturan/pelanggan', label: 'Outlet' },
          ]
        },
        {
          title: 'KEUANGAN',
          icon: Banknote,
          items: [
            { to: '/laporan', label: 'Laporan Keuangan' },
            { to: '/hutang-piutang', label: 'Hutang' },
          ]
        }
      ];
    }
    return [];
  }, [user.role]);

  let navLinks: any[] = [];
  
  if (user.role === 'Sales') {
    navLinks = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/pengaturan/pelanggan', icon: Users, label: 'Customer / Outlet' },
      { to: '/penjualan', icon: ShoppingCart, label: 'Histori Transaksi' },
      { to: '/pengiriman', icon: MapPin, label: 'Pengiriman' },
    ];
  } else if (user.role === 'Cust') {
    navLinks = [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/penjualan/buat', icon: PackagePlus, label: 'Input Orderan' },
      { to: '/penjualan', icon: ShoppingCart, label: 'Histori Transaksi' },
    ];
  } else if (user.role === 'Outlet') {
    navLinks = [
      { to: '/penjualan/buat', icon: PackagePlus, label: 'Order' },
      { to: '/penjualan', icon: ShoppingCart, label: 'History' },
    ];
  } else if (user.role === 'Kurir') {
    navLinks = [
      { to: '/pengiriman', icon: MapPin, label: 'Pengiriman' },
    ];
  }
  return (
    <div className="h-screen bg-[#070b19] flex flex-col md:flex-row overflow-hidden text-white font-sans">
      {/* Mobile Topbar */}
      <div className="md:hidden flex-shrink-0 flex items-center justify-between bg-[#0b1330] text-white px-4 border-b border-[#1d2a57] h-16 shadow-md">
        <div className="flex flex-col flex-1 overflow-hidden mr-2">
          <span className={`font-extrabold text-[#b4f56b] tracking-wider uppercase ${user.role === 'Cabang' ? 'text-base leading-tight line-clamp-2' : 'text-xl'}`}>
            {user.role === 'Cabang' ? branchName.replace(/CABANG\s*/i, '') : 'LUCIFER'}
          </span>
          <span className="text-[10px] text-slate-400 font-bold tracking-widest leading-none uppercase truncate mt-0.5">
            {user.role === 'Admin' ? 'KANTOR PUSAT' : user.role === 'Cust' ? 'OUTLET / CUSTOMER' : user.role === 'Outlet' ? 'LUCIFER OUTLET' : user.role === 'Sales' ? 'SALES' : user.role === 'Cabang' ? 'CABANG' : branchName}
          </span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#b4f56b] hover:opacity-80">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0b1330] border-r border-[#1d2a57] transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:flex flex-col flex-shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 border-b border-[#1d2a57] px-5">
            <div className="flex flex-col flex-1 overflow-hidden pr-2">
              <span className={`font-extrabold text-[#b4f56b] tracking-wider uppercase ${user.role === 'Cabang' ? 'text-lg leading-tight line-clamp-2' : 'text-2xl'}`}>
                {user.role === 'Cabang' ? branchName.replace(/CABANG\s*/i, '') : 'LUCIFER'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest leading-none uppercase truncate mt-1">
                {user.role === 'Admin' ? 'KANTOR PUSAT' : user.role === 'Cust' ? 'OUTLET / CUSTOMER' : user.role === 'Outlet' ? 'LUCIFER OUTLET' : user.role === 'Sales' ? 'SALES' : user.role === 'Cabang' ? 'CABANG' : branchName}
              </span>
            </div>
            <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 py-4 overflow-y-auto">
            <nav className="space-y-4 px-3">
              {/* Dashboard Link */}
              <NavLink
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#1b2559] text-[#b4f56b]'
                      : 'text-slate-300 hover:bg-[#11193d] hover:text-white'
                  }`
                }
              >
                <LayoutDashboard className="mr-3 flex-shrink-0 h-5 w-5" />
                Dashboard
              </NavLink>

              {user.role === 'Admin' || user.role === 'Cabang' ? (
                menuGroups.map((group) => {
                  const isExpanded = expandedGroups[group.title];
                  return (
                    <div key={group.title} className="space-y-1">
                      <button
                        onClick={() => toggleGroup(group.title)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-extrabold tracking-wider text-slate-400 hover:text-white focus:outline-none uppercase"
                      >
                        <div className="flex items-center">
                          <group.icon className="mr-2 h-4 w-4 text-[#b4f56b]" />
                          {group.title}
                        </div>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      
                      {isExpanded && (
                        <div className="pl-3 space-y-1 border-l border-[#1d2a57] ml-4">
                          {group.items.map((link) => (
                            <NavLink
                              key={link.to}
                              to={link.to}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                  isActive
                                    ? 'text-[#b4f56b] bg-[#1a2552]/60 font-bold'
                                    : 'text-slate-300 hover:text-white hover:bg-[#101736]'
                                }`
                              }
                            >
                              {link.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => {
                      const isLinkActive = link.to === '/penjualan'
                        ? (location.pathname.startsWith('/penjualan') && !location.pathname.startsWith('/penjualan/buat'))
                        : isActive;
                      return `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                        isLinkActive
                          ? 'bg-[#1b2559] text-[#b4f56b]'
                          : 'text-slate-300 hover:bg-[#11193d] hover:text-white'
                      }`;
                    }}
                  >
                    <link.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                    {link.label}
                  </NavLink>
                ))
              )}
            </nav>
          </div>
          
          <div className="p-4 border-t border-[#1d2a57] bg-[#090f26]">
            <div className="flex items-center mb-4">
              <div className="w-9 h-9 rounded-full bg-[#1b2559] flex items-center justify-center text-[#b4f56b] font-bold mr-3 border border-[#1d2a57]">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate tracking-wide uppercase font-medium">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-red-400 hover:bg-[#11193d] transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Desktop Topbar */}
        <header className="hidden md:flex flex-shrink-0 bg-transparent h-16 border-b border-[#1d2a57]/20 items-center justify-between px-6">
          <h1 className="text-base md:text-lg font-bold text-white uppercase tracking-wider truncate pr-4">
            {location.pathname === '/dashboard' ? 'DASHBOARD' : ''}
          </h1>
          <div className="flex items-center gap-4">
             <span className="text-sm text-slate-400 font-semibold mr-2">
               {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </span>
             {/* Notification Bell */}
             <div className="bg-[#182352] hover:bg-[#1f2d6b] p-2.5 rounded-xl shadow-md flex items-center justify-center cursor-pointer transition-all border border-white/5 relative">
               <Bell size={18} className="text-slate-200" />
               <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#070b19] text-white">
          <Outlet />
        </main>
      </div>
      <InvoiceDetailModal />
    </div>
  );
}
