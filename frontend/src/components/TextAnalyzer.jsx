import React, { useState, useCallback } from "react";
import Button from "./Button";
import Input from "./Input";
import { motion } from "framer-motion";

/**
 * TextAnalyzer - Enhanced text input with real-time detection
 * Features:
 * - Debounced real-time plagiarism check
 * - Character count
 * - Submission form
 * - Loading states
 */
export default function TextAnalyzer({
  value,
  onChange,
  onSubmit,
  loading,
  error,
  onRealtimeAnalyze = null,
  realtimeLoading = false,
}) {
  const charCount = value.length;
  const minChars = 20;
  const canSubmit = charCount >= minChars;

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(e);

    // Trigger real-time analysis if callback provided
    if (onRealtimeAnalyze && newValue.length >= minChars) {
      onRealtimeAnalyze(newValue);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Main input */}
      <div className="relative">
        <Input
          multiline
          rows={12}
          label="Text"
          value={value}
          onChange={handleChange}
          placeholder="Paste your text here to check for plagiarism..."
          className="font-mono text-sm"
        />

        {/* Real-time indicator */}
        {realtimeLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/50"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-300 font-semibold">Analyzing...</span>
          </motion.div>
        )}
      </div>

      {/* Character count and stats */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex gap-4">
          <span>{charCount} characters</span>
          <span>{value.split(/\s+/).filter(Boolean).length} words</span>
        </div>
        {charCount < minChars && <span className="text-yellow-400">Minimum {minChars} characters required</span>}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button loading={loading} disabled={!canSubmit} type="submit">
          {loading ? "Analyzing..." : "Analyze Now"}
        </Button>

        {charCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({ target: { value: "" } })}
            className="px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-slate-200 transition-colors text-sm font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </motion.div>
      )}

      {/* Info tip */}
      <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
        💡 <strong>Tip:</strong> Check your text for plagiarism, get AI-powered insights, and receive rewrite suggestions for suspicious content.
      </div>
    </form>
  );
}
