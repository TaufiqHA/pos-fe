import React, { useState, useMemo } from 'react';
import { usePosStore } from '../store';
import { formatRupiah, formatDate } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

export default function Laporan() {
  const { user, sales, products, openInvoiceModal, branches } = usePosStore();
  
  // Date filter
  const [filterPeriod, setFilterPeriod] = useState('7hari');

  const filteredSales = useMemo(() => {
    let baseSales = sales;
    if (user?.role === 'Admin') {
      baseSales = sales.filter(s => branches.some(b => b.name === s.customer));
    } else if (user?.role === 'Cabang') {
      baseSales = sales.filter(s => s.branchId === user?.branchId);
    } else if (user?.role === 'Sales') {
      baseSales = sales.filter(s => s.userId === user?.id);
    } else if (user?.role === 'Cust' || user?.role === 'Outlet') {
      const targetCustomer = user?.outletName || user?.name;
      baseSales = sales.filter(s => s.customer === targetCustomer);
    }

    const now = new Date();
    const daysToSubtract = filterPeriod === '7hari' ? 7 : filterPeriod === '30hari' ? 30 : 0;
    
    const validSales = baseSales.filter(s => {
      const st = (s.status || '').toLowerCase();
      return st !== 'dibatalkan' && st !== 'batal' && st !== 'ditolak';
    });

    if (daysToSubtract === 0) return validSales; // Semua

    const threshold = new Date(now.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
    return validSales.filter(s => new Date(s.date) >= threshold);
  }, [sales, filterPeriod, user]);

  // Aggregations
  const totalOmset = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);
  
  const totalItemsSold = filteredSales.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + item.qty, 0);
  }, 0);

  // Profit calculation (using item.cogs if available, fallback to role-based cogs)
  const totalProfit = filteredSales.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      
      // Default COGS untuk Pusat adalah cogs dari database atau buyPrice (harga modal asli)
      let cogs = item.cogs ?? product?.buyPrice ?? 0;
      
      // Untuk transaksi yang dilakukan oleh Cabang/Outlet, modal mereka adalah harga beli dari Pusat (sellPrice).
      // Abaikan item.cogs karena item.cogs di backend menyimpan modal Pusat (buyPrice).
      if (s.branchId || user?.role === 'Cabang' || user?.role === 'Outlet') {
        cogs = product?.sellPrice ?? 0;
      }
      
      return sum + ((item.price - cogs) * item.qty);
    }, 0);
  }, 0);

  // Group by date for chart
  const chartDataMap = filteredSales.reduce((acc, s) => {
    const d = new Date(s.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    if (!acc[d]) acc[d] = 0;
    acc[d] += s.grandTotal;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(chartDataMap).reverse().map(date => ({
    date,
    total: chartDataMap[date]
  }));

  // Top Selling Products
  const productSalesMap = filteredSales.reduce((acc, s) => {
    s.items.forEach(item => {
      if (!acc[item.productId]) {
        acc[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      }
      acc[item.productId].qty += item.qty;
      acc[item.productId].revenue += item.subtotal;
    });
    return acc;
  }, {} as Record<string, {name: string, qty: number, revenue: number}>);

  const topProducts = (Object.values(productSalesMap) as {name: string, qty: number, revenue: number}[]).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const handleExport = () => {
    // Generate simple CSV
    let csv = 'Tanggal,Invoice,Pelanggan,Total,Status\n';
    filteredSales.forEach(s => {
      csv += `${formatDate(s.date)},${s.invoice},${s.customer},${s.grandTotal},${s.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'laporan_penjualan.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">LAPORAN PENJUALAN</h2>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={filterPeriod} 
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-4 py-2.5 w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
          >
            <option value="7hari">7 Hari Terakhir</option>
            <option value="30hari">30 Hari Terakhir</option>
            <option value="semua">Semua Waktu</option>
          </select>

          <button 
            onClick={handleExport} 
            className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xs py-3 px-5 rounded-2xl tracking-widest transition-all uppercase shadow-md flex items-center gap-2 cursor-pointer active:scale-95 duration-150 flex-shrink-0"
          >
            <Download className="h-4 w-4" />
            EXPORT CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <dt className="text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Total Omset</dt>
          <dd className="mt-2 text-3xl font-black text-white tracking-tight">{formatRupiah(totalOmset)}</dd>
        </div>
        <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <dt className="text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Total Keuntungan (Estimasi)</dt>
          <dd className="mt-2 text-3xl font-black text-[#5df56b] tracking-tight">{formatRupiah(totalProfit)}</dd>
        </div>
        <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
          <dt className="text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Barang Terjual</dt>
          <dd className="mt-2 text-3xl font-black text-sky-400 tracking-tight">{totalItemsSold} Unit</dd>
        </div>
      </div>

      <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl p-6 shadow-2xl">
        <h3 className="text-md font-black text-white tracking-wider uppercase mb-5">Grafik Penjualan</h3>
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="flex justify-center items-center h-full text-slate-500 font-semibold uppercase tracking-wider text-sm">Tidak ada data untuk periode ini</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b4f56b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#b4f56b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2a57" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `Rp${val / 1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#090f26', borderColor: '#1d2a57', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value: number) => [formatRupiah(value), 'Total Penjualan']} 
                />
                <Area type="monotone" dataKey="total" stroke="#b4f56b" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="p-5 border-b border-[#1d2a57]/40 bg-[#0c143a]">
             <h3 className="text-md font-black text-white tracking-wider uppercase">Produk Terlaris</h3>
          </div>
          <div className="overflow-x-auto flex-1">
             <table className="min-w-full divide-y divide-[#1d2a57]/30">
               <thead className="bg-[#090f26]/70">
                 <tr>
                   <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Produk</th>
                   <th className="px-6 py-4.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Terjual</th>
                   <th className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Omset</th>
                 </tr>
               </thead>
               <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
                 {topProducts.length === 0 ? (
                   <tr>
                     <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                       Tidak ada penjualan
                     </td>
                   </tr>
                 ) : (
                   topProducts.map((p, idx) => (
                     <tr key={idx} className="hover:bg-[#131d42]/30 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white uppercase">{p.name}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-bold text-center font-mono">{p.qty}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#b4f56b] text-right font-mono">{formatRupiah(p.revenue)}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </div>

        <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="p-5 border-b border-[#1d2a57]/40 bg-[#0c143a]">
             <h3 className="text-md font-black text-white tracking-wider uppercase">Detail Transaksi Terakhir</h3>
          </div>
          <div className="overflow-x-auto flex-1">
             <table className="min-w-full divide-y divide-[#1d2a57]/30">
               <thead className="bg-[#090f26]/70">
                 <tr>
                   <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tanggal</th>
                   <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Invoice</th>
                   <th className="px-6 py-4.5 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Total</th>
                 </tr>
               </thead>
               <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
                 {filteredSales.length === 0 ? (
                   <tr>
                     <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                       Tidak ada transaksi
                     </td>
                   </tr>
                 ) : (
                   filteredSales.slice(0, 5).map((s) => (
                     <tr key={s.id} className="hover:bg-[#131d42]/30 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-semibold">{formatDate(s.date)}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#b4f56b] font-mono">
                         <button 
                           type="button" 
                           onClick={() => openInvoiceModal(s.invoice)}
                           className="hover:underline hover:text-white transition-colors cursor-pointer text-left focus:outline-none flex items-center gap-1 group"
                           title="Klik untuk lihat rincian barang"
                         >
                           {s.invoice}
                         </button>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right font-mono">{formatRupiah(s.grandTotal)}</td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
}
