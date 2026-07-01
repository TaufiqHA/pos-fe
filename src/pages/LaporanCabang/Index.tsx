import React, { useState } from 'react';
import TabManajemen from './TabManajemen';
import TabStokCabang from './TabStokCabang';
import TabTransaksiCabang from './TabTransaksiCabang';

export default function LaporanCabang() {
  const [activeTab, setActiveTab] = useState<'manajemen' | 'stok' | 'transaksi'>('manajemen');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
        <h2 className="text-2xl font-black text-white tracking-wider uppercase">LAPORAN CABANG</h2>
      </div>

      <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex border-b border-[#1d2a57]/40 bg-[#0e1531] overflow-x-auto whitespace-nowrap">
          <button 
            className={`flex-1 min-w-[150px] py-4 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'manajemen' ? 'bg-[#182352] text-[#b4f56b] border-b-2 border-[#b4f56b]' : 'text-slate-400 hover:text-white hover:bg-[#131d42]'}`}
            onClick={() => setActiveTab('manajemen')}
          >
            Manajemen Data
          </button>
          <button 
            className={`flex-1 min-w-[150px] py-4 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'stok' ? 'bg-[#182352] text-[#b4f56b] border-b-2 border-[#b4f56b]' : 'text-slate-400 hover:text-white hover:bg-[#131d42]'}`}
            onClick={() => setActiveTab('stok')}
          >
            Stok Cabang
          </button>
          <button 
            className={`flex-1 min-w-[150px] py-4 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'transaksi' ? 'bg-[#182352] text-[#b4f56b] border-b-2 border-[#b4f56b]' : 'text-slate-400 hover:text-white hover:bg-[#131d42]'}`}
            onClick={() => setActiveTab('transaksi')}
          >
            Transaksi Cabang
          </button>
        </div>
        
        <div className="p-4 sm:p-6">
          {activeTab === 'manajemen' && <TabManajemen />}
          {activeTab === 'stok' && <TabStokCabang />}
          {activeTab === 'transaksi' && <TabTransaksiCabang />}
        </div>
      </div>
    </div>
  );
}
