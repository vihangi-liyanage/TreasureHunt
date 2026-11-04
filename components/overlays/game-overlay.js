"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function GameOverlay({ title, open, onClose, children, size = "medium" }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeButtonRef.current?.focus();
    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`game-overlay game-overlay-${size}`} role="dialog" aria-modal="true" aria-labelledby="overlay-title">
        <header className="overlay-header">
          <h2 className="font-display" id="overlay-title">{title}</h2>
          <button ref={closeButtonRef} className="round-control" type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={21} /></button>
        </header>
        <div className="overlay-body">{children}</div>
      </section>
    </div>
  );
}
