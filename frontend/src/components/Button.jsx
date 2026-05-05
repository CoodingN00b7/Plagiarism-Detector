import React from "react";

const variants = {
  primary: "bg-[var(--accent)] text-slate-950 hover:brightness-110 focus:ring-[var(--accent)]",
  secondary: "border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text)] hover:border-[var(--accent)] focus:ring-[var(--accent)]",
  ghost: "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)] focus:ring-[var(--accent)]",
};

export default function Button({ variant = "primary", className = "", loading = false, disabled = false, type = "button", children, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 shadow-[var(--shadow)]";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[base, variants[variant] || variants.primary, className].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}