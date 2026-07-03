import React, { useState } from 'react';
import { usePosStore } from '../../store';
import { formatRupiah, formatRibuan, unformatRibuan } from '../../lib/utils';
import { Save, Plus, Trash2 } from 'lucide-react';
import { CurrencyInput } from '../../components/CurrencyInput';

const getCentralPriceForQty = (product: any, qty: number, baseCost: number) => {
  if (!product.isWholesale || !product.wholesalePrices || product.wholesalePrices.length === 0) {
    return baseCost;
  }
  const sortedWP = [...product.wholesalePrices].sort((a: any, b: any) => b.qty - a.qty);
  const tier = sortedWP.find((wp: any) => qty >= wp.qty);
  return tier ? Math.min(tier.price, baseCost) : baseCost;
};

export default function HargaCabang() {
  const { products, purchases, user, updateProduct } = usePosStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [tempIsWholesale, setTempIsWholesale] = useState<boolean>(false);
  const [tempWholesalePrices, setTempWholesalePrices] = useState<{qty: number; price: number}[]>([]);

  if (!user || !user.branchId) return <div className="p-6 text-center text-slate-400">Data cabang tidak ditemukan.</div>;

  const getLastPurchasePrice = (productId: string, fallbackPrice: number) => {
    const branchPurchases = purchases
      .filter(p => p.branchId === user?.branchId || (!p.branchId && p.userId === user?.id))
      .filter(p => p.status === 'Selesai' || p.status === 'Lunas')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const purchase of branchPurchases) {
      const item = purchase.items.find((i: any) => i.productId === productId);
      if (item) {
        return item.price;
      }
    }
    return fallbackPrice;
  };

  // Filter produk khusus untuk cabang: hanya tampilkan yang pernah dipesan
  let availableProducts = products;
  if (user?.role === 'Cabang') {
    const branchPurchaseProductIds = new Set<string>();
    purchases.forEach(purchase => {
      if (purchase.branchId === user.branchId || (!purchase.branchId && purchase.userId === user.id)) {
        if (purchase.status === 'Selesai' || purchase.status === 'Lunas') {
          purchase.items.forEach(item => {
            branchPurchaseProductIds.add(item.productId);
          });
        }
      }
    });
    availableProducts = products.filter(p => branchPurchaseProductIds.has(p.id));
  }

  const handleEdit = (product: any) => {
    const actualCost = getLastPurchasePrice(product.id, product.sellPrice);
    setEditingId(product.id);
    setTempPrice(product.branchPrices?.[user.branchId as string] || actualCost);
    setTempIsWholesale(product.branchIsWholesale?.[user.branchId as string] || product.isWholesale || false);
    
    const existingWP = product.branchWholesalePrices?.[user.branchId as string];
    if (existingWP) {
      setTempWholesalePrices([...existingWP]);
    } else if (product.wholesalePrices) {
      setTempWholesalePrices([...product.wholesalePrices]);
    } else {
      setTempWholesalePrices([]);
    }
  };

  const handleSave = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const actualCost = getLastPurchasePrice(product.id, product.sellPrice);

      if (tempPrice < actualCost) {
        alert('Harga dasar cabang tidak boleh di bawah harga beli dari pusat!');
        return;
      }

      if (tempIsWholesale) {
        for (const wp of tempWholesalePrices) {
          const centralMinPrice = getCentralPriceForQty(product, wp.qty, actualCost);
          // Tetap tidak boleh jual rugi (di bawah modal aktual cabang)
          const absoluteMinPrice = Math.max(centralMinPrice, actualCost);
          
          if (wp.price < absoluteMinPrice) {
            alert(`Harga grosir cabang untuk min. ${wp.qty} qty tidak boleh di bawah batas minimum (Rp ${absoluteMinPrice.toLocaleString('id-ID')})!`);
            return;
          }
        }
      }

      const newBranchPrices = {
        ...(product.branchPrices || {}),
        [user.branchId as string]: tempPrice
      };
      
      const newBranchIsWholesale = {
        ...(product.branchIsWholesale || {}),
        [user.branchId as string]: tempIsWholesale
      };
      
      const newBranchWholesalePrices = {
        ...(product.branchWholesalePrices || {}),
        [user.branchId as string]: tempIsWholesale ? tempWholesalePrices.filter(wp => wp.qty > 0 && wp.price > 0) : []
      };

      await updateProduct(productId, { 
        branchPrices: newBranchPrices,
        branchIsWholesale: newBranchIsWholesale,
        branchWholesalePrices: newBranchWholesalePrices
      });
      setEditingId(null);
    } catch (error) {
      alert('Gagal menyimpan harga cabang');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">Atur Harga Cabang</h2>
        </div>
      </div>

      <div className="bg-[#182352] rounded-2xl overflow-hidden border border-[#1d2a57] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0b1330] border-b border-[#1d2a57]">
              <tr>
                <th className="p-4 text-[#b4f56b] font-extrabold uppercase text-[11px] tracking-widest">SKU</th>
                <th className="p-4 text-[#b4f56b] font-extrabold uppercase text-[11px] tracking-widest">Nama Produk</th>
                <th className="p-4 text-[#b4f56b] font-extrabold uppercase text-[11px] tracking-widest text-right">Harga Pusat</th>
                <th className="p-4 text-[#b4f56b] font-extrabold uppercase text-[11px] tracking-widest text-right">Harga Cabang</th>
                <th className="p-4 text-[#b4f56b] font-extrabold uppercase text-[11px] tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2a57]/50">
              {availableProducts.map(product => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-slate-300 font-bold align-top">{product.sku}</td>
                  <td className="p-4 font-bold text-white max-w-[200px] truncate align-top">{product.name}</td>
                  <td className="p-4 text-right align-top">
                    <div className="text-slate-400 font-mono">{formatRupiah(getLastPurchasePrice(product.id, product.sellPrice))}</div>
                  </td>
                  <td className="p-4 text-right align-top min-w-[200px]">
                    {editingId === product.id ? (
                      <div className="flex flex-col gap-3 items-end w-full">
                        <div className="flex flex-col items-end w-full gap-1">
                           <label className="text-[10px] font-bold tracking-widest text-[#b4f56b] uppercase">Harga Dasar</label>
                           <CurrencyInput
                             value={tempPrice}
                             onChange={val => setTempPrice(val)}
                             className="w-full max-w-[150px] bg-[#090f26] border border-[#b4f56b] rounded-lg px-2 py-1.5 text-right font-bold text-[#b4f56b] focus:outline-none focus:ring-1 focus:ring-[#b4f56b]"
                           />
                        </div>
                        <div className="w-full flex justify-end">
                           <label className="flex items-center gap-2 cursor-pointer">
                             <span className="text-[10px] font-bold tracking-widest text-[#b4f56b] uppercase">Aktifkan Grosir</span>
                             <input 
                               type="checkbox" 
                               checked={tempIsWholesale}
                               onChange={e => setTempIsWholesale(e.target.checked)}
                               className="w-4 h-4 rounded border-[#1d2a57] text-[#b4f56b] focus:ring-[#b4f56b] bg-[#182352]"
                             />
                           </label>
                        </div>
                        {tempIsWholesale && (
                          <div className="w-full flex flex-col gap-2 mt-1 border-t border-[#1d2a57]/50 pt-2">
                             {tempWholesalePrices.map((wp, index) => (
                               <div key={index} className="flex gap-2 items-center justify-end w-full">
                                  <input
                                    type="number"
                                    placeholder="Min Qty"
                                    value={wp.qty || ''}
                                    onChange={e => {
                                      const newWP = [...tempWholesalePrices];
                                      newWP[index].qty = Number(e.target.value);
                                      setTempWholesalePrices(newWP);
                                    }}
                                    className="w-16 bg-[#090f26] border border-[#1d2a57] rounded-lg px-2 py-1 text-center font-mono text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#b4f56b]"
                                  />
                                  <CurrencyInput
                                    placeholder="Harga"
                                    value={wp.price}
                                    onChange={val => {
                                      const newWP = [...tempWholesalePrices];
                                      newWP[index].price = val;
                                      setTempWholesalePrices(newWP);
                                    }}
                                    className="w-24 bg-[#090f26] border border-[#1d2a57] rounded-lg px-2 py-1 text-right font-mono text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#b4f56b]"
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => setTempWholesalePrices(tempWholesalePrices.filter((_, i) => i !== index))}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                             ))}
                             <button 
                               type="button" 
                               onClick={() => setTempWholesalePrices([...tempWholesalePrices, {qty: 0, price: 0}])}
                               className="text-[#b4f56b] text-[10px] font-bold uppercase flex items-center justify-end gap-1 mt-1 hover:text-[#9ad656]"
                             >
                               <Plus size={12} /> Tambah Harga
                             </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-[#b4f56b] font-bold font-mono">
                          {product.branchPrices?.[user.branchId as string] 
                            ? formatRupiah(product.branchPrices[user.branchId as string]) 
                            : <span className="text-slate-500 font-normal italic text-xs font-sans">Belum diatur</span>}
                        </span>
                        {product.branchIsWholesale?.[user.branchId as string] && product.branchWholesalePrices?.[user.branchId as string]?.length > 0 && (
                          <div className="mt-2 flex flex-col items-end gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter border-b border-[#1d2a57]">Grosir Cabang:</span>
                            {product.branchWholesalePrices[user.branchId as string].map((wp: any, index: number) => (
                              <div key={index} className="text-[10px] font-mono text-[#b4f56b] font-semibold">
                                {wp.qty}+ {product.unit} @ {formatRupiah(wp.price)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center align-top">
                    {editingId === product.id ? (
                      <button
                        onClick={() => handleSave(product.id)}
                        className="bg-[#b4f56b] text-black px-4 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:bg-[#a3e451] transition-transform active:scale-95 flex items-center justify-center gap-1 mx-auto shadow-lg"
                      >
                        <Save size={14} /> Simpan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-sky-400 hover:text-sky-300 font-bold px-4 py-1.5 border-2 border-sky-400/30 rounded-xl hover:bg-sky-400/10 transition-colors uppercase tracking-wider text-[10px] mx-auto active:scale-95"
                      >
                        Ubah Harga
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {availableProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider text-xs">
                    Belum ada data produk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
