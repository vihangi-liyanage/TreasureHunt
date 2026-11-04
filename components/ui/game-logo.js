import Link from "next/link";

export function GameLogo({ compact = false, href = "/welcome" }) {
  const content = (
    <span className="inline-flex items-center gap-3" aria-label="TreasureHunt home">
      <span className={`${compact ? "size-9" : "size-11"} grid place-items-center rounded-full border border-amber-200/50 bg-amber-300/12 shadow-[0_0_24px_rgba(244,185,66,.16)]`} aria-hidden="true"><span className="text-amber-200">✦</span></span>
      <span className="font-display text-lg tracking-[.08em] text-amber-50">Treasure<span className="text-amber-300">Hunt</span></span>
    </span>
  );
  return href ? <Link href={href} className="rounded-lg">{content}</Link> : content;
}
