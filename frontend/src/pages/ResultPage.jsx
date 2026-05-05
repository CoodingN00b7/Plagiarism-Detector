import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchReport, fetchReportExplanation, reportJsonUrl, reportPdfUrl } from "../lib/api";

export default function ResultPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const payload = await fetchReport(reportId, controller.signal);
        if (cancelled) return;

        setReport(payload);
        const explanationPayload = await fetchReportExplanation(reportId, controller.signal);
        if (!cancelled) {
          setExplanation(explanationPayload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Report not found");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reportId]);

  const classificationClass = useMemo(() => {
    if (!report) return "text-slate-300";
    if (report.classification === "Plagiarized") return "text-rose-300";
    if (report.classification === "Suspicious") return "text-amber-300";
    return "text-emerald-300";
  }, [report]);

  if (loading) {
    return <Panel>Loading report...</Panel>;
  }

  if (error || !report) {
    return <Panel tone="error">{error || "Report not found"}</Panel>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Report</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-50">{report.report_id}</h1>
            <p className={`mt-2 text-sm font-medium ${classificationClass}`}>{report.classification}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={reportPdfUrl(report.report_id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Download PDF
            </a>
            <a
              href={reportJsonUrl(report.report_id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              Download JSON
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Similarity" value={`${Number(report.similarity_score || 0).toFixed(1)}%`} />
          <Metric label="Matched sources" value={`${report.matched_sources?.length || 0}`} />
          <Metric label="Created" value={formatDate(report.created_at)} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-50">Highlighted text</h2>
        <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300" dangerouslySetInnerHTML={{ __html: report.highlighted_text || "" }} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-50">Matched sources</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {report.matched_sources?.length ? (
            report.matched_sources.map((source) => (
              <div key={source.document_id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-100">{source.title}</p>
                    <p className="text-xs text-slate-500">{source.classification}</p>
                  </div>
                  <p className="text-sm font-semibold text-cyan-300">{Number(source.score || 0).toFixed(1)}%</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">{source.overlap_sentences?.length || 0} overlapping sentence(s)</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No source matches found.</p>
          )}
        </div>
      </div>

      {explanation ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Why this score was produced</h2>
              <p className="mt-1 text-sm text-slate-400">Compact explanation for review.</p>
            </div>
            <div className={`text-sm font-semibold ${classificationClass}`}>{explanation.classification}</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Confidence" value={`${Number(explanation.confidence_score || 0).toFixed(1)}%`} />
            <Metric label="Score" value={`${Number(explanation.similarity_score || 0).toFixed(1)}%`} />
            <Metric label="Sources" value={`${explanation.top_sources?.length || 0}`} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {explanation.signal_breakdown?.map((signal) => (
                <div key={signal.name} className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">{signal.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{signal.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cyan-300">{Number(signal.value || 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">weight {signal.weight}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(100, Math.max(0, signal.contribution || 0))}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {explanation.top_sources?.map((source) => (
                <div key={source.document_id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">{source.title}</p>
                      <p className="text-xs text-slate-500">{source.classification}</p>
                    </div>
                    <p className="text-sm font-semibold text-cyan-300">{Number(source.score || 0).toFixed(2)}%</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{source.overlap_count} overlapping sentence(s)</p>
                </div>
              ))}

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/40 p-4 text-sm text-emerald-100">
                {explanation.recommendation}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Panel({ children, tone }) {
  const className = tone === "error" ? "border-rose-500/30 bg-rose-950/40 text-rose-200" : "border-slate-800 bg-slate-950 text-slate-200";
  return <div className={`rounded-2xl border px-6 py-5 shadow-sm ${className}`}>{children}</div>;
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}
