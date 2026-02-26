/**
 * Hook React per focus trap nei modal (WCAG 2.4.3).
 *
 * Funzionalità:
 * - Intrappola il focus dentro il contenitore ref quando isOpen=true
 * - Tab dall'ultimo elemento → torna al primo
 * - Shift+Tab dal primo → va all'ultimo
 * - Escape → chiama onClose
 * - Al mount → focus sul primo elemento focusabile (o l'elemento con autoFocus)
 * - Al unmount → ripristina il focus all'elemento che era attivo prima dell'apertura
 *
 * USO:
 *   const modalRef = useRef(null);
 *   useFocusTrap(modalRef, isOpen, onClose);
 *   return <div ref={modalRef} role="dialog" aria-modal="true">...</div>
 */
import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(containerRef, isOpen, onClose) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Salva l'elemento attivo corrente per ripristinarlo alla chiusura
    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    // Piccolo ritardo per permettere al DOM di renderizzare
    const focusTimer = setTimeout(() => {
      const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTOR);
      const autoFocusEl = container.querySelector('[autofocus], [data-autofocus]');

      if (autoFocusEl) {
        autoFocusEl.focus();
      } else if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        // Se nessun elemento focusabile, rendi il container stesso focusabile
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    }, 50);

    function handleKeyDown(event) {
      // Escape → chiudi
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (typeof onClose === 'function') {
          onClose();
        }
        return;
      }

      // Tab → intrappola il focus
      if (event.key === 'Tab') {
        const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: se siamo sul primo → vai all'ultimo
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: se siamo sull'ultimo → vai al primo
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);

      // Ripristina focus precedente
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        // Piccolo ritardo per evitare conflitti con animazioni di chiusura
        setTimeout(() => {
          previousFocusRef.current?.focus();
        }, 0);
      }
    };
  }, [isOpen, containerRef, onClose]);
}

export default useFocusTrap;
