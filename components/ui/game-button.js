import Link from "next/link";

const variants = { primary: "game-button-primary", secondary: "game-button-secondary", ghost: "game-button-ghost" };

export function GameButton({ href, variant = "primary", disabled = false, className = "", children, ...props }) {
  const classes = `game-button ${variants[variant]} ${className}`;
  if (href && !disabled) return <Link className={classes} href={href} {...props}>{children}</Link>;
  return <button className={classes} type={props.type || "button"} disabled={disabled} aria-disabled={disabled} {...props}>{children}</button>;
}
