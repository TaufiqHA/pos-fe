import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../../store';
import { formatRupiah, formatRibuan, unformatRibuan } from '../../lib/utils';
import { Product, PurchaseItem } from '../../types';
import { Trash2, Plus, AlertCircle, ShoppingBag } from 'lucide-react';
import { CurrencyInput } from '../../components/CurrencyInput';

export default function PembelianCreate() {
  const navigate = useNavigate();
  const { user, users, suppliers, products, addPurchase } = usePosStore();

  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [method, setMethod] = useState<'Tunai' | 'Transfer' | 'Kredit'>('Tunai');
  const [discount, setDiscount] = useState(0);
  const [cashGiven, setCashGiven] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.subtotal, 0), [cart]);
  const grandTotal = subtotal - discount;
  const kembalian = cashGiven - grandTotal;

  const searchResults = searchProduct.length > 0
    ? products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()) || p.sku.toLowerCase().includes(searchProduct.toLowerCase())).slice(0, 5)
    : [];

  const getActiveBasePrice = (product: Product) => {
    if (user?.role === 'Cabang' || user?.role === 'Outlet') {
      return (product.branchPrices && user?.branchId && product.branchPrices[user.branchId])
        ? product.branchPrices[user.branchId]
        : product.sellPrice;
    }
    return product.buyPrice;
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(item => item.productId === product.id);
      if (exists) {
        return prev.map(item => item.productId === product.id
          ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price }
          : item
        );
      }
      const basePrice = getActiveBasePrice(product);
      return [...prev, {
        productId: product.id,
        name: product.name,
        qty: 1,
        price: basePrice,
        subtotal: basePrice,
        isWholesalePrice: false,
        wholesalePrices: product.wholesalePrices
      }];
    });
    setSearchProduct('');
  };

  const handleChangePriceOption = (productId: string, newPrice: number, isWholesalePrice: boolean) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (!existing) return prev;
      const product = products.find(p => p.id === productId);
      if (!product) return prev;

      let newQty = existing.qty;

      // Pastikan kuantitas minimum terpenuhi jika beralih ke harga grosir
      if (isWholesalePrice && product.wholesalePrices) {
        const wp = product.wholesalePrices.find(w => w.price === newPrice);
        if (wp && newQty < wp.qty) {
          newQty = wp.qty;
        }
      }

      return prev.map(item => item.productId === productId
        ? { ...item, qty: newQty, price: newPrice, subtotal: newQty * newPrice, isWholesalePrice: isWholesalePrice }
        : item
      );
    });
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    if (newQty < 1) return;

    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item;

      let finalPrice = item.price;
      let finalIsWholesale = item.isWholesalePrice;

      if (item.wholesalePrices && item.wholesalePrices.length > 0) {
        const sortedWholesale = [...item.wholesalePrices].sort((a, b) => b.qty - a.qty);
        const eligibleWholesale = sortedWholesale.find(w => newQty >= w.qty);

        if (eligibleWholesale) {
          finalPrice = eligibleWholesale.price;
          finalIsWholesale = true;
        } else {
          const product = products.find(p => p.id === productId);
          finalPrice = product ? getActiveBasePrice(product) : item.price;
          finalIsWholesale = false;
        }
      }

      return {
        ...item,
        qty: newQty,
        price: finalPrice,
        subtotal: newQty * finalPrice,
        isWholesalePrice: finalIsWholesale
      };
    }));
  };

  const handleUpdatePrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setCart(prev => prev.map(item => item.productId === productId
      ? { ...item, price: newPrice, subtotal: item.qty * newPrice }
      : item
    ));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Silahkan tambahkan minimal 1 produk.');
      return;
    }
    const isCabangOrOutlet = user?.role === 'Cabang' || user?.role === 'Outlet';
    if (isCabangOrOutlet) {
      for (const item of cart) {
        const prod = products.find(p => p.id === item.productId);
        const avail = prod ? (prod.centralStock ?? prod.stock) : 999999;
        if (item.qty > avail) {
          alert(`Peringatan: Stok produk "${item.name}" di admin pusat tidak cukup! (Tersedia: ${avail})`);
          return;
        }
      }
    }
    if (!isCabangOrOutlet && !supplierId) {
      alert('Supplier wajib dipilih.');
      return;
    }

    let supplierName = 'Unknown';
    if (isCabangOrOutlet) {
      supplierName = 'Kantor Pusat';
    } else {
      const supplier = suppliers.find(s => s.id === supplierId);
      supplierName = supplier?.name || 'Unknown';
    }

    let status: any = isCabangOrOutlet ? 'Diajukan' : 'Belum Bayar';
    if (!isCabangOrOutlet) {
      if (method === 'Tunai' || method === 'Transfer') {
        status = 'Lunas';
      } else {
        status = 'Belum Bayar';
      }
    }

    let destinationAdminId = undefined;
    if (isCabangOrOutlet) {
      // 1. Coba gunakan atasan langsung (hierarki)
      destinationAdminId = user?.parentId;

      // 2. Jika kosong (data lama), coba cari Admin yang ditugaskan di cabang yang sama
      if (!destinationAdminId) {
        const fallbackAdmin = users.find(u => u.role === 'Admin' && u.branchId === user?.branchId);
        destinationAdminId = fallbackAdmin?.id;
      }
    }

    try {
      setIsSubmitting(true);
      await addPurchase({
        date: new Date().toISOString(),
        supplier: supplierName,
        destinationAdminId: destinationAdminId,
        total: subtotal,
        discount,
        grandTotal,
        method,
        status,
        items: cart,
        notes,
        cashGiven: status === 'Lunas' ? (cashGiven > 0 ? cashGiven : grandTotal) : 0,
      });

      navigate('/pembelian');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan transaksi pembelian');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">CATAT PEMBELIAN BARU</h2>
        </div>
      </div>

      <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Tujuan PO</label>
              {(user?.role === 'Cabang' || user?.role === 'Outlet') ? (
                <input
                  type="text"
                  disabled
                  value="Kantor Pusat"
                  className="bg-[#182352] text-slate-400 border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none text-sm font-semibold cursor-not-allowed"
                />
              ) : (
                <select required value={supplierId} onChange={e => setSupplierId(e.target.value)} className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer">
                  <option value="" disabled>-- Pilih Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Tanggal</label>
              <input type="text" disabled value={new Date().toLocaleDateString('id-ID')} className="bg-[#182352] text-slate-400 border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none text-sm font-semibold cursor-not-allowed" />
            </div>
          </div>

          <div className="border-t border-[#1d2a57] pt-6">
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase mb-4">Pilih Produk</h3>
            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Cari Produk (Ketik minimal 1 huruf untuk mencari...)"
                value={searchProduct}
                onChange={e => setSearchProduct(e.target.value)}
                className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-400"
              />
              {searchResults.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-[#182352] border border-[#1d2a57] shadow-lg max-h-60 rounded-xl py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                  {searchResults.map(product => (
                    <li key={product.id} onClick={() => handleAddToCart(product)} className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-[#1d2a57]/50 border-b border-[#1d2a57]/30 last:border-0 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <div className="w-10 h-10 shrink-0 rounded overflow-hidden border border-[#1d2a57] bg-[#090f26]">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 shrink-0 rounded bg-[#131d42] border border-[#1d2a57] flex items-center justify-center text-slate-500 text-[8px] font-bold">No Img</div>
                          )}
                          <div>
                            <span className="block font-bold truncate uppercase">{product.name}</span>
                            <span className="block text-[11px] text-[#b4f56b] tracking-wider truncate font-mono">{product.sku}</span>
                            {user?.role !== 'Admin' && product.isWholesale && product.wholesalePrices && product.wholesalePrices.length > 0 && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#b4f56b]/20 text-[#b4f56b] text-[9px] font-extrabold tracking-widest rounded-md uppercase">Tersedia Harga Grosir</span>
                            )}
                          </div>
                        </div>
                        <span className="block font-bold text-[#b4f56b] font-mono text-right">
                          {user?.role === 'Cabang' || user?.role === 'Outlet' ? `Pusat: ${formatRupiah(getActiveBasePrice(product))}` : `Terakhir: ${formatRupiah(product.buyPrice)}`}
                          {(user?.role === 'Cabang' || user?.role === 'Outlet') && (
                            <span className={`block text-[10px] font-bold mt-0.5 ${((product.centralStock ?? product.stock) <= 0) ? 'text-rose-400' : 'text-slate-400'}`}>
                              Stok Pusat: {product.centralStock ?? product.stock} {((product.centralStock ?? product.stock) <= 0) ? '(Habis)' : ''}
                            </span>
                          )}
                        </span>
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
                    <th className="px-3 py-3.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Harga Beli</th>
                    <th className="px-3 py-3.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Qty</th>
                    <th className="px-3 py-3.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Subtotal</th>
                    <th className="py-3.5 pl-3 pr-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase sm:pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1d2a57]/30 bg-transparent text-slate-200">
                  {cart.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">Daftar produk masih kosong.</td></tr>
                  ) : (
                    cart.map(item => (
                      <tr key={item.productId} className="hover:bg-[#182352]/30 transition-colors">
                        <td className="py-4 pl-4 pr-3 text-sm font-bold text-white uppercase sm:pl-6">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const prod = products.find(p => p.id === item.productId);
                              return prod?.image ? (
                                <div className="w-10 h-10 shrink-0 rounded overflow-hidden border border-[#1d2a57] bg-[#090f26]">
                                  <img src={prod.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 shrink-0 rounded bg-[#131d42] border border-[#1d2a57] flex items-center justify-center text-slate-500 text-[8px] font-bold">No Img</div>
                              );
                            })()}
                            <div>
                              <div>{item.name}</div>
                              {user?.role !== 'Admin' && item.wholesalePrices && item.wholesalePrices.length > 0 && (
                                <div className="mt-2">
                                  <select
                                    value={`${item.price}-${item.isWholesalePrice || false}`}
                                    onChange={(e) => {
                                      const [valPrice, valIsWholesale] = e.target.value.split('-');
                                      handleChangePriceOption(item.productId, Number(valPrice), valIsWholesale === 'true');
                                    }}
                                    className="bg-[#090f26] text-[#b4f56b] border border-[#1d2a57] rounded-lg px-2 py-1 text-[10px] font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-[#b4f56b] cursor-pointer"
                                  >
                                    {(() => {
                                      const prod = products.find(p => p.id === item.productId);
                                      const regulerPrice = prod ? getActiveBasePrice(prod) : item.price;
                                      return <option value={`${regulerPrice}-false`}>Reguler: {formatRupiah(regulerPrice)}</option>;
                                    })()}
                                    {item.wholesalePrices.map((wp: any, idx: number) => (
                                      <option key={idx} value={`${wp.price}-true`}>Grosir Min {wp.qty} Pcs: {formatRupiah(wp.price)}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-center">
                          <CurrencyInput value={item.price} onChange={val => handleUpdatePrice(item.productId, val)} className="w-32 bg-[#182352] text-white border border-[#1d2a57] rounded-lg px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-[#b4f56b] font-mono" />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-center">
                          <input type="number" min="1" value={item.qty} onChange={(e) => handleUpdateQty(item.productId, parseInt(e.target.value) || 1)} className="w-16 bg-[#182352] text-white border border-[#1d2a57] rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#b4f56b] font-mono" />
                          {(() => {
                            const prod = products.find(p => p.id === item.productId);
                            const avail = prod ? (prod.centralStock ?? prod.stock) : 999999;
                            if ((user?.role === 'Cabang' || user?.role === 'Outlet') && item.qty > avail) {
                              return (
                                <span className="block mt-1 text-[10px] font-black text-rose-400 tracking-wider">
                                  ⚠️ Stok Pusat Tidak Cukup (Sisa: {avail})
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-white text-right font-mono">{formatRupiah(item.subtotal)}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium sm:pr-6">
                          <button type="button" onClick={() => handleRemoveFromCart(item.productId)} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-5 h-5 inline" /></button>
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
              {!(user?.role === 'Cabang' || user?.role === 'Outlet') && (
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Metode Pembayaran (Order)</label>
                  <div className="mt-2 grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {['Tunai', 'Transfer', 'Kredit']
                      .map((m) => (
                        <div key={m} onClick={() => setMethod(m as any)} className={`cursor-pointer border rounded-xl py-2 px-3 flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors ${method === m ? 'bg-[#b4f56b]/10 border-[#b4f56b] text-[#b4f56b]' : 'border-[#1d2a57] text-slate-400 hover:bg-[#182352]'}`}>
                          {m}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Catatan (opsional)</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-400"></textarea>
              </div>
            </div>

            <div className="bg-[#182352] border border-[#1d2a57] p-5 rounded-2xl space-y-4">
              {(user?.role === 'Cabang' || user?.role === 'Outlet') ? (
                <div className="pt-2 flex justify-between items-center text-lg">
                  <span className="font-bold text-slate-300 uppercase tracking-wide text-sm">Subtotal</span>
                  <span className="font-black text-[#b4f56b] font-mono text-xl">{formatRupiah(subtotal)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-wide text-xs">Subtotal</span>
                    <span className="font-bold text-white font-mono">{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-wide text-xs">Diskon (Rp)</span>
                    <CurrencyInput value={discount} onChange={val => setDiscount(val)} className="w-32 bg-[#090f26] text-white border border-[#1d2a57] rounded-lg px-2 py-1.5 text-right font-mono focus:outline-none focus:ring-1 focus:ring-[#b4f56b]" placeholder="0" />
                  </div>
                  <div className="pt-4 border-t border-[#1d2a57] flex justify-between items-center">
                    <span className="text-sm font-extrabold text-white uppercase tracking-wider mb-4">Total Akhir</span>
                    <span className="text-2xl font-black text-[#b4f56b] font-mono">{formatRupiah(grandTotal)}</span>
                  </div>
                </>
              )}

              {!(user?.role === 'Cabang' || user?.role === 'Outlet') && method === 'Tunai' && (
                <>
                  <div className="pt-4 flex justify-between items-center text-sm border-t border-[#1d2a57]">
                    <span className="text-slate-300 font-bold uppercase tracking-wide text-xs">Yang Harus Dibayarkan</span>
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
            <button type="button" onClick={() => navigate('/pembelian')} className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold text-sm py-4 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="w-1/2 bg-[#b4f56b] hover:bg-[#a5e45a] disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed text-black font-extrabold text-sm py-4 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer flex flex-col items-center justify-center">
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>MEMPROSES...</span>
                </div>
              ) : (
                'PROSES'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
