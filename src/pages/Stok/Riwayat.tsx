import React from 'react';
import { usePosStore } from '../../store';
import { formatDate } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const extractInvoice = (reason: string): string | null => {
  if (!reason) return null;
  const match = reason.match(/(PO-[A-Z0-9-]+|INV-[A-Z0-9-]+)/i);
  return match ? match[1].toUpperCase() : null;
};

export default function StokRiwayat() {
  const { user, stockHistory, purchases, openInvoiceModal } = usePosStore();

  let visibleHistory = stockHistory;

  // Filter out stock history records referencing non-existent (deleted) POs
  visibleHistory = visibleHistory.filter(h => {
    const invoice = extractInvoice(h.reason || '');
    if (invoice && invoice.startsWith('PO-')) {
      return purchases.some(p => p.invoice === invoice);
    }
    return true;
  });

  if (user?.role === 'Cabang') {
    visibleHistory = visibleHistory.filter(h => h.branchId === user?.branchId);
  }

  // sort by date descending
  const sortedHistory = [...visibleHistory].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">RIWAYAT STOK</h2>
        </div>
      </div>

      <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1d2a57]/30">
            <thead className="bg-[#090f26]/70">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tanggal</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Produk</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Tipe</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Jumlah</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Stok Sebelum</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Stok Sesudah</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">No. Referensi</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Oleh</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Alasan</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
              {sortedHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                    Belum ada riwayat stok.
                  </td>
                </tr>
              ) : (
                sortedHistory.map((log) => {
                  const invoice = extractInvoice(log.reason);
                  return (
                    <tr key={log.id} className="hover:bg-[#182352]/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                        {formatDate(log.date || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white uppercase">{log.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                           {log.type === 'Tambah' ? (
                              <span className="flex items-center text-[#b4f56b] font-bold text-xs uppercase tracking-wider bg-[#b4f56b]/10 px-2.5 py-0.5 rounded-full border border-[#b4f56b]/30">
                                <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> {log.reason?.toUpperCase().includes('PO') ? 'Tambah dari PO' : 'Penyesuaian'}
                              </span>
                           ) : (
                              <span className="flex items-center text-red-400 font-bold text-xs uppercase tracking-wider bg-red-400/10 px-2.5 py-0.5 rounded-full border border-red-400/30">
                                <ArrowDownRight className="w-3.5 h-3.5 mr-1" /> Kurang
                              </span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right font-mono">
                         {log.type === 'Tambah' ? '+' : '-'}{log.qty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 text-right font-mono">{log.prevStock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 text-right font-mono">{log.newStock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {invoice ? (
                          <button
                            onClick={() => openInvoiceModal(invoice)}
                            className="text-[#b4f56b] hover:text-[#a5e45a] underline font-bold tracking-wider font-mono cursor-pointer bg-transparent border-none p-0"
                          >
                            {invoice}
                          </button>
                        ) : (
                          <span className="text-slate-500 font-mono">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">{log.userName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{log.reason}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
