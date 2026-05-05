import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchReport,
  fetchReportExplanation,
  reportPdfUrl,
} from "../lib/api";

export default function ResultPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [explanation, setExplanation] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await fetchReport(reportId);
      setReport(data);

      const exp = await fetchReportExplanation(reportId);
      setExplanation(exp);
    }
    load();
  }, [reportId]);

  if (!report) return <div className="card p-6">Loading...</div>;

  return (
    <section className="space-y-6">

      {/*  HEADER */}
      <div className="card p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Report</h1>
          <p className="text-sm text-[var(--muted)]">
            {report.classification}
          </p>
        </div>

        <a
          href={reportPdfUrl(report.report_id)}
          target="_blank"
          className="btn"
        >
          Download PDF
        </a>
      </div>

      {/* 🔥 METRICS */}
      <div className="grid md:grid-cols-3 gap-4">
        <Metric label="Similarity" value={`${report.similarity_score}%`} />
        <Metric label="Sources" value={report.matched_sources.length} />
        <Metric label="Date" value={new Date(report.created_at).toLocaleString()} />
      </div>

      {/*  TEXT */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Highlighted Text</h2>

        <div
          className="text-sm leading-7 text-[var(--text)]"
          dangerouslySetInnerHTML={{ __html: report.highlighted_text }}
        />
      </div>

      {/*  SOURCES */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Matched Sources</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {report.matched_sources.map((s) => (
            <div key={s.document_id} className="card p-4">
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-[var(--muted)]">
                {s.classification}
              </p>
              <p className="text-sm text-indigo-400 mt-2">
                {s.score.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      
      {explanation && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">
            AI Explanation
          </h2>

          <p className="text-sm text-[var(--muted)]">
            {explanation.recommendation}
          </p>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="text-xl font-semibold mt-2">{value}</p>
    </div>
  );
}
