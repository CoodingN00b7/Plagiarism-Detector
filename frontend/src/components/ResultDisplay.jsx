import React from "react";
import { motion } from "framer-motion";
import AnimatedCard from "./AnimatedCard";
import AIPanel from "./AIPanel";
import HighlightedText from "./HighlightedText";

/**
 * ResultDisplay - Main results view with left panel (highlighted text) and right panel (AI analysis)
 * Layout: LEFT - text with smart highlighting, RIGHT - score, confidence, heatmap, sources
 */
export default function ResultDisplay({ kind, result, loading = false }) {
  if (!result && !loading) return null;

  // File analysis view
  if (kind === "file-analysis") {
    const reports = result?.reports || [];
    return (
      <div className="space-y-4">
        <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-slate-100">
          Analysis Results
        </motion.h2>
        <div className="space-y-4">
          {reports.map((item, idx) => (
            <motion.div
              key={item.filename}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <AnimatedCard className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-100">{item.filename}</h3>
                    <p className="text-xs text-slate-400 mt-1">{item.report?.classification}</p>
                  </div>
                  <span className="text-2xl font-bold text-indigo-400">{item.report?.similarity_score?.toFixed(1)}%</span>
                </div>
                {item.report?.highlighted_text && (
                  <HighlightedText text={item.report.highlighted_text} sentenceAnalysis={[]} />
                )}
              </AnimatedCard>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Text vs text/document comparison
  if (kind === "compare-text" || kind === "compare-documents") {
    return (
      <div className="space-y-4">
        <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-slate-100">
          Comparison Results
        </motion.h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatedCard className="p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Text A</h3>
            <HighlightedText text={result?.highlighted_text_a || ""} sentenceAnalysis={[]} />
          </AnimatedCard>
          <AnimatedCard className="p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Text B</h3>
            <HighlightedText text={result?.highlighted_text_b || ""} sentenceAnalysis={[]} />
          </AnimatedCard>
        </div>
      </div>
    );
  }

  // Main plagiarism check view with two-column layout
  return (
<<<<<<< HEAD
    <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] backdrop-blur-2xl sm:p-5">
      <ResultHeader score={result.similarity_score} classification={result.classification} />
      <ResultPanel title="Highlighted text" html={result.highlighted_text} />
      <SourcesBlock
        title="Sources"
        items={(result.matched_sources || []).map(
          (source) => `${source.title} · ${Number(source.score || 0).toFixed(1)}%`
        )}
        emptyText="No external sources matched."
      />
    </div>
  );
}

// ================= HEADER =================
function ResultHeader({ score, classification }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)] sm:text-xs">
          Result
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--text)] sm:text-2xl">
          {classification}
        </h2>
      </div>

      <div className="self-start rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-3 py-2 text-right shadow-[var(--shadow)] sm:px-4 sm:py-3">
        <div className="text-3xl font-bold text-[var(--text)] sm:text-4xl">
          {score === null || score === undefined
            ? "—"
            : `${Number(score || 0).toFixed(1)}%`}
        </div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)] sm:text-xs">
          Similarity
        </p>
      </div>
    </div>
  );
}

// ================= SAFE TEXT FIX =================
function fixBrokenText(html) {
  if (!html) return "";

  // Fix only extreme spaced words like: T e c h n o l o g y
  return html.replace(/\b(?:\w\s){3,}\w\b/g, (match) =>
    match.replace(/\s+/g, "")
  );
}

// ================= RESULT PANEL =================
function ResultPanel({ title, html }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 backdrop-blur-xl sm:p-4">
      <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>

      <div
        className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text)] sm:mt-3 sm:leading-7"
        dangerouslySetInnerHTML={{
          __html: fixBrokenText(html),
        }}
      />
    </section>
  );
}

// ================= SOURCES =================
function SourcesBlock({ title, items, emptyText }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 backdrop-blur-xl sm:p-4">
      <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>

      <div className="mt-2 space-y-2 sm:mt-3">
        {list.length ? (
          list.map((item, index) => (
            <div
              key={`${title}-${index}-${String(item)}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm leading-6 text-[var(--text)]"
            >
              {typeof item === "string" ? item : item.title}
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">{emptyText}</p>
        )}
      </div>
    </section>
  );
}

// ================= FILE REPORT =================
function ReportCard({ title, report }) {
  if (!report) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-3 backdrop-blur-xl sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
        <span className="text-sm font-semibold text-[var(--accent)]">
          {Number(report.similarity_score || 0).toFixed(1)}%
        </span>
      </div>

      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        {report.classification}
      </p>

      <ResultPanel title="Highlighted text" html={report.highlighted_text} />

      <SourcesBlock
        title="Sources"
        items={(report.matched_sources || []).map(
          (source) => `${source.title} · ${Number(source.score || 0).toFixed(1)}%`
        )}
        emptyText="No external sources matched."
      />
    </div>
  );
}
=======
    <div className="space-y-4">
      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-slate-100">
        Analysis Results
      </motion.h2>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT: Highlighted text panel (takes 2 columns) */}
        <div className="lg:col-span-2">
          <AnimatedCard className="p-6 h-full">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Highlighted Text
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : (
              <HighlightedText text={result?.original_text || result?.highlighted_text || ""} sentenceAnalysis={result?.sentence_results || []} />
            )}
          </AnimatedCard>
        </div>

        {/* RIGHT: AI Analysis panel (takes 1 column) */}
        <div className="lg:col-span-1">
          <AIPanel result={result} loading={loading} />
        </div>
      </div>

      {/* Bottom: Matched sources */}
      {!loading && result?.matched_sources && result.matched_sources.length > 0 && (
        <AnimatedCard className="p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Matched Sources
          </h3>
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {result.matched_sources.map((source, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-lg border border-indigo-500/20 bg-slate-800/40 p-3 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate">{source.title || "Unknown Source"}</p>
                    <p className="text-xs text-slate-500">{source.source}</p>
                  </div>
                  <span className="text-lg font-bold text-indigo-400 ml-2 whitespace-nowrap">{source.score?.toFixed(1) || 0}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      )}
    </div>
  );
}
>>>>>>> 3c7c955 (Upgrade plagiarism detector UI and analysis pipeline)
