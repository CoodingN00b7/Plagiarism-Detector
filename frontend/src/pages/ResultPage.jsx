import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Download } from "lucide-react";

import AnimatedCard from "../components/AnimatedCard";
import ScoreRing from "../components/ScoreRing";
import Heatmap from "../components/Heatmap";
import ConfidenceBar from "../components/ConfidenceBar";
import ReasoningBlock from "../components/ReasoningBlock";
import AIPanel from "../components/AIPanel";
import HighlightedText from "../components/HighlightedText";

import {
  fetchReport,
  fetchReportExplanation,
  reportJsonUrl,
  reportPdfUrl,
} from "../lib/api";

export default function ResultPage() {
  const { reportId } = useParams();

  const [report, setReport] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [sentences, setSentences] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);

        const payload = await fetchReport(reportId, controller.signal);
        if (cancelled) return;
        setReport(payload);

        const explanationPayload = await fetchReportExplanation(
          reportId,
          controller.signal
        );
        if (!cancelled) setExplanation(explanationPayload);

        // Sentence-level analysis
        if (payload?.original_text) {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/analyze-sentences`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: payload.original_text }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              setSentences(data.sentences || []);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load report");
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

  // ================= UI STATES =================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <AnimatedCard className="max-w-md text-center">
          <p className="text-red-400 font-semibold">Error</p>
          <p className="text-slate-300 mt-2">
            {error || "Report not found"}
          </p>
        </AnimatedCard>
      </div>
    );
  }

  const score = parseFloat(report.similarity_score || 0);
  const confidence = explanation?.confidence_score || 0;
  const heatmapSegments = report.heatmap || [];

  // ================= MAIN UI =================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/70 backdrop-blur p-6"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Plagiarism Report
            </h1>
            <p className="text-slate-400 text-sm">ID: {reportId}</p>
          </div>

          <div className="flex gap-2">
            <a
              href={reportPdfUrl(report.report_id)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-lg flex items-center gap-2"
            >
              <Download size={16} /> PDF
            </a>

            <a
              href={reportJsonUrl(report.report_id)}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-700/30 text-slate-300 border border-slate-600 rounded-lg flex items-center gap-2"
            >
              <Download size={16} /> JSON
            </a>
          </div>
        </div>
      </motion.div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* TOP SECTION */}
        <div className="grid md:grid-cols-3 gap-6">

          <AnimatedCard className="flex justify-center items-center">
            <ScoreRing score={score} />
          </AnimatedCard>

          <AnimatedCard>
            <ConfidenceBar confidence={confidence} label="Confidence" />
            <div className="mt-4">
              <ReasoningBlock
                signals={[
                  { type: "info", text: "Text normalized" },
                  { type: "success", text: `${sentences.length} sentences analyzed` },
                ]}
              />
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <Heatmap segments={heatmapSegments.slice(0, 8)} maxScore={100} />
          </AnimatedCard>
        </div>

        {/* AI PANEL */}
        <AnimatedCard>
          <AIPanel
            explanation={explanation?.summary || ""}
            loading={false}
          />
        </AnimatedCard>

        {/* TEXT + SOURCES */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* TEXT */}
          <div className="lg:col-span-2">
            <AnimatedCard>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                Text Analysis
              </h2>
              <HighlightedText
                sentences={sentences}
                loading={!sentences.length}
              />
            </AnimatedCard>
          </div>

          {/* SOURCES */}
          <AnimatedCard>
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              Sources
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {report.matched_sources?.length ? (
                report.matched_sources.map((s, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800/30 rounded-lg border border-slate-700"
                  >
                    <p className="text-sm text-slate-300 font-medium">
                      {s.title || "Unknown"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Math.round(s.score || 0)}%
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No sources</p>
              )}
            </div>
          </AnimatedCard>
        </div>

        {/* DETAILS */}
        {explanation && (
          <AnimatedCard>
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              Detailed Analysis
            </h2>

            <p className="text-slate-300 text-sm">
              {explanation.summary}
            </p>
          </AnimatedCard>
        )}
      </div>
    </div>
  );
}
