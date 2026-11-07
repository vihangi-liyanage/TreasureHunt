export function FormField({ id, label, error, hint, children }) {
  const message = error || hint || "";

  return (
    <div className="auth-field-group" data-invalid={error ? "true" : "false"}>
      <label htmlFor={id}>{label}</label>
      {children}
      <p className="field-help" id={`${id}-help`} role={error ? "alert" : undefined} aria-live={error ? "polite" : undefined} aria-hidden={!message}>{message}</p>
    </div>
  );
}
