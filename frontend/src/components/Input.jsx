import React from "react";

export default function Input({ label, helperText, error, multiline = false, className = "", rows = 6, ...props }) {
  const controlClassName = [
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text)] shadow-[var(--shadow)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 backdrop-blur-xl",
    className,
  ].join(" ");

  return (
    <label className="block space-y-2 text-sm text-[var(--muted)]">
      {label ? <span className="font-medium text-[var(--text)]">{label}</span> : null}
      {multiline ? <textarea rows={rows} className={controlClassName} {...props} /> : <input className={controlClassName} {...props} />}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {helperText ? <p className="text-xs text-[var(--muted)]">{helperText}</p> : null}
    </label>
  );
}