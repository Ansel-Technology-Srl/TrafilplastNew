/**
 * Accessible3DCanvas — Wrapper accessibile per il canvas Three.js.
 *
 * Fornisce:
 * - Toggle "Vista 3D / Vista accessibile"
 * - role="img" + aria-label sul canvas
 * - aria-hidden="true" sul canvas quando la vista accessibile è attiva
 * - Skip link per saltare il canvas con tastiera
 * - Mostra AccessibleConfigurator come alternativa testuale
 *
 * USO in ConfiguratorPage.jsx:
 *   import Accessible3DCanvas from '../components/Accessible3DCanvas';
 *
 *   // Sostituire il <Canvas> diretto con:
 *   <Accessible3DCanvas config={config} bom={distintaBase}>
 *     <ambientLight intensity={0.6} />
 *     <directionalLight position={[5, 10, 5]} />
 *     <OrbitControls />
 *     <FenceModel config={config} />
 *   </Accessible3DCanvas>
 */
import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import AccessibleConfigurator from './AccessibleConfigurator';

export default function Accessible3DCanvas({
  children,
  config,
  bom,
  className = '',
  canvasProps = {},
}) {
  const { t } = useTranslation();
  const [showAccessible, setShowAccessible] = useState(false);

  const toggleView = useCallback(() => {
    setShowAccessible(prev => !prev);
  }, []);

  // Genera aria-label per il canvas
  const canvasAriaLabel = config
    ? t('a11y.configurator3d', 'Vista 3D della recinzione configurata')
    : t('a11y.configurator3d', 'Vista 3D della recinzione');

  return (
    <div className={`relative ${className}`}>
      {/* Skip link per saltare il canvas */}
      <a
        href="#after-3d-canvas"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary-700 focus:text-white focus:px-3 focus:py-1 focus:rounded focus:text-sm"
      >
        {t('a11y.skipToContent', 'Salta il configuratore 3D')}
      </a>

      {/* Toggle Vista 3D / Vista Accessibile */}
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={toggleView}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md
                     border border-gray-300 bg-white text-gray-700
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     transition-colors"
          aria-pressed={showAccessible}
          aria-label={showAccessible
            ? t('a11y.toggle3d', 'Passa alla vista 3D')
            : t('a11y.toggleAccessible', 'Passa alla vista accessibile')
          }
        >
          {showAccessible ? (
            <>
              <Eye className="w-4 h-4" aria-hidden="true" />
              {t('a11y.toggle3d', 'Vista 3D')}
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" aria-hidden="true" />
              {t('a11y.toggleAccessible', 'Vista accessibile')}
            </>
          )}
        </button>
      </div>

      {/* Canvas 3D */}
      {!showAccessible && (
        <div
          role="img"
          aria-label={canvasAriaLabel}
          className="w-full rounded-lg overflow-hidden border border-gray-200"
          style={{ height: canvasProps.height || 400 }}
        >
          <Canvas
            camera={{ position: [5, 5, 5], fov: 50 }}
            {...canvasProps}
            style={{ width: '100%', height: '100%' }}
          >
            {children}
          </Canvas>
        </div>
      )}

      {/* Vista accessibile (nasconde canvas) */}
      {showAccessible && (
        <AccessibleConfigurator config={config} bom={bom} />
      )}

      {/* Ancora per lo skip link */}
      <div id="after-3d-canvas" tabIndex={-1} />
    </div>
  );
}
