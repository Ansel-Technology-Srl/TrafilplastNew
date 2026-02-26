import { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/store';
import { useFormatters } from '../utils/formatters';
import {
  ShoppingCart, Trash2, Plus, Minus, ChevronDown, ChevronUp,
  Settings2, ArrowLeft, FileText, PackageOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fmt = useFormatters();
  const {
    items, removeItem, updateQuantity, clear,
    getSubtotal, getVAT, getTotal, getItemCount
  } = useCartStore();
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReconfigure = (item) => {
    navigate('/configuratore', { state: { editConfig: item.config, editId: item.id } });
  };

  const handleSaveQuote = () => {
    if (items.length === 0) {
      toast.error(t('cart.emptyCartError'));
      return;
    }
    navigate('/preventivo');
  };

  // Carrello vuoto
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <PackageOpen className="w-24 h-24 text-gray-300 mb-6" />
        <h2 className="text-2xl font-semibold text-gray-500 mb-2">
          {t('cart.emptyCart')}
        </h2>
        <p className="text-gray-400 mb-6">{t('cart.emptyCartMessage')}</p>
        <button onClick={() => navigate('/catalogo')} className="btn-primary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('cart.goToCatalog')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ShoppingCart className="w-7 h-7" />
          {t('cart.title')}
          <span className="text-sm font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {t('cart.itemCount', { count: getItemCount() })}
          </span>
        </h1>
        <button onClick={clear} className="btn-danger text-sm">
          <Trash2 className="w-4 h-4 mr-1 inline" />
          {t('cart.clearCart')}
        </button>
      </div>

      {/* Tabella prodotti */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label={t('a11y.tableCaption.cart')}>
            <thead>
              <tr className="bg-gray-50 border-b text-left text-xs text-gray-500 uppercase">
                <th scope="col" className="px-4 py-3 w-10"></th>
                <th scope="col" className="px-4 py-3">{t('cart.product')}</th>
                <th scope="col" className="px-4 py-3 text-center">{t('cart.um')}</th>
                <th scope="col" className="px-4 py-3 text-center">{t('cart.quantity')}</th>
                <th scope="col" className="px-4 py-3 text-right">{t('cart.unitPrice')}</th>
                <th scope="col" className="px-4 py-3 text-right">{t('cart.totalPrice')}</th>
                <th scope="col" className="px-4 py-3 text-center">{t('cart.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const isConfigured = item.isConfigured;
                const isExpanded = expandedItems[item.id];
                const itemTotal = isConfigured
                  ? item.componenti?.reduce((sum, c) => sum + (c.prezzoTotale || 0), 0) || 0
                  : (item.prezzoUnitario || 0) * (item.quantita || 0);

                return (
                  <Fragment key={item.id}>
                    {/* Riga prodotto principale */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {isConfigured && (
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title={isExpanded ? t('cart.hideComponents') : t('cart.showComponents')}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.prdDes}</div>
                        <div className="text-xs text-gray-400">{item.prdCod}</div>
                        {isConfigured && (
                          <span className="inline-flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mt-1">
                            <Settings2 className="w-3 h-3 mr-1" />
                            {t('cart.configuredProduct')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{item.prdUm}</td>
                      <td className="px-4 py-3">
                        {isConfigured ? (
                          <div className="text-center text-gray-500" title={t('cart.quantityFixed')}>
                            {item.quantita}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantita - 1))}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantita}
                              onChange={(e) => {
                                const v = parseInt(e.target.value);
                                if (v > 0) updateQuantity(item.id, v);
                              }}
                              className="w-14 text-center border rounded px-1 py-0.5 text-sm"
                            />
                            <button
                              onClick={() => updateQuantity(item.id, item.quantita + 1)}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isConfigured ? '—' : fmt.currency(item.prezzoUnitario || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {fmt.currency(itemTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isConfigured && (
                            <button
                              onClick={() => handleReconfigure(item)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title={t('cart.reconfigure')}
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Righe componenti figli (espandibili) */}
                    {isConfigured && isExpanded && (
                      <>
                        {/* Parametri configurazione */}
                        {item.config && (
                          <tr className="bg-purple-50">
                            <td></td>
                            <td colSpan={6} className="px-4 py-2">
                              <div className="flex flex-wrap gap-3 text-xs text-purple-700">
                                <span><strong>{t('cart.configParams')}:</strong></span>
                                <span>📏 {t('configurator.height')}: {item.config.altezzaPali}cm</span>
                                <span>🎨 {t('configurator.slats')}: {item.config.tipoDoghe}</span>
                                <span>🔩 {t('configurator.fixing')}: {item.config.fissaggio}</span>
                                <span>🎯 {t('configurator.colorSlats')}: {item.config.coloreDoghe}</span>
                                {!item.config.stessoColore && (
                                  <span>🎯 {t('configurator.colorPoles')}: {item.config.colorePali}</span>
                                )}
                                <span>📐 {t('configurator.sections')}: {item.config.sezioni?.length || item.config.numeroSezioni || 0}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                        {/* Componenti */}
                        {item.componenti?.map((comp, idx) => (
                          <tr key={`${item.id}-comp-${idx}`} className="bg-blue-50/50 text-sm">
                            <td></td>
                            <td className="px-4 py-2 pl-10 text-gray-600">
                              <span className="text-gray-400 mr-1">└</span>
                              {comp.prdDes}
                              <span className="text-xs text-gray-400 ml-2">{comp.prdCod}</span>
                            </td>
                            <td className="px-4 py-2 text-center text-gray-500 text-xs">{comp.prdUm}</td>
                            <td className="px-4 py-2 text-center text-gray-500">{comp.quantita}</td>
                            <td className="px-4 py-2 text-right text-gray-500">{fmt.currency(comp.prezzoUnitario || 0)}</td>
                            <td className="px-4 py-2 text-right text-gray-600">{fmt.currency(comp.prezzoTotale || 0)}</td>
                            <td></td>
                          </tr>
                        ))}
                      </>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer: totali e azioni */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-4">
        {/* Pulsante continua acquisti */}
        <button
          onClick={() => navigate('/catalogo')}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('cart.continueShopping')}
        </button>

        {/* Card riepilogo */}
        <div className="card p-5 min-w-[280px]">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('cart.subtotal')}</span>
              <span>{fmt.currency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('cart.vat')}</span>
              <span>{fmt.currency(getVAT())}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold">
              <span>{t('cart.total')}</span>
              <span>{fmt.currency(getTotal())}</span>
            </div>
          </div>
          <button
            onClick={handleSaveQuote}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {t('cart.saveQuote')}
          </button>
        </div>
      </div>
    </div>
  );
}

