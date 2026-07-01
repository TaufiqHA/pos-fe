import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../../store';
import { formatRupiah, formatRibuan, unformatRibuan } from '../../lib/utils';
import { Product, SaleItem } from '../../types';
import { Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { CurrencyInput } from '../../components/CurrencyInput';

export default function PermintaanPO() {
  const navigate = useNavigate();
  const { user, users, products, purchases, branches, addSale, cancelPurchase } = usePosStore();

  const isCustOrStore = user?.role === 'Cust' || user?.role === 'Outlet';
  
  const poQueueData = useMemo(() => {
    const pendingPOs = purchases.filter(p => {
      // Abaikan yang sudah pernah diproses oleh Admin
      if (p.isProcessed) return false;
      
      if (user?.role === 'Admin') {
        const creator = users?.find(u => u.id === p.userId);
        if (creator?.role === 'Outlet' || creator?.role === 'Cust') return false;
        return p.destinationAdminId === user.id || !p.destinationAdminId;
      } else if (user?.role === 'Cabang') {
        const creator = users?.find(u => u.id === p.userId);
        if (creator?.role === 'Outlet' || creator?.role === 'Cust') {
           return p.branchId === user.branchId;
        }
        return false;
      }
      
      return false;
    });
    
    return pendingPOs.map(p => {
      let customerName = p.supplier;
      const creator = users?.find(u => u.id === p.userId);
      if (creator?.role === 'Outlet' || creator?.role === 'Cust') {
        customerName = creator.outletName || creator.name;
      } else {
        const branchName = branches.find(b => b.id === p.branchId)?.name;
        if (branchName) customerName = branchName;
      }

      return {
        id: p.id,
        customer: customerName,
        notes: p.notes || 'Permintaan PO via Sistem',
        items: p.items || []
      };
    });
  }, [purchases, branches, user, users]);

  const [poQueue, setPoQueue] = useState<any[]>([]);
  const [activePO, setActivePO] = useState<any>(null);

  const [customer, setCustomer] = useState(activePO?.customer || (isCustOrStore ? (user.outletName || user.name) : ''));
  const [method, setMethod] = useState<'Tunai'|'Transfer'|'Kredit'>('Transfer');
  const [notes, setNotes] = useState(activePO?.notes || '');
  const [discount, setDiscount] = useState(0);
  const [cashGiven, setCashGiven] = useState(0);

  const [cart, setCart] = useState<SaleItem[]>(activePO?.items || []);
  const [searchProduct, setSearchProduct] = useState('');
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setPoQueue(poQueueData);
    if (poQueueData.length > 0 && (!activePO || !poQueueData.find(po => po.id === activePO?.id))) {
      setActivePO(poQueueData[0]);
    } else if (poQueueData.length === 0) {
      setActivePO(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poQueueData]);

  useEffect(() => {
    if (activePO) {
      setCustomer(activePO.customer);
      setNotes(activePO.notes);
      setCart(activePO.items);
    } else {
      setCustomer('');
      setNotes('');
      setCart([]);
    }
  }, [activePO]);

  // Computations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.subtotal, 0), [cart]);
  const grandTotal = Math.max(0, subtotal - discount);
  const kembalian = cashGiven - grandTotal;

  const validProducts = products.filter(p => p.stock > 0);
  const searchResults = searchProduct.length > 0 
    ? validProducts.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()) || p.sku.toLowerCase().includes(searchProduct.toLowerCase())).slice(0, 5)
    : [];

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.productId === product.id);
      if (exists) {
        if (exists.qty + 1 > product.stock) {
           alert('Stok tidak mencukupi!');
           return prev;
        }
        return prev.map(item => item.productId === product.id 
          ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price } 
          : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, qty: 1, price: product.sellPrice, subtotal: product.sellPrice }];
    });
    setSearchProduct('');
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || newQty < 1) return;
    
    if (newQty > product.stock) {
      alert(`Stok hanya tersedia ${product.stock} ${product.unit}`);
      return;
    }

    setCart(prev => prev.map(item => item.productId === productId 
      ? { ...item, qty: newQty, subtotal: newQty * item.price } 
      : item
    ));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCancelPO = async () => {
    if (!activePO) return;
    
    // Beritahu database untuk membatalkan PO secara permanen
    try {
      await cancelPurchase(activePO.id);
    } catch (err: any) {
      alert("Gagal membatalkan PO: " + (err.response?.data?.message || err.message));
      return;
    }
    
    // 1. Buang PO yang sedang aktif dari antrean
    const updatedQueue = poQueue.filter(po => po.id !== activePO.id);
    setPoQueue(updatedQueue);

    // 2. Tutup Modal Konfirmasi
    setIsConfirmCancelOpen(false);

    // 3. Atur sisa antrean
    if (updatedQueue.length > 0) {
      setActivePO(updatedQueue[0]);
    } else {
      alert('Semua antrean PO telah selesai diproses/dibatalkan.');
      navigate('/penjualan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Silahkan tambahkan minimal 1 produk.');
      return;
    }
    for (const item of cart) {
      const prod = products.find(p => p.id === item.productId);
      if (prod && item.qty > prod.stock) {
        alert(`Peringatan: Stok produk "${item.name}" tidak cukup! (Tersedia: ${prod.stock} ${prod.unit})`);
        return;
      }
    }
    if (!customer) {
      alert(user?.role === 'Cabang' ? 'Nama outlet wajib diisi.' : 'Nama cabang wajib diisi.');
      return;
    }

    let status: 'Lunas' | 'Belum Bayar' | 'Sebagian' = 'Belum Bayar';
    if (method === 'Tunai') {
      if (cashGiven < grandTotal) {
        alert('Jumlah bayar kurang dari total tagihan!');
        return;
      }
      status = 'Lunas';
    }

    setIsSubmitting(true);
    try {
      await addSale({
        date: new Date().toISOString(),
        customer,
        salesName: user?.name || 'Unknown',
        total: subtotal,
        discount,
        grandTotal,
        method,
        status,
        items: cart,
        notes,
        cashGiven: method === 'Tunai' ? cashGiven : undefined,
        cashReturn: method === 'Tunai' ? Math.max(0, kembalian) : undefined,
        paymentRef: activePO.id
      });

      // Alihkan tab aplikasi yang sedang aktif menuju layar Pengiriman
      navigate('/pengiriman');
    } catch(err: any) {
      alert("Gagal memproses transaksi: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">
            {user?.role === 'Cabang' ? 'Permintaan PO Dari Outlet' : 'Permintaan PO Cabang'}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#0e1531] border border-[#1d2a57] rounded-3xl p-4 h-[80vh] overflow-y-auto hidden-scrollbar">
          <h3 className="text-sm font-extrabold text-[#b4f56b] tracking-wider uppercase mb-4 sticky top-0 bg-[#0e1531] py-2 z-10">Antrean Permintaan</h3>
          <div className="space-y-3">
            {poQueue.map(po => (
              <div 
                key={po.id} 
                onClick={() => setActivePO(po)}
                className={`p-4 rounded-xl cursor-pointer border transition-colors ${activePO.id === po.id ? 'bg-[#b4f56b]/10 border-[#b4f56b]' : 'bg-[#182352] border-[#1d2a57] hover:bg-[#1d2a57]'}`}
              >
                <p className="font-bold text-white text-sm uppercase">{po.customer}</p>
                <p className="text-xs text-slate-400 truncate mt-1">{po.notes}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl p-6 relative">
          {!activePO ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
              <p className="text-lg font-bold uppercase tracking-wider">Tidak ada antrean PO</p>
            </div>
          ) : (
            <>
              <div className="absolute top-0 right-0 bg-[#b4f56b] text-black font-bold text-[10px] px-3 py-1 rounded-bl-xl tracking-widest uppercase">
                Data Terisi Otomatis
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">
                {user?.role === 'Cabang' ? 'Outlet Pemohon' : 'Cabang Pemohon'}
              </label>
              <input type="text" required disabled={isCustOrStore} value={customer} onChange={e => setCustomer(e.target.value)} placeholder={user?.role === 'Cabang' ? 'Nama Outlet...' : 'Nama Cabang...'} className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-400 disabled:bg-[#0c143a] disabled:text-slate-500 disabled:cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Tanggal Permintaan</label>
              <input type="text" disabled value={new Date().toLocaleDateString('id-ID')} className="bg-[#182352] text-slate-400 border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none text-sm font-semibold cursor-not-allowed" />
            </div>
          </div>

          <div className="border-t border-[#1d2a57] pt-6">
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#b4f56b]" />
              Daftar Pesanan PO
            </h3>
            
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Tambahkan Produk Lainnya..." 
                value={searchProduct}
                onChange={e => setSearchProduct(e.target.value)}
                className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-400" 
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-[#182352] border border-[#1d2a57] shadow-lg max-h-60 rounded-xl py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                  {searchResults.map(product => (
                    <li key={product.id} onClick={() => handleAddToCart(product)} className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[#1d2a57]/50 border-b border-[#1d2a57]/30 last:border-0 text-white">
                      <div className="flex items-center justify-between">
                         <div>
                            <span className="block font-bold truncate uppercase">{product.name}</span>
                            <span className="block text-[11px] text-slate-400 font-mono tracking-wider truncate">{product.sku} | Stok: <span className="text-[#b4f56b]">{product.stock} {product.unit}</span></span>
                         </div>
                         <span className="block font-bold text-[#b4f56b] font-mono">{formatRupiah(product.sellPrice)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="overflow-x-auto ring-1 ring-[#1d2a57] rounded-xl">
              <table className="min-w-full divide-y divide-[#1d2a57]/30">
                <thead className="bg-[#090f26]/70">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase sm:pl-6">Produk</th>
                    <th className="px-3 py-3.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Harga</th>
                    <th className="px-3 py-3.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Qty Diminta</th>
                    <th className="px-3 py-3.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Subtotal</th>
                    <th className="py-3.5 pl-3 pr-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase sm:pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1d2a57]/30 bg-transparent text-slate-200">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">Belum ada barang di pesanan ini.</td>
                    </tr>
                  ) : (
                    cart.map(item => (
                      <tr key={item.productId} className="hover:bg-[#182352]/30 transition-colors">
                        <td className="py-4 pl-4 pr-3 text-sm font-bold uppercase text-white sm:pl-6">{item.name}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-right font-mono">{formatRupiah(item.price)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-center">
                          <input type="number" min="1" value={item.qty} onChange={(e) => handleUpdateQty(item.productId, parseInt(e.target.value))} className="w-16 bg-[#182352] text-white border border-[#1d2a57] rounded-lg px-2 py-1 text-center font-mono focus:outline-none focus:ring-1 focus:ring-[#b4f56b]" />
                          {(() => {
                            const prod = products.find(p => p.id === item.productId);
                            if (prod && item.qty > prod.stock) {
                              return <span className="block mt-1 text-[10px] font-black text-rose-400 animate-pulse">⚠️ Stok Tidak Cukup (Sisa: {prod.stock})</span>;
                            }
                            return null;
                          })()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-white text-right font-mono">{formatRupiah(item.subtotal)}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6">
                           <button type="button" onClick={() => handleRemoveFromCart(item.productId)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-5 h-5 inline"/></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-[#1d2a57] pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Metode Pembayaran</label>
                <div className="mt-2 grid grid-cols-2 lg:grid-cols-3 gap-3">
                   {['Tunai', 'Transfer', 'Kredit']
                     .filter((m) => !isCustOrStore || m !== 'Tunai')
                     .map((m) => (
                     <div key={m} onClick={() => !isCustOrStore && setMethod(m as any)} className={`cursor-pointer border rounded-xl py-2 px-3 flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors ${method === m ? 'bg-[#b4f56b]/10 border-[#b4f56b] text-[#b4f56b]' : 'border-[#1d2a57] text-slate-400 hover:bg-[#182352]'} ${isCustOrStore ? 'pointer-events-none' : ''}`}>
                       {m}
                     </div>
                   ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Catatan PO</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-400"></textarea>
              </div>
            </div>

            <div className="bg-[#182352] border border-[#1d2a57] p-5 rounded-2xl space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400 font-bold uppercase tracking-wide text-xs">Subtotal</span>
                 <span className="font-bold text-white font-mono">{formatRupiah(subtotal)}</span>
               </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-wide text-xs">Diskon (Rp)</span>
                  <CurrencyInput disabled={isCustOrStore} value={discount} onChange={val => setDiscount(val)} className="w-32 bg-[#090f26] text-white border border-[#1d2a57] rounded-lg px-2 py-1.5 text-right font-mono focus:outline-none focus:ring-1 focus:ring-[#b4f56b] disabled:bg-[#0c143a] disabled:text-slate-500 disabled:cursor-not-allowed" placeholder="0" />
                </div>
               <div className="pt-4 border-t border-[#1d2a57] flex justify-between items-center">
                 <span className="text-sm font-extrabold text-white uppercase tracking-wider mb-4">Total Akhir</span>
                 <span className="text-2xl font-black text-[#b4f56b] font-mono">{formatRupiah(grandTotal)}</span>
               </div>

               {method === 'Tunai' && (
                 <>
                    <div className="pt-4 flex justify-between items-center text-sm border-t border-[#1d2a57]">
                      <span className="text-slate-300 font-bold uppercase tracking-wide text-xs">Uang Diterima</span>
                      <CurrencyInput value={cashGiven} onChange={val => setCashGiven(val)} className="w-32 bg-[#090f26] text-white border border-[#b4f56b] rounded-lg px-2 py-1.5 text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#b4f56b]" placeholder="Rp" />
                    </div>
                   {cashGiven > 0 && (
                     <div className="flex justify-between items-center text-sm pt-2">
                       <span className="text-slate-400 font-bold uppercase tracking-wide text-xs">Kembalian</span>
                       <span className={`font-bold font-mono text-sm tracking-wider ${kembalian < 0 ? 'text-red-400' : 'text-[#b4f56b]'}`}>
                         {kembalian < 0 ? 'TIDAK CUKUP' : formatRupiah(kembalian)}
                       </span>
                     </div>
                   )}
                 </>
               )}
            </div>
          </div>

          <div className="pt-6 border-t border-[#1d2a57] flex gap-4">
             <button type="button" disabled={isSubmitting} onClick={() => setIsConfirmCancelOpen(true)} className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm py-4 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer">
               Batal
             </button>
             <button type="submit" disabled={isSubmitting} className="w-1/2 bg-[#b4f56b] hover:bg-[#a5e45a] disabled:opacity-70 disabled:cursor-not-allowed text-black font-extrabold text-sm py-4 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer flex flex-row items-center justify-center gap-2.5">
               {isSubmitting ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                   <span>Memproses...</span>
                 </>
               ) : (
                 <span>Proses & Simpan Transaksi</span>
               )}
             </button>
          </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Modal Khusus Konfirmasi Batal PO */}
      {isConfirmCancelOpen && activePO && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setIsConfirmCancelOpen(false)}>
          <div className="bg-[#0e1531] w-full max-w-sm rounded-3xl border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)] overflow-hidden text-center p-8 animate-scaleUp" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-500/20">
              <Trash2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white mb-3 uppercase tracking-widest">Batalkan PO?</h3>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              Apakah Anda yakin ingin menolak dan membatalkan permintaan PO dari <strong className="text-rose-400 uppercase">{activePO.customer}</strong>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsConfirmCancelOpen(false)}
                className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold py-3 px-4 rounded-xl transition-all hover:scale-95 uppercase text-[11px] tracking-widest"
              >
                Kembali
              </button>
              <button
                onClick={handleCancelPO}
                className="w-1/2 bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all hover:scale-95 uppercase text-[11px] tracking-widest"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
