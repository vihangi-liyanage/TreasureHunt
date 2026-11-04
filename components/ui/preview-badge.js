import { Eye } from "lucide-react";

export function PreviewBadge() {
  return <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-amber-100"><Eye size={14} aria-hidden="true" /> UI preview only</div>;
}
