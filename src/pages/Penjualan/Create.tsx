import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosStore } from '../../store';
import { formatRupiah, formatRibuan, unformatRibuan } from '../../lib/utils';
import { Product, SaleItem } from '../../types';
import { Trash2, Plus } from 'lucide-react';
import { CurrencyInput } from '../../components/CurrencyInput';

export default function PenjualanCreate() {
  const navigate = useNavigate();
  const { user, users, products, branches, purchases, addSale, addPurchase, addDelivery } = usePosStore();

  const isCustOrStore = user?.role === 'Cust' || user?.role === 'Outlet';
  const isAdminPusat = user?.role === 'Admin';
  const [customer, setCustomer] = useState(isCustOrStore ? (user?.branchId ? branches?.find(b => b.id === user.branchId)?.name || 'Cabang' : 'Cabang') : '');
  const [selectedWilayah, setSelectedWilayah] = useState('');

  useEffect(() => {
    if (isCustOrStore && branches.length > 0 && user?.branchId) {
      const branchName = branches.find(b => b.id === user.branchId)?.name || 'Cabang';
      if (customer !== branchName) {
        setCustomer(branchName);
      }
    }
  }, [isCustOrStore, branches, user?.branchId, customer]);
  const [selectedCabang, setSelectedCabang] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'Tunai'|'Transfer'|'Kredit'>(isCustOrStore ? 'Kredit' : 'Tunai');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [cashGiven, setCashGiven] = useState(0);

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');

  const getActivePrice = (product: Product) => {
    return (product.branchPrices && user?.branchId && product.branchPrices[user.branchId]) 
      ? product.branchPrices[user.branchId] 
      : product.sellPrice;
  };

  const uniqueWilayah = useMemo(() => {
    if (!branches) return [];
    const wilayahs = branches.map(b => b.wilayah).filter(Boolean);
    return Array.from(new Set(wilayahs));
  }, [branches]);

  const filteredBranches = useMemo(() => {
    if (!selectedWilayah) return [];
    return branches.filter(b => b.wilayah === selectedWilayah);
  }, [branches, selectedWilayah]);

  // Computations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.subtotal, 0), [cart]);
  const grandTotal = Math.max(0, subtotal - discount);
  const kembalian = cashGiven - grandTotal;

  // Filter produk khusus untuk cabang dan outlet: hanya tampilkan produk milik cabang
  let availableProducts = products;
  if (user?.role === 'Cabang' || user?.role === 'Outlet' || user?.role === 'Cust') {
    const branchPurchaseProductIds = new Set<string>();
    purchases.forEach(purchase => {
      if (purchase.branchId === user?.branchId || (!purchase.branchId && purchase.userId === user?.id && user?.role === 'Cabang')) {
        purchase.items.forEach(item => {
          branchPurchaseProductIds.add(item.productId);
        });
      }
    });
    availableProducts = products.filter(p => branchPurchaseProductIds.has(p.id));
  }

  const validProducts = availableProducts.filter(p => p.stock > 0);
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
        const newQty = exists.qty + 1;
        return prev.map(item => item.productId === product.id 
          ? { ...item, qty: newQty, subtotal: newQty * item.price } 
          : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        qty: 1, 
        price: getActivePrice(product), 
        subtotal: getActivePrice(product), 
        isWholesalePrice: false,
        wholesalePrices: product.isWholesale ? product.wholesalePrices : undefined
      }];
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

    let newPrice = getActivePrice(product);
    let newIsWholesalePrice = false;

    if (product.isWholesale && product.wholesalePrices && product.wholesalePrices.length > 0) {
      const validOptions = product.wholesalePrices.filter(wp => wp.qty <= newQty);
      if (validOptions.length > 0) {
        const bestOption = validOptions.reduce((prev, current) => (prev.qty > current.qty) ? prev : current);
        newPrice = bestOption.price;
        newIsWholesalePrice = true;
      }
    }

    setCart(prev => prev.map(item => item.productId === productId 
      ? { ...item, qty: newQty, price: newPrice, isWholesalePrice: newIsWholesalePrice, subtotal: newQty * newPrice } 
      : item
    ));
  };

  const handleChangePriceOption = (productId: string, newPrice: number, isWholesalePrice: boolean) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prev => {
      const itemToUpdate = prev.find(item => item.productId === productId);
      if (!itemToUpdate) return prev;

      let newQty = itemToUpdate.qty;
      if (isWholesalePrice && product.wholesalePrices) {
        const wholesaleOption = product.wholesalePrices.find(wp => wp.price === newPrice);
        if (wholesaleOption) {
          newQty = wholesaleOption.qty;
        }
      }

      if (newQty > product.stock) {
        alert(`Stok hanya tersedia ${product.stock} ${product.unit}. Tidak dapat menerapkan opsi grosir ini.`);
        return prev;
      }

      return prev.map(item => item.productId === productId 
        ? { ...item, qty: newQty, price: newPrice, subtotal: newQty * newPrice, isWholesalePrice }
        : item
      );
    });
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
    if (!customer) {
      alert('Nama pelanggan wajib diisi.');
      return;
    }

    let status: 'Lunas' | 'Belum Bayar' | 'Sebagian' = 'Lunas';
    if (method === 'Tunai' && cashGiven < grandTotal) {
      alert('Jumlah bayar kurang dari total tagihan!');
      return;
    }
    if (method === 'Kredit') status = 'Belum Bayar';

    try {
      if (isCustOrStore) {
        // Outlet/Cust mengajukan PO ke Cabang
        await addPurchase({
          date: new Date(transactionDate).toISOString(),
          supplier: user?.branchId ? branches.find(b => b.id === user.branchId)?.name || 'Cabang' : 'Cabang',
          total: grandTotal,
          method,
          status: 'Belum Bayar' as any,
          items: cart,
          isProcessed: false,
          deliveryStatus: 'Menunggu',
          branchId: user?.branchId,
          userId: user?.id,
          notes,
          destinationAdminId: undefined,
        });
        navigate('/penjualan');
        return;
      }

      const newSaleId = await addSale({
        date: new Date(transactionDate).toISOString(),
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
        cashReturn: method === 'Tunai' ? Math.max(0, kembalian) : undefined
      });

      // PUSH SYSTEM LOGIC: Distribusi sepihak ke Cabang
      const targetBranch = branches.find(b => b.name === customer);
      if (isAdminPusat && targetBranch) {
        // 1. Buat PO Bayangan untuk Cabang
        await addPurchase({
          date: new Date(transactionDate).toISOString(),
          supplier: 'KANTOR PUSAT',
          total: grandTotal,
          method,
          status: 'Disetujui' as any,
          items: cart,
          isProcessed: true,
          deliveryStatus: 'Dikirim',
          branchId: targetBranch.id,
        });
      }

      navigate(`/penjualan/${newSaleId}`);
    } catch(err: any) {
      alert("Gagal memproses transaksi: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">Buat Transaksi Penjualan</h2>
        </div>
      </div>

      <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`grid grid-cols-1 ${isAdminPusat ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
            {/* TAMPILAN UNTUK ADMIN CABANG (DAN ROLE LAIN) */}
            {!isAdminPusat && (
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">
                  {isCustOrStore ? 'Cabang' : 'Outlet'}
                </label>
                <select 
                  value={customer}
                  onChange={e => setCustomer(e.target.value)}
                  disabled={isCustOrStore}
                  className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer disabled:bg-[#0c143a] disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>Pilih {isCustOrStore ? 'Cabang' : 'Outlet'}...</option>
                  {isCustOrStore ? (
                    <option value={customer}>{customer}</option>
                  ) : (
                    users?.filter(u => u.role === 'Outlet' && (!user?.branchId || u.branchId === user?.branchId)).map(u => (
                      <option key={u.id} value={u.outletName || u.name || "Outlet Tanpa Nama"}>{u.outletName || u.name || "Outlet Tanpa Nama"}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* TAMPILAN KHUSUS ADMIN PUSAT */}
            {isAdminPusat && (
              <>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Wilayah</label>
                  <select
                    value={selectedWilayah}
                    onChange={e => {
                      setSelectedWilayah(e.target.value);
                      setSelectedCabang('');
                      setCustomer(''); // Reset target (nama cabang)
                    }}
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                  >
                    <option value="" disabled>Pilih Wilayah...</option>
                    {uniqueWilayah.map(w => (
                      <option key={w as string} value={w as string}>{w as string}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Cabang Tujuan</label>
                  <select
                    value={selectedCabang}
                    onChange={e => {
                      const branchId = e.target.value;
                      setSelectedCabang(branchId);
                      
                      // Set nama cabang tujuan sebagai data 'customer' di transaksi
                      const branch = branches.find(b => b.id === branchId);
                      if (branch) {
                        setCustomer(branch.name); 
                      }
                    }}
                    disabled={!selectedWilayah}
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer disabled:bg-[#0c143a] disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>Pilih Cabang...</option>
                    {filteredBranches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Tanggal</label>
              <input 
                type="date" 
                value={transactionDate} 
                onChange={e => setTransactionDate(e.target.value)}
                disabled={isCustOrStore}
                className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer disabled:bg-[#0c143a] disabled:text-slate-500 disabled:cursor-not-allowed" 
              />
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
                              <span className="block text-[11px] text-slate-400 font-mono tracking-wider truncate">{product.sku} | Stok: <span className="text-[#b4f56b]">{product.stock} {product.unit}</span></span>
                              {product.isWholesale && product.wholesalePrices && product.wholesalePrices.length > 0 && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#b4f56b]/20 text-[#b4f56b] text-[9px] font-extrabold tracking-widest rounded-md uppercase">Tersedia Harga Grosir</span>
                              )}
                           </div>
                         </div>
                         <span className="block font-bold text-[#b4f56b] font-mono">{formatRupiah(getActivePrice(product))}</span>
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
                    <th className="px-3 py-3.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Qty</th>
                    <th className="px-3 py-3.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Subtotal</th>
                    <th className="py-3.5 pl-3 pr-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase sm:pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1d2a57]/30 bg-transparent text-slate-200">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">Keranjang masih kosong.</td>
                    </tr>
                  ) : (
                    cart.map(item => (
                      <tr key={item.productId} className="hover:bg-[#182352]/30 transition-colors">
                        <td className="py-4 pl-4 pr-3 text-sm font-bold uppercase text-white sm:pl-6">
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
                              {item.wholesalePrices && item.wholesalePrices.length > 0 && (
                                <div className="mt-2">
                                  <select 
                                    value={`${item.price}-${item.isWholesalePrice}`}
                                    onChange={(e) => {
                                      const [valPrice, valIsWholesale] = e.target.value.split('-');
                                      handleChangePriceOption(item.productId, Number(valPrice), valIsWholesale === 'true');
                                    }}
                                    className="bg-[#090f26] text-[#b4f56b] border border-[#1d2a57] rounded-lg px-2 py-1 text-[10px] font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-[#b4f56b] cursor-pointer"
                                  >
                                    {(() => {
                                      const prod = products.find(p => p.id === item.productId);
                                      const regulerPrice = prod ? getActivePrice(prod) : item.price;
                                      return <option value={`${regulerPrice}-false`}>Reguler: {formatRupiah(regulerPrice)}</option>;
                                    })()}
                                    {item.wholesalePrices.map((wp, idx) => (
                                      <option key={idx} value={`${wp.price}-true`}>Grosir Min {wp.qty} Pcs: {formatRupiah(wp.price)}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-right font-mono">{formatRupiah(item.price)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400 text-center">
                          <input type="number" min="1" value={item.qty} onChange={(e) => handleUpdateQty(item.productId, parseInt(e.target.value))} className="w-16 bg-[#182352] text-white border border-[#1d2a57] rounded-lg px-2 py-1 text-center font-mono focus:outline-none focus:ring-1 focus:ring-[#b4f56b]" />
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
              {!isCustOrStore && (
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
               {isCustOrStore ? (
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

               {!isCustOrStore && method === 'Tunai' && (
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
             <button type="button" onClick={() => navigate('/penjualan')} className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold text-sm py-4 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer">
               Batal
             </button>
             <button type="submit" className="w-1/2 bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-sm py-4 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer flex flex-col items-center justify-center">
               Simpan & Cetak Invoice
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
