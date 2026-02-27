import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, RotateCw, Move, GripVertical } from 'lucide-react';

// ─── Costanti ──────────────────────────────────────────────────────────────
const SVG_PADDING = 60;
const PALO_RADIUS = 8;
const PALO_RADIUS_SELECTED = 11;
const PALO_RADIUS_HOVER = 14;
const LABEL_OFFSET = 20;
const ANGOLO_ARC_RADIUS = 25;

/**
 * PlanView2D — Vista pianta interattiva della recinzione.
 * 
 * Interazione: cliccare su un palo per selezionarlo.
 * - Click sull'ultimo palo: aggiunge una nuova sezione
 * - Click su un palo intermedio: lo seleziona per modifica
 * - Drag di un palo: modifica lunghezza/angolo della sezione
 */
export default function PlanView2D({
  sezioni = [],
  colorePali = '#7B7B7B',
  coloreDoghe = '#7B7B7B',
  selectedPaloIndex = null,
  onPaloClick,
  onAddSezione,
  onRemoveSezione,
  onUpdateSezione,
  className = '',
}) {
  const { t } = useTranslation();
  const svgRef = useRef(null);
  const [hoveredPalo, setHoveredPalo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPaloIndex, setDragPaloIndex] = useState(null);
  const [svgSize, setSvgSize] = useState({ width: 600, height: 350 });

  // Responsive SVG
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setSvgSize({
          width: Math.max(400, width),
          height: Math.max(250, Math.min(400, width * 0.55)),
        });
      }
    });
    if (svgRef.current?.parentElement) {
      observer.observe(svgRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, []);

  // ─── Calcola posizioni pali nello spazio SVG ─────────────────────────
  const { paliSVG, bounds, scale } = useMemo(() => {
    // Calcola in coordinate reali (cm)
    const realPositions = [{ x: 0, y: 0 }];
    let currentAngle = 0;

    for (const sez of sezioni) {
      const last = realPositions[realPositions.length - 1];
      const angleRad = (sez.angolo || 0) * (Math.PI / 180);
      currentAngle += angleRad;

      realPositions.push({
        x: last.x + Math.cos(currentAngle) * sez.lunghezza,
        y: last.y + Math.sin(currentAngle) * sez.lunghezza,
      });
    }

    // Calcola bounding box
    const xs = realPositions.map(p => p.x);
    const ys = realPositions.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const realW = maxX - minX || 150;
    const realH = maxY - minY || 50;

    // Scala per adattare all'SVG
    const availW = svgSize.width - SVG_PADDING * 2;
    const availH = svgSize.height - SVG_PADDING * 2;
    const sc = Math.min(availW / realW, availH / Math.max(realH, 30), 3);

    // Converti a coordinate SVG
    const offsetX = SVG_PADDING + (availW - realW * sc) / 2;
    const offsetY = SVG_PADDING + (availH - realH * sc) / 2;

    const svgPositions = realPositions.map(p => ({
      x: offsetX + (p.x - minX) * sc,
      y: offsetY + (p.y - minY) * sc,
    }));

    return {
      paliSVG: svgPositions,
      bounds: { minX, maxX, minY, maxY, realW, realH },
      scale: sc,
    };
  }, [sezioni, svgSize]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handlePaloClick = useCallback((index, e) => {
    e.stopPropagation();
    
    if (index === paliSVG.length - 1 && sezioni.length < 20) {
      // Click sull'ultimo palo → aggiungi sezione
      onAddSezione?.();
    } else {
      // Click su palo intermedio → seleziona
      onPaloClick?.(index);
    }
  }, [paliSVG.length, sezioni.length, onAddSezione, onPaloClick]);

  // Drag per modificare lunghezza
  const handleDragStart = useCallback((index, e) => {
    if (index === 0 || index >= paliSVG.length) return;
    e.preventDefault();
    setIsDragging(true);
    setDragPaloIndex(index);
  }, [paliSVG.length]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || dragPaloIndex === null || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const svgX = clientX - rect.left;
    const svgY = clientY - rect.top;

    // Converti coordinate SVG → reali
    const prevPalo = paliSVG[dragPaloIndex - 1];
    const dx = svgX - prevPalo.x;
    const dy = svgY - prevPalo.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const newLunghezza = Math.round(Math.max(10, Math.min(158, dist / scale)));

    // Calcola angolo — snap a 0° o 90° (unici angoli ammessi)
    const angle = Math.atan2(dy, dx);
    let prevAngle = 0;
    if (dragPaloIndex > 1) {
      const pp = paliSVG[dragPaloIndex - 2];
      const cp = paliSVG[dragPaloIndex - 1];
      prevAngle = Math.atan2(cp.y - pp.y, cp.x - pp.x);
    }
    const rawAngolo = Math.round(((angle - prevAngle) * 180) / Math.PI);
    const newAngolo = Math.abs(rawAngolo) >= 45 ? 90 : 0;

    onUpdateSezione?.(dragPaloIndex - 1, {
      lunghezza: newLunghezza,
      angolo: newAngolo,
    });
  }, [isDragging, dragPaloIndex, paliSVG, scale, onUpdateSezione]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragPaloIndex(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // ─── Rendering ───────────────────────────────────────────────────────
  const isLastPalo = (i) => i === paliSVG.length - 1;

  return (
    <div className={`relative ${className}`}>
      {/* Legenda */}
      <div className="absolute top-2 left-2 flex items-center gap-3 text-xs text-gray-500 z-10">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-100 inline-block" />
          {t('configurator.plan.clickToAdd')}
        </span>
        <span className="flex items-center gap-1">
          <Move size={12} />
          {t('configurator.plan.dragToResize')}
        </span>
      </div>

      <svg
        ref={svgRef}
        width={svgSize.width}
        height={svgSize.height}
        className="w-full border border-gray-200 rounded-lg bg-white"
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      >
        {/* Griglia di sfondo */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
          </pattern>
          {/* Marcatore punta freccia per quote */}
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#999" />
          </marker>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" rx="8" />

        {/* Titolo pianta */}
        <text x={svgSize.width / 2} y={20} textAnchor="middle" fontSize="11" fill="#888" fontWeight="500">
          {t('configurator.plan.title')} — {t('configurator.plan.topView')}
        </text>

        {/* Linee sezioni (doghe) */}
        {sezioni.map((sez, i) => {
          const start = paliSVG[i];
          const end = paliSVG[i + 1];
          if (!start || !end) return null;

          return (
            <g key={`sez-line-${i}`}>
              {/* Ombra sezione */}
              <line
                x1={start.x} y1={start.y + 2}
                x2={end.x} y2={end.y + 2}
                stroke="rgba(0,0,0,0.08)"
                strokeWidth={12}
                strokeLinecap="round"
              />
              {/* Corpo sezione */}
              <line
                x1={start.x} y1={start.y}
                x2={end.x} y2={end.y}
                stroke={coloreDoghe}
                strokeWidth={10}
                strokeLinecap="round"
                opacity={0.85}
              />
              {/* Bordo sezione */}
              <line
                x1={start.x} y1={start.y}
                x2={end.x} y2={end.y}
                stroke={coloreDoghe}
                strokeWidth={12}
                strokeLinecap="round"
                opacity={0.3}
              />

              {/* Label lunghezza */}
              <text
                x={(start.x + end.x) / 2}
                y={(start.y + end.y) / 2 - LABEL_OFFSET}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#333"
                className="select-none pointer-events-none"
              >
                {sez.lunghezza} cm
              </text>

              {/* Label numero sezione */}
              <text
                x={(start.x + end.x) / 2}
                y={(start.y + end.y) / 2 + LABEL_OFFSET + 5}
                textAnchor="middle"
                fontSize="9"
                fill="#888"
                className="select-none pointer-events-none"
              >
                {t('configurator.section')} {i + 1}
              </text>
            </g>
          );
        })}

        {/* Indicatori angolo */}
        {sezioni.map((sez, i) => {
          if (i === 0 || sez.angolo === 0) return null;
          const pos = paliSVG[i];
          if (!pos) return null;

          return (
            <g key={`angle-${i}`}>
              <circle cx={pos.x} cy={pos.y} r={ANGOLO_ARC_RADIUS} fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" opacity={0.4} />
              <text
                x={pos.x + ANGOLO_ARC_RADIUS + 4}
                y={pos.y - 4}
                fontSize="10"
                fill="#3b82f6"
                fontWeight="500"
              >
                {sez.angolo}°
              </text>
            </g>
          );
        })}

        {/* Pali (cerchi interattivi) */}
        {paliSVG.map((pos, i) => {
          const isSelected = selectedPaloIndex === i;
          const isHovered = hoveredPalo === i;
          const isLast = isLastPalo(i);
          const canAdd = isLast && sezioni.length < 20;

          let radius = PALO_RADIUS;
          if (isSelected) radius = PALO_RADIUS_SELECTED;
          if (isHovered) radius = PALO_RADIUS_HOVER;

          return (
            <g
              key={`palo-${i}`}
              onClick={(e) => handlePaloClick(i, e)}
              onMouseDown={(e) => handleDragStart(i, e)}
              onTouchStart={(e) => handleDragStart(i, e)}
              onMouseEnter={() => setHoveredPalo(i)}
              onMouseLeave={() => setHoveredPalo(null)}
              style={{ cursor: canAdd ? 'pointer' : (i > 0 ? 'grab' : 'default') }}
            >
              {/* Alone hover */}
              {isHovered && (
                <circle
                  cx={pos.x} cy={pos.y}
                  r={radius + 6}
                  fill={canAdd ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.05)'}
                  stroke={canAdd ? '#3b82f6' : '#ccc'}
                  strokeWidth="1"
                  strokeDasharray={canAdd ? 'none' : '3,3'}
                />
              )}

              {/* Cerchio palo */}
              <circle
                cx={pos.x} cy={pos.y}
                r={radius}
                fill={isSelected ? '#3b82f6' : colorePali}
                stroke={isSelected ? '#1d4ed8' : '#555'}
                strokeWidth={isSelected ? 3 : 1.5}
              />

              {/* Icona + sull'ultimo palo */}
              {canAdd && (
                <>
                  <line
                    x1={pos.x - 4} y1={pos.y}
                    x2={pos.x + 4} y2={pos.y}
                    stroke="white" strokeWidth="2" strokeLinecap="round"
                    className="pointer-events-none"
                  />
                  <line
                    x1={pos.x} y1={pos.y - 4}
                    x2={pos.x} y2={pos.y + 4}
                    stroke="white" strokeWidth="2" strokeLinecap="round"
                    className="pointer-events-none"
                  />
                </>
              )}

              {/* Label palo */}
              <text
                x={pos.x}
                y={pos.y + radius + 14}
                textAnchor="middle"
                fontSize="9"
                fill={isSelected ? '#1d4ed8' : '#666'}
                fontWeight={isSelected ? '600' : '400'}
                className="select-none pointer-events-none"
              >
                P{i + 1}
              </text>
            </g>
          );
        })}

        {/* Istruzioni quando vuoto */}
        {sezioni.length === 0 && paliSVG.length === 1 && (
          <text
            x={paliSVG[0].x + 30}
            y={paliSVG[0].y}
            fontSize="12"
            fill="#999"
            dominantBaseline="middle"
          >
            ← {t('configurator.plan.clickFirstPost')}
          </text>
        )}

        {/* Scala di riferimento */}
        {scale > 0 && (
          <g>
            <line
              x1={15} y1={svgSize.height - 20}
              x2={15 + 100 * scale * 0.5} y2={svgSize.height - 20}
              stroke="#999" strokeWidth="1"
            />
            <text
              x={15 + (100 * scale * 0.5) / 2}
              y={svgSize.height - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#999"
            >
              {Math.round(100 * 0.5)} cm
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
