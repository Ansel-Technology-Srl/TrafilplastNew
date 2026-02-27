import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Plus, LayoutGrid, List, ChevronLeft, ChevronRight,
  Filter, X, SlidersHorizontal, Eye, Settings2, Package
} from 'lucide-react';
import api from '../services/api';
import { useCartStore } from '../store/store';
import { useFormatters } from '../utils/formatters';
import toast from 'react-hot-toast';
import ProductDetailModal from '../components/ProductDetailModal';

export default function CatalogPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const fmt = useFormatters();

  // State: prodotti e paginazione
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 24, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [listino, setListino] = useState(null);

  // State: filtri
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [famFilter, setFamFilter] = useState('');
  const [grpFilter, setGrpFilter] = useState('');
  const [sortBy, setSortBy] = useState('code');
  const [sortDir, setSortDir] = useState('asc');

  // State: filtri disponibili
  const [categorie, setCategorie] = useState([]);
  const [famiglie, setFamiglie] = useState([]);
  const [gruppi, setGruppi] = useState([]);

  // State: UI
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [brokenImages, setBrokenImages] = useState(new Set());

  const getProductImageUrl = (prdCod) => `/Image/${prdCod.replace(/ /g, '_')}.png`;

  // Carica filtri disponibili
  useEffect(() => {
    loadFiltri();
  }, []);

  // Ricarica famiglie quando cambia categoria
  useEffect(() => {
    if (catFilter) {
      loadFamigliePerCategoria(catFilter);
    }
  }, [catFilter]);

  // Ricarica prodotti quando cambiano filtri, lingua o pagina
  useEffect(() => {
    loadProducts(1);
  }, [i18n.language, catFilter, famFilter, grpFilter, sortBy, sortDir]);

  const loadFiltri = async () => {
    const res = await api.get('/prodotti/filtri');
    if (res?.success) {
      setCategorie(res.data.categorie || []);
      setFamiglie(res.data.famiglie || []);
      setGruppi(res.data.gruppi || []);
    }
  };

  const loadFamigliePerCategoria = async (cat) => {
    const res = await api.get(`/prodotti/filtri/famiglie?catCod=${encodeURIComponent(cat)}`);
    if (res?.success) {
      setFamiglie(res.data || []);
      // Se la famiglia selezionata non è più disponibile, resettala
      if (famFilter && !res.data.some(f => f.codice === famFilter)) {
        setFamFilter('');
      }
    }
  };

  const loadProducts = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', '24');
    if (i18n.language !== 'it') params.set('lang', i18n.language);
    if (catFilter) params.set('catCod', catFilter);
    if (famFilter) params.set('famCod', famFilter);
    if (grpFilter) params.set('grpCod', grpFilter);
    if (searchApplied) params.set('search', searchApplied);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortDir) params.set('sortDir', sortDir);

    const res = await api.get(`/prodotti?${params}`);
    if (res?.success) {
      setProducts(res.data);
      setPagination(res.pagination);
      setListino(res.listino);
    }
    setLoading(false);
  }, [i18n.language, catFilter, famFilter, grpFilter, searchApplied, sortBy, sortDir]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchApplied(search);
    loadProducts(1);
  };

  const clearSearch = () => {
    setSearch('');
    setSearchApplied('');
  };

  const clearAllFilters = () => {
    setCatFilter('');
    setFamFilter('');
    setGrpFilter('');
    setSearch('');
    setSearchApplied('');
    setSortBy('code');
    setSortDir('asc');
  };

  const hasActiveFilters = catFilter || famFilter || grpFilter || searchApplied;

  const handleAddToCart = (product) => {
    if (product.prezzo == null) {
      toast.error(t('catalog.noPriceAvailable'));
      return;
    }
    addItem({
      prdCod: product.prdCod,
      prdDes: product.prdDes,
      prdUm: product.prdUm,
      quantita: 1,
      prezzoUnitario: product.prezzo
    });
    toast.success(t('catalog.addedToCart', { product: product.prdDes }));
  };

  const handleOpenDetail = async (prdCod) => {
    setDetailLoading(true);
    const lang = i18n.language !== 'it' ? `?lang=${i18n.language}` : '';
    const res = await api.get(`/prodotti/${encodeURIComponent(prdCod)}${lang}`);
    if (res?.success) {
      setSelectedProduct(res.data);
    }
    setDetailLoading(false);
  };

  const handleGoToConfigurator = (product) => {
    navigate('/configuratore', { state: { fromProduct: product } });
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadProducts(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatPrice = (v) => v != null ? fmt.currency(v) : null;

  // ====== Active filter pills ======
  const renderActiveFilters = () => {
    if (!hasActiveFilters) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">{t('catalog.activeFilters')}:</span>
        {catFilter && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
            {t('catalog.category')}: {catFilter}
            <button onClick={() => { setCatFilter(''); setFamFilter(''); setGrpFilter(''); }} className="hover:text-primary-900"><X size={12} /></button>
          </span>
        )}
        {famFilter && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            {t('catalog.family')}: {famFilter}
            <button onClick={() => setFamFilter('')} className="hover:text-blue-900"><X size={12} /></button>
          </span>
        )}
        {grpFilter && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            {t('catalog.group')}: {grpFilter}
            <button onClick={() => setGrpFilter('')} className="hover:text-green-900"><X size={12} /></button>
          </span>
        )}
        {searchApplied && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            "{searchApplied}"
            <button onClick={clearSearch} className="hover:text-yellow-900"><X size={12} /></button>
          </span>
        )}
        <button onClick={clearAllFilters} className="text-xs text-gray-400 hover:text-gray-600 underline ml-2">
          {t('catalog.clearAll')}
        </button>
      </div>
    );
  };

  // ====== Pagination ======
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const current = pagination.page;
    const total = pagination.totalPages;

    // Calcola range pagine da mostrare
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    if (current <= 3) end = Math.min(5, total);
    if (current >= total - 2) start = Math.max(1, total - 4);

    return (
      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <p className="text-sm text-gray-500">
          {t('catalog.showing', {
            from: (current - 1) * pagination.pageSize + 1,
            to: Math.min(current * pagination.pageSize, pagination.total),
            total: pagination.total
          })}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(current - 1)}
            disabled={current === 1}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>

          {start > 1 && (
            <>
              <button onClick={() => goToPage(1)} className="px-3 py-1 rounded text-sm hover:bg-gray-100">1</button>
              {start > 2 && <span className="px-1 text-gray-400">…</span>}
            </>
          )}

          {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(p => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`px-3 py-1 rounded text-sm ${p === current
                ? 'bg-primary-600 text-white font-medium'
                : 'hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}

          {end < total && (
            <>
              {end < total - 1 && <span className="px-1 text-gray-400">…</span>}
              <button onClick={() => goToPage(total)} className="px-3 py-1 rounded text-sm hover:bg-gray-100">{total}</button>
            </>
          )}

          <button
            onClick={() => goToPage(current + 1)}
            disabled={current === total}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  // ====== Product card (grid mode) ======
  const renderProductCard = (p) => (
    <div key={p.prdCod} className="card hover:shadow-md transition-shadow group flex flex-col">
      {/* Header: codice + badge */}
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs text-gray-400 font-mono">{p.prdCod}</p>
        <div className="flex items-center gap-1">
          {p.isConfigurabile && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              {t('catalog.configurable')}
            </span>
          )}
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.prdUm}</span>
        </div>
      </div>

      {/* Body: info + immagine affiancati */}
      <div className="flex gap-3 mb-3 flex-1">
        {/* Sinistra: descrizione + tag */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">{p.prdDes}</h3>
          <div className="flex flex-wrap gap-1">
            {p.catCod && (
              <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">
                {p.catCod}
              </span>
            )}
            {p.famCod && (
              <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">
                {p.famCod}
              </span>
            )}
          </div>
        </div>
        {/* Destra: immagine prodotto */}
        <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-white flex items-center justify-center">
          {!brokenImages.has(p.prdCod) && (
            <img
              src={getProductImageUrl(p.prdCod)}
              alt=""
              className="w-full h-full object-contain"
              onError={() => setBrokenImages(prev => new Set(prev).add(p.prdCod))}
            />
          )}
        </div>
      </div>

      {/* Prezzo + azioni */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t">
        <span className={`text-lg font-bold ${p.prezzo != null ? 'text-primary-600' : 'text-gray-300'}`}>
          {formatPrice(p.prezzo) || t('catalog.noPrice')}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenDetail(p.prdCod)}
            className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title={t('catalog.viewDetail')}
          >
            <Eye size={16} />
          </button>
          {p.isConfigurabile ? (
            <button
              onClick={() => handleGoToConfigurator(p)}
              className="btn-primary flex items-center gap-1 text-sm py-1.5 px-3"
            >
              <Settings2 size={14} /> {t('catalog.configure')}
            </button>
          ) : p.prezzo != null ? (
            <button
              onClick={() => handleAddToCart(p)}
              className="btn-success flex items-center gap-1 text-sm py-1.5 px-3"
            >
              <Plus size={14} /> {t('catalog.addToCart')}
            </button>
          ) : (
            <button
              onClick={() => navigate('/configuratore')}
              className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3"
            >
              <Settings2 size={14} /> {t('catalog.goToConfigurator')}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ====== Product row (list mode) ======
  const renderProductRow = (p) => (
    <tr key={p.prdCod} className="hover:bg-gray-50 border-b last:border-b-0">
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
            {!brokenImages.has(p.prdCod) && (
              <img
                src={getProductImageUrl(p.prdCod)}
                alt=""
                className="w-full h-full object-contain"
                onError={() => setBrokenImages(prev => new Set(prev).add(p.prdCod))}
              />
            )}
          </div>
          <span className="font-mono text-xs text-gray-500">{p.prdCod}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{p.prdDes}</span>
          {p.isConfigurabile && (
            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
              {t('catalog.configurable')}
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-xs text-gray-500">{p.catCod || '-'}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-xs text-gray-500">{p.famCod || '-'}</span>
      </td>
      <td className="px-3 py-3 text-center">
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{p.prdUm}</span>
      </td>
      <td className="px-3 py-3 text-right">
        <span className={`font-semibold ${p.prezzo != null ? 'text-primary-600' : 'text-gray-300'}`}>
          {formatPrice(p.prezzo) || '-'}
        </span>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenDetail(p.prdCod)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title={t('catalog.viewDetail')}
          >
            <Eye size={15} />
          </button>
          {p.isConfigurabile ? (
            <button
              onClick={() => handleGoToConfigurator(p)}
              className="btn-primary text-xs py-1 px-2 flex items-center gap-1"
            >
              <Settings2 size={13} /> {t('catalog.configure')}
            </button>
          ) : p.prezzo != null ? (
            <button
              onClick={() => handleAddToCart(p)}
              className="btn-success text-xs py-1 px-2 flex items-center gap-1"
            >
              <Plus size={13} /> {t('catalog.add')}
            </button>
          ) : (
            <button
              onClick={() => navigate('/configuratore')}
              className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
            >
              <Settings2 size={13} /> {t('catalog.goToConfigurator')}
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Package className="text-primary-600" size={24} />
          <h1 className="text-2xl font-bold">{t('catalog.title')}</h1>
          {!loading && (
            <span className="text-sm text-gray-400">
              ({pagination.total} {t('catalog.productsCount')})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
              title={t('catalog.gridView')}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-400 hover:text-gray-600'}`}
              title={t('catalog.listView')}
            >
              <List size={18} />
            </button>
          </div>
          {/* Toggle filtri mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`md:hidden p-2 rounded border ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-600' : ''}`}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Barra ricerca + filtri */}
      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('catalog.searchPlaceholder')}
              className="input-field pl-10 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); if (searchApplied) { setSearchApplied(''); } }}
                className="absolute right-3 top-2.5 text-gray-300 hover:text-gray-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary px-4">
            <Search size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`hidden md:flex items-center gap-2 px-3 py-2 rounded border text-sm
              ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter size={16} />
            {t('catalog.filters')}
            {hasActiveFilters && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {[catFilter, famFilter, grpFilter, searchApplied].filter(Boolean).length}
              </span>
            )}
          </button>
        </form>

        {/* Pannello filtri */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Categoria */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('catalog.category')}</label>
              <select
                value={catFilter}
                onChange={e => { setCatFilter(e.target.value); setFamFilter(''); setGrpFilter(''); }}
                className="input-field text-sm"
              >
                <option value="">{t('catalog.allCategories')}</option>
                {categorie.map(c => (
                  <option key={c.codice} value={c.codice}>{c.codice} ({c.count})</option>
                ))}
              </select>
            </div>

            {/* Famiglia */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('catalog.family')}</label>
              <select
                value={famFilter}
                onChange={e => { setFamFilter(e.target.value); setGrpFilter(''); }}
                className="input-field text-sm"
              >
                <option value="">{t('catalog.allFamilies')}</option>
                {famiglie.map(f => (
                  <option key={f.codice} value={f.codice}>{f.codice} ({f.count})</option>
                ))}
              </select>
            </div>

            {/* Gruppo */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('catalog.group')}</label>
              <select
                value={grpFilter}
                onChange={e => setGrpFilter(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">{t('catalog.allGroups')}</option>
                {gruppi.map(g => (
                  <option key={g.codice} value={g.codice}>{g.codice} ({g.count})</option>
                ))}
              </select>
            </div>

            {/* Ordinamento */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('catalog.sortBy')}</label>
              <div className="flex gap-1">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="input-field text-sm flex-1"
                >
                  <option value="code">{t('catalog.code')}</option>
                  <option value="desc">{t('catalog.description')}</option>
                  <option value="cat">{t('catalog.category')}</option>
                </select>
                <button
                  onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 border rounded text-sm hover:bg-gray-50"
                  title={sortDir === 'asc' ? 'Ascendente' : 'Discendente'}
                >
                  {sortDir === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtri attivi (pills) */}
      {renderActiveFilters()}

      {/* Contenuto */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-500">{t('app.loading')}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">{t('catalog.noProducts')}</p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="mt-2 text-sm text-primary-600 hover:underline">
              {t('catalog.clearFilters')}
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista griglia */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map(renderProductCard)}
        </div>
      ) : (
        /* Vista lista */
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label={t('a11y.tableCaption.products')}>
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('catalog.code')}</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('catalog.description')}</th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('catalog.category')}</th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('catalog.family')}</th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('catalog.um')}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('catalog.price')}</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('catalog.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map(renderProductRow)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginazione */}
      {renderPagination()}

      {/* Modal dettaglio prodotto */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onConfigure={handleGoToConfigurator}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
}
