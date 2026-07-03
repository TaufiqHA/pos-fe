import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../../store';
import { formatDate, formatRupiah } from '../../lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export default function PembelianList() {
  const { user, purchases, users, openInvoiceModal, deletePurchase } = usePosStore();
  const navigate = useNavigate();

  const handleDelete = async (id: string, invoice: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pembelian ${invoice}?`)) {
      try {
        await deletePurchase(id);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus pembelian');
      }
    }
  };

  const getUserName = (id?: string) => {
    if (!id) return '-';
    return users.find(u => u.id === id)?.name || '-';
  };

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [activeTab, setActiveTab] = useState<'po_ke_pusat' | 'po_dari_outlet'>('po_ke_pusat');

  let visiblePurchases = purchases;
  if (user?.role === 'Cabang') {
    if (activeTab === 'po_ke_pusat') {
      visiblePurchases = purchases.filter(p => 
        p.branchId === user?.branchId && 
        (p.supplier || '').toLowerCase() === 'kantor pusat'
      );
    } else {
      visiblePurchases = purchases.filter(p => 
        p.destinationAdminId === user?.id || 
        (p.branchId === user?.branchId && (p.supplier || '').toLowerCase() !== 'kantor pusat')
      );
    }
  } else if (user?.role === 'Admin') {
    // Pusat hanya melihat pembelian yang dibuat oleh Pusat itu sendiri (tidak memiliki branchId)
    visiblePurchases = purchases.filter(p => !p.branchId);
  }

  // Penyesuaian dinamis untuk data lama yang status utamanya tidak tersinkronisasi
  const enrichedPurchases = visiblePurchases.map(p => {
    let finalStatus = p.status;
    if ((p.method === 'Tunai' || p.method === 'Transfer') && (p.status === 'Belum Bayar' || p.status === 'Diajukan' || !p.status)) {
      finalStatus = 'Selesai';
    } else if (p.status === 'Belum Bayar' || p.status === 'Lunas' || p.status === 'Sebagian') {
      finalStatus = p.status;
    } else if (p.deliveryStatus === 'Selesai') {
      finalStatus = 'Selesai';
    } else if (p.isProcessed && p.status === 'Diajukan') {
      finalStatus = 'Disetujui';
    }
    return { ...p, displayStatus: finalStatus };
  });

  const filtered = enrichedPurchases.filter(p => {
    const matchesSearch = p.invoice.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'Semua' || p.displayStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Lunas': return 'bg-green-100 text-green-800';
      case 'Sebagian': return 'bg-yellow-100 text-yellow-800';
      case 'Belum Bayar': return 'bg-red-100 text-red-800';
      case 'Diajukan': return 'bg-purple-100 text-purple-800';
      case 'Disetujui': return 'bg-blue-100 text-blue-800';
      case 'Selesai': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">
            {user?.role === 'Cabang' 
              ? (activeTab === 'po_ke_pusat' ? 'DAFTAR PO KE PUSAT' : 'DAFTAR PO DARI OUTLET') 
              : 'DAFTAR PEMBELIAN'}
          </h2>
        </div>
        <button
          onClick={() => navigate('/pembelian/buat')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-extrabold rounded-xl shadow-lg text-black bg-[#b4f56b] hover:bg-[#a5e45a] focus:outline-none transition-transform active:scale-95 uppercase tracking-wider"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Buat Pembelian
        </button>
      </div>

      {user?.role === 'Cabang' && (
        <div className="flex gap-4 border-b border-[#1d2a57]">
          <button
            onClick={() => setActiveTab('po_ke_pusat')}
            className={`pb-4 px-2 font-bold tracking-wider uppercase text-sm border-b-2 transition-colors ${activeTab === 'po_ke_pusat' ? 'border-[#b4f56b] text-[#b4f56b]' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            PO ke Pusat
          </button>
          <button
            onClick={() => setActiveTab('po_dari_outlet')}
            className={`pb-4 px-2 font-bold tracking-wider uppercase text-sm border-b-2 transition-colors ${activeTab === 'po_dari_outlet' ? 'border-[#b4f56b] text-[#b4f56b]' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Daftar PO dari Outlet
          </button>
        </div>
      )}

      <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1d2a57]/40 flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:max-w-sm relative">
            <input type="text" placeholder="Cari Invoice / Tujuan..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] placeholder-slate-500 text-sm font-semibold" />
          </div>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer">
            <option value="Semua">Semua Status</option>
            {user?.role === 'Cabang' || user?.role === 'Outlet' ? (
              <>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Lunas">Lunas</option>
                <option value="Selesai">Selesai</option>
              </>
            ) : (
              <>
                <option value="Lunas">Lunas</option>
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Sebagian">Sebagian</option>
                <option value="Diajukan">Diajukan</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Selesai">Selesai</option>
              </>
            )}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1d2a57]/30">
            <thead className="bg-[#090f26]/70">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">No. Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tujuan</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Pembuat</th>
                <th className="px-6 py-4 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Total</th>
                <th className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Metode</th>
                <th className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">Belum ada data pembelian.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#182352]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#b4f56b] font-mono">
                      <button 
                        type="button" 
                        onClick={() => openInvoiceModal(p.invoice)}
                        className="hover:underline hover:text-white transition-colors cursor-pointer text-left focus:outline-none flex items-center gap-1 group"
                        title="Klik untuk lihat rincian barang"
                      >
                        {p.invoice}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">{formatDate(p.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white uppercase">{p.supplier}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{getUserName(p.userId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right font-mono">{formatRupiah(p.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-400">{p.method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(p.displayStatus)}`}>{p.displayStatus}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {user?.role === 'Cabang' && p.status !== 'Diajukan' ? (
                        <span className="text-slate-500 text-xs italic tracking-wider">Terkunci</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(p.id, p.invoice)}
                          className="text-rose-400 hover:text-rose-300 flex items-center justify-center mx-auto transition-colors font-semibold uppercase tracking-wider text-xs bg-[#182352] px-3 py-1.5 rounded-lg border border-[#1d2a57] cursor-pointer"
                          title="Hapus pembelian"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" /> Hapus
                        </button>
                      )}
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
