// ═══════════════════════════════════════════════════════════════
//  ISTRUZIONI: Modifiche da applicare a OrdersPage.jsx
//  NON è un file completo — contiene solo le parti da aggiungere
// ═══════════════════════════════════════════════════════════════

// ── 1. AGGIUNGERE IMPORT (in cima al file) ──────────────────
import { FileText, Send, RefreshCw, Download, CheckCircle } from 'lucide-react';
import EuritmoPreviewModal from '../components/EuritmoPreviewModal';

// ── 2. AGGIUNGERE STATE (dentro il componente) ─────────────
const [euritmoModal, setEuritmoModal] = useState({ open: false, ordNum: null });

// ── 3. AGGIUNGERE HANDLER (dentro il componente) ───────────
const handleOpenEuritmo = (ordNum) => {
  setEuritmoModal({ open: true, ordNum });
};

const handleEuritmoSent = () => {
  // Ricarica la lista ordini per aggiornare i badge
  loadOrdini();
};

const handleDownloadEdi = async (ordNum) => {
  try {
    const res = await api.downloadBlob(`/api/ordini/${ordNum}/euritmo`);
    const url = window.URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ORDERS_${ordNum}.edi`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success(t('orders.euritmo.downloadSuccess'));
  } catch {
    toast.error(t('orders.euritmo.downloadError'));
  }
};

// ── 4. AGGIUNGERE NELLA SEZIONE AZIONI DI OGNI ORDINE ─────
// Nella riga/card di ogni ordine, dopo i pulsanti esistenti:

{/* Badge EDI inviato */}
{ordine.flagInvioFornitore && (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
    <CheckCircle className="w-3 h-3" />
    {t('orders.euritmo.sentAt', {
      date: new Date(ordine.dataInvioFornitore).toLocaleDateString(),
      time: new Date(ordine.dataInvioFornitore).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })}
  </span>
)}

{/* Pulsante Anteprima EDI — solo per ordini confermati */}
{ordine.flagConferma && (
  <button
    onClick={() => handleOpenEuritmo(ordine.ordNum)}
    className="btn-secondary text-sm flex items-center gap-1"
    title={t('orders.euritmo.preview')}
  >
    <FileText className="w-4 h-4" />
    {t('orders.euritmo.preview')}
  </button>
)}

{/* Pulsante Invia / Re-invia al fornitore */}
{ordine.flagConferma && !ordine.flagInvioFornitore && (
  <button
    onClick={() => handleOpenEuritmo(ordine.ordNum)}
    className="btn-primary text-sm flex items-center gap-1"
  >
    <Send className="w-4 h-4" />
    {t('orders.euritmo.send')}
  </button>
)}
{ordine.flagConferma && ordine.flagInvioFornitore && (
  <button
    onClick={() => handleOpenEuritmo(ordine.ordNum)}
    className="btn-secondary text-sm flex items-center gap-1"
  >
    <RefreshCw className="w-4 h-4" />
    {t('orders.euritmo.resend')}
  </button>
)}

{/* Pulsante Download .edi */}
{ordine.flagConferma && (
  <button
    onClick={() => handleDownloadEdi(ordine.ordNum)}
    className="btn-secondary text-sm flex items-center gap-1"
    title={t('orders.euritmo.download')}
  >
    <Download className="w-4 h-4" />
  </button>
)}

// ── 5. AGGIUNGERE MODAL (prima del </> di chiusura del componente) ──
<EuritmoPreviewModal
  ordNum={euritmoModal.ordNum}
  isOpen={euritmoModal.open}
  onClose={() => setEuritmoModal({ open: false, ordNum: null })}
  onSent={handleEuritmoSent}
/>
