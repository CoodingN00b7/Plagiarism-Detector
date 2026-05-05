import React from "react";

export default function ResultDisplay({ kind, result }) {
  if (!result) return null;

  if (kind === "file-analysis") {
    const reports = result.reports || [];
    return (
      <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] backdrop-blur-2xl sm:p-5">
        <ResultHeader score={null} classification={`Processed ${reports.length} file(s)`} />
        <div className="space-y-4">
          {reports.map((item) => (
            <ReportCard key={item.filename} title={item.filename} report={item.report} />
          ))}
        </div>
      </div>
    );
  }

  if (kind === "compare-text" || kind === "compare-documents") {
    return (
      <div className="space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] backdrop-blur-2xl sm:p-5">
        <ResultHeader score={result.similarity_score} classification={result.classification} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ResultPanel title="Highlighted text A" html={result.highlighted_text_a} />
          <ResultPanel title="Highlighted text B" html={result.highlighted_text_b} />
        </div>
        <SourcesBlock title="Shared fragments" items={result.overlap_sentences} emptyText="No overlapping fragments found." />
      </div>
    );
  }

  return (
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
