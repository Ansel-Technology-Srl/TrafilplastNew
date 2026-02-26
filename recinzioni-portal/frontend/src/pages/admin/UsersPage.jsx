import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Download, Upload, X, Search } from 'lucide-react';

const USER_TYPES = { 1: 'Administrator', 2: 'Super User Cliente', 3: 'Capo Negozio', 4: 'Operatore Semplice' };

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ userID: '', userLogin: '', password: '', userName: '', userType: 4, mailAddress: '', itemID: '', itemIDSede: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const params = search ? `?search=${search}` : '';
    const res = await api.get(`/utenti${params}`);
    if (res?.success) setUsers(res.data);
    setLoading(false);
  };

  const openCreate = () => {
    setForm({ userID: '', userLogin: '', password: '', userName: '', userType: 4, mailAddress: '', itemID: '', itemIDSede: '' });
    setModal('create');
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ ...user, password: '' });
    setModal('edit');
  };

  const handleSave = async () => {
    if (modal === 'create') {
      const res = await api.post('/utenti', { ...form, userID: parseInt(form.userID), userType: parseInt(form.userType) });
      if (res?.success) { toast.success('Utente creato'); setModal(null); loadUsers(); }
      else toast.error(res?.message || 'Errore');
    } else {
      const payload = { ...form, userType: parseInt(form.userType) };
      if (!payload.password) delete payload.password;
      const res = await api.put(`/utenti/${editUser.userID}`, payload);
      if (res?.success) { toast.success('Utente aggiornato'); setModal(null); loadUsers(); }
      else toast.error(res?.message || 'Errore');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm(t('users.confirmDelete'))) return;
    const res = await api.del(`/utenti/${userId}`);
    if (res?.success) { toast.success('Utente eliminato'); loadUsers(); }
    else toast.error(res?.message || 'Errore');
  };

  const handleExport = async () => {
    const blob = await api.downloadBlob('/utenti/export');
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'utenti_export.xlsx'; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await api.upload('/utenti/import', file, { mode: 'merge' });
    if (res) {
      toast.success(`Importati: ${res.righeImportate}/${res.totaleRighe}`);
      if (res.errori?.length > 0) toast.error(`${res.righeErrore} errori`);
      loadUsers();
    }
    e.target.value = '';
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t('users.title')}</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={openCreate} className="btn-primary flex items-center gap-1 text-sm">
            <Plus size={16} /> {t('users.add')}
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1 text-sm">
            <Download size={16} /> {t('users.export')}
          </button>
          <label className="btn-secondary flex items-center gap-1 text-sm cursor-pointer">
            <Upload size={16} /> {t('users.import')}
            <input type="file" accept=".xlsx,.csv" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <form onSubmit={e => { e.preventDefault(); loadUsers(); }} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('users.search')} className="input-field pl-10" />
          </div>
          <button type="submit" className="btn-primary">Cerca</button>
        </form>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm" aria-label={t('a11y.tableCaption.users')}>
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600">
              <th scope="col" className="px-4 py-3">{t('users.id')}</th>
              <th scope="col" className="px-4 py-3">{t('users.login')}</th>
              <th scope="col" className="px-4 py-3">{t('users.name')}</th>
              <th scope="col" className="px-4 py-3">{t('users.type')}</th>
              <th scope="col" className="px-4 py-3">{t('users.email')}</th>
              <th scope="col" className="px-4 py-3">{t('users.client')}</th>
              <th scope="col" className="px-4 py-3">{t('users.branch')}</th>
              <th scope="col" className="px-4 py-3 w-24">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center py-8 text-gray-400">{t('app.loading')}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-8 text-gray-400">{t('common.noData')}</td></tr>
            ) : users.map(u => (
              <tr key={u.userID} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">{u.userID}</td>
                <td className="px-4 py-3">{u.userLogin}</td>
                <td className="px-4 py-3 font-medium">{u.userName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{USER_TYPES[u.userType]}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.mailAddress}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.itemID}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.itemIDSede}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(u.userID)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-lg">
                {modal === 'create' ? t('users.add') : t('users.edit')}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>

            <div className="p-4 space-y-4">
              {modal === 'create' && (
                <div>
                  <label className="block text-sm font-medium mb-1">UserID *</label>
                  <input type="number" value={form.userID} onChange={e => update('userID', e.target.value)}
                    className="input-field" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Login *</label>
                  <input type="text" value={form.userLogin || ''} onChange={e => update('userLogin', e.target.value)}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password {modal === 'edit' ? '(lascia vuoto per non cambiare)' : '*'}
                  </label>
                  <input type="password" value={form.password || ''} onChange={e => update('password', e.target.value)}
                    className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nome completo *</label>
                <input type="text" value={form.userName || ''} onChange={e => update('userName', e.target.value)}
                  className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo *</label>
                  <select value={form.userType} onChange={e => update('userType', e.target.value)} className="input-field">
                    {Object.entries(USER_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={form.mailAddress || ''} onChange={e => update('mailAddress', e.target.value)}
                    className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Codice Cliente (ItemID)</label>
                  <input type="text" value={form.itemID || ''} onChange={e => update('itemID', e.target.value)}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Codice Sede (ItemIDSede)</label>
                  <input type="text" value={form.itemIDSede || ''} onChange={e => update('itemIDSede', e.target.value)}
                    className="input-field" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t">
              <button onClick={() => setModal(null)} className="btn-secondary">{t('common.cancel')}</button>
              <button onClick={handleSave} className="btn-primary">{t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
