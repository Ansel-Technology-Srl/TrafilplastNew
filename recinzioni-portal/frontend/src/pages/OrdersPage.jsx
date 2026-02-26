import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { useFormatters } from '../utils/formatters';
import {
  FileText, Search, Download, Printer, CheckCircle, Send, Trash2,
  ChevronDown, ChevronUp, X, Eye, Edit3, Loader2, Settings2,
  AlertTriangle, Package, Wrench, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import EuritmoPreviewModal from '../components/EuritmoPreviewModal';

const STATUS_COLORS = {
  Carrello: 'bg-gray-100 text-gray-700',
  Preventivo: 'bg-blue-100 text-blue-700',
  Ordine: 'bg-green-100 text-green-700'
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const fmt = useFormatters();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStato, setFilterStato] = useState('tutti');
  const [counts, setCounts] = useState({ carrello: 0, preventivo: 0, ordine: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dettaglio ordine
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  // Dialogs
  const [confirmAction, setConfirmAction] = useState(null);

  // Euritmo preview modal
  const [euritmoOrdNum, setEuritmoOrdNum] = useState(null);

  // ─── Fetch lista ordini ──────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        ...(filterStato !== 'tutti' && { stato: filterStato }),
        ...(search && { search })
      });
      const res = await api.get(`/ordini?${params}`);
      if (res?.success) {
        const d = res.data;
        setOrders(d.items || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
        if (d.counts) setCounts(d.counts);
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [page, filterStato, search, t]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Reset pagina quando cambiano filtri
  useEffect(() => { setPage(1); }, [filterStato, search]);

  // ─── Fetch dettaglio ordine ──────────────────────────────────
  const openDetail = async (ordNum) => {
    setSelectedOrder(ordNum);
    setDetailLoading(true);
    setDetailData(null);
    setExpandedRows({});
    try {
      const res = await api.get(`/ordini/${ordNum}`);
      if (res?.success) {
        setDetailData(res.data);
      }
    } catch (err) {
      toast.error(t('common.error'));
      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setDetailData(null);
  };

  // ─── Azioni ──────────────────────────────────────────────────
  const handleDownloadPdf = async (ordNum) => {
    try {
      const blob = await api.downloadBlob(`/ordini/${ordNum}/pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const prefix = detailData?.flagConferma ? 'ordine' : 'preventivo';
      a.download = `${prefix}_${ordNum}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t('orders.pdfDownloaded'));
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const handleConfirmOrder = async (ordNum) => {
    try {
      const res = await api.put(`/ordini/${ordNum}/conferma`);
      if (res?.success) {
        toast.success(t('orders.confirmed'));
        fetchOrders();
        if (detailData) openDetail(ordNum);
      }
    } catch (err) {
      toast.error(err.message || t('common.error'));
    }
    setConfirmAction(null);
  };

  const handleSendSupplier = (ordNum) => {
    setConfirmAction(null);
    setEuritmoOrdNum(ordNum);
  };

  const handleDeleteOrder = async (ordNum) => {
    try {
      const res = await api.del(`/ordini/${ordNum}`);
      if (res?.success) {
        toast.success(t('orders.deleted'));
        closeDetail();
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || t('common.error'));
    }
    setConfirmAction(null);
  };

  const handleDeleteRow = async (ordNum, rigaNum) => {
    try {
      const res = await api.del(`/ordini/${ordNum}/righe/${rigaNum}`);
      if (res?.success) {
        toast.success(t('orders.rowDeleted'));
        openDetail(ordNum); // refresh detail
      }
    } catch (err) {
      toast.error(err.message || t('common.error'));
    }
    setConfirmAction(null);
  };

  const toggleRowExpand = (rigaNum) => {
    setExpandedRows(prev => ({ ...prev, [rigaNum]: !prev[rigaNum] }));
  };

  // ─── Filtri stato ────────────────────────────────────────────
  const filterButtons = [
    { key: 'tutti', label: t('orders.allStatuses'), count: counts.carrello + counts.preventivo + counts.ordine },
    { key: 'Preventivo', label: t('orders.statusPreventivo'), count: counts.preventivo },
    { key: 'Ordine', label: t('orders.statusOrdine'), count: counts.ordine },
    { key: 'Carrello', label: t('orders.statusCarrello'), count: counts.carrello }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <FileText className="w-7 h-7" />
        {t('orders.title')}
      </h1>

      {/* Filtri e ricerca */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Filtri stato */}
          <div className="flex flex-wrap gap-2">
            {filterButtons.map(fb => (
              <button
                key={fb.key}
                onClick={() => setFilterStato(fb.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterStato === fb.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {fb.label}
                <span className="ml-1.5 text-xs opacity-75">({fb.count})</span>
              </button>
            ))}
          </div>

          {/* Ricerca */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('orders.search')}
              className="input-field w-full pl-9"
            />
          </div>
        </div>
      </div>

      {/* Tabella ordini */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('orders.noOrders')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label={t('a11y.tableCaption.orders')}>
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs text-gray-500 uppercase">
                    <th scope="col" className="px-4 py-3">{t('orders.number')}</th>
                    <th scope="col" className="px-4 py-3">{t('orders.date')}</th>
                    <th scope="col" className="px-4 py-3">{t('orders.status')}</th>
                    <th scope="col" className="px-4 py-3">{t('orders.ragSoc')}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t('orders.total')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('orders.sent')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('cart.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map(ord => (
                    <tr key={ord.ordNum} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium">#{ord.ordNum}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {fmt.date(ord.ordData)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ord.stato] || ''}`}>
                          {ord.stato}
                        </span>
                      </td>
                      <td className="px-4 py-3">{ord.fattRagSoc || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{fmt.currency(ord.totale || 0)}</td>
                      <td className="px-4 py-3 text-center">
                        {ord.flagInvioFornitore ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetail(ord.ordNum)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title={t('orders.detail.title')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(ord.ordNum)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            title={t('orders.printPdf')}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {!ord.flagConferma && (
                            <button
                              onClick={() => setConfirmAction({ type: 'confirm', ordNum: ord.ordNum })}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title={t('orders.confirm')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {ord.flagConferma && !ord.flagInvioFornitore && (
                            <button
                              onClick={() => setConfirmAction({ type: 'send', ordNum: ord.ordNum })}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                              title={t('orders.sendSupplier')}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {!ord.flagConferma && (
                            <button
                              onClick={() => setConfirmAction({ type: 'delete', ordNum: ord.ordNum })}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              title={t('common.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginazione */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
                <span className="text-gray-500">
                  {t('orders.showing', { count: orders.length, total })}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal Dettaglio Ordine ──────────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 mb-10" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b">
              <h2 id="order-detail-title" className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5" aria-hidden="true" />
                {t('orders.detail.title')} #{selectedOrder}
                {detailData && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[detailData.stato] || ''}`}>
                    {detailData.stato}
                  </span>
                )}
              </h2>
              <button onClick={closeDetail} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : detailData ? (
              <div className="p-5 space-y-5">
                {/* Dati testata: fatturazione e consegna */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('quote.invoiceData')}</h3>
                    <p className="font-medium">{detailData.fattRagSoc}</p>
                    <p className="text-sm text-gray-600">{detailData.fattIndirizzo}</p>
                    <p className="text-sm text-gray-600">{detailData.fattCap} {detailData.fattCitta} ({detailData.fattProvincia})</p>
                    {detailData.fattPIva && <p className="text-xs text-gray-500 mt-1">P.IVA: {detailData.fattPIva}</p>}
                    {detailData.fattCFis && <p className="text-xs text-gray-500">C.F.: {detailData.fattCFis}</p>}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('quote.deliveryData')}</h3>
                    <p className="font-medium">{detailData.consRagSoc}</p>
                    <p className="text-sm text-gray-600">{detailData.consIndirizzo}</p>
                    <p className="text-sm text-gray-600">{detailData.consCap} {detailData.consCitta} ({detailData.consProvincia})</p>
                  </div>
                </div>

                {/* Note e pagamento */}
                {(detailData.note || detailData.pagDescrizione) && (
                  <div className="flex gap-4 text-sm">
                    {detailData.pagDescrizione && (
                      <span className="text-gray-500">{t('quote.payment')}: <strong>{detailData.pagCod} - {detailData.pagDescrizione}</strong></span>
                    )}
                    {detailData.note && (
                      <span className="text-gray-500">{t('quote.notes')}: {detailData.note}</span>
                    )}
                  </div>
                )}

                {/* Tabella righe */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm" aria-label={t('a11y.tableCaption.orderDetail')}>
                    <thead>
                      <tr className="bg-gray-100 text-left text-xs text-gray-500 uppercase">
                        <th scope="col" className="px-3 py-2 w-8"></th>
                        <th scope="col" className="px-3 py-2">{t('cart.product')}</th>
                        <th scope="col" className="px-3 py-2 text-center">{t('cart.um')}</th>
                        <th scope="col" className="px-3 py-2 text-center">{t('cart.quantity')}</th>
                        <th scope="col" className="px-3 py-2 text-right">{t('cart.unitPrice')}</th>
                        <th scope="col" className="px-3 py-2 text-right">{t('cart.totalPrice')}</th>
                        {!detailData.flagConferma && <th className="px-3 py-2 w-10"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {detailData.righe?.map((riga, idx) => {
                        const isExpanded = expandedRows[riga.rigaNum];
                        return (
                          <tr key={riga.rigaNum}>
                            <td colSpan={!detailData.flagConferma ? 7 : 6} className="p-0">
                              <table className="w-full">
                                <tbody>
                                  {/* Riga padre */}
                                  <tr className="hover:bg-gray-50">
                                    <td className="px-3 py-2 w-8">
                                      {riga.isConfigured && (
                                        <button onClick={() => toggleRowExpand(riga.rigaNum)} className="text-gray-400 hover:text-blue-600">
                                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={riga.isConfigured ? 'font-medium' : ''}>
                                          {riga.prdDes}
                                        </span>
                                        <span className="text-xs text-gray-400">{riga.prdCod}</span>
                                        {riga.isConfigured && (
                                          <span className="inline-flex items-center text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                            <Settings2 className="w-3 h-3 mr-0.5" />
                                            {t('cart.configuredProduct')}
                                          </span>
                                        )}
                                        <a
                                          href={`/alleg_documenti/${riga.prdCod.replace(/ /g, '_')}_tools.pdf`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-0.5 text-xs text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-1.5 py-0.5 rounded transition-colors"
                                          title="PDF Tools"
                                        >
                                          <Wrench className="w-3 h-3" /> Tools
                                        </a>
                                        <a
                                          href={`/alleg_documenti/${riga.prdCod.replace(/ /g, '_')}_sctec.pdf`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                                          title="Scheda Tecnica"
                                        >
                                          <BookOpen className="w-3 h-3" /> Scheda Tecnica
                                        </a>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-center text-gray-500">{riga.prdUm}</td>
                                    <td className="px-3 py-2 text-center">{riga.quantita}</td>
                                    <td className="px-3 py-2 text-right">
                                      {riga.isConfigured ? '' : fmt.currency(riga.prezzoUnitario || 0)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium">
                                      {fmt.currency(riga.prezzoTotale || 0)}
                                    </td>
                                    {!detailData.flagConferma && (
                                      <td className="px-3 py-2 text-center">
                                        <button
                                          onClick={() => setConfirmAction({ type: 'deleteRow', ordNum: detailData.ordNum, rigaNum: riga.rigaNum })}
                                          className="p-1 text-red-400 hover:text-red-600 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>

                                  {/* Config params */}
                                  {riga.isConfigured && isExpanded && riga.config && (
                                    <tr className="bg-purple-50">
                                      <td></td>
                                      <td colSpan={6} className="px-3 py-2">
                                        <div className="flex flex-wrap gap-3 text-xs text-purple-700">
                                          <span><strong>{t('orders.configParams')}:</strong></span>
                                          <span>📏 {t('configurator.height')}: {riga.config.altezzaPali}cm</span>
                                          <span>🎨 {t('configurator.slats')}: {riga.config.tipoDoghe}</span>
                                          <span>🔩 {t('configurator.fixing')}: {riga.config.fissaggio}</span>
                                          <span>🎯 {t('configurator.colorSlats')}: {riga.config.coloreDoghe}</span>
                                          {!riga.config.stessoColore && (
                                            <span>🎯 {t('configurator.colorPoles')}: {riga.config.colorePali}</span>
                                          )}
                                          <span>📐 {t('configurator.sections')}: {riga.config.numeroSezioni}</span>
                                        </div>
                                      </td>
                                    </tr>
                                  )}

                                  {/* Componenti figli */}
                                  {riga.isConfigured && isExpanded && riga.componenti?.map((comp, ci) => (
                                    <tr key={ci} className="bg-blue-50/50 text-xs">
                                      <td></td>
                                      <td className="px-3 py-1.5 pl-10 text-gray-600">
                                        <span className="text-gray-400 mr-1">└</span>
                                        {comp.prdDes}
                                        <span className="text-gray-400 ml-2">{comp.prdCod}</span>
                                      </td>
                                      <td className="px-3 py-1.5 text-center text-gray-500">{comp.prdUm}</td>
                                      <td className="px-3 py-1.5 text-center text-gray-500">{comp.quantita}</td>
                                      <td className="px-3 py-1.5 text-right text-gray-500">{fmt.currency(comp.prezzoUnitario || 0)}</td>
                                      <td className="px-3 py-1.5 text-right text-gray-600">{fmt.currency(comp.prezzoTotale || 0)}</td>
                                      {!detailData.flagConferma && <td></td>}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totali */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('cart.subtotal')}</span>
                      <span>{fmt.currency(detailData.subtotale || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('cart.vat')} ({detailData.aliquotaIVA}%)</span>
                      <span>{fmt.currency(detailData.importoIVA || 0)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>{t('cart.total')}</span>
                      <span>{fmt.currency(detailData.totale || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Azioni dettaglio */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <button onClick={() => handleDownloadPdf(detailData.ordNum)} className="btn-secondary flex items-center gap-1.5 text-sm">
                    <Download className="w-4 h-4" /> {t('orders.printPdf')}
                  </button>
                  {!detailData.flagConferma && (
                    <button
                      onClick={() => setConfirmAction({ type: 'confirm', ordNum: detailData.ordNum })}
                      className="btn-success flex items-center gap-1.5 text-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> {t('orders.confirm')}
                    </button>
                  )}
                  {detailData.flagConferma && (
                    <button
                      onClick={() => setEuritmoOrdNum(detailData.ordNum)}
                      className="btn-secondary flex items-center gap-1.5 text-sm"
                    >
                      <FileText className="w-4 h-4" /> {t('euritmo.preview')}
                    </button>
                  )}
                  {detailData.flagConferma && !detailData.flagInvioFornitore && (
                    <button
                      onClick={() => setConfirmAction({ type: 'send', ordNum: detailData.ordNum })}
                      className="btn-primary flex items-center gap-1.5 text-sm"
                    >
                      <Send className="w-4 h-4" /> {t('orders.sendSupplier')}
                    </button>
                  )}
                  {!detailData.flagConferma && (
                    <button
                      onClick={() => setConfirmAction({ type: 'delete', ordNum: detailData.ordNum })}
                      className="btn-danger flex items-center gap-1.5 text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Euritmo Preview Modal ────────────────────────────────── */}
      <EuritmoPreviewModal
        ordNum={euritmoOrdNum}
        isOpen={!!euritmoOrdNum}
        onClose={() => setEuritmoOrdNum(null)}
        onSent={() => { fetchOrders(); if (detailData) openDetail(euritmoOrdNum); }}
      />

      {/* ── Dialog conferma ─────────────────────────────────────── */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-action-title">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 id="confirm-action-title" className="font-semibold mb-1">{t('orders.confirmAction')}</h3>
                <p className="text-sm text-gray-600">
                  {confirmAction.type === 'confirm' && t('orders.confirmOrderMessage')}
                  {confirmAction.type === 'send' && t('orders.confirmSendMessage')}
                  {confirmAction.type === 'delete' && t('orders.confirmDeleteMessage')}
                  {confirmAction.type === 'deleteRow' && t('orders.confirmDeleteRowMessage')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="btn-secondary text-sm">
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  const { type, ordNum, rigaNum } = confirmAction;
                  if (type === 'confirm') handleConfirmOrder(ordNum);
                  else if (type === 'send') handleSendSupplier(ordNum);
                  else if (type === 'delete') handleDeleteOrder(ordNum);
                  else if (type === 'deleteRow') handleDeleteRow(ordNum, rigaNum);
                }}
                className={`text-sm ${confirmAction.type === 'delete' || confirmAction.type === 'deleteRow' ? 'btn-danger' : 'btn-success'}`}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
