import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useFormatters } from '../utils/formatters';
import toast from 'react-hot-toast';
import {
  Store, Tag, Calendar, Plus, Trash2, RotateCcw, Search,
  ChevronLeft, ChevronRight, RefreshCw, Check, X, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus, Filter, Edit3, Save
} from 'lucide-react';

export default function PriceListsPage() {
  const { t } = useTranslation();
  const [pdvList, setPdvList] = useState([]);
  const [selectedPdv, setSelectedPdv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPdvList(); }, []);

  const loadPdvList = async () => {
    setLoading(true);
    const res = await api.get('/listini/puntivendita');
    if (res?.success) setPdvList(res.data);
    setLoading(false);
  };

  const handleSelect = (pdv) => {
    setSelectedPdv(pdv);
  };

  const handleRefresh = () => {
    loadPdvList();
    setSelectedPdv(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('priceLists.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: PdV list */}
        <div className="lg:col-span-4 xl:col-span-3">
          <PdvSelector
            pdvList={pdvList}
            loading={loading}
            selectedPdv={selectedPdv}
            onSelect={handleSelect}
          />
        </div>

        {/* Right: Price list content */}
        <div className="lg:col-span-8 xl:col-span-9">
          {selectedPdv ? (
            selectedPdv.hasCustomList ? (
              <PriceListEditor pdv={selectedPdv} onRefresh={handleRefresh} />
            ) : (
              <PublicListView pdv={selectedPdv} onCreated={handleRefresh} />
            )
          ) : (
            <div className="card text-center py-16 text-gray-400">
              <Store className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-lg">{t('priceLists.selectBranch')}</p>
              <p className="text-sm mt-1">{t('priceLists.selectBranchHint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PdV Selector (left panel)
// ============================================================
function PdvSelector({ pdvList, loading, selectedPdv, onSelect }) {
  const { t } = useTranslation();

  if (loading) return (
    <div className="card text-center py-8 text-gray-400">
      <RefreshCw className="animate-spin mx-auto mb-2" size={20} /> {t('app.loading')}
    </div>
  );

  if (pdvList.length === 0) return (
    <div className="card text-center py-8 text-gray-400">
      {t('priceLists.noBranches')}
    </div>
  );

  return (
    <div className="space-y-2">
      {pdvList.map(pdv => {
        const isSelected = selectedPdv?.itemIDSede === pdv.itemIDSede;
        return (
          <button
            key={pdv.itemIDSede}
            onClick={() => onSelect(pdv)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                <Store size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{pdv.itemDes || pdv.itemIDSede}</p>
                {pdv.loc && <p className="text-xs text-gray-500 truncate">{pdv.loc}{pdv.pro ? ` (${pdv.pro})` : ''}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {pdv.hasCustomList ? (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      pdv.customIsValid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      <Tag size={10} />
                      {pdv.customIsValid ? t('priceLists.customActive') : t('priceLists.customExpired')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      <Tag size={10} /> {t('priceLists.publicOnly')}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{pdv.numPrezziPubb} {t('priceLists.items')}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Public List View (no custom list yet)
// ============================================================
function PublicListView({ pdv, onCreated }) {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);

  useEffect(() => { loadData(); }, [pdv.lstCodPubb, page]);

  const loadData = async () => {
    if (!pdv.lstCodPubb) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '50' });
    if (search) params.set('search', search);
    const res = await api.get(`/listini/${encodeURIComponent(pdv.lstCodPubb)}?${params}`);
    if (res?.success) { setData(res.data); setPagination(res.pagination); }
    setLoading(false);
  };

  const handleCreate = async () => {
    setCreating(true);
    const res = await api.post(`/listini/crea/${pdv.itemIDSede}`, { validoDal: dateFrom, validoAl: dateTo });
    if (res?.success) {
      toast.success(t('priceLists.created'));
      onCreated();
    } else {
      toast.error(res?.message || t('common.error'));
    }
    setCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-blue-900">{pdv.itemDes || pdv.itemIDSede}</h2>
            <p className="text-sm text-blue-700 mt-1">
              {t('priceLists.publicListCode')}: <span className="font-mono">{pdv.lstCodPubb || '—'}</span>
            </p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
            <Plus size={16} /> {t('priceLists.createCustom')}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-800 mb-3">{t('priceLists.createHint')}</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">{t('priceLists.validFrom')}</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="input-field text-sm w-40" />
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">{t('priceLists.validTo')}</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="input-field text-sm w-40" />
              </div>
              <button onClick={handleCreate} disabled={creating}
                className="btn-success flex items-center gap-2 text-sm">
                {creating ? <RefreshCw className="animate-spin" size={15} /> : <Check size={15} />}
                {t('priceLists.confirmCreate')}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <form onSubmit={e => { e.preventDefault(); setPage(1); loadData(); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('priceLists.searchPlaceholder')} className="input-field pl-10 text-sm" />
        </div>
        <button type="submit" className="btn-primary text-sm">{t('import.searchBtn')}</button>
      </form>

      {/* Table */}
      <DataTable data={data} loading={loading} pagination={pagination} page={page} setPage={setPage} readOnly={true} />
    </div>
  );
}

// ============================================================
// Price List Editor (custom list exists)
// ============================================================
function PriceListEditor({ pdv, onRefresh }) {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [dateFrom, setDateFrom] = useState(pdv.customValidoDal?.split('T')[0] || '');
  const [dateTo, setDateTo] = useState(pdv.customValidoAl?.split('T')[0] || '');
  const priceInputRef = useRef(null);

  useEffect(() => { loadData(); }, [pdv.itemIDSede, page, filter]);

  const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '50' });
    if (search) params.set('search', search);
    if (filter !== 'all') params.set('filter', filter);
    const res = await api.get(`/listini/confronto/${pdv.itemIDSede}?${params}`);
    if (res?.success) {
      setData(res.data);
      setPagination(res.pagination);
      setSummary(res.summary);
    }
    setLoading(false);
  };

  const startEdit = (row) => {
    setEditingRow(row.prdCod);
    setEditPrice(String(row.prezzoCustom ?? row.prezzoPubblico ?? 0));
    setTimeout(() => priceInputRef.current?.select(), 50);
  };

  const cancelEdit = () => { setEditingRow(null); setEditPrice(''); };

  const savePrice = async (prdCod) => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice < 0) { toast.error(t('priceLists.invalidPrice')); return; }

    setSaving(true);
    const res = await api.put(`/listini/${encodeURIComponent(pdv.customLstCod)}/prezzo`, {
      prdCod, nuovoPrezzo: newPrice
    });
    if (res?.success) {
      toast.success(t('priceLists.priceUpdated'));
      setEditingRow(null);
      loadData();
    } else {
      toast.error(res?.message || t('common.error'));
    }
    setSaving(false);
  };

  const handleKeyDown = (e, prdCod) => {
    if (e.key === 'Enter') savePrice(prdCod);
    if (e.key === 'Escape') cancelEdit();
  };

  const handleSaveDates = async () => {
    const res = await api.put(`/listini/${encodeURIComponent(pdv.customLstCod)}/validita`, {
      validoDal: dateFrom, validoAl: dateTo
    });
    if (res?.success) { toast.success(t('priceLists.datesUpdated')); setShowDates(false); onRefresh(); }
    else toast.error(res?.message || t('common.error'));
  };

  const handleReset = async () => {
    if (!window.confirm(t('priceLists.confirmReset'))) return;
    const res = await api.post(`/listini/${encodeURIComponent(pdv.customLstCod)}/reset`);
    if (res?.success) { toast.success(res.message); loadData(); }
    else toast.error(res?.message || t('common.error'));
  };

  const handleDelete = async () => {
    if (!window.confirm(t('priceLists.confirmDelete'))) return;
    const res = await api.del(`/listini/${encodeURIComponent(pdv.customLstCod)}`);
    if (res?.success) { toast.success(res.message); onRefresh(); }
    else toast.error(res?.message || t('common.error'));
  };

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">{pdv.itemDes || pdv.itemIDSede}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('priceLists.customListCode')}: <span className="font-mono text-primary-600">{pdv.customLstCod}</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar size={14} className="text-gray-400" />
              <span className={`text-sm ${pdv.customIsValid ? 'text-green-600' : 'text-red-500'}`}>
                {dateFrom || pdv.customValidoDal?.split('T')[0]} → {dateTo || pdv.customValidoAl?.split('T')[0]}
              </span>
              <button onClick={() => setShowDates(!showDates)} className="text-xs text-primary-600 hover:underline ml-1">
                {t('priceLists.editDates')}
              </button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleReset}
              className="btn-secondary flex items-center gap-1.5 text-xs">
              <RotateCcw size={14} /> {t('priceLists.resetAll')}
            </button>
            <button onClick={handleDelete}
              className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors">
              <Trash2 size={14} /> {t('priceLists.deleteList')}
            </button>
          </div>
        </div>

        {/* Date editor */}
        {showDates && (
          <div className="mt-4 pt-4 border-t flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('priceLists.validFrom')}</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field text-sm w-40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('priceLists.validTo')}</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field text-sm w-40" />
            </div>
            <button onClick={handleSaveDates} className="btn-primary text-sm flex items-center gap-1">
              <Save size={14} /> {t('common.save')}
            </button>
            <button onClick={() => setShowDates(false)} className="btn-secondary text-sm">{t('common.cancel')}</button>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => { setFilter('all'); setPage(1); }}>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            <p className={`text-xs ${filter === 'all' ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
              {t('priceLists.totalProducts')}
            </p>
          </div>
          <div className="card p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => { setFilter('modified'); setPage(1); }}>
            <p className="text-2xl font-bold text-amber-600">{summary.modified}</p>
            <p className={`text-xs ${filter === 'modified' ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
              {t('priceLists.modified')}
            </p>
          </div>
          <div className="card p-3 text-center cursor-pointer hover:shadow-md transition-all"
            onClick={() => { setFilter('unchanged'); setPage(1); }}>
            <p className="text-2xl font-bold text-gray-400">{summary.unchanged}</p>
            <p className={`text-xs ${filter === 'unchanged' ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
              {t('priceLists.unchanged')}
            </p>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={e => { e.preventDefault(); setPage(1); loadData(); }} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('priceLists.searchPlaceholder')} className="input-field pl-10 text-sm" />
          </div>
          <button type="submit" className="btn-primary text-sm">{t('import.searchBtn')}</button>
        </form>
      </div>

      {/* Comparison table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t('a11y.tableCaption.priceList')}>
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b">
                <th scope="col" className="px-4 py-3 font-medium">{t('priceLists.colCode')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('priceLists.colDescription')}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t('priceLists.colUm')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">{t('priceLists.colPublicPrice')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">{t('priceLists.colCustomPrice')}</th>
                <th scope="col" className="px-4 py-3 font-medium text-center">{t('priceLists.colDiff')}</th>
                <th scope="col" className="px-4 py-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <RefreshCw className="animate-spin inline mr-2" size={16} />{t('app.loading')}
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">{t('common.noData')}</td></tr>
              ) : data.map(row => (
                <tr key={row.prdCod} className={`border-t transition-colors ${
                  row.isModified ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'
                }`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{row.prdCod}</td>
                  <td className="px-4 py-2.5 text-gray-800">{row.prdDes}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{row.prdUm}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500">
                    {fmt.currency(row.prezzoPubblico ?? 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {editingRow === row.prdCod ? (
                      <input
                        ref={priceInputRef}
                        type="number"
                        step="0.01"
                        min="0"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, row.prdCod)}
                        onBlur={() => cancelEdit()}
                        className="w-28 text-right text-sm border border-primary-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-300"
                        autoFocus
                      />
                    ) : (
                      <span className={`font-medium ${row.isModified ? 'text-amber-700' : 'text-gray-700'}`}>
                        {fmt.currency(row.prezzoCustom ?? row.prezzoPubblico ?? 0)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {row.isModified ? (
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                        row.differenza > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {row.differenza > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {row.diffPerc > 0 ? '+' : ''}{row.diffPerc}%
                      </span>
                    ) : (
                      <Minus size={14} className="mx-auto text-gray-300" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {editingRow === row.prdCod ? (
                      <div className="flex gap-1 justify-center">
                        <button onMouseDown={e => { e.preventDefault(); savePrice(row.prdCod); }}
                          disabled={saving}
                          className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check size={15} />
                        </button>
                        <button onMouseDown={e => { e.preventDefault(); cancelEdit(); }}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(row)}
                        className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded">
                        <Edit3 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-500">
              {t('import.showing', {
                from: (pagination.page - 1) * pagination.pageSize + 1,
                to: Math.min(pagination.page * pagination.pageSize, pagination.total),
                total: pagination.total
              })}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30">
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pn;
                if (pagination.totalPages <= 5) pn = i + 1;
                else if (page <= 3) pn = i + 1;
                else if (page >= pagination.totalPages - 2) pn = pagination.totalPages - 4 + i;
                else pn = page - 2 + i;
                return (
                  <button key={pn} onClick={() => setPage(pn)}
                    className={`px-3 py-1 rounded text-sm ${page === pn ? 'bg-primary-600 text-white' : 'hover:bg-gray-200'}`}>
                    {pn}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ============================================================
// Simple data table (for public list, read-only)
// ============================================================
function DataTable({ data, loading, pagination, page, setPage, readOnly }) {
  const { t } = useTranslation();
  const fmt = useFormatters();

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={t('a11y.tableCaption.priceList')}>
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 border-b">
              <th scope="col" className="px-4 py-3 font-medium">{t('priceLists.colCode')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('priceLists.colDescription')}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t('priceLists.colUm')}</th>
              <th scope="col" className="px-4 py-3 font-medium text-right">{t('priceLists.colPrice')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">
                <RefreshCw className="animate-spin inline mr-2" size={16} />{t('app.loading')}
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-12 text-gray-400">{t('common.noData')}</td></tr>
            ) : data.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{row.prdCod}</td>
                <td className="px-4 py-2.5 text-gray-800">{row.prdDes}</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{row.prdUm}</td>
                <td className="px-4 py-2.5 text-right font-medium">{fmt.currency(row.prdPrz ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
          <span className="text-gray-500">
            {t('import.showing', {
              from: (pagination.page - 1) * pagination.pageSize + 1,
              to: Math.min(pagination.page * pagination.pageSize, pagination.total),
              total: pagination.total
            })}
          </span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronLeft size={18} /></button>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
