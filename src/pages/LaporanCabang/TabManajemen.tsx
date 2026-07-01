import React, { useState } from 'react';
import { usePosStore } from '../../store';
import { 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Store, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Settings, 
  Save, 
  Edit 
} from 'lucide-react';
import { Branch } from '../../types';

export default function TabManajemen() {
  // 1. Ambil fungsi action dari usePosStore
  const { 
    branches, 
    customers, 
    wilayahs, 
    addBranch, 
    updateBranch, 
    deleteBranch, 
    addWilayah, 
    editWilayah, 
    deleteWilayah, 
    addUser 
  } = usePosStore();

  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});
  
  // State untuk Modal Tambah/Edit Cabang
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // State untuk Modal Kelola Wilayah
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{old: string, new: string} | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // State Form Data Cabang
  const [formData, setFormData] = useState({
    wilayah: '',
    name: '',
    address: '',
    phone: '',
    notes: '',
    email: '',
    password: ''
  });

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  // Handler untuk membuka modal Tambah / Edit
  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        wilayah: branch.wilayah || '',
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        notes: branch.notes || '',
        email: '',
        password: ''
      });
    } else {
      setEditingBranch(null);
      setFormData({ wilayah: '', name: '', address: '', phone: '', notes: '', email: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  // Handler Submit data cabang baru / update cabang
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password, ...branchData } = formData;
    
    if (editingBranch) {
      await updateBranch(editingBranch.id, branchData);
    } else {
      const newBranch = await addBranch(branchData);
      
      // Jika cabang baru berhasil dibuat dan ada email/password, buatkan akun login otomatis
      if (newBranch && email && password) {
        try {
          await addUser({
            name: `Admin ${formData.name}`,
            email: email,
            role: 'Cabang',
            branchId: newBranch.id,
            status: 'Aktif',
            password: password,
          });
        } catch (error) {
          console.error("Gagal membuat user untuk cabang:", error);
          alert("Cabang berhasil dibuat, tetapi gagal membuat user. Silakan buat user secara manual di menu Pengaturan Pengguna.");
        }
      }
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus cabang ini?')) {
      deleteBranch(id);
    }
  };

  const regions = wilayahs;

  return (
    <div className="space-y-6">
      
      {/* Tombol Aksi Utama: Tambah Cabang Baru */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xs py-3 px-5 rounded-2xl tracking-widest transition-all uppercase shadow-md flex items-center gap-2 cursor-pointer active:scale-95 duration-150"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          TAMBAH CABANG BARU
        </button>
      </div>

      {regions.length === 0 && (
        <div className="text-center py-8 text-slate-500 font-bold text-sm uppercase tracking-wide">
          Belum ada data wilayah atau cabang
        </div>
      )}
      
      {regions.map(region => {
        const isExpanded = expandedRegions[region];
        const regionBranches = branches.filter(b => b.wilayah === region);

        return (
          <div key={region} className="bg-[#182352] border border-[#1d2a57] rounded-xl overflow-hidden shadow-lg">
            <button 
              className="w-full flex items-center justify-between p-4 bg-[#131d42] hover:bg-[#1c274c] transition-colors focus:outline-none"
              onClick={() => toggleRegion(region)}
            >
              <div className="flex items-center gap-3">
                <MapPin className="text-[#b4f56b] w-5 h-5" />
                <span className="font-extrabold text-white uppercase tracking-wider">{region}</span>
                <span className="bg-[#0b1330] text-slate-300 text-xs px-2.5 py-1 rounded-md font-mono border border-white/5">{regionBranches.length} Cabang</span>
              </div>
              {isExpanded ? <ChevronDown className="text-[#b4f56b]" /> : <ChevronRight className="text-slate-400" />}
            </button>
            
            {isExpanded && (
              <div className="p-4 space-y-4 border-t border-[#1d2a57] bg-[#0e1531]">
                {regionBranches.map(branch => {
                  const branchOutlets = customers.filter(c => c.branchId === branch.id || c.cabang === branch.name);
                  
                  return (
                    <div key={branch.id} className="bg-[#0b1330] p-4 rounded-xl border border-[#1d2a57]/50 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#38bdf8] opacity-50 group-hover:opacity-100 transition-opacity"></div>
                      
                      {/* Section Info Cabang + Tombol Edit/Hapus */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 pl-2">
                        <div>
                          <h4 className="text-sm font-bold text-[#b4f56b] flex items-center gap-2 uppercase tracking-wide">
                            <Store className="w-4 h-4 text-[#38bdf8]" /> {branch.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 font-medium">{branch.address} • <span className="text-slate-300 font-mono">{branch.phone}</span></p>
                        </div>
                        
                        {/* Tombol Edit & Hapus Cabang */}
                        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                          <button 
                            onClick={() => handleOpenModal(branch)} 
                            className="text-sky-400 hover:text-sky-300 transition-colors p-1.5 hover:bg-sky-400/10 rounded-lg"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(branch.id)} 
                            className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-red-400/10 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Section List Outlet */}
                      <div className="mt-3 pt-3 border-t border-white/5 pl-2">
                        <div className="text-[10px] font-black text-slate-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-widest">
                          <Users className="w-3.5 h-3.5 text-[#a78bfa]" /> Outlet Terdaftar ({branchOutlets.length})
                        </div>
                        {branchOutlets.length === 0 ? (
                          <p className="text-xs text-slate-600 font-bold italic uppercase">Belum ada outlet</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {branchOutlets.map(outlet => (
                              <div key={outlet.id} className="bg-[#131d42] border border-[#1d2a57] px-3 py-2 rounded-lg text-xs font-bold text-slate-300 truncate shadow-inner flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#a78bfa]/50"></div>
                                {outlet.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH & EDIT DATA CABANG                                        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={handleCloseModal}>
          <div 
            className="bg-[#0b1330] w-full max-w-lg rounded-3xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#1d2a57] bg-[#090f26]">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[#b4f56b]" />
                <h3 className="text-md font-extrabold tracking-wide uppercase text-white">
                  {editingBranch ? 'Edit Informasi Cabang' : 'Daftarkan Cabang Baru'}
                </h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Pilih Wilayah</label>
                  <button type="button" onClick={() => setIsManageModalOpen(true)} className="text-[#b4f56b] text-[10px] hover:text-white flex items-center gap-1 font-bold uppercase">
                    <Settings size={12} /> Kelola
                  </button>
                </div>
                <select 
                  required
                  value={formData.wilayah} 
                  onChange={(e) => setFormData({ ...formData, wilayah: e.target.value })}
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                >
                  <option value="" disabled>Pilih wilayah...</option>
                  {wilayahs.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Nama Cabang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Lucifer Store Jakarta"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Nomor Telepon</label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Masukkan alamat cabang..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Catatan Khusus</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan (opsional)..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold"
                />
              </div>

              {!editingBranch && (
                <>
                  <div className="border-t border-[#1d2a57]/50 pt-4 mt-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Akun Login Cabang</h4>
                    <div>
                      <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Email Cabang (Untuk Login)</label>
                      <input
                        type="email"
                        required
                        placeholder="Contoh: admin@cabang.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Password Cabang</label>
                    <input
                      type="password"
                      required
                      placeholder="Masukkan password untuk cabang..."
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-3 flex-row-reverse">
                <button
                  type="submit"
                  className="w-full bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-xs py-3 px-6 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Simpan Cabang
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: KELOLA WILAYAH / REGION                                          */}
      {/* ========================================================================= */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => { setIsManageModalOpen(false); setEditingItem(null); setNewItemName(''); }}>
          <div
            className="bg-[#0e1531] w-full max-w-sm rounded-2xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d2a57]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#b4f56b]" />
                <h3 className="text-md font-extrabold tracking-wide uppercase text-white">Kelola Wilayah</h3>
              </div>
              <button
                onClick={() => { setIsManageModalOpen(false); setEditingItem(null); setNewItemName(''); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {wilayahs.map(item => (
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
                          editWilayah(editingItem.old, editingItem.new);
                          const branchesToUpdate = branches.filter(b => b.wilayah === editingItem.old);
                          branchesToUpdate.forEach(b => {
                             updateBranch(b.id, { wilayah: editingItem.new });
                          });
                          if (formData.wilayah === editingItem.old) setFormData({...formData, wilayah: editingItem.new});
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
                          if (confirm(`Hapus wilayah "${item}"?\nPerhatian: Cabang yang menggunakan wilayah ini akan kehilangan data wilayahnya.`)) {
                            deleteWilayah(item);
                            const branchesToUpdate = branches.filter(b => b.wilayah === item);
                            branchesToUpdate.forEach(b => {
                               updateBranch(b.id, { wilayah: '' });
                            });
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
                  placeholder={`Nama Wilayah...`}
                  className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold"
                />
                <button 
                  onClick={() => {
                    if (newItemName.trim() !== '') {
                      if (!wilayahs.includes(newItemName)) addWilayah(newItemName);
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
