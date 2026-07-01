import React, { useState, useEffect } from 'react';
import { usePosStore } from '../../store';
import { Plus, Edit2, Trash2, X, User as UserIcon, Key } from 'lucide-react';
import { User } from '../../types';

export default function PengaturanPengguna() {
  const { users, branches, customers, addUser, updateUser, deleteUser, fetchAllData } = usePosStore();

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: User['role'];
    branchId: string;
    status: 'Aktif' | 'Nonaktif';
    password?: string;
    confirmPassword?: string;
    outletName?: string;
  }>({
    name: '',
    email: '',
    role: 'Admin',
    branchId: '',
    status: 'Aktif',
    password: '',
    confirmPassword: '',
    outletName: '',
    parentId: ''
  });

  const [selectedWilayah, setSelectedWilayah] = useState<string>('');
  const uniqueRegions = Array.from(new Set(branches.map(b => b.wilayah).filter(Boolean))) as string[];

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      const userBranch = branches.find(b => b.id === user.branchId);
      setSelectedWilayah(userBranch?.wilayah || '');
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId || '',
        status: user.status || 'Aktif',
        password: '',
        confirmPassword: '',
        outletName: user.outletName || '',
        parentId: user.parentId || ''
      });
    } else {
      setEditingUser(null);
      setSelectedWilayah('');
      setFormData({ name: '', email: '', role: 'Admin', branchId: '', status: 'Aktif', password: '', confirmPassword: '', outletName: '', parentId: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        alert("Password dan Konfirmasi Password tidak cocok!");
        return;
      }
    }

    const { confirmPassword, branchId, outletName, parentId, ...restData } = formData;
    const payload = {
      ...restData,
      branchId: branchId || null,
      outletName: formData.role === 'Outlet' && outletName ? outletName : null,
      parentId: parentId || null
    };

    if (editingUser) {
      updateUser(editingUser.id, payload as any);
    } else {
      addUser(payload as any);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      deleteUser(id);
    }
  };

  const handleResetPassword = (user: User) => {
    setResettingUser(user);
    setNewPassword(''); // Kosongkan inputan
    setIsResetModalOpen(true);
  };

  const submitResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resettingUser) {
      if (newPassword.length < 6) {
        alert("Gagal mereset: Password harus terdiri dari minimal 6 karakter!");
        return;
      }
      // Buka modal konfirmasi kustom, bukan bawaan browser
      setIsConfirmResetOpen(true);
    }
  };

  // Fungsi baru untuk eksekusi final
  const handleConfirmReset = () => {
    if (resettingUser) {
      updateUser(resettingUser.id, { ...resettingUser, password: newPassword });
      alert(`Password untuk ${resettingUser.name} berhasil direset!`);
      setIsConfirmResetOpen(false);
      setIsResetModalOpen(false);
      setResettingUser(null);
    }
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return 'Pusat';
    return branches.find(b => b.id === branchId)?.name || 'Pusat';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-6 bg-[#b4f56b] rounded-full"></div>
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">MANAJEMEN PENGGUNA</h2>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#b4f56b] hover:bg-[#a3e451] text-black font-black text-xs py-3 px-5 rounded-2xl tracking-widest transition-all uppercase shadow-md flex items-center gap-2 cursor-pointer active:scale-95 duration-150 animate-pulse"
        >
          <Plus className="-ml-1 mr-1 h-4 w-4" strokeWidth={3} />
          TAMBAH PENGGUNA
        </button>
      </div>

      {['Admin', 'Cabang', 'Outlet'].map((roleGroup) => {
        const roleUsers = users.filter(u => u.role === roleGroup);
        if (roleUsers.length === 0) return null;

        return (
          <div key={roleGroup} className="mb-8">
            <h3 className="text-sm font-bold text-[#b4f56b] uppercase tracking-widest mb-3 pl-2 border-l-4 border-[#b4f56b]">
              {roleGroup === 'Cabang' ? 'Admin Cabang' : roleGroup}
            </h3>
            <div className="bg-[#0e1531] border border-[#1d2a57] rounded-3xl overflow-hidden shadow-2xl">
              <ul className="divide-y divide-[#1d2a57]/30">
                {roleUsers.map((u) => (
                  <li key={u.id}>
                    <div className="px-5 py-4 sm:px-6 hover:bg-[#182352]/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 bg-[#b4f56b]/10 p-2.5 rounded-2xl border border-[#b4f56b]/30">
                            <UserIcon className="h-6 w-6 text-[#b4f56b]" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-bold text-white uppercase">{u.name}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</p>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex flex-wrap items-center justify-end gap-2 sm:gap-4">
                           <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full ${u.status === 'Aktif' ? 'bg-[#b4f56b]/10 text-[#b4f56b] border border-[#b4f56b]/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                             {u.status || 'Aktif'}
                           </span>
                           <span className="px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full bg-[#182352] text-sky-400 border border-sky-400/20 uppercase">
                             {u.role}
                           </span>
                           <span className="hidden sm:inline-block text-xs text-slate-400 uppercase tracking-wider font-semibold">
                             {u.role === 'Outlet' ? (u.outletName || u.name) : getBranchName(u.branchId)}
                           </span>
                          <button onClick={() => handleResetPassword(u)} className="p-2 text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors cursor-pointer" title="Reset Password">
                            <Key className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleOpenModal(u)} className="p-2 text-sky-450 hover:bg-sky-400/10 rounded-lg transition-colors cursor-pointer" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {u.role !== 'Admin' && (
                            <button onClick={() => handleDelete(u.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer" title="Hapus">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={handleCloseModal}>
          <div className="bg-[#0e1531] w-full max-w-md rounded-2xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#1d2a57]">
                <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">{editingUser ? 'Edit' : 'Tambah'} Pengguna</h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: H. Taufiq"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Email / Username</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: taufiq@lucifer.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Password</label>
                    <input
                      type="password"
                      placeholder={editingUser ? "Kosongkan jika tak ingin diubah" : "Minimal 6 karakter"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Konfirmasi Password</label>
                    <input
                      type="password"
                      placeholder="Ketik ulang password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Akses / Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Cabang">Admin Cabang</option>
                      <option value="Outlet">Outlet</option>
                    </select>
                  </div>
                  {(formData.role === 'Cabang' || formData.role === 'Outlet') && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Wilayah</label>
                        <select
                          value={selectedWilayah}
                          onChange={(e) => {
                            setSelectedWilayah(e.target.value);
                            setFormData({ ...formData, branchId: '' }); // Reset pilihan cabang saat wilayah diganti
                          }}
                          className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                        >
                          <option value="">-- Pilih Wilayah --</option>
                          {uniqueRegions.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Cabang Tugas</label>
                        <select
                          value={formData.branchId}
                          onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                          disabled={!selectedWilayah}
                          className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <option value="">-- Pilih Cabang --</option>
                          {branches.filter(b => b.wilayah === selectedWilayah).map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      {formData.role === 'Outlet' && (
                        <div>
                          <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Outlet Terkait</label>
                          <select
                            value={formData.outletName || ''}
                            onChange={(e) => setFormData({ ...formData, outletName: e.target.value })}
                            disabled={!formData.branchId}
                            className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer disabled:opacity-50"
                          >
                            <option value="">-- Pilih Outlet --</option>
                            {customers.filter(c => c.cabang === branches.find(b => b.id === formData.branchId)?.name).map(c => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                  {formData.role === 'Cabang' && (
                    <div>
                      <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Kantor Pusat</label>
                      <select
                        value={formData.parentId || ''}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                      >
                        <option value="">-- Pilih Kantor Pusat --</option>
                        {users.filter(u => u.role === 'Admin').map(u => (
                          <option key={u.id} value={u.id}>Kantor Pusat</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {formData.role === 'Outlet' && (
                    <div>
                      <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Induk Cabang</label>
                      <select
                        value={formData.parentId || ''}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                      >
                        <option value="">-- Pilih Cabang --</option>
                        {users.filter(u => u.role === 'Cabang' && (!formData.branchId || u.branchId === formData.branchId)).map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Status Akun</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold text-sm py-4 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-[#b4f56b] hover:bg-[#a5e45a] text-black font-extrabold text-sm py-4 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer flex flex-col items-center justify-center"
                  >
                    <span>Simpan</span>
                    <span>Pengguna</span>
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Modal Khusus Reset Password */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsResetModalOpen(false)}>
          <div className="bg-[#0e1531] w-full max-w-sm rounded-2xl border border-[#1d2a57] shadow-2xl overflow-hidden text-white animate-scaleUp" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#1d2a57]">
              <h3 className="text-sm font-extrabold tracking-wide uppercase text-white">Reset Password</h3>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitResetPassword} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                  Masukkan kata sandi baru untuk <strong className="text-white uppercase tracking-wider">{resettingUser.name}</strong>.
                </p>
                <label className="block text-[11px] font-bold tracking-widest text-[#b4f56b] uppercase mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#182352] text-white border border-[#1d2a57] rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-1 focus:ring-[#b4f56b] text-sm font-semibold placeholder-slate-500"
                />
              </div>
              <div className="pt-2 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold text-sm py-3 px-4 rounded-xl transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg transition-transform focus:scale-95 uppercase tracking-wider cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Khusus Konfirmasi Reset */}
      {isConfirmResetOpen && resettingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setIsConfirmResetOpen(false)}>
          <div className="bg-[#0e1531] w-full max-w-sm rounded-3xl border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.15)] overflow-hidden text-center p-8 animate-scaleUp" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-orange-500/20">
              <Key className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-white mb-3 uppercase tracking-widest">Konfirmasi Reset</h3>
            <p className="text-slate-300 text-sm mb-8 leading-relaxed">
              Apakah Anda yakin ingin mengganti kata sandi untuk pengguna <strong className="text-orange-400 uppercase">{resettingUser.name}</strong>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsConfirmResetOpen(false)}
                className="w-1/2 bg-[#1c274c] hover:bg-[#1a233f] text-white font-extrabold py-3 px-4 rounded-xl transition-all hover:scale-95 uppercase text-[11px] tracking-widest"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReset}
                className="w-1/2 bg-orange-500 hover:bg-orange-400 text-white font-extrabold py-3 px-4 rounded-xl shadow-lg transition-all hover:scale-95 uppercase text-[11px] tracking-widest"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
