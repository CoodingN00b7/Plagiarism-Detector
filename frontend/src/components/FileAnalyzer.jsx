import React from "react";

export default function FileAnalyzer({ files, onChange, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* File input */}
      <div className="relative">
        <label className="block text-sm font-medium text-cyan-300 mb-3">Upload Documents</label>
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.doc,.docx"
          onChange={onChange}
          className="glow-input w-full cursor-pointer file:bg-cyan-600 file:border-0 file:px-4 file:py-2 file:text-white file:cursor-pointer file:mr-4 hover:file:bg-cyan-500"
        />
        <p className="mt-2 text-xs text-cyan-300/60">
          {files && files.length ? `${files.length} file(s) selected` : "Choose one or more documents (PDF, TXT, DOC, DOCX)"}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          disabled={!files || !files.length || loading}
          type="submit"
          className="glow-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Analyzing..." : "Analyze Files"}
        </button>
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
