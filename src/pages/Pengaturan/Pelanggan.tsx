import React, { useState } from 'react';
import { usePosStore } from '../../store';
import { Plus, Edit, Trash2, X } from 'lucide-react';

export default function Pelanggan() {
  const { user, users, customers, branches, addCustomer, updateCustomer, deleteCustomer, addUser, updateUser, wilayahs } = usePosStore();
  const [search, setSearch] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('Semua Wilayah');
  const [filterCabang, setFilterCabang] = useState('Semua Cabang');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<{id:string} | null>(null);

  const [formData, setFormData] = useState({ name: '', phone: '', address: '', notes: '', wilayah: '', cabang: '', password: '', email: '', branchId: '' });

  let visibleCustomers = customers;
  if (user?.role === 'Cabang') {
    const userBranch = branches.find(b => b.id === user.branchId);
    visibleCustomers = customers.filter(c => 
      c.branchId === user.branchId || (userBranch && c.cabang === userBranch.name)
    );
  }

  const filtered = visibleCustomers.filter(c => {
    // 1. Filter Search (Nama / HP)
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        (c.phone && c.phone.includes(search));

    // Relasi branch untuk fallback wilayah/cabang jika data langsung di customer kosong
    const branchObj = branches.find(b => b.id === c.branchId || b.name === c.cabang);

    // 2. Filter Wilayah
    let matchWilayah = true;
    if (filterWilayah !== 'Semua Wilayah') {
      const custWilayah = c.wilayah || branchObj?.wilayah;
      matchWilayah = custWilayah === filterWilayah;
    }

    // 3. Filter Cabang
    let matchCabang = true;
    if (filterCabang !== 'Semua Cabang') {
      const custCabang = c.cabang || branchObj?.name;
      matchCabang = custCabang === filterCabang;
    }

    return matchSearch && matchWilayah && matchCabang;
  });

  const handleOpenModal = (cust?: any) => {
    if (cust) {
      setEditingCustomer(cust);
      setFormData({ name: cust.name || '', phone: cust.phone || '', address: cust.address || '', notes: cust.notes || '', wilayah: cust.wilayah || '', cabang: cust.cabang || '', password: cust.password || '', email: cust.email || '' });
    } else {
      setEditingCustomer(null);
      let defaultWilayah = '';
      let defaultCabang = '';
      let defaultBranchId = '';
      
      if (user?.role === 'Cabang') {
        const userBranch = branches.find(b => b.id === user.branchId);
        if (userBranch) {
          defaultWilayah = userBranch.wilayah || '';
          defaultCabang = userBranch.name || '';
          defaultBranchId = userBranch.id;
        }
      }
      
      setFormData({ name: '', phone: '', address: '', notes: '', wilayah: defaultWilayah, cabang: defaultCabang, password: '', email: '', branchId: defaultBranchId });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchObj = branches.find(b => b.name === formData.cabang);
    const fixedBranchId = branchObj?.id || (formData as any).branchId || user?.branchId;
    const finalFormData = { ...formData, branchId: fixedBranchId };

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, finalFormData);
      const associatedUser = users?.find(u => (u.role === 'Outlet' || u.role === 'Cust') && (u.outletName === (editingCustomer as any).name || u.name === (editingCustomer as any).name));
      if (associatedUser) {
        await updateUser(associatedUser.id, {
          name: formData.name,
          outletName: formData.name,
          branchId: fixedBranchId
        });
      }
    } else {
      await addCustomer(finalFormData);
      
      await addUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'Outlet',
        outletName: formData.name,
        branchId: fixedBranchId,
        status: 'Aktif'
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">PENGATURAN OUTLET</h2>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xs py-3 px-5 rounded-2xl tracking-widest transition-all uppercase shadow-md flex items-center gap-2 cursor-pointer active:scale-95 duration-150"
        >
          <Plus className="-ml-1 mr-1 h-4 w-4" strokeWidth={3} /> TAMBAH OUTLET
        </button>
      </div>

      <div className="bg-[#0b1330] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#1d2a57]/40 bg-[#0c143a] flex flex-col sm:flex-row gap-4 justify-between items-center">
          <input 
            type="text" 
            placeholder="Search nama / No. HP outlet..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-4 py-2.5 w-full sm:max-w-sm focus:outline-none focus:ring-1 focus:ring-[#b4f56b] placeholder-slate-500 text-sm font-semibold" 
          />

          {user?.role !== 'Cabang' && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Dropdown Filter Wilayah */}
              <select 
                value={filterWilayah}
                onChange={(e) => {
                  setFilterWilayah(e.target.value);
                  setFilterCabang('Semua Cabang'); // Reset cabang saat wilayah berubah
                }}
                className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-4 py-2.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
              >
                <option value="Semua Wilayah">Semua Wilayah</option>
                {wilayahs.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Dropdown Filter Cabang */}
              <select 
                value={filterCabang}
                onChange={(e) => setFilterCabang(e.target.value)}
                className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-4 py-2.5 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
              >
                <option value="Semua Cabang">Semua Cabang</option>
                {branches
                  .filter(b => filterWilayah === 'Semua Wilayah' || b.wilayah === filterWilayah)
                  .map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
              </select>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1d2a57]/30">
            <thead className="bg-[#090f26]/70">
              <tr>
                <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Nama Outlet</th>
                <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">No. HP</th>
                <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Alamat</th>
                <th className="px-6 py-4.5 text-left text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Catatan</th>
                <th className="px-6 py-4.5 text-center text-xs font-bold tracking-widest text-[#b4f56b] uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-[#1d2a57]/30 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500 font-semibold uppercase tracking-wider">
                    Belum ada data outlet terdaftar.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#131d42]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white uppercase">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-300 font-bold">{c.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-medium">{c.address || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-medium italic">{c.notes || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => handleOpenModal(c)} className="text-sky-400 hover:text-sky-300 mr-4 transition-colors p-1.5 hover:bg-sky-400/10 rounded-lg">
                        <Edit className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => { if(confirm('Hapus outlet?')) deleteCustomer(c.id); }} className="text-red-400 hover:text-red-300 transition-colors p-1.5 hover:bg-red-400/10 rounded-lg">
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
                  {editingCustomer ? 'Edit Profil Outlet' : 'Daftarkan Outlet Baru'}
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
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Nama Lengkap</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Contoh: Outlet Mitra Abadi"
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">No. HP / Telepon</label>
                <input 
                  type="text" 
                  placeholder="Contoh: 08123456789"
                  value={formData.phone || ''} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-mono font-bold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Alamat Lengkap</label>
                <textarea 
                  rows={2} 
                  placeholder="Masukkan alamat outlet..."
                  value={formData.address || ''} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Catatan Khusus</label>
                <textarea 
                  rows={2} 
                  placeholder="Catatan porsi orderan, limit kredit, dsb..."
                  value={formData.notes || ''} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Email Outlet (Untuk Login)</label>
                <input 
                  type="email" 
                  required={!editingCustomer}
                  placeholder="Contoh: outlet@gmail.com"
                  value={formData.email || ''} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Password Outlet</label>
                <input 
                  type="password" 
                  placeholder="Masukkan password untuk outlet..."
                  value={formData.password || ''} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold" 
                />
              </div>
              {user?.role !== 'Cabang' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Wilayah</label>
                    <select 
                      required
                      value={formData.wilayah || ''} 
                      onChange={(e) => setFormData({ ...formData, wilayah: e.target.value, cabang: '' })}
                      className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                    >
                      <option value="" disabled>Pilih wilayah...</option>
                      {wilayahs.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold tracking-widest text-[#b4f56b] uppercase mb-1.5">Cabang Utama</label>
                    <select 
                      required
                      value={formData.cabang || ''} 
                      onChange={(e) => setFormData({ ...formData, cabang: e.target.value })}
                      className="bg-[#131d42] text-white border border-[#21306b] rounded-xl px-3.5 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                    >
                      <option value="" disabled>Pilih cabang...</option>
                      {branches
                        .filter(b => !formData.wilayah || b.wilayah === formData.wilayah || !b.wilayah || b.name === formData.cabang)
                        .map(b => (
                        <option key={b.id} value={b.name}>{b.name} {!b.wilayah ? '(Belum set wilayah)' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="pt-4 flex gap-3 flex-row-reverse">
                <button 
                  type="submit" 
                  className="w-full bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-xs py-3 px-6 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-widest cursor-pointer"
                >
                  Simpan Outlet
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
