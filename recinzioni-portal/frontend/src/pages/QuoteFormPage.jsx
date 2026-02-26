import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/store';
import { useFormatters } from '../utils/formatters';
import api from '../services/api';
import { FileText, Copy, ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = {
  fattRagSoc: '', fattIndirizzo: '', fattCap: '', fattCitta: '', fattProvincia: '',
  fattPIva: '', fattCFis: '',
  consRagSoc: '', consIndirizzo: '', consCap: '', consCitta: '', consProvincia: '',
  pagCod: '', pagDescrizione: '', note: ''
};

export default function QuoteFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, getSubtotal, getVAT, getTotal, getItemCount, clear } = useCartStore();
  const fmt = useFormatters();

  const [form, setForm] = useState({ ...emptyForm });
  const [sameAsInvoice, setSameAsInvoice] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);

  // Pre-compilazione dati anagrafica
  useEffect(() => {
    const fetchAnagrafica = async () => {
      try {
        const res = await api.get('/ordini/dati-anagrafica');
        if (res?.success && res?.data) {
          const d = res.data;
          setForm(prev => ({
            ...prev,
            fattRagSoc: d.fatturazione?.ragSoc || '',
            fattIndirizzo: d.fatturazione?.indirizzo || '',
            fattCap: d.fatturazione?.cap || '',
            fattCitta: d.fatturazione?.citta || '',
            fattProvincia: d.fatturazione?.provincia || '',
            fattPIva: d.fatturazione?.pIva || '',
            fattCFis: d.fatturazione?.cFis || '',
            consRagSoc: d.consegna?.ragSoc || '',
            consIndirizzo: d.consegna?.indirizzo || '',
            consCap: d.consegna?.cap || '',
            consCitta: d.consegna?.citta || '',
            consProvincia: d.consegna?.provincia || '',
            pagCod: d.pagamento || '',
            pagDescrizione: d.pagamento || ''
          }));
        }
      } catch (err) {
        console.error('Errore pre-compilazione:', err);
      } finally {
        setPrefilling(false);
      }
    };
    fetchAnagrafica();
  }, []);

  // Redirect se carrello vuoto
  useEffect(() => {
    if (!prefilling && items.length === 0) {
      toast.error(t('cart.emptyCartError'));
      navigate('/carrello');
    }
  }, [prefilling, items, navigate, t]);

  // Gestione "consegna = fatturazione"
  useEffect(() => {
    if (sameAsInvoice) {
      setForm(prev => ({
        ...prev,
        consRagSoc: prev.fattRagSoc,
        consIndirizzo: prev.fattIndirizzo,
        consCap: prev.fattCap,
        consCitta: prev.fattCitta,
        consProvincia: prev.fattProvincia
      }));
    }
  }, [sameAsInvoice, form.fattRagSoc, form.fattIndirizzo, form.fattCap, form.fattCitta, form.fattProvincia]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // Validazione
  const validate = () => {
    const errs = {};
    if (!form.fattRagSoc || form.fattRagSoc.length < 3)
      errs.fattRagSoc = t('quote.validation.ragSocMin');
    if (!form.fattIndirizzo)
      errs.fattIndirizzo = t('quote.validation.required');
    if (form.fattCap && !/^\d{5}$/.test(form.fattCap))
      errs.fattCap = t('quote.validation.capFormat');
    if (!form.fattCitta)
      errs.fattCitta = t('quote.validation.required');
    if (form.fattProvincia && !/^[A-Z]{2}$/i.test(form.fattProvincia))
      errs.fattProvincia = t('quote.validation.provinciaFormat');
    if (form.fattPIva && !/^(IT)?\d{11}$/.test(form.fattPIva.replace(/\s/g, '')))
      errs.fattPIva = t('quote.validation.pivaFormat');
    if (form.fattCFis && !/^[A-Z0-9]{16}$/i.test(form.fattCFis.replace(/\s/g, '')))
      errs.fattCFis = t('quote.validation.cfisFormat');

    if (!sameAsInvoice) {
      if (!form.consRagSoc || form.consRagSoc.length < 3)
        errs.consRagSoc = t('quote.validation.ragSocMin');
      if (!form.consIndirizzo)
        errs.consIndirizzo = t('quote.validation.required');
      if (!form.consCitta)
        errs.consCitta = t('quote.validation.required');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error(t('quote.validation.fixErrors'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        items: items.map(item => ({
          prdCod: item.prdCod,
          prdDes: item.prdDes,
          prdUm: item.prdUm,
          quantita: item.quantita,
          prezzoUnitario: item.prezzoUnitario,
          isConfigured: item.isConfigured || false,
          componenti: item.componenti?.map(c => ({
            prdCod: c.prdCod,
            prdDes: c.prdDes,
            prdUm: c.prdUm,
            quantita: c.quantita,
            prezzoUnitario: c.prezzoUnitario,
            prezzoTotale: c.prezzoTotale
          })) || null,
          config: item.config ? {
            coloreDoghe: item.config.coloreDoghe,
            colorePali: item.config.colorePali,
            stessoColore: item.config.stessoColore,
            fissaggio: item.config.fissaggio,
            tipoDoghe: item.config.tipoDoghe,
            altezzaPali: item.config.altezzaPali,
            numeroDoghe: item.config.numeroDoghe,
            numeroSezioni: item.config.sezioni?.length || item.config.numeroSezioni,
            sezioniJson: item.config.sezioni ? JSON.stringify(item.config.sezioni) : null
          } : null
        }))
      };

      const res = await api.post('/ordini', payload);
      if (res?.success) {
        clear();
        toast.success(t('quote.savedSuccess'));
        navigate('/ordini');
      } else {
        // Handle both ApiResponse { message } and ASP.NET validation { title, errors }
        const errorMsg = res?.message || res?.title || t('common.error');
        const validationErrors = res?.errors;
        if (validationErrors) {
          const details = Object.values(validationErrors).flat().join('; ');
          toast.error(`${errorMsg}: ${details}`, { duration: 6000 });
        } else {
          toast.error(errorMsg, { duration: 6000 });
        }
        console.error('[QuoteFormPage] Save error:', res);
      }
    } catch (err) {
      toast.error(err.message || t('common.error'));
      console.error('[QuoteFormPage] Exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label, field, opts = {}) => {
    const { placeholder, maxLength, disabled, uppercase } = opts;
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <input
          type="text"
          value={form[field] || ''}
          onChange={(e) => {
            let val = e.target.value;
            if (uppercase) val = val.toUpperCase();
            handleChange(field, val);
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`input-field w-full ${errors[field] ? 'border-red-500 ring-1 ring-red-300' : ''} ${disabled ? 'bg-gray-100' : ''}`}
        />
        {errors[field] && (
          <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors[field]}
          </p>
        )}
      </div>
    );
  };

  if (prefilling) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <FileText className="w-7 h-7" />
        {t('quote.title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Fatturazione ────────────────────────── */}
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">{t('quote.invoiceData')}</h2>
          <div className="space-y-3">
            {renderField(t('quote.ragSoc'), 'fattRagSoc')}
            {renderField(t('quote.address'), 'fattIndirizzo')}
            <div className="grid grid-cols-3 gap-3">
              {renderField(t('quote.cap'), 'fattCap', { maxLength: 5, placeholder: '00000' })}
              {renderField(t('quote.city'), 'fattCitta')}
              {renderField(t('quote.province'), 'fattProvincia', { maxLength: 2, uppercase: true, placeholder: 'XX' })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {renderField(t('quote.piva'), 'fattPIva', { maxLength: 13, placeholder: 'IT00000000000' })}
              {renderField(t('quote.cfis'), 'fattCFis', { maxLength: 16, uppercase: true })}
            </div>
          </div>
        </div>

        {/* ── Consegna ────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">{t('quote.deliveryData')}</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsInvoice}
                onChange={(e) => setSameAsInvoice(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Copy className="w-3.5 h-3.5" />
              {t('quote.sameAsInvoice')}
            </label>
          </div>
          <div className="space-y-3">
            {renderField(t('quote.ragSoc'), 'consRagSoc', { disabled: sameAsInvoice })}
            {renderField(t('quote.address'), 'consIndirizzo', { disabled: sameAsInvoice })}
            <div className="grid grid-cols-3 gap-3">
              {renderField(t('quote.cap'), 'consCap', { maxLength: 5, placeholder: '00000', disabled: sameAsInvoice })}
              {renderField(t('quote.city'), 'consCitta', { disabled: sameAsInvoice })}
              {renderField(t('quote.province'), 'consProvincia', { maxLength: 2, uppercase: true, placeholder: 'XX', disabled: sameAsInvoice })}
            </div>
          </div>
        </div>
      </div>

      {/* Pagamento e note */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">{t('quote.payment')}</h2>
          <div className="space-y-3">
            {renderField(t('quote.paymentCode'), 'pagCod')}
            {renderField(t('quote.paymentDesc'), 'pagDescrizione')}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">{t('quote.notes')}</h2>
          <textarea
            value={form.note}
            onChange={(e) => handleChange('note', e.target.value)}
            placeholder={t('quote.notesPlaceholder')}
            rows={4}
            className="input-field w-full resize-none"
          />
        </div>
      </div>

      {/* Riepilogo carrello + invio */}
      <div className="mt-6 card p-5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <span>{t('quote.cartSummary')}: <strong>{getItemCount()}</strong> {t('quote.itemsCount')}</span>
            <span className="text-gray-300">|</span>
            <span>{t('cart.subtotal')}: <strong>{fmt.currency(getSubtotal())}</strong></span>
            <span className="text-gray-300">|</span>
            <span>{t('cart.vat')}: <strong>{fmt.currency(getVAT())}</strong></span>
            <span className="text-gray-300">|</span>
            <span className="text-lg font-bold">{t('cart.total')}: {fmt.currency(getTotal())}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/carrello')} className="btn-secondary">
              {t('common.back')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-success flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {t('quote.saveQuote')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
