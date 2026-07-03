import React, { useState } from 'react';
import { usePosStore } from '../store';
import { formatDate } from '../lib/utils';
import { Truck, CheckCircle, Clock, X } from 'lucide-react';

export default function Pengiriman() {
    const { user, users, branches, deliveries, updateDelivery, purchases, updatePurchase, sales, updateSale, openInvoiceModal } = usePosStore();
    
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [search, setSearch] = useState('');
  
    const [statusModal, setStatusModal] = useState<{id: string, status: any} | null>(null);
    const [newStatus, setNewStatus] = useState<'Menunggu' | 'Dikirim' | 'Selesai'>('Menunggu');

  // Filter based on role
  let visibleDeliveries = deliveries;
  if (user?.role === 'Cabang') {
    visibleDeliveries = deliveries.filter(d => d.branchId === user?.branchId);
  } else if (user?.role === 'Admin') {
    // Admin Pusat HANYA melihat pengiriman ke Cabang (bukan Outlet)
    visibleDeliveries = deliveries.filter(d => {
      const customerName = (d.customerName || '').toLowerCase();
      
      // 1. Cek apakah customerName adalah nama salah satu Cabang (di tabel branches)
      const isCabangBranch = branches.some(b => (b.name || '').toLowerCase() === customerName);
      
      // 2. Cek apakah customerName adalah User dengan role 'Cabang'
      const targetUser = users.find(u => (u.name || '').toLowerCase() === customerName);
      const isCabangUser = targetUser?.role === 'Cabang';
      
      return isCabangBranch || isCabangUser;
    });
  }

  // Filter based on UI filters
  const filtered = visibleDeliveries.filter(d => {
    const invoiceStr = d.invoice || '';
    const customerStr = d.customerName || '';
    const searchLower = (search || '').toLowerCase();
    
    const matchSearch = invoiceStr.toLowerCase().includes(searchLower) || 
                        customerStr.toLowerCase().includes(searchLower);
    const matchStatus = filterStatus === 'Semua' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Selesai': return 'bg-green-100 text-green-800';
      case 'Dikirim': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Selesai': return <CheckCircle className="w-4 h-4 mr-1 text-green-600" />;
      case 'Dikirim': return <Truck className="w-4 h-4 mr-1 text-blue-600" />;
      default: return <Clock className="w-4 h-4 mr-1 text-yellow-600" />;
    }
  };



  const handleStatusSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (statusModal) {
      updateDelivery(statusModal.id, { status: newStatus });

      const targetDelivery = deliveries.find(d => d.id === statusModal.id);
      if (targetDelivery) {
        const targetSale = sales.find(s => s.id === targetDelivery.saleId);
        if (targetSale) {
          let purchaseIdToUpdate = targetSale.paymentRef;

          // LOGIKA FALLBACK UNTUK DATA LAMA
          if (!purchaseIdToUpdate) {
            const fallbackPurchase = purchases.find(p => 
              p.isProcessed && 
              p.total === targetSale.total && 
              (p.supplier === targetDelivery.customerName || p.supplier === targetSale.customer)
            );
            if (fallbackPurchase) {
              purchaseIdToUpdate = fallbackPurchase.id;
            }
          }

          if (purchaseIdToUpdate) {
            const currentPurchase = purchases.find(p => p.id === purchaseIdToUpdate);
            const isTransferOrCredit = targetSale.method !== 'Tunai';
            const shouldFixUnpaid = currentPurchase && (currentPurchase.status === 'Diajukan' || (currentPurchase.status === 'Lunas' && isTransferOrCredit));
            updatePurchase(purchaseIdToUpdate, { 
              deliveryStatus: newStatus,
              ...(shouldFixUnpaid ? { status: 'Belum Bayar' } : {})
            });
            if (targetSale.status === 'Lunas' && isTransferOrCredit && (targetSale.cashGiven || 0) < targetSale.grandTotal) {
              updateSale(targetSale.id, { status: 'Belum Bayar' });
            }
          }
        }
      }

      setStatusModal(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">Pengiriman Barang</h2>
        </div>
      </div>

      <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1d2a57]/40 flex flex-col sm:flex-row gap-4 justify-between">
          <input 
            type="text" 
            placeholder="Cari Order / Pelanggan..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full sm:max-w-xs focus:outline-none focus:ring-1 focus:ring-[#b4f56b] placeholder-slate-500 text-sm font-semibold" 
          />
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)} 
            className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Dikirim">Dikirim</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1d2a57]/30">
            <thead className="bg-[#090f26]/70">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">No. Order</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Pelanggan</th>
                <th className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase max-w-sm">Alamat</th>
                <th className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">Tidak ada data pengiriman.</td></tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-[#182352]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#b4f56b] font-mono">
                      <button 
                        type="button" 
                        onClick={() => openInvoiceModal(d.invoice)}
                        className="hover:underline hover:text-white transition-colors cursor-pointer text-left focus:outline-none flex items-center gap-1 group"
                        title="Klik untuk lihat rincian barang"
                      >
                        {d.invoice}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">{formatDate(d.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white uppercase">{d.customerName}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">{d.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                       <span className={`px-2.5 py-1 inline-flex items-center text-xs font-bold tracking-wider uppercase rounded-full border border-current/30 ${getStatusColor(d.status)}`}>
                          {getStatusIcon(d.status)}
                          {d.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button 
                        onClick={() => { setStatusModal({id: d.id, status: d.status}); setNewStatus(d.status); }} 
                        className="text-[#b4f56b] hover:text-[#a5e45a] transition-colors font-semibold uppercase tracking-wider text-xs bg-[#182352] px-3 py-1.5 rounded-lg border border-[#1d2a57]"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setStatusModal(null)}>
          <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 transition-transform" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[#1d2a57]/50 bg-[#090f26]/70">
              <h3 className="text-base font-extrabold text-white tracking-wider uppercase">Update Status</h3>
              <button onClick={() => setStatusModal(null)} className="text-slate-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleStatusSave} className="p-6 space-y-5">
              <div>
                 <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-3">Status Pengiriman</label>
                 <div className="mt-2 space-y-2">
                   {['Menunggu', 'Dikirim'].map((s) => (
                     <label key={s} className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${newStatus === s ? 'bg-[#b4f56b]/10 border-[#b4f56b]' : 'border-[#1d2a57] bg-[#182352] hover:bg-[#1c274c]'}`}>
                       <input 
                         type="radio" 
                         name="status" 
                         value={s} 
                         checked={newStatus === s} 
                         onChange={() => setNewStatus(s as any)} 
                         className="h-4 w-4 text-[#b4f56b] bg-transparent border-[#1d2a57] focus:ring-0 focus:ring-offset-0"
                       />
                       <span className={`ml-3 block text-sm font-bold uppercase tracking-wider ${newStatus === s ? 'text-[#b4f56b]' : 'text-slate-300'}`}>
                         {s}
                       </span>
                     </label>
                   ))}
                 </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setStatusModal(null)} className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold text-xs py-3 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer">Batal</button>
                <button type="submit" className="w-1/2 bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
