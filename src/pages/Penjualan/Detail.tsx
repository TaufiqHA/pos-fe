import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePosStore } from '../../store';
import { formatRupiah, formatDate } from '../../lib/utils';
import { FileText, ArrowLeft, Printer, Trash2 } from 'lucide-react';

export default function PenjualanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sales, purchases, products, user, deleteSale, fetchAllData } = usePosStore();
  
  React.useEffect(() => {
    if (!sales.find(s => s.id === id) && !purchases.find(p => p.id === id)) {
      fetchAllData();
    }
  }, [id, sales, purchases, fetchAllData]);

  let sale = sales.find(s => s.id === id);
  const purchase = purchases.find(p => p.id === id);

  if (!sale && purchase && (user?.role === 'Cust' || user?.role === 'Outlet')) {
    // Jika ini adalah PO yang dibuat Outlet, kita tampilkan dalam format yang mirip dengan Sale
    sale = {
      id: purchase.id,
      invoice: purchase.invoice,
      date: purchase.date,
      customer: purchase.supplier,
      salesName: 'Anda (Outlet/Cust)',
      total: purchase.total,
      discount: 0,
      grandTotal: purchase.total,
      method: purchase.method as any,
      status: (purchase.status === 'Belum Bayar' ? 'Diajukan' : purchase.status) as any,
      items: purchase.items as any[],
      notes: purchase.notes,
    } as any;
  }

  if (!sale) {
    if (sales.length === 0 && purchases.length === 0) {
      return (
        <div className="text-center py-20">
           <h2 className="text-xl font-medium text-gray-900">Memuat data transaksi...</h2>
        </div>
      );
    }
    return (
      <div className="text-center py-20">
         <h2 className="text-xl font-medium text-gray-900">Transaksi tidak ditemukan</h2>
         <button onClick={() => navigate('/penjualan')} className="mt-4 text-blue-600 hover:underline">Kembali ke Daftar Penjualan</button>
      </div>
    );
  }

  const canDelete = user?.role === 'Admin' || user?.role === 'Cabang';

  const handleDelete = async () => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus penjualan ${sale?.invoice}?`)) {
      try {
        if (sale?.id) {
          await deleteSale(sale.id);
          navigate('/penjualan');
        }
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus penjualan');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Non-printable header actions */}
      <div className="print:hidden flex justify-between items-center mb-6">
        <button onClick={() => navigate('/penjualan')} className="inline-flex items-center text-sm font-extrabold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali
        </button>
        <div className="flex items-center gap-3">
          {canDelete && (
            <button onClick={handleDelete} className="inline-flex items-center px-4 py-2 border border-rose-500/30 text-sm font-extrabold rounded-xl shadow-lg text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 focus:outline-none transition-transform active:scale-95 uppercase tracking-wider cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Hapus Transaksi
            </button>
          )}
          {sale.status !== 'Lunas' && (
             <button className="inline-flex items-center px-4 py-2 border border-[#1d2a57] text-sm font-extrabold rounded-xl shadow-lg text-white bg-[#1c274c] hover:bg-[#1a233f] focus:outline-none transition-transform active:scale-95 uppercase tracking-wider">
               Catat Pembayaran
             </button>
          )}
          <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-extrabold rounded-xl shadow-lg text-black bg-[#b4f56b] hover:bg-[#a5e45a] focus:outline-none transition-transform active:scale-95 uppercase tracking-wider">
            <Printer className="h-4 w-4 mr-2" /> Cetak Struk
          </button>
        </div>
      </div>

      {/* Invoice Document (Printable area) */}
      <div className="bg-[#0e1531] border border-[#1d2a57] shadow-2xl rounded-3xl p-8 custom-print-area print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="flex justify-between items-start border-b border-[#1d2a57] pb-6 mb-6 print:border-gray-300">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-8 h-8 text-[#b4f56b] print:text-black" />
              <h1 className="text-4xl font-black text-white uppercase tracking-widest print:text-black">INVOICE</h1>
            </div>
            <p className="text-slate-400 font-mono tracking-wider print:text-gray-600">{sale.invoice}</p>
          </div>
          <div className="text-right">
             <span className={`px-4 py-1.5 inline-flex text-xs leading-5 font-bold uppercase tracking-widest rounded-full ${getStatusClass(sale.status)} border border-current/30`}>
                {sale.status || (sale.method === 'Kredit' ? 'Belum Bayar' : 'Lunas')}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 print:text-black">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1 print:text-gray-500">Diterbitkan oleh:</p>
            <p className="font-extrabold text-xl text-white uppercase tracking-wider print:text-black">LUCIFER POS V2</p>
            <p className="text-sm font-semibold text-slate-400 mt-2 uppercase tracking-wide print:text-gray-600">Admin / Sales: <span className="text-white print:text-black">{sale.salesName}</span></p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1 print:text-gray-500">Ditagihkan kepada:</p>
            <p className="font-bold text-lg text-white uppercase tracking-wide print:text-black">{sale.customer}</p>
            <p className="text-sm font-semibold text-slate-400 mt-2 font-mono print:text-gray-600">{formatDate(sale.date)}</p>
          </div>
        </div>

        <table className="min-w-full divide-y divide-[#1d2a57] mb-8 border-b border-[#1d2a57] print:divide-gray-300 print:border-gray-300 print:text-black">
          <thead>
            <tr>
              <th className="py-3 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase print:text-gray-500">Deskripsi</th>
              <th className="py-3 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase w-24 print:text-gray-500">Harga</th>
              <th className="py-3 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase w-16 print:text-gray-500">Qty</th>
              <th className="py-3 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase w-32 print:text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1d2a57]/50 print:divide-gray-200 text-slate-200 print:text-black">
            {sale.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-4 text-sm font-bold uppercase print:text-gray-900">
                  <div>{item.name}</div>
                  {item.isWholesalePrice && (() => {
                    const product = products.find(p => p.id === item.productId);
                    const wp = product?.wholesalePrices?.find(w => w.price === item.price);
                    
                    return (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#b4f56b]/20 text-[#b4f56b] text-[9px] font-extrabold tracking-widest rounded-md print:bg-gray-200 print:text-gray-700">
                        {wp ? `HARGA GROSIR (MIN. ${wp.qty} PCS)` : 'HARGA GROSIR'}
                      </span>
                    );
                  })()}
                </td>
                <td className="py-4 text-sm text-slate-400 text-right font-mono print:text-gray-600">{formatRupiah(item.price)}</td>
                <td className="py-4 text-sm text-slate-400 text-center font-mono print:text-gray-600">{item.qty}</td>
                <td className="py-4 text-sm font-bold text-white text-right font-mono print:text-black">{formatRupiah(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end print:text-black">
          <div className="w-72 space-y-3">
             <div className="flex justify-between text-sm">
               <span className="text-slate-400 font-bold uppercase tracking-wide print:text-gray-600">Subtotal</span>
               <span className="font-bold text-white font-mono print:text-gray-900">{formatRupiah(sale.total)}</span>
             </div>
             {sale.discount > 0 && (
               <div className="flex justify-between text-sm text-red-400 font-semibold print:text-red-600">
                 <span className="uppercase tracking-wide">Diskon</span>
                 <span className="font-mono">-{formatRupiah(sale.discount)}</span>
               </div>
             )}
             <div className="flex justify-between pt-4 border-t border-[#1d2a57] print:border-gray-300 mt-2 mb-4">
               <span className="font-extrabold text-white text-lg uppercase tracking-wide print:text-gray-900">Total Akhir</span>
               <span className="font-black text-[#b4f56b] text-xl font-mono print:text-black">{formatRupiah(sale.grandTotal)}</span>
             </div>
             
             <div className="flex justify-between text-sm pt-3 bg-[#182352] px-3 py-2 rounded-xl border border-[#1d2a57] print:bg-gray-50 print:border-none print:py-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wide print:text-gray-500">Metode Bayar</span>
                <span className="font-bold text-white uppercase tracking-wide print:text-gray-900">{sale.method}</span>
             </div>

             {sale.cashGiven !== undefined && (
               <>
                 <div className="flex justify-between text-sm px-3 pt-3">
                   <span className="text-slate-400 font-semibold uppercase tracking-wide print:text-gray-500">Tunai Diterima</span>
                   <span className="text-white font-bold font-mono print:text-gray-900">{formatRupiah(sale.cashGiven)}</span>
                 </div>
                 <div className="flex justify-between text-sm px-3 pb-2">
                   <span className="text-slate-400 font-semibold uppercase tracking-wide print:text-gray-500">Kembalian</span>
                   <span className="text-white font-bold font-mono print:text-gray-900">{formatRupiah(sale.cashReturn || 0)}</span>
                 </div>
               </>
             )}
          </div>
        </div>

        {sale.notes && (
          <div className="mt-8 pt-6 border-t border-[#1d2a57] print:border-gray-200 print:text-black">
            <h4 className="text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-2 print:text-gray-900">Catatan :</h4>
            <p className="text-sm font-semibold text-slate-300 print:text-gray-600">{sale.notes}</p>
          </div>
        )}
        
        <div className="mt-12 pt-6 text-center text-xs font-bold text-slate-500 uppercase tracking-widest print:text-gray-500">
          Terima kasih telah berbelanja di Lucifer POS!
        </div>
      </div>
      
      {/* Hide surrounding UI when printing. We'll add this to index.css instead */}
    </div>
  );
}
