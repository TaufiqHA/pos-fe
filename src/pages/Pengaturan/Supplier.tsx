import React, { useState } from 'react';
import { usePosStore } from '../../store';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function Supplier() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = usePosStore();
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<{id:string} | null>(null);
  const [formData, setFormData] = useState({ name: '', contactName: '', phone: '', address: '' });

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.contactName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (sup?: any) => {
    if (sup) {
      setEditingSupplier(sup);
      setFormData({ name: sup.name, contactName: sup.contactName, phone: sup.phone, address: sup.address });
    } else {
      setEditingSupplier(null);
      setFormData({ name: '', contactName: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) updateSupplier(editingSupplier.id, formData);
    else addSupplier(formData);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">PENGATURAN SUPPLIER</h2>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xs py-3 px-5 rounded-2xl tracking-widest transition-all uppercase shadow-md flex items-center gap-2 cursor-pointer active:scale-95 duration-150"
        >
          <Plus className="-ml-1 mr-1 h-4 w-4" strokeWidth={3} /> TAMBAH SUPPLIER
        </button>
      </div>

      <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1d2a57]/40 bg-[#0c143a]">
          <input 
            type="text" 
            placeholder="Search nama / CP supplier..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-4 py-2.5 w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-[#b4f56b] placeholder-slate-500 text-sm font-semibold" 
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1d2a57]/30">
            <thead className="bg-[#090f26]/70">
              <tr>
                <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Nama Supplier</th>
                <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Kontak Personal</th>
                <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">No. HP</th>
                <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Alamat</th>
                <th className="px-6 py-4.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                    Belum ada data supplier terdaftar.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#131d42]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white uppercase">{s.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-semibold">{s.contactName || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300 font-bold">{s.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-medium">{s.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => handleOpenModal(s)} className="text-sky-400 hover:text-sky-300 mr-4 transition-colors p-1.5 hover:bg-sky-400/10 rounded-lg">
                        <Edit className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => { if(confirm('Hapus supplier?')) deleteSupplier(s.id); }} className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-red-400/10 rounded-lg">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-[#0b1330] w-full max-w-lg rounded-3xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#1d2a57] bg-[#090f26]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#b4f56b]" />
                <h3 className="text-md font-extrabold tracking-wide uppercase text-white">
                  {editingSupplier ? 'Edit Profil Supplier' : 'Daftarkan Supplier Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Nama Perusahaan / Supplier</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Contoh: PT Lucifer Cahaya Abadi"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Kontak Personal (CP)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: H. Taufiq"
                  value={formData.contactName} 
                  onChange={e => setFormData({...formData, contactName: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">No. HP / Telepon</label>
                <input 
                  type="text" 
                  placeholder="Contoh: 08123456789"
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-mono font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Alamat Lengkap</label>
                <textarea 
                  rows={2} 
                  placeholder="Masukkan alamat gudang/supplier..."
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold" 
                />
              </div>
              <div className="pt-4 flex gap-3 flex-row-reverse">
                <button 
                  type="submit" 
                  className="w-full bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-xs py-3 px-6 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Simpan Supplier
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
