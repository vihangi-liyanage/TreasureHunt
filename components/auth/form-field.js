export function FormField({ id, label, error, hint, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-stone-100" htmlFor={id}>{label}</label>
      {children}
      <p className={`mt-1.5 min-h-5 text-xs ${error ? "text-[#ff9d87]" : "text-stone-300/50"}`} id={`${id}-help`} aria-live="polite">{error || hint || " "}</p>
    </div>
  );
}
