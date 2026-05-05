import React from "react";

const MODES = [
  { id: "analyze-text", label: "Analyze Text" },
  { id: "file-analysis", label: "File Analysis" },
  { id: "compare-text", label: "Compare Text" },
  { id: "compare-documents", label: "Compare Documents" },
];

export default function ModeSwitcher({ activeMode, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow)] backdrop-blur-2xl">
      {MODES.map((mode) => {
        const active = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onChange(mode.id)}
            className={[
              "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-[var(--accent)] text-slate-950 shadow-sm"
                : "text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]",
            ].join(" ")}
            aria-pressed={active}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}