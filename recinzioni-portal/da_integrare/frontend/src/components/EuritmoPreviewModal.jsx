import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Send, RefreshCw, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const RECORD_COLORS = {
  BGM: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', label: 'Testata' },
  NAS: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', label: 'Fornitore' },
  CTA: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Contatto' },
  NAB: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Buyer' },
  NAD: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', label: 'Consegna' },
  NAI: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', label: 'Fattura' },
  DTM: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', label: 'Data consegna' },
  FTX: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', label: 'Note' },
  PAT: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'Pagamento' },
  LIN: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Riga prodotto' },
  CNT: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', label: 'Sommario' },
};

export default function EuritmoPreviewModal({ ordNum, isOpen, onClose, onSent }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && ordNum) loadPreview();
    return () => { setData(null); setError(null); };
  }, [isOpen, ordNum]);

  const loadPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/ordini/${ordNum}/euritmo/preview`);
      if (res.data?.success) setData(res.data.data);
      else setError(res.data?.message || t('orders.euritmo.generateError'));
    } catch (err) {
      setError(err.response?.data?.message || t('orders.euritmo.generateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await api.downloadBlob(`/api/ordini/${ordNum}/euritmo`);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = data?.fileName || `ORDERS_${ordNum}.edi`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('orders.euritmo.downloadSuccess'));
    } catch {
      toast.error(t('orders.euritmo.downloadError'));
    }
  };

  const handleSend = async () => {
    const isResend = data?.flagInviato;
    const confirmMsg = isResend ? t('orders.euritmo.confirmResend') : t('orders.euritmo.confirmSend');
    if (!window.confirm(confirmMsg)) return;

    setSending(true);
    try {
      const res = await api.put(`/api/ordini/${ordNum}/invia`);
      if (res.data?.success) {
        toast.success(t('orders.euritmo.sendSuccess'));
        setData(prev => prev ? { ...prev, flagInviato: true, dataInvio: res.data.dataInvio } : prev);
        onSent?.();
      } else {
        toast.error(res.data?.message || t('orders.euritmo.sendError'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('orders.euritmo.sendError');
      toast.error(msg);
      if (err.response?.data?.ediGenerated) loadPreview();
    } finally {
      setSending(false);
    }
  };

  const renderLines = () => {
    if (!data?.content) return null;
    const lines = data.content.split('\n').filter(l => l.trim());
    return lines.map((line, idx) => {
      const recordType = line.substring(0, 3);
      const color = RECORD_COLORS[recordType] || { bg: 'bg-white', text: 'text-gray-600', border: 'border-gray-100', label: recordType };
      return (
        <div key={idx} className={`flex items-start gap-2 px-3 py-1 ${color.bg} border-l-4 ${color.border}`}>
          <span className={`shrink-0 w-20 text-xs font-semibold ${color.text} pt-0.5`}>
            {t(`orders.euritmo.recordTypes.${recordType}`, color.label)}
          </span>
          <pre className="text-xs font-mono text-gray-700 whitespace-pre overflow-x-auto flex-1 leading-relaxed">
            {line}
          </pre>
        </div>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {t('orders.euritmo.preview')} — {t('orders.orderNum')} {ordNum}
              </h2>
              <p className="text-sm text-gray-500">EURITMO ORDERS Release 25.1</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Badge stato invio */}
        {data && (
          <div className={`mx-6 mt-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm ${
            data.flagInviato
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {data.flagInviato ? (
              <>
                <CheckCircle className="w-4 h-4" />
                {t('orders.euritmo.sentAt', {
                  date: new Date(data.dataInvio).toLocaleDateString(),
                  time: new Date(data.dataInvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                })}
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4" />
                {t('orders.euritmo.notSent')}
              </>
            )}
          </div>
        )}

        {/* Contenuto */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>{t('orders.euritmo.generating')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <AlertCircle className="w-8 h-8 mb-3" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-0.5 rounded-lg overflow-hidden border border-gray-200">
              {renderLines()}
            </div>
          )}
        </div>

        {/* Legenda */}
        {data && !loading && (
          <div className="px-6 py-2 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              {Object.entries(RECORD_COLORS).map(([code, c]) => (
                <span key={code} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${c.bg} ${c.text}`}>
                  <strong>{code}</strong> {t(`orders.euritmo.recordTypes.${code}`, c.label)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer azioni */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-secondary">
            {t('common.close')}
          </button>
          <button onClick={handleDownload} disabled={!data || loading} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t('orders.euritmo.download')}
          </button>
          <button
            onClick={handleSend}
            disabled={!data || loading || sending}
            className={`flex items-center gap-2 ${data?.flagInviato ? 'btn-secondary' : 'btn-primary'}`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" />
              : data?.flagInviato ? <RefreshCw className="w-4 h-4" />
              : <Send className="w-4 h-4" />}
            {data?.flagInviato ? t('orders.euritmo.resend') : t('orders.euritmo.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
