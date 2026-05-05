import React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDocuments } from "../lib/api";

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem("reports") || "[]"));

    let cancelled = false;
    const controller = new AbortController();

    async function loadDocuments() {
      try {
        const payload = await fetchDocuments(controller.signal);
        if (!cancelled) {
          setDocuments(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    }
    loadDocuments();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-50">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Review recent checks and browse the indexed dataset in a single, readable layout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-50">Recent reports</h2>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-slate-400">No reports yet.</p>
            ) : (
              history.map((item) => (
                <Link
                  key={item.report_id}
                  className="block rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm transition hover:border-slate-600"
                  to={`/result/${item.report_id}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-slate-100">{item.report_id}</span>
                    <span className="text-sm font-semibold text-cyan-300">{Number(item.similarity_score || 0).toFixed(1)}%</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.classification}</p>
                </Link>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Dataset documents</h2>
              <p className="mt-1 text-sm text-slate-400">Loaded from the backend corpus index.</p>
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>

          <div className="mt-4 max-h-[28rem] space-y-3 overflow-auto pr-1">
            {documents.slice(0, 40).map((doc) => (
              <div key={doc.document_id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
                <h3 className="text-sm font-medium text-slate-100">{doc.title}</h3>
                <p className="mt-1 break-all text-xs text-slate-500">{doc.source_path}</p>
                <p className="mt-2 text-xs text-cyan-300">{doc.word_count} words</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
