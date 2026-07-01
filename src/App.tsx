import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePosStore } from './store';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProdukList from './pages/Produk';
import Pelanggan from './pages/Pengaturan/Pelanggan';
import Supplier from './pages/Pengaturan/Supplier';

import PenjualanList from './pages/Penjualan/List';
import PenjualanCreate from './pages/Penjualan/Create';
import PenjualanDetail from './pages/Penjualan/Detail';
import PermintaanPO from './pages/Penjualan/PermintaanPO';

import PembelianList from './pages/Pembelian/List';
import PembelianCreate from './pages/Pembelian/Create';

import StokMonitor from './pages/Stok/Monitor';
import StokRiwayat from './pages/Stok/Riwayat';

import HutangPiutang from './pages/HutangPiutang';

import Laporan from './pages/Laporan';
import Pengiriman from './pages/Pengiriman';

import Pengguna from './pages/Pengaturan/Pengguna';
import LaporanCabang from './pages/LaporanCabang/Index';
import HargaCabang from './pages/Pengaturan/HargaCabang';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const user = usePosStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'Kurir' ? '/pengiriman' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 30, // Data dianggap fresh selama 30 detik
      retry: 2,
    },
  },
});

import DataSynchronizer from './components/DataSynchronizer';

export default function App() {
  const user = usePosStore((state) => state.user);

  return (
    <QueryClientProvider client={queryClient}>
      {user && <DataSynchronizer />}
      <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to={user?.role === 'Kurir' ? '/pengiriman' : '/dashboard'} replace />} />
          
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['Admin', 'Cabang', 'Sales', 'Cust', 'Outlet']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="laporan-cabang" element={<ProtectedRoute allowedRoles={['Admin']}><LaporanCabang /></ProtectedRoute>} />
          <Route path="pengaturan/cabang" element={<Navigate to="/laporan-cabang" replace />} />
          <Route path="pengaturan/produk" element={<ProtectedRoute allowedRoles={['Admin']}><ProdukList /></ProtectedRoute>} />
          <Route path="pengaturan/pelanggan" element={<ProtectedRoute allowedRoles={['Admin', 'Sales', 'Cabang']}><Pelanggan /></ProtectedRoute>} />
          <Route path="pengaturan/supplier" element={<ProtectedRoute allowedRoles={['Admin']}><Supplier /></ProtectedRoute>} />

          <Route path="pengaturan/pengguna" element={<ProtectedRoute allowedRoles={['Admin']}><Pengguna /></ProtectedRoute>} />
          <Route path="pengaturan/harga-cabang" element={<ProtectedRoute allowedRoles={['Cabang']}><HargaCabang /></ProtectedRoute>} />
          
          <Route path="penjualan" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang', 'Sales', 'Cust', 'Outlet']}><PenjualanList /></ProtectedRoute>} />
          <Route path="penjualan/buat" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang', 'Sales', 'Cust', 'Outlet']}><PenjualanCreate /></ProtectedRoute>} />
          <Route path="penjualan/po" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang', 'Sales', 'Cust', 'Outlet']}><PermintaanPO /></ProtectedRoute>} />
          <Route path="penjualan/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang', 'Sales', 'Cust', 'Outlet']}><PenjualanDetail /></ProtectedRoute>} />

          <Route path="pembelian" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang']}><PembelianList /></ProtectedRoute>} />
          <Route path="pembelian/buat" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang']}><PembelianCreate /></ProtectedRoute>} />
          
          <Route path="stok" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang']}><StokMonitor /></ProtectedRoute>} />
          <Route path="stok/riwayat" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang']}><StokRiwayat /></ProtectedRoute>} />

          <Route path="hutang-piutang" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang']}><HutangPiutang /></ProtectedRoute>} />
          <Route path="laporan" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang']}><Laporan /></ProtectedRoute>} />
          <Route path="pengiriman" element={<ProtectedRoute allowedRoles={['Admin', 'Cabang', 'Kurir', 'Sales']}><Pengiriman /></ProtectedRoute>} />
        </Route>
      </Routes>
    </HashRouter>
    </QueryClientProvider>
  );
}
