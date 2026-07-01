import React, { useState } from 'react';
import { usePosStore } from '../../store';
import { Product } from '../../types';
import { Edit2, X } from 'lucide-react';

export default function StokMonitor() {
  const { user, products, purchases, stockHistory, adjustStock } = usePosStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [adjustType, setAdjustType] = useState<'Tambah'|'Kurang'>('Tambah');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState('');

  const getStatus = (stock: number, min: number) => {
    if (stock <= 0) return { label: 'Habis', class: 'bg-red-100 text-red-800' };
    if (stock <= min) return { label: 'Menipis', class: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Aman', class: 'bg-green-100 text-green-800' };
  };

  // Filter produk khusus untuk cabang: hanya tampilkan yang pernah dipesan atau memiliki riwayat stok di cabang
  let availableProducts = products;
  if (user?.role === 'Cabang') {
    const branchProductIds = new Set<string>();
    purchases.forEach(purchase => {
      if (purchase.branchId === user.branchId || (!purchase.branchId && purchase.userId === user.id)) {
        purchase.items.forEach(item => {
          branchProductIds.add(item.productId);
        });
      }
    });
    stockHistory.forEach(h => {
      if (h.branchId === user.branchId) {
        branchProductIds.add(h.productId);
      }
    });
    availableProducts = products.filter(p => branchProductIds.has(p.id));

    // Aturan Bisnis: Sembunyikan produk yang berstatus diajukan/dikirim (belum diterima) jika stoknya 0
    availableProducts = availableProducts.filter(p => {
      if (p.stock > 0) return true;

      const hasPendingPurchase = purchases.some(purchase => {
        const isBranchPurchase = purchase.branchId === user.branchId || (!purchase.branchId && purchase.userId === user.id);
        if (!isBranchPurchase) return false;

        const hasProduct = purchase.items.some(item => item.productId === p.id);
        if (!hasProduct) return false;

        // Cek apakah pembelian/pengiriman belum selesai diterima
        const isPending = 
          purchase.status === 'Diajukan' || 
          purchase.deliveryStatus === 'Dikirim' ||
          purchase.deliveryStatus === 'Menunggu' ||
          purchase.deliveryStatus === 'Diproses';

        return isPending;
      });

      return !hasPendingPurchase;
    });
  }

  const filteredProducts = availableProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const status = getStatus(p.stock, p.minStock).label;
    const matchesStatus = filterStatus === 'Semua' || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustType('Tambah');
    setAdjustQty(1);
    setAdjustReason('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      adjustStock(selectedProduct.id, adjustType, adjustQty, adjustReason);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">MONITORING STOK REALTIME</h2>
        </div>
      </div>

      <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1d2a57]/40 bg-[#0e1531] flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:max-w-sm relative">
            <input
              type="text"
              placeholder="Cari produk (Nama / SKU)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] placeholder-slate-500 text-sm font-semibold"
            />
          </div>

          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aman">Aman</option>
            <option value="Menipis">Menipis</option>
            <option value="Habis">Habis</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1d2a57]/30">
            <thead className="bg-[#090f26]/70">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Produk</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">SKU</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Kategori</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Stok Saat Ini</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Min. Stok</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Status</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                    Belum ada data stok terdaftar.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStatus(product.stock, product.minStock);
                  const isRed = status.label === 'Habis';
                  const isYellow = status.label === 'Menipis';
                  const badgeClass = isRed 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                    : isYellow 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                    : 'bg-[#b4f56b]/10 text-[#b4f56b] border border-[#b4f56b]/30';

                  return (
                    <tr key={product.id} className="hover:bg-[#131d42]/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#090f26] border border-[#1d2a57] shrink-0">
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#131d42] border border-[#1d2a57] flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">No Img</div>
                          )}
                          <span className="text-sm font-bold text-white uppercase">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono font-medium">{product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-medium">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold text-right font-mono">{product.stock} {product.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 text-right font-mono">{product.minStock} {product.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                         <span className={`px-2.5 py-0.5 inline-flex text-xs font-black rounded-full uppercase tracking-wider ${badgeClass}`}>
                            {status.label} {status.label !== 'Aman' && '⚠️'}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button 
                          onClick={() => handleOpenModal(product)} 
                          className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xxs py-1.5 px-3.5 rounded-xl tracking-wider uppercase transition-transform active:scale-95"
                        >
                          Sesuaikan
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-[#0e1531] w-full max-w-lg rounded-2xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#1d2a57] bg-[#0e1531]">
              <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">Penyesuaian Stok Gudang</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Nama Produk</label>
                  <input type="text" readOnly value={selectedProduct.name} className="bg-[#182352] text-slate-400 border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full text-sm font-semibold uppercase cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Stok Saat Ini</label>
                  <input type="text" readOnly value={`${selectedProduct.stock} ${selectedProduct.unit}`} className="bg-[#182352] text-[#b4f56b] border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full text-sm font-mono font-bold cursor-not-allowed" />
                </div>
              </div>
              
              <div>
                 <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Tipe Penyesuaian</label>
                 <div className="flex items-center space-x-6 bg-[#182352] px-4 py-2.5 rounded-xl border border-[#1d2a57]">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        className="accent-[#b4f56b] h-4 w-4 bg-transparent" 
                        checked={adjustType === 'Tambah'} 
                        onChange={() => setAdjustType('Tambah')} 
                      />
                      <span className="ml-2 text-sm text-slate-200 font-bold uppercase tracking-wider">Tambah (+)</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="radio" 
                        className="accent-red-400 h-4 w-4 bg-transparent" 
                        checked={adjustType === 'Kurang'} 
                        onChange={() => setAdjustType('Kurang')} 
                      />
                      <span className="ml-2 text-sm text-slate-200 font-bold uppercase tracking-wider">Kurang (-)</span>
                    </label>
                 </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Jumlah {adjustType}</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  max={adjustType === 'Kurang' ? selectedProduct.stock : undefined} 
                  value={adjustQty} 
                  onChange={e => setAdjustQty(Number(e.target.value))} 
                  className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-mono font-bold" 
                />
                {adjustType === 'Kurang' && adjustQty > selectedProduct.stock && (
                  <p className="mt-1.5 text-xs text-red-400 font-semibold uppercase tracking-wide">Jumlah kurang melebihi stok yang ada.</p>
                )}
              </div>
              
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Alasan Penyesuaian</label>
                <textarea 
                  required 
                  rows={2} 
                  placeholder="Contoh: Stock opname, Barang rusak dsb..." 
                  value={adjustReason} 
                  onChange={e => setAdjustReason(e.target.value)} 
                  className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-400" 
                />
              </div>

              <div className="pt-2 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold text-sm py-4 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={adjustType === 'Kurang' && adjustQty > selectedProduct.stock} 
                  className="w-1/2 bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-sm py-4 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                >
                  <span>Simpan</span>
                  <span>Penyesuaian</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
