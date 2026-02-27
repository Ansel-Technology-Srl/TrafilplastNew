import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Palette, Anchor, Layers, Ruler, PenTool,
  ShoppingCart, FileText, ChevronRight, ChevronLeft,
  Plus, Trash2, RotateCw, Eye, EyeOff,
  Box, LayoutDashboard, Settings, Download,
  Check, AlertCircle, Maximize2, Minimize2,
} from 'lucide-react';
import api from '../services/api';
import { useCartStore } from '../store/store';
import { useFormatters } from '../utils/formatters';
import FenceScene3D from '../components/configurator/FenceScene3D';
import PlanView2D from '../components/configurator/PlanView2D';

// ─── Costanti ──────────────────────────────────────────────────────────────
const TABELLA_DOGHE = {
  100: { persiana: 8, pieno: 9 },
  150: { persiana: 12, pieno: 14 },
  185: { persiana: 15, pieno: 17 },
  200: { persiana: 16, pieno: 18 },
};

const COLORI_DEFAULT = [
  { hex: '#E8E0D0', nome: 'Bianco melange' },
  { hex: '#8B4513', nome: 'Marrone' },
  { hex: '#4A4A4A', nome: 'Antracite' },
];

const ALTEZZE_VALIDE = [100, 150, 185, 200];

const ANGOLI_PRESET = [0, 90];

const STEPS = [
  { id: 'parametri', icon: Settings },
  { id: 'disegno', icon: PenTool },
  { id: 'riepilogo', icon: FileText },
];

// ─── Componente selettore colore ───────────────────────────────────────────
function ColorPicker({ colori, value, onChange, label }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>}
      <div className="flex gap-2">
        {colori.map((c) => (
          <button
            key={c.hex}
            className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
              value === c.hex
                ? 'border-blue-500 ring-2 ring-blue-200 scale-110'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: c.hex }}
            onClick={() => onChange(c.hex)}
            title={c.nome}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Componente slider + input numerico ────────────────────────────────────
function SliderInput({ value, min, max, step = 1, onChange, unit = 'cm', label }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => setLocalValue(value), [value]);

  const handleBlur = () => {
    const clamped = Math.max(min, Math.min(max, Number(localValue) || min));
    setLocalValue(clamped);
    onChange(clamped);
  };

  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm text-gray-600 w-16 shrink-0">{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={(e) => {
          setLocalValue(Number(e.target.value));
          onChange(Number(e.target.value));
        }}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-blue-600"
      />
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  );
}

