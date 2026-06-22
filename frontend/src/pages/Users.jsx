import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, UserX, UserCheck, Key, Shield, Package, Trash2 } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const ROLE_COLORS = {
  super_admin: 'bg-purple-100 text-purple-700',
  manager:     'bg-blue-100 text-blue-700',
  po:          'bg-indigo-100 text-indigo-700',
  developer:   'bg-emerald-100 text-emerald-700',
  qa:          'bg-amber-100 text-amber-700',
};

const AVATAR_COLORS = ['#4F46E5','#0EA5E9','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];

// ─── UserForm ─────────────────────────────────────────────────────────────────
function UserForm({ user, roles, products, onSave, onClose }) {
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    password: '', role_id: user?.role_id || '',
    avatar_color: user?.avatar_color || '#4F46E5',
    is_active: user?.is_active ?? true,
  });
  const [selectedProducts, setSelectedProducts] = useState(
    () => new Set((user?.products || []).map(p => p.id))
  );
  const [saving, setSaving] = useState(false);

  const toggleProduct = (id) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let userId = user?.id;
      if (userId) {
        const { password, ...rest } = form;
        await client.put(`/users/${userId}`, rest);
      } else {
        if (!form.password) { toast.error('Password wajib untuk user baru'); return; }
        const res = await client.post('/users', form);
        userId = res.data.id;
      }
      await client.put(`/users/${userId}/products`, { product_ids: [...selectedProducts] });
      toast.success(user?.id ? 'User diperbarui' : 'User dibuat');
      onSave();
    } catch {} finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="grid grid-cols-2 gap-4">
      <div>
        <label className="label">Nama Lengkap *</label>
        <input className="input" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      </div>
      <div>
        <label className="label">Email *</label>
        <input type="email" className="input" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
      </div>
      {!user?.id && (
        <div className="col-span-2">
          <label className="label">Password *</label>
          <input type="password" className="input" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Min. 6 karakter" required />
        </div>
      )}
      <div>
        <label className="label">Role</label>
        <select className="select" value={form.role_id}
          onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))}>
          <option value="">— Pilih Role —</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.display_name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="select" value={form.is_active}
          onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>
      <div className="col-span-2">
        <label className="label">Warna Avatar</label>
        <div className="flex gap-2 flex-wrap">
          {AVATAR_COLORS.map(c => (
            <button type="button" key={c} onClick={() => setForm(f => ({ ...f, avatar_color: c }))}
              className={`w-7 h-7 rounded-full border-2 transition-all ${form.avatar_color === c ? 'border-slate-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="col-span-2">
        <label className="label flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-slate-400" />
          Akses Produk
          <span className="text-xs font-normal text-slate-400 ml-1">(min. 1 produk)</span>
        </label>
        {products.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada produk.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 mt-1 border border-slate-200 rounded-lg p-3 bg-slate-50">
            {products.map(p => (
              <label key={p.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-white rounded-md px-2 py-1.5 transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded accent-indigo-600"
                  checked={selectedProducts.has(p.id)} onChange={() => toggleProduct(p.id)} />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#4F46E5' }} />
                <span className="text-sm text-slate-700">
                  <span className="font-mono text-xs text-slate-400 mr-1">{p.code}</span>
                  {p.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Menyimpan...' : (user?.id ? 'Perbarui' : 'Buat User')}
        </button>
      </div>
    </form>
  );
}

// ─── ResetPasswordForm ────────────────────────────────────────────────────────
function ResetPasswordForm({ user, onClose }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving]     = useState(false);
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await client.put(`/users/${user.id}/password`, { password });
      toast.success('Password direset');
      onClose();
    } catch {} finally { setSaving(false); }
  };
  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-slate-500">Reset password untuk <strong>{user.name}</strong></p>
      <div>
        <label className="label">Password Baru *</label>
        <input type="password" className="input" value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 6 karakter" required minLength={6} />
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Mereset...' : 'Reset Password'}
        </button>
      </div>
    </form>
  );
}

// ─── Predefined permissions ───────────────────────────────────────────────────
const PREDEFINED_PERMISSIONS = [
  { key: 'all',               label: 'Akses Penuh',              desc: 'Semua akses tanpa batasan (super admin)' },
  { key: 'read_all',          label: 'Baca Semua Data',          desc: 'Lihat semua data tanpa filter produk' },
  { key: 'view_all_products', label: 'Lihat Semua Produk',       desc: 'Bypass filter produk yang di-assign' },
  { key: 'manage_users',      label: 'Kelola Users',             desc: 'Tambah, edit, nonaktifkan user' },
  { key: 'manage_roles',      label: 'Kelola Roles',             desc: 'Tambah, edit, hapus roles' },
  { key: 'manage_products',   label: 'Kelola Produk',            desc: 'Tambah, edit, hapus produk & roadmap' },
  { key: 'manage_backlog',    label: 'Kelola Backlog',           desc: 'Buat dan edit backlog item' },
  { key: 'manage_sprints',    label: 'Kelola Sprint',            desc: 'Buat dan kelola sprint' },
  { key: 'manage_features',   label: 'Kelola Features',          desc: 'Kelola fitur dan roadmap produk' },
  { key: 'manage_qa',         label: 'Kelola QA',                desc: 'Buat test case, jalankan test' },
  { key: 'update_assigned',   label: 'Update Item Ditugaskan',   desc: 'Hanya item yang di-assign' },
  { key: 'view_reports',      label: 'Lihat Reports',            desc: 'Akses analytics dan dashboard' },
  { key: 'import_data',       label: 'Import Data',              desc: 'Import dari CSV/Jira' },
  { key: 'report_bugs',       label: 'Lapor Bug',                desc: 'Submit bug report dan defect' },
  { key: 'submit_standup',    label: 'Submit Standup',           desc: 'Kirim laporan standup harian' },
];

// ─── RoleForm ─────────────────────────────────────────────────────────────────
function RoleForm({ role, onSave, onClose }) {
  const [displayName, setDisplayName] = useState(role?.display_name || '');
  const [name, setName]               = useState(role?.name || '');
  const [checked, setChecked]         = useState(() => {
    const perms = role?.permissions || {};
    return Object.fromEntries(PREDEFINED_PERMISSIONS.map(p => [p.key, !!perms[p.key]]));
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const save = async () => {
    if (!displayName.trim()) { toast.error('Display name wajib'); return; }
    if (!role?.id && !name.trim()) { toast.error('Nama role wajib'); return; }
    setSaving(true);
    try {
      const permissions = Object.fromEntries(
        PREDEFINED_PERMISSIONS.filter(p => checked[p.key]).map(p => [p.key, true])
      );
      if (role?.id) {
        await client.put(`/roles/${role.id}`, { display_name: displayName, permissions });
        toast.success('Role diperbarui');
      } else {
        await client.post('/roles', { name, display_name: displayName, permissions });
        toast.success('Role dibuat');
      }
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Terjadi kesalahan');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {!role?.id && (
        <div>
          <label className="label">Nama (slug) *</label>
          <input className="input" value={name}
            onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
            placeholder="contoh: senior_dev" />
          <p className="text-xs text-slate-400 mt-1">Hanya huruf kecil, angka, underscore. Tidak bisa diubah.</p>
        </div>
      )}
      <div>
        <label className="label">Display Name *</label>
        <input className="input" value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="contoh: Senior Developer" />
      </div>
      <div>
        <label className="label">Permissions</label>
        <div className="border border-slate-200 rounded-lg bg-slate-50 divide-y divide-slate-100 overflow-hidden">
          {PREDEFINED_PERMISSIONS.map(p => (
            <label key={p.key}
              className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-white transition-colors">
              <input type="checkbox" className="w-4 h-4 mt-0.5 rounded accent-indigo-600 shrink-0"
                checked={!!checked[p.key]} onChange={() => toggle(p.key)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{p.label}</p>
                <p className="text-xs text-slate-400">{p.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {Object.values(checked).filter(Boolean).length} permission dipilih
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
        <button type="button" className="btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Menyimpan...' : (role?.id ? 'Perbarui Role' : 'Buat Role')}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Users() {
  const { hasRole } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [roles,    setRoles]    = useState([]);
  const [products, setProducts] = useState([]);
  const [modal,    setModal]    = useState({ open: false, type: '', data: null });
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('users');
  const [perPage,  setPerPage]  = useState(10);
  const [page,     setPage]     = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [us, rl, pr] = await Promise.all([
        client.get('/users'),
        client.get('/users/roles'),
        client.get('/products'),
      ]);
      setUsers(us.data);
      setRoles(rl.data);
      setProducts(pr.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (user) => {
    await client.put(`/users/${user.id}`, { ...user, is_active: !user.is_active, role_id: user.role_id });
    toast.success(user.is_active ? 'User dinonaktifkan' : 'User diaktifkan');
    load();
  };

  const deleteRole = async (role) => {
    if (!confirm(`Hapus role "${role.display_name}"?`)) return;
    try {
      await client.delete(`/roles/${role.id}`);
      toast.success('Role dihapus');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Gagal menghapus role');
    }
  };

  const totalPages  = Math.max(1, Math.ceil(users.length / perPage));
  const pagedUsers  = users.slice((page - 1) * perPage, page * perPage);

  const handlePerPage = (val) => { setPerPage(val); setPage(1); };

  const closeModal = () => setModal(m => ({ ...m, open: false }));

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {[['users','Users'], ['roles','Roles & Permissions']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <>
          <div className="flex justify-end">
            {hasRole('super_admin','manager') && (
              <button className="btn-primary"
                onClick={() => setModal({ open: true, type: 'user', data: null })}>
                <Plus className="w-4 h-4" /> Tambah User
              </button>
            )}
          </div>
          <div className="card overflow-hidden">
            {/* Per-page toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">{users.length} user</span>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                Tampilkan
                <select className="border border-slate-200 rounded px-1.5 py-0.5 bg-white text-xs"
                  value={perPage} onChange={e => handlePerPage(+e.target.value)}>
                  {[10, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                baris
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th className="text-left px-5 py-3">User</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-center px-4 py-3">Role</th>
                    <th className="text-left px-4 py-3">Produk</th>
                    <th className="text-center px-4 py-3">Status</th>
                    <th className="text-center px-4 py-3">Items Aktif</th>
                    <th className="text-left px-4 py-3">Bergabung</th>
                    <th className="text-center px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map(u => (
                    <tr key={u.id} className="table-row">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{ backgroundColor: u.avatar_color || '#4F46E5' }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role_name] || 'bg-slate-100 text-slate-600'}`}>
                          {u.role_display || u.role_name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(u.products || []).length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Tidak ada</span>
                          ) : (
                            (u.products || []).map(p => (
                              <span key={p.id}
                                className="text-xs font-mono font-medium px-1.5 py-0.5 rounded border"
                                style={{ color: p.color, borderColor: p.color + '55', backgroundColor: p.color + '15' }}>
                                {p.code}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 font-medium">{u.assigned_items}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {u.created_at ? format(parseISO(u.created_at), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-center">
                          {hasRole('super_admin','manager') && (
                            <>
                              <button className="btn-ghost btn-sm p-1.5 rounded-lg" title="Edit"
                                onClick={() => setModal({ open: true, type: 'user', data: u })}>
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {hasRole('super_admin') && (
                                <>
                                  <button className="btn-ghost btn-sm p-1.5 rounded-lg" title="Reset Password"
                                    onClick={() => setModal({ open: true, type: 'reset', data: u })}>
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    className={`btn-ghost btn-sm p-1.5 rounded-lg ${u.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                    title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                    onClick={() => toggleActive(u)}>
                                    {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
                <span>{(page-1)*perPage+1}–{Math.min(page*perPage, users.length)} dari {users.length}</span>
                <div className="flex gap-1">
                  <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                    className="btn-ghost btn-sm px-2.5 py-1 disabled:opacity-40">‹ Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`btn-ghost btn-sm px-2.5 py-1 ${p === page ? 'bg-indigo-50 text-indigo-600 font-medium' : ''}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button disabled={page === totalPages} onClick={() => setPage(p => p+1)}
                    className="btn-ghost btn-sm px-2.5 py-1 disabled:opacity-40">Next ›</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <div className="space-y-4">
          {hasRole('super_admin') && (
            <div className="flex justify-end">
              <button className="btn-primary"
                onClick={() => setModal({ open: true, type: 'role', data: null })}>
                <Plus className="w-4 h-4" /> Tambah Role
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => {
              const activePerms = PREDEFINED_PERMISSIONS.filter(p => role.permissions?.[p.key]);
              const userCount   = users.filter(u => u.role_name === role.name).length;
              return (
                <div key={role.id} className="card p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{role.display_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{role.name}</p>
                    </div>
                    {hasRole('super_admin') && (
                      <div className="flex gap-1 shrink-0">
                        <button className="btn-ghost btn-sm p-1.5 rounded-lg" title="Edit role"
                          onClick={() => setModal({ open: true, type: 'role', data: role })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button className="btn-ghost btn-sm p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                          title="Hapus role" onClick={() => deleteRole(role)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {activePerms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {activePerms.map(p => (
                        <span key={p.key}
                          className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                          {p.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic mb-3">Tidak ada permission</p>
                  )}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400">{userCount} user dengan role ini</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <Modal open={modal.open && modal.type === 'user'} onClose={closeModal}
        title={modal.data ? 'Edit User' : 'Tambah User'} size="md">
        <UserForm user={modal.data} roles={roles} products={products}
          onSave={() => { closeModal(); load(); }} onClose={closeModal} />
      </Modal>

      <Modal open={modal.open && modal.type === 'reset'} onClose={closeModal}
        title="Reset Password" size="sm">
        {modal.data && (
          <ResetPasswordForm user={modal.data} onClose={closeModal} />
        )}
      </Modal>

      <Modal open={modal.open && modal.type === 'role'} onClose={closeModal}
        title={modal.data ? 'Edit Role' : 'Tambah Role'} size="sm">
        <RoleForm role={modal.data} onSave={() => { closeModal(); load(); }} onClose={closeModal} />
      </Modal>
    </div>
  );
}
