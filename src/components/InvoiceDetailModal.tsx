import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../store';
import { formatRupiah, formatDate } from '../lib/utils';
import { FileText, X, Calendar, User, ShoppingBag, CreditCard, ArrowUpRight, Tag, Layers } from 'lucide-react';

export default function InvoiceDetailModal() {
  const navigate = useNavigate();
  const { selectedInvoiceModal, closeInvoiceModal, sales, purchases, deliveries, products } = usePosStore();

  const transaction = useMemo(() => {
    if (!selectedInvoiceModal) return null;
    const target = selectedInvoiceModal.trim();

    let s = sales.find(item => item.invoice === target || item.id === target);
    const p = purchases.find(item => item.invoice === target || item.id === target);
    const d = deliveries.find(item => item.invoice === target || item.id === target);

    if (!s && d) {
      s = sales.find(item => item.id === d.saleId || item.invoice === d.invoice);
    }

    if (s) {
      return {
        type: 'sale',
        id: s.id,
        invoice: s.invoice,
        date: s.date,
        counterpartyTitle: 'Pelanggan / Ditagihkan Kepada',
        counterpartyName: s.customer || '-',
        personTitle: 'Sales / Kasir',
        personName: s.salesName || '-',
        status: ((s.method === 'Tunai' || s.method === 'Transfer') && (s.status === 'Belum Bayar' || s.status === 'Diajukan' || !s.status)) ? 'Selesai' : (s.status || '-'),
        method: s.method || '-',
        items: s.items || [],
        subtotal: s.total || 0,
        discount: s.discount || 0,
        grandTotal: s.grandTotal || 0,
        notes: s.notes,
        cashGiven: s.cashGiven,
        cashReturn: s.cashReturn
      };
    } else if (p) {
      return {
        type: 'purchase',
        id: p.id,
        invoice: p.invoice,
        date: p.date,
        counterpartyTitle: 'Supplier / Pemohon',
        counterpartyName: p.supplier || '-',
        personTitle: 'Keterangan Order',
        personName: p.paymentStatus || p.deliveryStatus || 'PO Cabang',
        status: ((p.method === 'Tunai' || p.method === 'Transfer') && (p.status === 'Belum Bayar' || p.status === 'Diajukan' || !p.status)) ? 'Selesai' : (p.status === 'Belum Bayar' ? 'Diajukan' : (p.status || '-')),
        method: p.method || '-',
        items: p.items || [],
        subtotal: p.total || 0,
        discount: p.discount || 0,
        grandTotal: p.grandTotal !== undefined ? p.grandTotal : (p.total - (p.discount || 0)),
        notes: p.notes,
        cashGiven: p.cashGiven
      };
    } else if (d) {
      return {
        type: 'delivery',
        id: d.id,
        invoice: d.invoice,
        date: d.date,
        counterpartyTitle: 'Penerima Barang',
        counterpartyName: d.customerName || '-',
        personTitle: 'Kurir Pengirim',
        personName: d.courier || '-',
        status: d.status || '-',
        method: '-',
        items: [],
        subtotal: 0,
        discount: 0,
        grandTotal: 0,
        notes: d.notes || d.address
      };
    }
    return null;
  }, [selectedInvoiceModal, sales, purchases, deliveries]);

  if (!selectedInvoiceModal) return null;

  const getStatusBadge = (status?: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'lunas' || st === 'disetujui' || st === 'selesai') {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
    }
    if (st === 'sebagian' || st === 'dikirim') {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    }
    if (st === 'belum bayar' || st === 'diajukan' || st === 'menunggu') {
      return 'bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.2)]';
    }
    if (st === 'dibatalkan' || st === 'ditolak' || st === 'batal') {
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
    }
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  const handleGoToFullPage = () => {
    if (!transaction) return;
    if (transaction.type === 'sale' || transaction.type === 'purchase') {
      navigate(`/penjualan/${transaction.id}`);
      closeInvoiceModal();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={closeInvoiceModal}>
      <div 
        className="relative bg-[#0b122c] border border-[#1d2a57] rounded-3xl w-full max-w-3xl shadow-[0_20px_70px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden max-h-[90vh] animate-scaleUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#121c45] via-[#0e1738] to-[#0b122c] border-b border-[#1d2a57] p-6 flex justify-between items-center relative">
          <div className="absolute inset-0 bg-[#b4f56b]/5 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#b4f56b]/15 text-[#b4f56b] flex items-center justify-center shadow-inner border border-[#b4f56b]/30">
              <FileText size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#b4f56b]/10 text-[#b4f56b]">Detail Invoice</span>
              </div>
              <h3 className="text-2xl font-black text-white tracking-wider font-mono mt-0.5">{selectedInvoiceModal}</h3>
            </div>
          </div>
          <button 
            onClick={closeInvoiceModal}
            className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer relative z-10 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {!transaction ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
              <p className="text-base font-bold text-white">Data Detail Tidak Ditemukan</p>
              <p className="text-xs text-slate-500">Invoice <span className="font-mono text-slate-400">{selectedInvoiceModal}</span> tidak tersedia dalam memori aktif saat ini.</p>
            </div>
          ) : (
            <>
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#131d45]/60 border border-[#1d2a57] p-3.5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <User size={12} className="text-[#b4f56b]" /> {transaction.counterpartyTitle}
                  </span>
                  <span className="font-bold text-white text-sm truncate uppercase" title={transaction.counterpartyName}>{transaction.counterpartyName}</span>
                </div>

                <div className="bg-[#131d45]/60 border border-[#1d2a57] p-3.5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Calendar size={12} className="text-sky-400" /> Tanggal
                  </span>
                  <span className="font-bold font-mono text-white text-sm">{formatDate(transaction.date)}</span>
                </div>

                <div className="bg-[#131d45]/60 border border-[#1d2a57] p-3.5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Tag size={12} className="text-purple-400" /> {transaction.personTitle}
                  </span>
                  <span className="font-bold text-white text-sm truncate">{transaction.personName}</span>
                </div>

                <div className="bg-[#131d45]/60 border border-[#1d2a57] p-3.5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Layers size={12} className="text-amber-400" /> Status
                  </span>
                  <div>
                    <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusBadge(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black tracking-widest text-[#b4f56b] uppercase flex items-center gap-2">
                  <ShoppingBag size={14} /> Daftar Barang ({transaction.items.length})
                </h4>

                <div className="overflow-x-auto ring-1 ring-[#1d2a57] rounded-2xl bg-[#090f26]/50">
                  <table className="min-w-full divide-y divide-[#1d2a57]/50">
                    <thead className="bg-[#090f26]">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-xs font-bold tracking-widest text-slate-400 uppercase">Nama Barang</th>
                        <th className="py-3.5 px-3 text-right text-xs font-bold tracking-widest text-slate-400 uppercase">Harga</th>
                        <th className="py-3.5 px-3 text-center text-xs font-bold tracking-widest text-slate-400 uppercase w-16">Qty</th>
                        <th className="py-3.5 pl-3 pr-4 text-right text-xs font-bold tracking-widest text-slate-400 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1d2a57]/30 text-slate-200">
                      {transaction.items.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
                            Tidak ada rincian barang untuk transaksi ini.
                          </td>
                        </tr>
                      ) : (
                        transaction.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#182352]/30 transition-colors">
                            <td className="py-3.5 pl-4 pr-3 text-sm font-bold text-white uppercase">
                              <div>{item.name}</div>
                              {item.isWholesalePrice && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#b4f56b]/15 text-[#b4f56b] text-[9px] font-black tracking-widest rounded">
                                  HARGA GROSIR
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-sm text-slate-400 text-right font-mono font-medium">{formatRupiah(item.price)}</td>
                            <td className="py-3.5 px-3 text-sm text-slate-300 text-center font-mono font-bold bg-white/5 rounded">{item.qty}</td>
                            <td className="py-3.5 pl-3 pr-4 text-sm font-bold text-white text-right font-mono">{formatRupiah(item.subtotal)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial & Notes Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Notes & Method */}
                <div className="space-y-4">
                  <div className="bg-[#131d45]/40 border border-[#1d2a57] p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CreditCard size={16} className="text-[#b4f56b]" /> Metode Bayar
                    </span>
                    <span className="font-black text-white uppercase text-sm tracking-wide bg-[#1c285e] px-3 py-1 rounded-xl border border-white/10">{transaction.method}</span>
                  </div>

                  {transaction.notes && (
                    <div className="bg-[#131d45]/30 border border-[#1d2a57] p-4 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Catatan :</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{transaction.notes}</p>
                    </div>
                  )}
                </div>

                {/* Total Box */}
                <div className="bg-[#121b42] border border-[#1d2a57] p-5 rounded-2xl space-y-2.5 shadow-lg">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Subtotal</span>
                    <span className="font-bold text-slate-200 font-mono text-sm">{formatRupiah(transaction.subtotal)}</span>
                  </div>

                  {transaction.discount > 0 && (
                    <div className="flex justify-between items-center text-xs text-rose-400 font-semibold">
                      <span className="uppercase tracking-wider">Diskon</span>
                      <span className="font-mono text-sm">-{formatRupiah(transaction.discount)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#1d2a57] flex justify-between items-center">
                    <span className="text-sm font-black text-white uppercase tracking-wider">Total Akhir</span>
                    <span className="text-2xl font-black text-[#b4f56b] font-mono tracking-tight">{formatRupiah(transaction.grandTotal)}</span>
                  </div>

                  {transaction.cashGiven !== undefined && transaction.cashGiven > 0 && (
                    <div className="pt-3 border-t border-[#1d2a57]/60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Tunai Diterima</span>
                        <span className="font-mono font-bold">{formatRupiah(transaction.cashGiven)}</span>
                      </div>
                      <div className="flex justify-between text-[#b4f56b] font-semibold">
                        <span>Kembalian</span>
                        <span className="font-mono font-bold">{formatRupiah(transaction.cashReturn || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#090f26] border-t border-[#1d2a57] p-4 px-6 flex justify-between items-center">
          <button 
            type="button" 
            onClick={closeInvoiceModal}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-extrabold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            Tutup
          </button>

          {transaction && (transaction.type === 'sale' || transaction.type === 'purchase') && (
            <button 
              type="button"
              onClick={handleGoToFullPage}
              className="px-5 py-2.5 rounded-xl bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              Lihat Halaman Penuh & Cetak <ArrowUpRight size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
