import Link from "next/link";

export function MenuTile({ href, icon: Icon, title, description, disabled = false }) {
  const content = <><span className="grid size-10 place-items-center rounded-xl bg-amber-200/10 text-amber-300"><Icon size={21} aria-hidden="true" /></span><span><span className="block font-extrabold">{title}</span><span className="mt-1 block text-xs leading-5 text-stone-300/55">{description}</span></span></>;
  return href && !disabled ? <Link className="menu-tile" href={href}>{content}</Link> : <button className="menu-tile" type="button" disabled aria-disabled="true">{content}</button>;
}
