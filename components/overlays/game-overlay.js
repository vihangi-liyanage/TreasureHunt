"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function GameOverlay({ title, open, onClose, children, size = "medium" }) {
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    function handleKeys(event) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll("button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex='-1'])") || [])];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", handleKeys);
    return () => { window.removeEventListener("keydown", handleKeys); previousFocusRef.current?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className={`game-overlay game-overlay-${size}`} role="dialog" aria-modal="true" aria-labelledby="overlay-title">
        <header className="overlay-header">
          <h2 className="font-display" id="overlay-title">{title}</h2>
          <button ref={closeButtonRef} className="round-control" type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={21} /></button>
        </header>
        <div className="overlay-body">{children}</div>
      </section>
    </div>
  );
}
