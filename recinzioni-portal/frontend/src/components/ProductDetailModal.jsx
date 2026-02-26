import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Settings2, Globe, Tag, Package, Layers, FolderTree, Palette, Wrench } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function ProductDetailModal({ product, onClose, onAddToCart, onConfigure, formatPrice }) {
  const { t } = useTranslation();
  const modalRef = useRef(null);
  const [imageBroken, setImageBroken] = useState(false);
  useFocusTrap(modalRef, !!product, onClose);

  // Reset broken image state when product changes
  useEffect(() => { setImageBroken(false); }, [product?.prdCod]);

  if (!product) return null;

  const p = product;

  // Info fields da mostrare (solo se hanno valore)
  const infoFields = [
    { label: t('catalog.detail.archivePos'), value: p.posArc, icon: FolderTree },
    { label: t('catalog.detail.origin'), value: p.prvCla, icon: Tag },
    { label: t('catalog.detail.site'), value: p.sitCod, icon: Package },
    { label: t('catalog.detail.group'), value: p.grpCod, icon: Layers },
    { label: t('catalog.detail.category'), value: p.catCod, icon: Layers },
    { label: t('catalog.detail.tree'), value: p.treeCod, icon: FolderTree },
    { label: t('catalog.detail.family'), value: p.famCod, icon: FolderTree },
    { label: t('catalog.detail.bom'), value: p.diBaCod, icon: Package },
    { label: t('catalog.detail.cfgTipo'), value: p.cfgTipo, icon: Wrench },
    { label: t('catalog.detail.cfgColore'), value: p.cfgColore, icon: Palette },
  ].filter(f => f.value);

  // Traduzioni disponibili
  const translations = p.traduzioni || {};
  const langLabels = { en: 'English', fr: 'Français', de: 'Deutsch' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Modal */}
      <div ref={modalRef} className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between z-10">
          <div>
            <p className="text-xs text-gray-400 font-mono">{p.prdCod}</p>
            <h2 id="product-detail-title" className="text-lg font-bold mt-1">{p.prdDes}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.prdUm}</span>
              {p.isConfigurabile && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                  {t('catalog.configurable')}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label={t('a11y.closeModal')}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Prezzo */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">{t('catalog.price')}</p>
              <p className={`text-2xl font-bold mt-1 ${p.prezzo != null ? 'text-primary-600' : 'text-gray-300'}`}>
                {formatPrice(p.prezzo) || t('catalog.noPrice')}
              </p>
              {p.listino && (
                <p className="text-xs text-gray-400 mt-1">
                  {t('catalog.detail.priceList')}: {p.listino}
                </p>
              )}
            </div>
            <div>
              {p.isConfigurabile ? (
                <button
                  onClick={() => { onClose(); onConfigure(p); }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Settings2 size={16} /> {t('catalog.configure')}
                </button>
              ) : (
                p.prezzo != null && (
                  <button
                    onClick={() => { onAddToCart(p); onClose(); }}
                    className="btn-success flex items-center gap-2"
                  >
                    <Plus size={16} /> {t('catalog.addToCart')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Info tecniche + Immagine */}
          <div className="flex gap-4">
            {/* Sinistra: info tecniche */}
            {infoFields.length > 0 && (
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('catalog.detail.technicalInfo')}</h3>
                <div className="space-y-2">
                  {infoFields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <f.icon size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="text-gray-500">{f.label}:</span>
                      <span className="font-medium text-gray-700 truncate">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Destra: immagine prodotto */}
            <div className="w-48 h-48 flex-shrink-0 rounded overflow-hidden bg-white flex items-center justify-center">
              {!imageBroken && (
                <img
                  src={`/Image/${p.prdCod.replace(/ /g, '_')}.png`}
                  alt=""
                  className="w-full h-full object-contain"
                  onError={() => setImageBroken(true)}
                />
              )}
            </div>
          </div>

          {/* Traduzioni */}
          {Object.keys(translations).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Globe size={14} /> {t('catalog.detail.translations')}
              </h3>
              <div className="space-y-2">
                {/* Italiano (originale) */}
                <div className="flex items-start gap-3 p-2 bg-blue-50 rounded text-sm">
                  <span className="bg-blue-200 text-blue-800 text-xs font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0">IT</span>
                  <span className="text-gray-700">{p.prdDesOriginale}</span>
                </div>
                {Object.entries(translations).map(([lang, desc]) => (
                  <div key={lang} className="flex items-start gap-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                      {lang}
                    </span>
                    <span className="text-gray-600">{desc || <em className="text-gray-300">{t('catalog.detail.noTranslation')}</em>}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-3 flex justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
