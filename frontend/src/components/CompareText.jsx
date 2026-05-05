import React from "react";

export default function CompareText({
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  onSubmit,
  loading,
  error,
}) {
  const canSubmit = leftValue.trim().length >= 20 && rightValue.trim().length >= 20;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Two-column text areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left side */}
        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Text 1</label>
          <textarea
            value={leftValue}
            onChange={onLeftChange}
            rows={8}
            placeholder="First text for comparison..."
            className="glow-input w-full resize-none font-mono text-sm"
          />
          <p className="mt-1 text-xs text-cyan-300/60">{leftValue.length} characters</p>
        </div>

        {/* Right side */}
        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Text 2</label>
          <textarea
            value={rightValue}
            onChange={onRightChange}
            rows={8}
            placeholder="Second text for comparison..."
            className="glow-input w-full resize-none font-mono text-sm"
          />
          <p className="mt-1 text-xs text-cyan-300/60">{rightValue.length} characters</p>
        </div>
      </div>

      {/* Minimum characters warning */}
      {!canSubmit && (
        <p className="text-xs text-amber-400">
          Both texts must be at least 20 characters long
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          disabled={!canSubmit || loading}
          type="submit"
          className="glow-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Comparing..." : "Compare Texts"}
        </button>

        {(leftValue || rightValue) && (
          <button
            type="button"
            onClick={() => {
              onLeftChange({ target: { value: "" } });
              onRightChange({ target: { value: "" } });
            }}
            className="glow-btn"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}
    </form>
  );
}
