import React from "react";

export default function CompareFiles({
  leftFile,
  rightFile,
  onLeftChange,
  onRightChange,
  onSubmit,
  loading,
  error,
}) {
  const canSubmit = leftFile && rightFile;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Two-column file inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left side */}
        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">File 1</label>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={onLeftChange}
            className="glow-input w-full cursor-pointer file:bg-cyan-600 file:border-0 file:px-4 file:py-2 file:text-white file:cursor-pointer file:mr-4 hover:file:bg-cyan-500"
          />
          <p className="mt-1 text-xs text-cyan-300/60">
            {leftFile ? leftFile.name : "Choose a document"}
          </p>
        </div>

        {/* Right side */}
        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">File 2</label>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={onRightChange}
            className="glow-input w-full cursor-pointer file:bg-cyan-600 file:border-0 file:px-4 file:py-2 file:text-white file:cursor-pointer file:mr-4 hover:file:bg-cyan-500"
          />
          <p className="mt-1 text-xs text-cyan-300/60">
            {rightFile ? rightFile.name : "Choose a document"}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          disabled={!canSubmit || loading}
          type="submit"
          className="glow-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Comparing..." : "Compare Files"}
        </button>

        {(leftFile || rightFile) && (
          <button
            type="button"
            onClick={() => {
              onLeftChange({ target: { files: [] } });
              onRightChange({ target: { files: [] } });
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
