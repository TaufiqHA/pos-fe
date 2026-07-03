import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../../store';
import { formatDate, formatRupiah } from '../../lib/utils';
import { Plus, Eye, Trash2 } from 'lucide-react';

export default function PenjualanList() {
  const { user, users, sales, purchases, branches, openInvoiceModal, deleteSale, wilayahs } = usePosStore();
  const navigate = useNavigate();

  const canDelete = user?.role === 'Admin' || user?.role === 'Cabang';

  const handleDelete = async (id: string, invoice: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus penjualan ${invoice}?`)) {
      try {
        await deleteSale(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus penjualan');
      }
    }
  };

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

  let visibleSales = sales;
  if (user?.role === 'Admin') {
    visibleSales = sales.filter(s => branches.some(b => b.name === s.customer));
  } else if (user?.role === 'Cabang') {
    visibleSales = sales.filter(s => s.branchId === user?.branchId);
  } else if (user?.role === 'Sales') {
    visibleSales = sales.filter(s => s.userId === user?.id);
  } else if (user?.role === 'Cust' || user?.role === 'Outlet') {
    const userSales = sales.filter(s => s.customer === user?.name || s.customer === user?.outletName || s.userId === user?.id);
    
    // Gabungkan PO yang belum diproses oleh cabang
    const userPendingPOs = purchases
      .filter(p => p.userId === user?.id && !p.isProcessed)
      .map(p => ({
        id: p.id,
        invoice: p.invoice,
        date: p.date,
        customer: p.supplier, // Supplier di sini adalah nama cabang
        grandTotal: p.total,
        method: p.method,
        status: (p.method === 'Tunai' || p.method === 'Transfer') ? 'Selesai' : (p.status === 'Belum Bayar' ? 'Diajukan' : (p.status || 'Belum Bayar')),
      }));
      
    visibleSales = [...userSales, ...userPendingPOs] as any[];
    
    // Urutkan berdasarkan tanggal terbaru
    visibleSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterWilayah, setFilterWilayah] = useState('Semua Wilayah');
  const [filterCabang, setFilterCabang] = useState('Semua Cabang');

  const filteredSales = visibleSales.filter(s => {
    const matchesSearch = s.invoice.toLowerCase().includes(search.toLowerCase()) || 
                          s.customer.toLowerCase().includes(search.toLowerCase());
    const displayedStatus = (s.method === 'Tunai' || s.method === 'Transfer') && (s.status === 'Belum Bayar' || s.status === 'Diajukan' || !s.status) ? 'Selesai' : (s.status || 'Belum Bayar');
    const matchesStatus = filterStatus === 'Semua' || displayedStatus === filterStatus;
    
    let matchesRegion = true;
    let matchesBranch = true;
    
    if (user?.role === 'Admin') {
      if (filterWilayah !== 'Semua Wilayah') {
        const branchInfo = branches.find(b => b.name === s.customer);
        matchesRegion = branchInfo ? branchInfo.wilayah === filterWilayah : false;
      }
      if (filterCabang !== 'Semua Cabang') {
        matchesBranch = s.customer === filterCabang;
      }
    }

    return matchesSearch && matchesStatus && matchesRegion && matchesBranch;
  });

  const getStatusClass = (status?: string) => {
    const s = status || '';
    if (s === 'Lunas') return 'bg-green-100 text-green-800';
    if (s === 'Sebagian') return 'bg-yellow-100 text-yellow-800';
    if (s === 'Belum Bayar' || s === 'Belum Dibayar') return 'bg-red-100 text-red-800';
    if (s === 'Diajukan') return 'bg-blue-100 text-blue-800';
    if (s === 'Disetujui' || s === 'Selesai') return 'bg-emerald-100 text-emerald-800';
    if (s === 'Menunggu' || s === 'Dikirim') return 'bg-purple-100 text-purple-800';
    if (s === 'Dibatalkan') return 'bg-rose-100 text-rose-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">
            {user?.role === 'Outlet' || user?.role === 'Cust' ? 'HISTORY ORDER' : 'DAFTAR PENJUALAN'}
          </h2>
        </div>
        <div className="flex gap-3 items-center">
          {user?.role !== 'Outlet' && user?.role !== 'Cust' && (
            <button
              onClick={() => navigate('/penjualan/po')}
              className="relative inline-flex items-center px-4 py-2 border-2 border-[#b4f56b] text-sm font-extrabold rounded-xl shadow-lg text-[#b4f56b] hover:bg-[#b4f56b]/10 transition-colors active:scale-95 uppercase tracking-wider cursor-pointer"
            >
              {user?.role === 'Cabang' ? 'Permintaan PO Dari Outlet' : 'Permintaan PO'}
              {pendingPOCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#070b19] shadow-lg">
                  {pendingPOCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => navigate('/penjualan/buat')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-extrabold rounded-xl shadow-lg text-black bg-[#b4f56b] hover:bg-[#a5e45a] focus:outline-none transition-transform active:scale-95 uppercase tracking-wider cursor-pointer"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Buat Transaksi
          </button>
        </div>
      </div>

      <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1d2a57]/40 flex flex-col sm:flex-row flex-wrap gap-4 items-center">
          <div className="w-full sm:flex-1 relative">
            <input
              type="text"
              placeholder={user?.role === 'Admin' ? "Cari Invoice atau Cabang..." : "Cari Invoice atau Outlet..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] placeholder-slate-500 text-sm font-semibold"
            />
          </div>
          
          {user?.role === 'Admin' && (
            <>
              <select 
                value={filterWilayah}
                onChange={(e) => {
                  setFilterWilayah(e.target.value);
                  setFilterCabang('Semua Cabang');
                }}
                className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
              >
                <option value="Semua Wilayah">Semua Wilayah</option>
                {wilayahs.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select 
                value={filterCabang}
                onChange={(e) => setFilterCabang(e.target.value)}
                disabled={filterWilayah === 'Semua Wilayah'}
                className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                <option value="Semua Cabang">Semua Cabang</option>
                {branches.filter(b => b.wilayah === filterWilayah).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </>
          )}

          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Belum Bayar">Belum Bayar</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1d2a57]/30">
            <thead className="bg-[#090f26]/70">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">No. Invoice</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tanggal</th>
                {user?.role !== 'Outlet' && user?.role !== 'Cust' && (
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">
                    {user?.role === 'Admin' ? 'Cabang' : 'Outlet'}
                  </th>
                )}
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Total</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Metode</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Status</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={user?.role !== 'Outlet' && user?.role !== 'Cust' ? 7 : 6} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                    Belum ada data penjualan.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#182352]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#b4f56b] font-mono">
                      <button 
                        type="button" 
                        onClick={() => openInvoiceModal(sale.invoice)}
                        className="hover:underline hover:text-white transition-colors cursor-pointer text-left focus:outline-none flex items-center gap-1 group"
                        title="Klik untuk lihat rincian barang"
                      >
                        {sale.invoice}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">{formatDate(sale.date)}</td>
                    {user?.role !== 'Outlet' && user?.role !== 'Cust' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white uppercase">{sale.customer}</td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right font-mono">{formatRupiah(sale.grandTotal)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-400">{sale.method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass((sale.method === 'Tunai' || sale.method === 'Transfer') && (sale.status === 'Belum Bayar' || sale.status === 'Diajukan' || !sale.status) ? 'Selesai' : sale.status)}`}>
                          {(sale.method === 'Tunai' || sale.method === 'Transfer') && (sale.status === 'Belum Bayar' || sale.status === 'Diajukan' || !sale.status) ? 'Selesai' : (sale.status || 'Belum Bayar')}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => navigate(`/penjualan/${sale.id}`)} className="text-sky-400 hover:text-sky-300 inline-flex items-center transition-colors font-semibold uppercase tracking-wider text-xs bg-[#182352] px-3 py-1.5 rounded-lg border border-[#1d2a57] cursor-pointer">
                          <Eye className="h-4 w-4 mr-1.5" /> Lihat
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(sale.id, sale.invoice)}
                            className="text-rose-400 hover:text-rose-300 inline-flex items-center transition-colors font-semibold uppercase tracking-wider text-xs bg-[#182352] px-3 py-1.5 rounded-lg border border-[#1d2a57] cursor-pointer"
                            title="Hapus penjualan"
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" /> Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
