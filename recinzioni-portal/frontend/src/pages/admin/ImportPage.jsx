import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useFormatters } from '../../utils/formatters';
import toast from 'react-hot-toast';
import {
  Package, DollarSign, Users, Store,
  Upload, Download, Search, RefreshCw,
  FileSpreadsheet, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, X, Info
} from 'lucide-react';

// ============================================================
// Tab definitions
// ============================================================
const TABS = [
  { key: 'prodotti',     icon: Package,     labelKey: 'import.products' },
  { key: 'prezzi',       icon: DollarSign,  labelKey: 'import.prices' },
  { key: 'clienti',      icon: Users,       labelKey: 'import.clients' },
  { key: 'puntivendita', icon: Store,       labelKey: 'import.branches' },
];

// Column config per tab
const COLUMNS = {
  prodotti: [
    { key: 'prdCod',    label: 'Codice',        w: 'w-32' },
    { key: 'prdDes',    label: 'Descrizione',    w: 'flex-1' },
    { key: 'prdUm',     label: 'U.M.',          w: 'w-20' },
    { key: 'catCod',    label: 'Categoria',      w: 'w-28' },
    { key: 'famCod',    label: 'Famiglia',       w: 'w-28' },
    { key: 'grpCod',    label: 'Gruppo',         w: 'w-28' },
    { key: 'cfgTipo',   label: 'Configurazione', w: 'w-28' },
    { key: 'cfgColore', label: 'Colore',         w: 'w-20' },
  ],
  prezzi: [
    { key: 'prdCod',  label: 'Codice Prodotto', w: 'flex-1' },
    { key: 'lstCod',  label: 'Codice Listino',  w: 'flex-1' },
    { key: 'prdPrz',  label: 'Prezzo',          w: 'w-32', format: 'price' },
  ],
  clienti: [
    { key: 'itemID',    label: 'Codice',          w: 'w-28' },
    { key: 'itemDes',   label: 'Ragione Sociale',  w: 'flex-1' },
    { key: 'pIva',      label: 'P.IVA',            w: 'w-36' },
    { key: 'cFis',      label: 'C.F.',             w: 'w-36' },
    { key: 'ind',       label: 'Indirizzo',         w: 'w-40' },
    { key: 'loc',       label: 'Località',          w: 'w-28' },
    { key: 'pro',       label: 'Prov.',             w: 'w-16' },
    { key: 'lstCod',    label: 'Listino',          w: 'w-28' },
    { key: 'pagCod',    label: 'Pagamento',         w: 'w-24' },
  ],
  puntivendita: [
    { key: 'itemID',     label: 'Cliente',      w: 'w-24' },
    { key: 'itemIDSede', label: 'Sede',          w: 'w-24' },
    { key: 'itemDes',    label: 'Descrizione',   w: 'flex-1' },
    { key: 'loc',        label: 'Località',      w: 'w-32' },
    { key: 'pro',        label: 'Prov.',         w: 'w-16' },
    { key: 'tel',        label: 'Telefono',      w: 'w-32' },
    { key: 'mail',       label: 'Email',         w: 'w-40' },
  ],
};

// Import file format templates
const TEMPLATES = {
  prodotti:     'PrdCod | PrdDes | PrdUm | PosArc | PrvCla | SitCod | GrpCod | CatCod | TreeCod | FamCod | DiBaCod | CfgTipo | CfgColore | PrdDes_EN | PrdDes_FR | PrdDes_DE',
  prezzi:       'PrdCod | LstCod | PrdPrz',
  clienti:      'ItemID | ItemDes | PIva | CFis | Ind | Cap | Loc | Pro | LstCod | LstCodPubb | PagCod',
  puntivendita: 'ItemID | ItemIDSede | ItemDes | Ind | Cap | Loc | Pro | Reg | Naz | LstCod | LstCodPubb | PagCod | Tel | Mail',
};

