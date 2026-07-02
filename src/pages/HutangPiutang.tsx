import React, { useState } from 'react';
import { usePosStore } from '../store';
import { formatDate, formatRupiah, formatRibuan, unformatRibuan } from '../lib/utils';
import { X } from 'lucide-react';
import { CurrencyInput } from '../components/CurrencyInput';

export default function HutangPiutang() {
  const { user, sales, purchases, branches, paySale, payPurchase, openInvoiceModal } = usePosStore();
  const [activeTab, setActiveTab] = useState<'piutang' | 'hutang'>(user?.role === 'Cabang' ? 'hutang' : 'piutang');
  
  let visibleSales = sales;
  let visiblePurchases = purchases;
  
  if (user?.role === 'Cabang') {
    visibleSales = sales.filter(s => s.branchId === user?.branchId);
    visiblePurchases = purchases.filter(p => p.branchId === user?.branchId);
  } else {
    visiblePurchases = purchases.filter(p => (p.supplier || '').toLowerCase() !== 'kantor pusat' && !p.branchId);
  }

  const isCancelledStatus = (st?: string) => {
    const s = (st || '').toLowerCase();
    return s === 'dibatalkan' || s === 'batal' || s === 'ditolak';
  };

  const unpaidSales = visibleSales.filter(s => s.status !== 'Lunas' && !isCancelledStatus(s.status));
  const unpaidPurchases = visiblePurchases.filter(p => {
    if (p.status === 'Lunas' || isCancelledStatus(p.status)) return false;
    if (user?.role === 'Cabang' && p.deliveryStatus !== 'Selesai') return false;
    return true;
  });

  const piutangData = unpaidSales
    .filter(s => !(s.invoice || '').toUpperCase().startsWith('PO'))
    .map(s => {
      const relatedPurchase = purchases.find(p => p.id === s.paymentRef);
      return { 
        ...s, 
        dataType: 'sale',
        paymentStatus: relatedPurchase?.paymentStatus,
        pendingPayment: relatedPurchase?.pendingPayment,
        purchaseId: relatedPurchase?.id
      };
    });
  const hutangData = unpaidPurchases.map(p => ({ ...p, dataType: 'purchase' }));

  const getTerbayarNominal = (st: string, tagihan: number, cashGiven: number) => {
    if (st === 'Lunas' || st === 'LUNAS') return tagihan;
    if (st === 'Sebagian' || st === 'SEBAGIAN') return cashGiven || 0;
    return 0; // Belum Bayar / Menunggu / Diajukan -> Rp 0
  };

  const totalPiutang = piutangData.reduce((acc, item) => {
    const tagihan = item.dataType === 'sale' ? (item.grandTotal || item.total || 0) : (item.total || 0);
    const terbayar = getTerbayarNominal(item.status || '', tagihan, item.cashGiven || 0);
    return acc + Math.max(0, tagihan - terbayar);
  }, 0);

  const totalHutang = hutangData.reduce((acc, item) => {
    const tagihan = item.grandTotal || item.total || 0;
    const terbayar = getTerbayarNominal(item.status || '', tagihan, item.cashGiven || 0);
    return acc + Math.max(0, tagihan - terbayar);
  }, 0);

  const [paymentModalData, setPaymentModalData] = useState<{ id: string, ref: string, sisa: number, type: 'piutang'|'hutang' } | null>(null);
  const [confirmModalData, setConfirmModalData] = useState<{ id: string, invoice: string, pendingPayment: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');

  const handleOpenPayment = (id: string, ref: string, sisa: number, type: 'piutang'|'hutang') => {
    setPaymentModalData({ id, ref, sisa, type });
    setPaymentAmount(sisa);
    setPaymentMethod('Tunai');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalData || !paymentAmount) return;
    
    if (paymentAmount > paymentModalData.sisa) {
      alert('Jumlah bayar tidak boleh melebihi sisa tagihan.');
      return;
    }

    if (paymentModalData.type === 'piutang') {
      paySale(paymentModalData.id, Number(paymentAmount));
    } else {
      payPurchase(paymentModalData.id, Number(paymentAmount), user?.role === 'Cabang');
    }

    setPaymentModalData(null);
  };

  const getStatusClass = (status: string) => {
    if (status === 'Sebagian') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (status === 'Selesai') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
        <h2 className="text-2xl font-black text-white tracking-wider uppercase">{user?.role === 'Cabang' ? 'Laporan Hutang ke Pusat' : 'Laporan Hutang & Piutang'}</h2>
      </div>

      <div className={`grid grid-cols-1 ${user?.role === 'Cabang' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
        {user?.role !== 'Cabang' && (
          <div className="bg-[#0b1330] p-6 rounded-3xl border border-[#1d2a57] shadow-2xl flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-[#b4f56b]"></div>
             <h3 className="text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Total Hutang (dari Cabang)</h3>
             <p className="mt-2 text-3xl font-black text-white tracking-tight">{formatRupiah(totalPiutang)}</p>
          </div>
        )}
        <div className="bg-[#0b1330] p-6 rounded-3xl border border-[#1d2a57] shadow-2xl flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400"></div>
           <h3 className="text-xs font-bold tracking-widest text-red-400 uppercase">{user?.role === 'Cabang' ? 'Total Hutang (ke Pusat)' : 'Total Hutang (ke Supplier)'}</h3>
           <p className="mt-2 text-3xl font-black text-white tracking-tight">{formatRupiah(totalHutang)}</p>
        </div>
      </div>

      <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="border-b border-[#1d2a57]/40 bg-[#0c143a]">
          <nav className="-mb-px flex">
            {user?.role !== 'Cabang' && (
              <button 
                onClick={() => setActiveTab('piutang')} 
                className={`w-1/2 py-4 px-1 text-center border-b-2 font-bold text-sm tracking-wider uppercase transition-all duration-150 ${activeTab === 'piutang' ? 'border-[#b4f56b] text-[#b4f56b]' : 'border-transparent text-slate-400 hover:text-white hover:border-[#1d2a57]'}`}
              >
                Hutang (dari Cabang)
              </button>
            )}
            <button 
              onClick={() => setActiveTab('hutang')} 
              className={`${user?.role === 'Cabang' ? 'w-full' : 'w-1/2'} py-4 px-1 text-center border-b-2 font-bold text-sm tracking-wider uppercase transition-all duration-150 ${activeTab === 'hutang' ? 'border-[#b4f56b] text-[#b4f56b]' : 'border-transparent text-slate-400 hover:text-white hover:border-[#1d2a57]'}`}
            >
              {user?.role === 'Cabang' ? 'Hutang (ke Pusat)' : 'Hutang (ke Supplier)'}
            </button>
          </nav>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'piutang' ? (
            <table className="min-w-full divide-y divide-[#1d2a57]/30">
              <thead className="bg-[#090f26]/70">
                <tr>
                  <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Cabang / Customer</th>
                  <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">No. Invoice</th>
                  <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tanggal</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Total Tagihan</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Terbayar</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Sisa</th>
                  <th className="px-6 py-4.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Status</th>
                  <th className="px-6 py-4.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
                {piutangData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                      Tidak ada hutang cabang / piutang.
                    </td>
                  </tr>
                ) : (
                  piutangData.map(item => {
                    const customerName = item.customer;
                    const tagihan = item.grandTotal || item.total || 0;
                    const terbayar = getTerbayarNominal(item.status || '', tagihan, item.cashGiven || 0);
                    const sisa = Math.max(0, tagihan - terbayar);
                    return (
                      <tr key={item.id} className="hover:bg-[#131d42]/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white uppercase">{customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b4f56b] font-bold font-mono">
                          <button 
                            type="button" 
                            onClick={() => openInvoiceModal(item.invoice)}
                            className="hover:underline hover:text-white transition-colors cursor-pointer text-left focus:outline-none flex items-center gap-1 group"
                            title="Klik untuk lihat rincian barang"
                          >
                            {item.invoice}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-semibold">{formatDate(item.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold text-right font-mono">{formatRupiah(tagihan)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5df56b] font-bold text-right font-mono">{formatRupiah(terbayar)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-400 text-right font-mono">{formatRupiah(sisa)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full uppercase tracking-wider border ${getStatusClass(item.status)}`}>{item.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {item.paymentStatus === 'Menunggu Konfirmasi' ? (
                            <button 
                              onClick={() => setConfirmModalData({ id: item.purchaseId || '', invoice: item.invoice, pendingPayment: item.pendingPayment || 0 })} 
                              className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xxs py-1.5 px-3.5 rounded-xl tracking-wider uppercase transition-transform active:scale-95 duration-100"
                            >
                              Konfirmasi {item.pendingPayment ? `(${formatRupiah(item.pendingPayment)})` : ''}
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleOpenPayment(item.id, item.invoice, sisa, 'piutang')} 
                              className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xxs py-1.5 px-3.5 rounded-xl tracking-wider uppercase transition-transform active:scale-95 duration-100"
                            >
                              Bayar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-[#1d2a57]/30">
              <thead className="bg-[#090f26]/70">
                <tr>
                  {user?.role !== 'Cabang' && (
                    <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Supplier</th>
                  )}
                  <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">No. Invoice</th>
                  <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tanggal</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Total Tagihan</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Terbayar</th>
                  <th className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Sisa</th>
                  <th className="px-6 py-4.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Status</th>
                  <th className="px-6 py-4.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
                {hutangData.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'Cabang' ? 7 : 8} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                      Tidak ada hutang.
                    </td>
                  </tr>
                ) : (
                  hutangData.map(p => {
                    const tagihan = p.grandTotal || p.total || 0;
                    const terbayar = getTerbayarNominal(p.status || '', tagihan, p.cashGiven || 0);
                    const sisa = Math.max(0, tagihan - terbayar);
                    return (
                      <tr key={p.id} className="hover:bg-[#131d42]/30 transition-colors">
                        {user?.role !== 'Cabang' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white uppercase">{p.supplier || 'Unknown'}</td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b4f56b] font-bold font-mono">
                          <button 
                            type="button" 
                            onClick={() => openInvoiceModal(p.invoice)}
                            className="hover:underline hover:text-white transition-colors cursor-pointer text-left focus:outline-none flex items-center gap-1 group"
                            title="Klik untuk lihat rincian barang"
                          >
                            {p.invoice}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-semibold">{formatDate(p.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold text-right font-mono">{formatRupiah(p.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5df56b] font-bold text-right font-mono">{formatRupiah(terbayar)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-red-400 text-right font-mono">{formatRupiah(sisa)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full uppercase tracking-wider border ${getStatusClass(p.status)}`}>{p.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          {p.paymentStatus === 'Menunggu Konfirmasi' ? (
                            user?.role === 'Cabang' ? (
                              <span className="text-amber-500 font-bold text-[10px] uppercase tracking-wider">Menunggu Konfirmasi</span>
                            ) : (
                              <button 
                                onClick={() => setConfirmModalData({ id: p.id, invoice: p.invoice, pendingPayment: p.pendingPayment || 0 })} 
                                className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xxs py-1.5 px-3.5 rounded-xl tracking-wider uppercase transition-transform active:scale-95 duration-100"
                              >
                                Konfirmasi {p.pendingPayment ? `(${formatRupiah(p.pendingPayment)})` : ''}
                              </button>
                            )
                          ) : (
                            <button 
                              onClick={() => handleOpenPayment(p.id, p.invoice, sisa, 'hutang')} 
                              className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xxs py-1.5 px-3.5 rounded-xl tracking-wider uppercase transition-transform active:scale-95 duration-100"
                            >
                              Bayar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPaymentModalData(null)}>
          <div 
            className="bg-[#0b1330] w-full max-w-lg rounded-3xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-[#1d2a57] bg-[#090f26]">
              <h3 className="text-md font-extrabold tracking-wide uppercase text-white">Catat Pembayaran {paymentModalData.type === 'piutang' ? 'Hutang Cabang' : 'Hutang'}</h3>
              <button onClick={() => setPaymentModalData(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div>
                 <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">No. Referensi / Invoice</label>
                 <input type="text" readOnly value={paymentModalData.ref} className="bg-[#090f26] text-slate-400 border border-[#21306b]/50 rounded-xl px-3.5 py-2.5 w-full text-sm font-mono font-bold cursor-not-allowed uppercase" />
              </div>
              
              <div>
                 <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Sisa Tagihan</label>
                 <input type="text" readOnly value={formatRupiah(paymentModalData.sisa)} className="bg-[#090f26] text-red-500 border border-[#21306b]/50 rounded-xl px-3.5 py-2.5 w-full text-sm font-mono font-bold cursor-not-allowed" />
              </div>
              
              <div>
                 <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Metode Pembayaran</label>
                 <select 
                   value={paymentMethod} 
                   onChange={e => setPaymentMethod(e.target.value)} 
                   className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                 >
                   <option>Tunai</option>
                   <option>Transfer</option>
                 </select>
              </div>
              
              <div>
                 <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Jumlah Bayar</label>
                 <CurrencyInput 
                   value={paymentAmount} 
                   onChange={val => setPaymentAmount(val || '')} 
                   required 
                   className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-mono font-bold" 
                 />
              </div>

              <div className="pt-4 flex gap-3 flex-row-reverse">
                <button 
                  type="submit" 
                  className="w-full bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-xs py-3 px-6 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Simpan Pembayaran
                </button>
                <button 
                  type="button" 
                  onClick={() => setPaymentModalData(null)} 
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirmModalData(null)}>
          <div 
            className="bg-[#0b1330] w-full max-w-lg rounded-3xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-[#1d2a57] bg-[#090f26]">
              <h3 className="text-md font-extrabold tracking-wide uppercase text-white">Konfirmasi Pembayaran</h3>
              <button onClick={() => setConfirmModalData(null)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                 <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">No. Referensi / Invoice</label>
                 <input type="text" readOnly value={confirmModalData.invoice} className="bg-[#090f26] text-slate-400 border border-[#21306b]/50 rounded-xl px-3.5 py-2.5 w-full text-sm font-mono font-bold cursor-not-allowed uppercase" />
              </div>
              
              <div>
                 <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Nominal Pembayaran</label>
                 <input type="text" readOnly value={formatRupiah(confirmModalData.pendingPayment)} className="bg-[#090f26] text-emerald-400 border border-[#21306b]/50 rounded-xl px-3.5 py-2.5 w-full text-sm font-mono font-bold cursor-not-allowed" />
              </div>
              
              <div className="pt-4 flex gap-3 flex-row-reverse">
                <button 
                  onClick={() => {
                    payPurchase(confirmModalData.id, 0, false);
                    setConfirmModalData(null);
                  }}
                  className="w-full bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-xs py-3 px-6 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Selesai
                </button>
                <button 
                  onClick={() => setConfirmModalData(null)} 
                  className="w-full bg-[#131d42] hover:bg-[#1d2a57] text-white font-extrabold text-xs py-3 px-6 rounded-xl border border-[#21306b] transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
