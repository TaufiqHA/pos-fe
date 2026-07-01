import React, { useState } from 'react';
import { usePosStore } from '../../store';

export default function TabStokCabang() {
  const { products, branches, wilayahs } = usePosStore();
  const [filterWilayah, setFilterWilayah] = useState('Semua Wilayah');
  const [filterCabang, setFilterCabang] = useState('Semua Cabang');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');
  const uniqueKategori = Array.from(new Set(products.map(p => p.category).filter(cat => cat && cat !== 'Umum'))) as string[];

  const uniqueRegions = wilayahs;

  const filteredProducts = products.filter(p => {
    // Hanya tampilkan stok yang benar-benar milik cabang
    if (!(p as any).branchId) {
      return false;
    }

    let matchRegion = true;
    let matchBranch = true;
    
    if (filterWilayah !== 'Semua Wilayah') {
      const branchInfo = branches.find(b => b.id === (p as any).branchId);
      matchRegion = branchInfo ? branchInfo.wilayah === filterWilayah : false;
    }
    
    if (filterCabang !== 'Semua Cabang') {
      const branchInfo = branches.find(b => b.id === (p as any).branchId);
      matchBranch = branchInfo ? branchInfo.name === filterCabang : false;
    }

    let matchCategory = true;
    if (filterKategori !== 'Semua Kategori') {
      matchCategory = p.category === filterKategori;
    }

    return matchRegion && matchBranch && matchCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select 
          value={filterWilayah}
          onChange={(e) => {
            setFilterWilayah(e.target.value);
            setFilterCabang('Semua Cabang');
          }}
          className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2 w-full sm:w-1/3 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
        >
          <option value="Semua Wilayah">Semua Wilayah</option>
          {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select 
          value={filterCabang}
          onChange={(e) => setFilterCabang(e.target.value)}
          disabled={filterWilayah === 'Semua Wilayah'}
          className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2 w-full sm:w-1/3 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer disabled:opacity-50"
        >
          <option value="Semua Cabang">Semua Cabang</option>
          {branches.filter(b => b.wilayah === filterWilayah).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
        <select 
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2 w-full sm:w-1/3 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
        >
          <option value="Semua Kategori">Semua Kategori</option>
          {uniqueKategori.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1d2a57]">
        <table className="min-w-full divide-y divide-[#1d2a57]/30">
          <thead className="bg-[#090f26]">
            <tr>
              <th className="px-4 py-4 text-left text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">Produk</th>
              <th className="px-4 py-4 text-left text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">SKU</th>
              <th className="px-4 py-4 text-left text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">Kategori</th>
              <th className="px-4 py-4 text-right text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">Stok</th>
            </tr>
          </thead>
          <tbody className="bg-[#0b1330] divide-y divide-[#1d2a57]/30">
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-bold text-xs tracking-wider uppercase">Tidak ada data stok di cabang ini.</td></tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-[#131d42]/50 transition-colors">
                  <td className="px-4 py-4 text-sm text-white font-bold uppercase">{p.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-400 font-mono font-medium">{p.sku}</td>
                  <td className="px-4 py-4 text-sm text-slate-400 font-medium">{p.category}</td>
                  <td className="px-4 py-4 text-sm text-white font-black text-right font-mono">{p.stock} <span className="text-slate-500 text-xs">{p.unit}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
