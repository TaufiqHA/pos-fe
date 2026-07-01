import React, { useState } from 'react';
import { usePosStore } from '../store';
import { Product } from '../types';
import { formatRupiah, formatRibuan, unformatRibuan } from '../lib/utils';
import { Plus, Edit, Trash2, X, Settings, Save } from 'lucide-react';
import { CurrencyInput } from '../components/CurrencyInput';

export default function ProdukList() {
  const { user, products, purchases, addProduct, updateProduct, deleteProduct, categories, units, addCategory, editCategory, deleteCategory, addUnit, editUnit, deleteUnit } = usePosStore();
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0, minStock: 5, unit: 'pcs',
    isWholesale: false,
    wholesalePrices: [] as { qty: number; price: number }[],
    image: ''
  });

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageType, setManageType] = useState<'Kategori' | 'Satuan'>('Kategori');
  const [editingItem, setEditingItem] = useState<{old: string, new: string} | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Filter produk khusus untuk cabang: hanya tampilkan yang pernah dipesan
  let availableProducts = products;
  if (user?.role === 'Cabang') {
    const branchPurchaseProductIds = new Set<string>();
    purchases.forEach(purchase => {
      // Asumsi pesanan dari pusat ke cabang masuk ke daftar purchases dengan branchId yang sesuai
      if (purchase.branchId === user.branchId || (!purchase.branchId && purchase.userId === user.id)) {
        purchase.items.forEach(item => {
          branchPurchaseProductIds.add(item.productId);
        });
      }
    });
    availableProducts = products.filter(p => branchPurchaseProductIds.has(p.id));
  }

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, sku: product.sku, category: product.category,
        buyPrice: product.buyPrice, sellPrice: product.sellPrice,
        stock: product.stock, minStock: product.minStock, unit: product.unit,
        isWholesale: product.isWholesale || false,
        wholesalePrices: product.wholesalePrices ? product.wholesalePrices.map(wp => ({ ...wp })) : [],
        image: product.image || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', sku: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0, minStock: 5, unit: 'pcs',
        isWholesale: false,
        wholesalePrices: [],
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '', sku: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0, minStock: 5, unit: 'pcs',
      isWholesale: false,
      wholesalePrices: [],
      image: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Cleanup wholesalePrices if wholesale is active
    let finalData = { ...formData };
    if (finalData.isWholesale) {
      finalData.wholesalePrices = finalData.wholesalePrices.filter(wp => wp.qty > 0 && wp.price > 0);
    } else {
      finalData.wholesalePrices = [];
    }

    if (editingProduct) {
      const { stock, ...updates } = finalData;
      updateProduct(editingProduct.id, updates);
    } else {
      addProduct(finalData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Hapus Produk ${name}? Tindakan ini tidak bisa dibatalkan.`)) {
      deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">PENGATURAN PRODUK</h2>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xs py-3 px-5 rounded-2xl tracking-widest transition-all uppercase shadow-md flex items-center gap-2 cursor-pointer active:scale-95 duration-150"
        >
          <Plus className="-ml-1 mr-1 h-4 w-4" strokeWidth={3} />
          TAMBAH PRODUK BARU
        </button>
      </div>

      <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1d2a57]/40 bg-[#0c143a] flex justify-between items-center">
          <div className="w-full max-w-sm relative">
            <input
              type="text"
              placeholder="Cari produk (Nama / SKU)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] placeholder-slate-500 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1d2a57]/30">
            <thead className="bg-[#090f26]/70">
              <tr>
                <th scope="col" className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase w-12">Gambar</th>
                <th scope="col" className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">SKU</th>
                <th scope="col" className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Nama Produk</th>
                <th scope="col" className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Kategori</th>
                {user?.role === 'Admin' && (
                  <th scope="col" className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Modal Rata-rata</th>
                )}
                <th scope="col" className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Harga Jual</th>
                <th scope="col" className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Stok</th>
                <th scope="col" className="px-6 py-4.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'Admin' ? 8 : 7} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                    Belum ada data produk terdaftar.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#131d42]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.image ? (
                        <div className="w-10 h-10 rounded overflow-hidden bg-[#090f26] border border-[#1d2a57] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(product.image!)}>
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-[#131d42] border border-[#1d2a57] flex items-center justify-center text-slate-500 text-[10px] font-bold">No Img</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-[#b4f56b] font-bold">{product.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">{product.category}</td>
                    {user?.role === 'Admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {product.stock <= 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-slate-400 font-mono font-bold">Rp 0</span>
                            <span className="text-[10px] text-slate-500 italic mt-0.5">Histori: {formatRupiah(product.averageCost || product.buyPrice)}</span>
                          </div>
                        ) : (
                          <div className="text-white font-mono font-bold">{formatRupiah(product.averageCost || product.buyPrice)}</div>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="text-white font-mono font-bold">{formatRupiah(product.sellPrice)}</div>
                      {product.isWholesale && product.wholesalePrices && product.wholesalePrices.length > 0 && (
                        <div className="mt-2 flex flex-col items-end gap-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter border-b border-[#1d2a57]">Harga Grosir:</span>
                          <div className="flex flex-col items-end">
                            {product.wholesalePrices.map((wp, index) => (
                              <div key={index} className="text-[10px] font-mono text-[#b4f56b] font-semibold">
                                {wp.qty}+ {product.unit} @ {formatRupiah(wp.price)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#b4f56b] font-mono text-right font-bold">{product.stock} {product.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => handleOpenModal(product)} className="text-sky-400 hover:text-sky-300 mr-4 transition-colors p-1.5 hover:bg-sky-400/10 rounded-lg">
                        <Edit className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => handleDelete(product.id, product.name)} className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-red-400/10 rounded-lg">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => handleCloseModal()}>
          <div
            className="bg-[#0e1531] w-full max-w-md rounded-2xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d2a57]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#b4f56b]" />
                <h3 className="text-md font-extrabold tracking-wide uppercase text-white">
                  {editingProduct ? 'Edit Informasi Produk' : 'Upload Produk Baru'}
                </h3>
              </div>
              <button
                onClick={() => handleCloseModal()}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Nama Produk</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Lampu LED Lucifer"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">SKU / Kode Barcode</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SKU-004"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm placeholder-slate-400 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase">Kategori</label>
                    <button type="button" onClick={() => { setManageType('Kategori'); setIsManageModalOpen(true); }} className="text-[#b4f56b] text-[10px] hover:text-white flex items-center gap-1 font-bold uppercase"><Settings size={12} /> Kelola</button>
                  </div>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Harga Beli (Rp)</label>
                  <CurrencyInput
                    value={formData.buyPrice}
                    onChange={val => setFormData({ ...formData, buyPrice: val })}
                    required
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm placeholder-slate-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Harga Jual (Rp)</label>
                  <CurrencyInput
                    value={formData.sellPrice}
                    onChange={val => setFormData({ ...formData, sellPrice: val })}
                    required
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm placeholder-slate-400 font-mono"
                  />
                </div>
                
                <div className="sm:col-span-2 mt-2 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer w-max">
                    <input 
                      type="checkbox" 
                      checked={formData.isWholesale}
                      onChange={e => setFormData({...formData, isWholesale: e.target.checked})}
                      className="w-4 h-4 rounded border-[#1d2a57] text-[#b4f56b] focus:ring-[#b4f56b] bg-[#182352]"
                    />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">Aktifkan Harga Grosir</span>
                  </label>
                </div>

                {formData.isWholesale && (
                  <div className="sm:col-span-2 bg-[#131d42] border border-[#1d2a57] rounded-xl p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase">Daftar Harga Grosir</h4>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, wholesalePrices: [...formData.wholesalePrices, {qty: 0, price: 0}]})}
                        className="text-[#b4f56b] hover:text-[#9ad656] text-[10px] font-bold uppercase flex items-center gap-1 transition-colors"
                      >
                        <Plus size={12} /> Tambah Harga
                      </button>
                    </div>
                    {formData.wholesalePrices.length === 0 ? (
                       <p className="text-xs text-slate-400 italic">Belum ada harga grosir ditambahkan.</p>
                    ) : (
                      <div className="space-y-3">
                        {formData.wholesalePrices.map((wp, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <input
                                type="number"
                                placeholder="Min. Qty"
                                value={wp.qty || ''}
                                onChange={e => {
                                  const newWP = [...formData.wholesalePrices];
                                  newWP[index].qty = Number(e.target.value);
                                  setFormData({...formData, wholesalePrices: newWP});
                                }}
                                className="bg-[#182352] text-white border border-[#1d2a57] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-mono"
                              />
                            </div>
                            <div className="flex-1">
                              <CurrencyInput
                                placeholder="Harga/Unit"
                                value={wp.price}
                                onChange={val => {
                                  const newWP = [...formData.wholesalePrices];
                                  newWP[index].price = val;
                                  setFormData({...formData, wholesalePrices: newWP});
                                }}
                                className="bg-[#182352] text-white border border-[#1d2a57] rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-mono"
                              />
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                const newWP = formData.wholesalePrices.filter((_, i) => i !== index);
                                setFormData({...formData, wholesalePrices: newWP});
                              }}
                              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Margin Profit Indicator */}
                <div className="sm:col-span-2 flex flex-col justify-center bg-[#131d42] p-3 rounded-xl border border-[#1d2a57] mt-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ESTIMASI MARGIN PROFIT</span>
                    {!formData.isWholesale && (
                      <span className={`text-sm font-mono font-black ${((formData.sellPrice || 0) - (formData.buyPrice || 0)) >= 0 ? 'text-[#b4f56b]' : 'text-rose-400'}`}>
                        {((formData.sellPrice || 0) - (formData.buyPrice || 0)) > 0 ? '+' : ''}Rp {(((formData.sellPrice || 0) - (formData.buyPrice || 0))).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                  {formData.isWholesale && (
                    <div className="flex flex-col gap-1 pt-1 border-t border-[#1d2a57]/50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold">Eceran:</span>
                        <span className={`font-mono font-bold ${((formData.sellPrice || 0) - (formData.buyPrice || 0)) >= 0 ? 'text-[#b4f56b]' : 'text-rose-400'}`}>
                          {((formData.sellPrice || 0) - (formData.buyPrice || 0)) > 0 ? '+' : ''}Rp {(((formData.sellPrice || 0) - (formData.buyPrice || 0))).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {formData.wholesalePrices.filter(wp => wp.qty > 0 && wp.price > 0).map((wp, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold">Grosir (Min {wp.qty}):</span>
                          <span className={`font-mono font-bold ${(wp.price - (formData.buyPrice || 0)) >= 0 ? 'text-[#b4f56b]' : 'text-rose-400'}`}>
                            {(wp.price - (formData.buyPrice || 0)) > 0 ? '+' : ''}Rp {((wp.price - (formData.buyPrice || 0))).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Stok Awal</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock || '0'}
                      onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm placeholder-slate-400 font-mono"
                    />
                  </div>
                )}
                <div className={editingProduct ? "sm:col-span-2" : ""}>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Batas Stok Minimum</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStock || ''}
                    onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm placeholder-slate-400 font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase">Satuan Unit</label>
                    <button type="button" onClick={() => { setManageType('Satuan'); setIsManageModalOpen(true); }} className="text-[#b4f56b] text-[10px] hover:text-white flex items-center gap-1 font-bold uppercase"><Settings size={12} /> Kelola</button>
                  </div>
                  <select 
                    value={formData.unit} 
                    onChange={e => setFormData({...formData, unit: e.target.value})} 
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm cursor-pointer"
                  >
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Gambar Produk</label>
                  <div className="flex items-center gap-3">
                    {formData.image && (
                      <div className="w-10 h-10 rounded overflow-hidden bg-[#131d42] border border-[#1d2a57] shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(formData.image)}>
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, image: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1c274c] file:text-[#b4f56b] hover:file:bg-[#1a233f] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-4">
                <button
                  type="button"
                  onClick={() => handleCloseModal()}
                  className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold text-sm py-4 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-sm py-4 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer flex flex-col items-center justify-center"
                >
                  {editingProduct ? (
                    <>
                      <span>Simpan</span>
                      <span>Perubahan</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan</span>
                      <span>Produk</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {previewImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 cursor-pointer" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full flex items-center justify-center animate-scaleUp">
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
              className="absolute -top-12 right-0 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X size={32} />
            </button>
            <img src={previewImage} alt="Preview Besar" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => { setIsManageModalOpen(false); setEditingItem(null); setNewItemName(''); }}>
          <div
            className="bg-[#0e1531] w-full max-w-sm rounded-2xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d2a57]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#b4f56b]" />
                <h3 className="text-md font-extrabold tracking-wide uppercase text-white">
                  Kelola {manageType}
                </h3>
              </div>
              <button
                onClick={() => { setIsManageModalOpen(false); setEditingItem(null); setNewItemName(''); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {(manageType === 'Kategori' ? categories : units).map(item => (
                <div key={item} className="flex items-center justify-between bg-[#131d42] p-3 rounded-xl border border-[#1d2a57]">
                  {editingItem?.old === item ? (
                    <input 
                      type="text" 
                      autoFocus
                      value={editingItem.new} 
                      onChange={e => setEditingItem({ ...editingItem, new: e.target.value })} 
                      className="bg-[#182352] text-white border border-[#1d2a57] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm flex-1 mr-2"
                    />
                  ) : (
                    <span className="text-sm font-bold text-slate-200">{item}</span>
                  )}
                  
                  <div className="flex items-center gap-1">
                    {editingItem?.old === item ? (
                      <button onClick={() => {
                        if (editingItem.new.trim() !== '') {
                          if (manageType === 'Kategori') {
                            editCategory(editingItem.old, editingItem.new);
                            if (formData.category === editingItem.old) setFormData({...formData, category: editingItem.new});
                          } else {
                            editUnit(editingItem.old, editingItem.new);
                            if (formData.unit === editingItem.old) setFormData({...formData, unit: editingItem.new});
                          }
                        }
                        setEditingItem(null);
                      }} className="text-[#b4f56b] hover:text-[#9ad656] p-1.5 hover:bg-[#b4f56b]/10 rounded-lg transition-colors">
                        <Save className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => setEditingItem({ old: item, new: item })} className="text-sky-400 hover:text-sky-300 p-1.5 hover:bg-sky-400/10 rounded-lg transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => {
                          if (confirm(`Hapus ${manageType} "${item}"?\nPerhatian: Produk yang menggunakan ${manageType} ini mungkin akan terdampak.`)) {
                            if (manageType === 'Kategori') deleteCategory(item);
                            else deleteUnit(item);
                          }
                        }} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#1d2a57] bg-[#0c143a]">
              <label className="block text-[10px] font-bold tracking-widest text-[#b4f56b] uppercase mb-2">Tambah Baru</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder={`Nama ${manageType}...`}
                  className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold"
                />
                <button 
                  onClick={() => {
                    if (newItemName.trim() !== '') {
                      if (manageType === 'Kategori' && !categories.includes(newItemName)) addCategory(newItemName);
                      else if (manageType === 'Satuan' && !units.includes(newItemName)) addUnit(newItemName);
                      setNewItemName('');
                    }
                  }}
                  className="bg-[#b4f56b] text-black px-4 rounded-xl font-bold hover:bg-[#9ad656] transition-colors"
                >
                  <Plus className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
