import React, { useState } from 'react';
import { usePosStore } from '../../store';
import { formatRupiah, formatDate } from '../../lib/utils';
// Lucide react icons removed

export default function TabTransaksiCabang() {
  const { branches, sales, products, wilayahs, openInvoiceModal, categories } = usePosStore();
  const [filterWilayah, setFilterWilayah] = useState('Semua Wilayah');
  const [filterCabang, setFilterCabang] = useState('Semua Cabang');
  const [filterKategori, setFilterKategori] = useState('Semua Kategori');
  
  const uniqueRegions = wilayahs;

  const branchSales = sales.filter(s => {
    if (!s.branchId) return false;
    let matchRegion = filterWilayah === 'Semua Wilayah';
    let matchBranch = filterCabang === 'Semua Cabang';
    if (filterWilayah !== 'Semua Wilayah') {
      const branchInfo = branches.find(b => b.id === s.branchId);
      matchRegion = branchInfo ? branchInfo.wilayah === filterWilayah : false;
    }
    if (filterCabang !== 'Semua Cabang') {
      const branchInfo = branches.find(b => b.id === s.branchId);
      matchBranch = branchInfo ? branchInfo.name === filterCabang : false;
    }

    let matchCategory = true;
    if (filterKategori !== 'Semua Kategori') {
      matchCategory = s.items?.some((item: any) => {
        const prod = products.find(p => p.id === item.productId);
        return prod && prod.category === filterKategori;
      }) ?? false;
    }

    return matchRegion && matchBranch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[#131d42] p-4 border border-[#1d2a57] rounded-xl">
        <div className="w-full sm:w-auto flex-1 flex flex-col sm:flex-row gap-4">
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
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

        <div className="overflow-x-auto rounded-2xl border border-[#1d2a57] shadow-xl">
             <table className="min-w-full divide-y divide-[#1d2a57]/30">
               <thead className="bg-[#090f26]">
                 <tr>
                   <th className="px-5 py-4 text-left text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">Invoice</th>
                   <th className="px-5 py-4 text-left text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">Tanggal</th>
                   <th className="px-5 py-4 text-left text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">Cabang</th>
                   <th className="px-5 py-4 text-left text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">Outlet</th>
                   <th className="px-5 py-4 text-right text-[11px] font-black tracking-widest text-[#b4f56b] uppercase">Total Harga</th>
                 </tr>
               </thead>
               <tbody className="bg-[#0b1330] divide-y divide-[#1d2a57]/30">
                 {branchSales.length === 0 ? (
                   <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500 font-bold text-xs uppercase tracking-wider">Tidak ada data penjualan.</td></tr>
                 ) : (
                   branchSales.map(s => (
                     <tr key={s.id} className="hover:bg-[#131d42]/60 transition-colors">
                       <td className="px-5 py-4 text-sm font-bold text-[#b4f56b] font-mono uppercase">
                         <button 
                           type="button" 
                           onClick={() => openInvoiceModal(s.invoice)}
                           className="hover:underline hover:text-white transition-colors cursor-pointer text-left focus:outline-none flex items-center gap-1 group"
                           title="Klik untuk lihat rincian barang"
                         >
                           {s.invoice}
                         </button>
                       </td>
                       <td className="px-5 py-4 text-sm text-slate-400 font-mono font-medium">{formatDate(s.date)}</td>
                       <td className="px-5 py-4 text-sm text-slate-300 font-semibold uppercase">{branches.find(b => b.id === s.branchId)?.name || '-'}</td>
                       <td className="px-5 py-4 text-sm text-slate-300 font-semibold">{s.customer}</td>
                       <td className="px-5 py-4 text-sm text-[#b4f56b] font-black text-right font-mono">{formatRupiah(s.grandTotal)}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
        </div>
    </div>
  );
}
