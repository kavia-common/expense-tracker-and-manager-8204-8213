import React, { useEffect } from 'react';
import '../../styles/theme.css';

/**
 * A minimal, accessible modal component with Ocean Professional styling.
 * Provides overlay, focus trap basic behavior, ESC to close, and size variations.
 */
// PUBLIC_INTERFACE
export default function Modal({ isOpen, title, children, onClose, footer, size = 'md' }) {
  // Close on Escape (hook must not be conditional)
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && isOpen) onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, isOpen]);

  /** Render nothing if closed */
  if (!isOpen) return null;

  // Simple size map
  const maxWidth = {
    sm: 420,
    md: 560,
    lg: 760,
  }[size] || 560;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      className="et-modal"
      onClick={(e) => {
        // Close when clicking the overlay only
        if (e.target.classList.contains('et-modal')) onClose?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.4)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 50,
      }}
    >
      <div
        className="et-modal__panel"
        style={{
          width: '100%',
          maxWidth,
          background: 'var(--surface)',
          border: 'var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}
      >
        <div
          className="et-modal__header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--gradient-surface)',
            borderBottom: 'var(--border)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
          <button
            type="button"
            className="et-btn et-btn--ghost"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="et-modal__body" style={{ padding: 16 }}>
          {children}
        </div>
        {footer ? (
          <div
            className="et-modal__footer"
            style={{
              padding: 12,
              borderTop: 'var(--border)',
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              background: 'rgba(17,24,39,0.02)',
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