// ─── CONFIGURATOR PAGE ─────────────────────────────────────────────────────
export default function ConfiguratorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const addConfiguredItem = useCartStore((s) => s.addConfiguredItem);
  const fmt = useFormatters();

  // ─── Tipo configurazione (dal prodotto catalogo o default) ────────────
  const [cfgTipo, setCfgTipo] = useState('recinzione');

  // ─── State configurazione ─────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [stessoColore, setStessoColore] = useState(true);
  const [coloreDoghe, setColoreDoghe] = useState('#4A4A4A');
  const [colorePali, setColorePali] = useState('#4A4A4A');
  const [fissaggio, setFissaggio] = useState('cemento');
  const [tipoDoghe, setTipoDoghe] = useState('persiana');
  const [altezzaPali, setAltezzaPali] = useState(150);
  const [sezioni, setSezioni] = useState([{ lunghezza: 158, angolo: 0 }]);

  // ─── State vista/interazione ──────────────────────────────────────────
  const [viewMode, setViewMode] = useState('both'); // '3d' | '2d' | 'both'
  const [selectedPaloIndex, setSelectedPaloIndex] = useState(null);
  const [is3DExpanded, setIs3DExpanded] = useState(false);

  // ─── State distinta base ──────────────────────────────────────────────
  const [distinta, setDistinta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── Se arriva da catalogo con prodotto ───────────────────────────────
  useEffect(() => {
    if (location.state?.fromProduct) {
      const product = location.state.fromProduct;
      // Imposta il tipo di configurazione dal prodotto
      if (product.cfgTipo) {
        setCfgTipo(product.cfgTipo);
      }
      toast.success(t('configurator.fromCatalog'));
    }
  }, [location.state]);

  // Sincronizza colore pali quando "stesso colore"
  useEffect(() => {
    if (stessoColore) setColorePali(coloreDoghe);
  }, [stessoColore, coloreDoghe]);

  // ─── Numero doghe corrente ────────────────────────────────────────────
  const numDoghe = useMemo(() => {
    const entry = TABELLA_DOGHE[altezzaPali];
    if (!entry) return 12;
    return tipoDoghe === 'persiana' ? entry.persiana : entry.pieno;
  }, [altezzaPali, tipoDoghe]);

  // ─── Handlers sezioni ────────────────────────────────────────────────
  const addSezione = useCallback(() => {
    if (sezioni.length >= 20) {
      toast.error(t('configurator.maxSections'));
      return;
    }
    setSezioni((prev) => [...prev, { lunghezza: 158, angolo: 0 }]);
    toast.success(t('configurator.sectionAdded'));
  }, [sezioni.length, t]);

  const removeSezione = useCallback((index) => {
    if (sezioni.length <= 1) {
      toast.error(t('configurator.minSections'));
      return;
    }
    setSezioni((prev) => prev.filter((_, i) => i !== index));
    setSelectedPaloIndex(null);
    toast.success(t('configurator.sectionRemoved'));
  }, [sezioni.length, t]);

  const updateSezione = useCallback((index, updates) => {
    setSezioni((prev) =>
      prev.map((sez, i) =>
        i === index ? { ...sez, ...updates } : sez
      )
    );
  }, []);

  // Click su palo nel 2D/3D
  const handlePaloClick = useCallback((index) => {
    setSelectedPaloIndex((prev) => (prev === index ? null : index));
  }, []);

  // ─── Calcola distinta base ────────────────────────────────────────────
  const calcolaDistinta = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        altezzaPali,
        tipoDoghe,
        fissaggio,
        coloreDoghe,
        colorePali: stessoColore ? coloreDoghe : colorePali,
        sezioni,
      };
      const res = await api.post('/configuratore/distinta-base', payload);
      if (res?.success && res.data?.componenti?.length > 0) {
        setDistinta(res.data);
        setStep(2); // Vai al riepilogo
        toast.success(t('configurator.bomCalculated'));
      } else if (res?.success && (!res.data?.componenti || res.data.componenti.length === 0)) {
        setError(t('configurator.bomEmpty', 'La distinta base è vuota. Verificare che i prodotti siano configurati nel sistema.'));
        toast.error(t('configurator.bomEmpty', 'Distinta base vuota'));
      } else {
        setError(res?.error || res?.message || t('common.genericError'));
        toast.error(res?.error || res?.message || t('common.genericError'));
      }
    } catch (err) {
      const msg = err.message || t('common.genericError');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [altezzaPali, tipoDoghe, fissaggio, coloreDoghe, colorePali, stessoColore, sezioni, t]);

  // ─── Aggiungi al carrello ─────────────────────────────────────────────
  const aggiungiAlCarrello = useCallback(() => {
    if (!distinta) return;
    const numeroDoghe = TABELLA_DOGHE[altezzaPali]?.[tipoDoghe] || 0;
    const config = {
      cfgTipo,
      altezzaPali,
      tipoDoghe,
      fissaggio,
      coloreDoghe,
      colorePali: stessoColore ? coloreDoghe : colorePali,
      stessoColore,
      numeroDoghe,
      sezioni,
    };
    addConfiguredItem(config, distinta.componenti, distinta.totale);
    toast.success(t('configurator.addedToCart'));
    navigate('/carrello');
  }, [distinta, cfgTipo, altezzaPali, tipoDoghe, fissaggio, coloreDoghe, colorePali, stessoColore, sezioni, addConfiguredItem, navigate, t]);

  // ─── Lunghezza totale ─────────────────────────────────────────────────
  const lunghezzaTotale = useMemo(
    () => sezioni.reduce((sum, s) => sum + s.lunghezza, 0),
    [sezioni]
  );

  // ══════════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-4">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t('configurator.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('configurator.subtitle')}
          </p>
        </div>

        {/* Toggle vista 2D/3D */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === '2d' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard size={16} className="inline mr-1" />
            2D
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === '3d' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Box size={16} className="inline mr-1" />
            3D
          </button>
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'both' ? 'bg-white text-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye size={16} className="inline mr-1" />
            {t('configurator.bothViews')}
          </button>
        </div>
      </div>

      {/* ─── Stepper ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i;
          const isDone = step > i;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDone
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {isDone ? <Check size={16} /> : <Icon size={16} />}
                {t(`configurator.steps.${s.id}`)}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={16} className="text-gray-300" />}
            </div>
          );
        })}
      </div>

      {/* ─── Layout principale: parametri + visualizzazione ────────────── */}
      <div className={`grid gap-4 ${
        is3DExpanded ? 'grid-cols-1' : 'lg:grid-cols-[380px_1fr]'
      }`}>

        {/* ═══ PANNELLO SINISTRO: Parametri / Sezioni / Riepilogo ═══ */}
        {!is3DExpanded && (
          <div className="flex flex-col max-h-[calc(100vh-200px)]">

            {/* Area scrollabile */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">

            {/* ─── STEP 0: Parametri generali ────────────────────────── */}
            {step === 0 && (
              <div className="space-y-4">
                {/* Colore */}
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Palette size={16} className="text-blue-500" />
                    {t('configurator.color.title')}
                  </h3>

                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stessoColore}
                      onChange={(e) => setStessoColore(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">{t('configurator.color.sameColor')}</span>
                  </label>

                  <ColorPicker
                    colori={COLORI_DEFAULT}
                    value={coloreDoghe}
                    onChange={setColoreDoghe}
                    label={stessoColore ? t('configurator.color.fenceColor') : t('configurator.color.slatsColor')}
                  />

                  {!stessoColore && (
                    <div className="mt-3">
                      <ColorPicker
                        colori={COLORI_DEFAULT}
                        value={colorePali}
                        onChange={setColorePali}
                        label={t('configurator.color.postsColor')}
                      />
                    </div>
                  )}
                </div>

                {/* Fissaggio */}
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Anchor size={16} className="text-blue-500" />
                    {t('configurator.mounting.title')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['cemento', 'terreno'].map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setFissaggio(tipo)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          fissaggio === tipo
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">{tipo === 'cemento' ? '🧱' : '🌱'}</div>
                        {t(`configurator.mounting.${tipo}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo doghe */}
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Layers size={16} className="text-blue-500" />
                    {t('configurator.slats.title')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['persiana', 'pieno'].map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setTipoDoghe(tipo)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          tipoDoghe === tipo
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg mb-1">
                          {tipo === 'persiana' ? '≡' : '█'}
                        </div>
                        {t(`configurator.slats.${tipo}`)}
                        <div className="text-xs text-gray-400 mt-1">
                          {tipo === 'persiana'
                            ? t('configurator.slats.persianaDesc')
                            : t('configurator.slats.pienoDesc')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Altezza pali */}
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Ruler size={16} className="text-blue-500" />
                    {t('configurator.height.title')}
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {ALTEZZE_VALIDE.map((h) => {
                      const doghe = TABELLA_DOGHE[h];
                      const n = tipoDoghe === 'persiana' ? doghe.persiana : doghe.pieno;
                      return (
                        <button
                          key={h}
                          onClick={() => setAltezzaPali(h)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            altezzaPali === h
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-lg font-bold">{h}</div>
                          <div className="text-xs text-gray-400">cm</div>
                          <div className="text-xs mt-1 text-gray-500">
                            {n} {t('configurator.height.slats')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 1: Disegno sezioni ───────────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Info rapida */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  <AlertCircle size={14} className="inline mr-1" />
                  {t('configurator.design.hint')}
                </div>

                {/* Lista sezioni editabili */}
                <div className="space-y-2">
                  {sezioni.map((sez, i) => (
                    <div
                      key={i}
                      className={`card p-3 transition-all ${
                        selectedPaloIndex === i || selectedPaloIndex === i + 1
                          ? 'ring-2 ring-blue-400 bg-blue-50/30'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          {t('configurator.section')} {i + 1}
                        </span>
                        {sezioni.length > 1 && (
                          <button
                            onClick={() => removeSezione(i)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title={t('configurator.design.removeSection')}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Lunghezza */}
                      <SliderInput
                        value={sez.lunghezza}
                        min={10}
                        max={158}
                        onChange={(v) => updateSezione(i, { lunghezza: v })}
                        label={t('configurator.design.length')}
                      />

                      {/* Angolo: 0° (in linea) o 90° */}
                      <div className="mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <RotateCw size={12} className="text-gray-400" />
                          <input
                            type="checkbox"
                            checked={sez.angolo === 90}
                            onChange={(e) => updateSezione(i, { angolo: e.target.checked ? 90 : 0 })}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">{t('configurator.design.angle90')}</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Aggiungi sezione */}
                <button
                  onClick={addSezione}
                  disabled={sezioni.length >= 20}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  {t('configurator.design.addSection')}
                  {sezioni.length >= 20 && ` (${t('configurator.maxReached')})`}
                </button>

                {/* Riepilogo rapido */}
                <div className="card p-3 bg-gray-50">
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <div className="text-lg font-bold text-gray-800">{sezioni.length}</div>
                      <div className="text-xs text-gray-500">{t('configurator.summary.sections')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">{sezioni.length + 1}</div>
                      <div className="text-xs text-gray-500">{t('configurator.summary.posts')}</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">{lunghezzaTotale}</div>
                      <div className="text-xs text-gray-500">cm {t('configurator.summary.total')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 2: Riepilogo e distinta base ─────────────────── */}
            {step === 2 && distinta && (
              <div className="space-y-4">
                {/* Riepilogo numerico */}
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t('configurator.bom.summary')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-800">{distinta.riepilogo.numSezioni}</div>
                      <div className="text-xs text-gray-500">{t('configurator.summary.sections')}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-800">{distinta.riepilogo.numPali}</div>
                      <div className="text-xs text-gray-500">{t('configurator.summary.posts')}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-800">{distinta.riepilogo.numDoghePerSezione}</div>
                      <div className="text-xs text-gray-500">{t('configurator.bom.slatsPerSection')}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-gray-800">{distinta.riepilogo.lunghezzaTotale}</div>
                      <div className="text-xs text-gray-500">cm {t('configurator.summary.total')}</div>
                    </div>
                  </div>
                </div>

                {/* Lista componenti (layout compatto per pannello 380px) */}
                <div className="space-y-2">
                  {distinta.componenti.map((comp, i) => (
                    <div key={i} className="card p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{comp.prdDes}</p>
                          <p className="text-xs text-gray-400 font-mono">{comp.prdCod}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-800">{fmt.currency(comp.prezzoTotale)}</p>
                          <p className="text-xs text-gray-400">
                            {comp.quantita} x {fmt.currency(comp.prezzoUnitario)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            </div>{/* Fine area scrollabile */}

            {/* ─── Barra fissa in basso (totale + pulsanti) ───────────── */}
            <div className="flex-shrink-0 pt-3 border-t border-gray-200 mt-3 bg-white space-y-3">
              {/* Totale complessivo fisso - visibile solo allo step 2 */}
              {step === 2 && distinta && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700">{t('configurator.bom.grandTotal')}</span>
                    <span className="text-xl font-bold text-blue-700">{fmt.currency(distinta.totale)}</span>
                  </div>
                </div>
              )}
              {step === 0 && (
                <button
                  onClick={() => setStep(1)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {t('configurator.steps.goToDesign')}
                  <ChevronRight size={16} />
                </button>
              )}
              {step === 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(0)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    {t('configurator.steps.back')}
                  </button>
                  <button
                    onClick={calcolaDistinta}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <FileText size={16} />
                    )}
                    {t('configurator.steps.calculateBom')}
                  </button>
                </div>
              )}
              {step === 2 && distinta && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    {t('configurator.steps.back')}
                  </button>
                  <button
                    onClick={aggiungiAlCarrello}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={16} />
                    {t('configurator.addToCart')}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═══ PANNELLO DESTRO: Visualizzazione 2D + 3D ═══ */}
        <div className="space-y-4">
          {/* Toggle fullscreen 3D */}
          <div className="flex justify-end">
            <button
              onClick={() => setIs3DExpanded(!is3DExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title={is3DExpanded ? t('configurator.exitFullscreen') : t('configurator.fullscreen')}
            >
              {is3DExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          {/* Vista 3D */}
          {(viewMode === '3d' || viewMode === 'both') && (
            <div className={`card overflow-hidden ${
              viewMode === 'both' ? 'h-[350px] lg:h-[400px]' : 'h-[500px] lg:h-[600px]'
            } ${is3DExpanded ? 'h-[70vh]' : ''}`}>
              <FenceScene3D
                sezioni={sezioni}
                altezzaPali={altezzaPali}
                tipoDoghe={tipoDoghe}
                coloreDoghe={coloreDoghe}
                colorePali={stessoColore ? coloreDoghe : colorePali}
                selectedPaloIndex={selectedPaloIndex}
                onPaloClick={handlePaloClick}
              />
            </div>
          )}

          {/* Vista 2D pianta */}
          {(viewMode === '2d' || viewMode === 'both') && (
            <div className="card p-2">
              <PlanView2D
                sezioni={sezioni}
                colorePali={stessoColore ? coloreDoghe : colorePali}
                coloreDoghe={coloreDoghe}
                selectedPaloIndex={selectedPaloIndex}
                onPaloClick={handlePaloClick}
                onAddSezione={addSezione}
                onRemoveSezione={removeSezione}
                onUpdateSezione={updateSezione}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