// ============================================================
// Main Component
// ============================================================
export default function ImportPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('prodotti');
  const [counts, setCounts] = useState(null);

  useEffect(() => { loadCounts(); }, []);

  const loadCounts = async () => {
    const res = await api.get('/import/counts');
    if (res?.success) setCounts(res.data);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('import.title')}</h1>
      </div>

      {/* Stats cards */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {TABS.map(tab => (
            <div key={tab.key} className={`card p-4 cursor-pointer transition-all ${
              activeTab === tab.key ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
            }`} onClick={() => setActiveTab(tab.key)}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                  <tab.icon size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t(tab.labelKey)}</p>
                  <p className="text-xl font-bold">{counts[tab.key] ?? 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <TabContent tabKey={activeTab} onImportDone={loadCounts} />
    </div>
  );
}

// ============================================================
// Tab Content: Import + Data Table
// ============================================================
function TabContent({ tabKey, onImportDone }) {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);

  useEffect(() => {
    setSearch('');
    setPage(1);
    setShowImport(false);
    setShowTemplate(false);
  }, [tabKey]);

  useEffect(() => { loadData(); }, [tabKey, page]);

  const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '50' });
    if (search) params.set('search', search);
    const res = await api.get(`/import/${tabKey}?${params}`);
    if (res?.success) {
      setData(res.data);
      setPagination(res.pagination);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleExport = async () => {
    toast.loading(t('import.exporting'), { id: 'export' });
    const blob = await api.downloadBlob(`/import/${tabKey}/export`);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tabKey}_export.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('import.exportDone'), { id: 'export' });
    } else {
      toast.error(t('common.error'), { id: 'export' });
    }
  };

  const handleImportDone = () => {
    setShowImport(false);
    setPage(1);
    loadData();
    onImportDone?.();
  };

  const columns = COLUMNS[tabKey] || [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('import.searchPlaceholder')} className="input-field pl-10 text-sm" />
          </div>
          <button type="submit" className="btn-primary text-sm">{t('import.searchBtn')}</button>
        </form>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowTemplate(!showTemplate)}
            className="btn-secondary flex items-center gap-1.5 text-sm">
            <Info size={15} /> {t('import.template')}
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-sm">
            <Download size={15} /> {t('import.exportBtn')}
          </button>
          <button onClick={() => setShowImport(!showImport)}
            className="btn-primary flex items-center gap-1.5 text-sm">
            <Upload size={15} /> {t('import.importBtn')}
          </button>
        </div>
      </div>

      {/* Template info */}
      {showTemplate && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <FileSpreadsheet size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-900 text-sm mb-1">{t('import.templateTitle')}</p>
              <p className="text-xs text-blue-700 font-mono break-all">{TEMPLATES[tabKey]}</p>
              <p className="text-xs text-blue-600 mt-2">{t('import.templateNote')}</p>
            </div>
            <button onClick={() => setShowTemplate(false)} className="text-blue-400 hover:text-blue-600"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Import panel */}
      {showImport && (
        <ImportPanel tabKey={tabKey} onDone={handleImportDone} onCancel={() => setShowImport(false)} />
      )}

      {/* Data table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b">
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 font-medium whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-gray-400">
                  <RefreshCw className="animate-spin inline mr-2" size={16} />{t('app.loading')}
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-gray-400">
                  {t('common.noData')}
                </td></tr>
              ) : data.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-2.5 text-gray-700">
                      {col.format === 'price' && row[col.key] != null
                        ? fmt.currency(row[col.key])
                        : row[col.key] ?? '—'}
                    </td>
                  ))}
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
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
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
                    className={`px-3 py-1 rounded text-sm ${page === pn ? 'bg-primary-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}>
                    {pn}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed">
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
// Import Panel: Drag & Drop + Mode selection + Results
// ============================================================
function ImportPanel({ tabKey, onDone, onCancel }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('merge');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.csv'))) {
      setFile(f); setResult(null);
    } else {
      toast.error(t('import.invalidFile'));
    }
  }, [t]);

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await api.upload(`/import/${tabKey}`, file, { mode });
      setResult(res);
      if (res?.righeErrore === 0) {
        toast.success(`${t('import.importSuccess')}: ${res.righeImportate}/${res.totaleRighe}`);
      } else {
        toast.error(`${res.righeErrore} ${t('import.errors').toLowerCase()}`);
      }
    } catch {
      toast.error(t('common.error'));
    }
    setImporting(false);
  };

  return (
    <div className="card border-2 border-primary-200 bg-primary-50/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Upload size={18} /> {t('import.importTitle')}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver ? 'border-primary-500 bg-primary-50'
          : file ? 'border-green-400 bg-green-50'
          : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.csv" onChange={handleFileSelect} className="hidden" />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="text-green-600" size={24} />
            <div className="text-left">
              <p className="font-medium text-green-800">{file.name}</p>
              <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
              className="ml-4 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50">
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600">
              {t('import.dragDrop')} <span className="text-primary-600 font-medium">{t('import.browse')}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{t('import.fileTypes')}</p>
          </>
        )}
      </div>

      {/* Mode + Import button */}
      {file && !result && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase">{t('import.modeLabel')}</p>
            <div className="flex gap-3">
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${
                mode === 'merge' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
                <input type="radio" name="mode" value="merge" checked={mode === 'merge'}
                  onChange={() => setMode('merge')} className="sr-only" />
                <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${mode === 'merge' ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}
                  style={mode === 'merge' ? { boxShadow: 'inset 0 0 0 2px white' } : {}} />
                {t('import.modeMerge')}
              </label>
              <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${
                mode === 'replace' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
                <input type="radio" name="mode" value="replace" checked={mode === 'replace'}
                  onChange={() => setMode('replace')} className="sr-only" />
                <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${mode === 'replace' ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}
                  style={mode === 'replace' ? { boxShadow: 'inset 0 0 0 2px white' } : {}} />
                {t('import.modeReplace')}
              </label>
            </div>
            {mode === 'replace' && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {t('import.replaceWarning')}
              </p>
            )}
          </div>
          <button onClick={handleImport} disabled={importing}
            className="btn-success flex items-center gap-2 text-sm whitespace-nowrap">
            {importing
              ? <><RefreshCw className="animate-spin" size={15} /> {t('import.importing')}</>
              : <><Upload size={15} /> {t('import.importBtn')}</>
            }
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-4 space-y-3">
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            result.righeErrore === 0 ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
          }`}>
            {result.righeErrore === 0
              ? <CheckCircle2 size={20} className="text-green-600" />
              : <AlertCircle size={20} className="text-yellow-600" />}
            <div>
              <p className="font-medium">{t('import.resultTitle')}</p>
              <p className="text-sm">
                {t('import.resultSummary', {
                  imported: result.righeImportate, total: result.totaleRighe, errors: result.righeErrore
                })}
              </p>
            </div>
          </div>

          {result.errori?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-xs font-medium text-red-700 mb-2">{t('import.errorDetails')}</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-red-600">
                    <th className="text-left py-1 px-2">{t('import.errorRow')}</th>
                    <th className="text-left py-1 px-2">{t('import.errorField')}</th>
                    <th className="text-left py-1 px-2">{t('import.errorMessage')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errori.map((err, i) => (
                    <tr key={i} className="border-t border-red-100">
                      <td className="py-1 px-2 font-mono">{err.riga}</td>
                      <td className="py-1 px-2">{err.campo}</td>
                      <td className="py-1 px-2 text-red-600">{err.messaggio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setFile(null); setResult(null); }} className="btn-secondary text-sm">
              {t('import.importAnother')}
            </button>
            <button onClick={onDone} className="btn-primary text-sm">
              {t('import.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
