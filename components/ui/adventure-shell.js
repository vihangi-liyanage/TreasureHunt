import { FloatingMotes } from "./floating-motes";

export function AdventureShell({ children, className = "" }) {
  return <main className={`adventure-shell ${className}`}><FloatingMotes />{children}</main>;
}
