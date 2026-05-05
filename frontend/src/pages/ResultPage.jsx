<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchReport,
  fetchReportExplanation,
  reportPdfUrl,
} from "../lib/api";
=======
/**
 * ResultPage Component
 * Modern AI-powered plagiarism detection results display
 * Features: Modern glass-morphism design, sentence-level analysis, rewrite suggestions
 */

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from 'framer-motion';
import { Download, Share2, RefreshCw } from 'lucide-react';

import AnimatedCard from "../components/AnimatedCard";
import ScoreRing from "../components/ScoreRing";
import Heatmap from "../components/Heatmap";
import ConfidenceBar from "../components/ConfidenceBar";
import ReasoningBlock from "../components/ReasoningBlock";
import AIPanel from "../components/AIPanel";
import HighlightedText from "../components/HighlightedText";

import { fetchReport, fetchReportExplanation, reportJsonUrl, reportPdfUrl } from "../lib/api";
>>>>>>> 3c7c955 (Upgrade plagiarism detector UI and analysis pipeline)

export default function ResultPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [explanation, setExplanation] = useState(null);
<<<<<<< HEAD
=======
  const [sentences, setSentences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
>>>>>>> 3c7c955 (Upgrade plagiarism detector UI and analysis pipeline)

  useEffect(() => {
    async function load() {
      const data = await fetchReport(reportId);
      setReport(data);

<<<<<<< HEAD
      const exp = await fetchReportExplanation(reportId);
      setExplanation(exp);
=======
      try {
        const payload = await fetchReport(reportId, controller.signal);
        if (cancelled) return;

        setReport(payload);
        
        // Fetch explanation
        const explanationPayload = await fetchReportExplanation(reportId, controller.signal);
        if (!cancelled) {
          setExplanation(explanationPayload);
        }

        // Fetch sentence-level analysis
        if (payload.original_text) {
          const sentencesRes = await fetch(`http://localhost:8000/api/analyze-sentences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: payload.original_text })
          });
          
          if (sentencesRes.ok) {
            const sentencesData = await sentencesRes.json();
            if (!cancelled) {
              setSentences(sentencesData.sentences || []);
            }
          }
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
>>>>>>> 3c7c955 (Upgrade plagiarism detector UI and analysis pipeline)
    }
    load();
  }, [reportId]);

<<<<<<< HEAD
  if (!report) return <div className="card p-6">Loading...</div>;
=======
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-800/50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 flex items-center justify-center">
        <AnimatedCard className="max-w-md">
          <div className="text-center">
            <p className="text-red-400 font-semibold">Error</p>
            <p className="text-slate-300 mt-2">{error || "Report not found"}</p>
          </div>
        </AnimatedCard>
      </div>
    );
  }
>>>>>>> 3c7c955 (Upgrade plagiarism detector UI and analysis pipeline)

  const scoreRing = parseFloat(report.similarity_score || 0);
  const confidence = explanation?.confidence_score || 0;
  const heatmapSegments = report.heatmap || [];

  return (
<<<<<<< HEAD
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
=======
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-slate-800 bg-gradient-to-b from-slate-800/20 to-transparent p-6 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Plagiarism Analysis</h1>
              <p className="text-slate-400 text-sm mt-1">Report ID: {reportId}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={reportPdfUrl(report.report_id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg border border-indigo-500/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                PDF
              </a>
              <a
                href={reportJsonUrl(report.report_id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/20 hover:bg-slate-700/40 text-slate-300 rounded-lg border border-slate-700/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                JSON
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Top Row: Score + Confidence + Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score Ring */}
          <AnimatedCard className="flex items-center justify-center py-8" delay={0}>
            <ScoreRing score={scoreRing} />
          </AnimatedCard>

          {/* Confidence & Signals */}
          <AnimatedCard className="space-y-6" delay={0.1}>
            <ConfidenceBar confidence={confidence} label="Detection Confidence" />
            <div className="h-px bg-slate-700/50" />
            <ReasoningBlock signals={[
              { type: 'info', text: 'Text normalized and cleaned' },
              { type: 'info', text: 'Sentence-level analysis complete' },
              { type: 'success', text: `${sentences.length} sentences analyzed` }
            ]} />
          </AnimatedCard>

          {/* Heatmap */}
          <AnimatedCard delay={0.2}>
            <Heatmap segments={heatmapSegments.slice(0, 8)} maxScore={100} />
          </AnimatedCard>
        </div>

        {/* AI Panel */}
        <AnimatedCard delay={0.3}>
          <AIPanel explanation={explanation?.summary || ''} loading={false} />
        </AnimatedCard>

        {/* Two-Column Layout: Highlighted Text + Source Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Highlighted Text (2/3 width) */}
          <div className="lg:col-span-2">
            <AnimatedCard delay={0.4} className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-200">Text Analysis</h2>
              <HighlightedText 
                sentences={sentences} 
                loading={sentences.length === 0}
              />
            </AnimatedCard>
          </div>

          {/* Matched Sources (1/3 width) */}
          <AnimatedCard delay={0.5} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200">Top Sources</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {report.matched_sources && report.matched_sources.length > 0 ? (
                report.matched_sources.slice(0, 5).map((source, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.05 }}
                    className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:border-indigo-500/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-300 truncate">
                          {source.title || "Unknown Source"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {source.overlap_sentences?.length || 0} matches
                        </p>
                      </div>
                      <span className="text-sm font-bold text-indigo-400 flex-shrink-0">
                        {Math.round(source.score || 0)}%
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No sources matched</p>
              )}
            </div>
          </AnimatedCard>
        </div>

        {/* Details Section */}
        {explanation && (
          <AnimatedCard delay={0.6} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200">Detailed Analysis</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-400">Classification</p>
                <p className={`text-sm font-bold mt-1 ${
                  report.classification === 'Original' ? 'text-green-400' :
                  report.classification === 'Suspicious' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {report.classification}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-400">Matched Sources</p>
                <p className="text-sm font-bold text-indigo-400 mt-1">
                  {report.matched_sources?.length || 0}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-400">Sentences Analyzed</p>
                <p className="text-sm font-bold text-indigo-400 mt-1">
                  {sentences.length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30">
                <p className="text-xs text-slate-400">Date</p>
                <p className="text-sm font-bold text-indigo-400 mt-1">
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {explanation.summary && (
              <div className="p-4 rounded-lg bg-slate-800/20 border border-slate-700/50">
                <p className="text-sm text-slate-300">
                  {explanation.summary}
                </p>
              </div>
            )}
          </AnimatedCard>
        )}
      </div>
>>>>>>> 3c7c955 (Upgrade plagiarism detector UI and analysis pipeline)
    </div>
  );
}
