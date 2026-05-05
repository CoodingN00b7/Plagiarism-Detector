import React, { useState } from "react";
import ModeSwitcher from "../components/ModeSwitcher";
import TextAnalyzer from "../components/TextAnalyzer";
import FileAnalyzer from "../components/FileAnalyzer";
import CompareText from "../components/CompareText";
import CompareFiles from "../components/CompareFiles";
import ResultDisplay from "../components/ResultDisplay";
import { analyzeFiles, analyzeText, compareText } from "../lib/api";

export default function HomePage() {
  const [activeMode, setActiveMode] = useState("analyze-text");
  const [resultOpen, setResultOpen] = useState(false);
  const [text, setText] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [files, setFiles] = useState([]);
  const [fileResult, setFileResult] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");

  const [compareTextA, setCompareTextA] = useState("");
  const [compareTextB, setCompareTextB] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  const [compareFileA, setCompareFileA] = useState(null);
  const [compareFileB, setCompareFileB] = useState(null);
  const [compareFilesResult, setCompareFilesResult] = useState(null);
  const [compareFilesLoading, setCompareFilesLoading] = useState(false);
  const [compareFilesError, setCompareFilesError] = useState("");

  async function handleAnalyzeSubmit(event) {
    event.preventDefault();
    setAnalysisError("");
    setAnalysisLoading(true);

    try {
      const result = await analyzeText({ text });
      setAnalysisResult(result);
      setResultOpen(true);
    } catch (error) {
      setAnalysisError(error.message || "Failed to analyze text");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();
    setFileError("");

    if (!files.length) {
      setFileError("Choose at least one file first.");
      return;
    }

    setFileLoading(true);
    try {
      const payload = await analyzeFiles(files);
      setFileResult(payload);
      setResultOpen(true);
    } catch (error) {
      setFileError(error.message || "Failed to analyze files");
    } finally {
      setFileLoading(false);
    }
  }

  async function handleCompareTextSubmit(event) {
    event.preventDefault();
    setCompareError("");
    setCompareLoading(true);

    try {
      const result = await compareText({ text_a: compareTextA, text_b: compareTextB });
      setCompareResult(result);
      setResultOpen(true);
    } catch (error) {
      setCompareError(error.message || "Failed to compare text");
    } finally {
      setCompareLoading(false);
    }
  }

  async function handleCompareFilesSubmit(event) {
    event.preventDefault();
    setCompareFilesError("");

    if (!compareFileA || !compareFileB) {
      setCompareFilesError("Choose two files to compare.");
      return;
    }

    setCompareFilesLoading(true);
    try {
      const result = await compareText({ file_a: compareFileA, file_b: compareFileB });
      setCompareFilesResult(result);
      setResultOpen(true);
    } catch (error) {
      setCompareFilesError(error.message || "Failed to compare files");
    } finally {
      setCompareFilesLoading(false);
    }
  }

  function clearAnalysis() {
    setText("");
    setAnalysisResult(null);
    setAnalysisError("");
    setResultOpen(false);
  }

  function clearUpload() {
    setFiles([]);
    setFileResult(null);
    setFileError("");
    setResultOpen(false);
  }

  function clearCompareText() {
    setCompareTextA("");
    setCompareTextB("");
    setCompareResult(null);
    setCompareError("");
    setResultOpen(false);
  }

  function clearCompareFiles() {
    setCompareFileA(null);
    setCompareFileB(null);
    setCompareFilesResult(null);
    setCompareFilesError("");
    setResultOpen(false);
  }

  function getActiveResult() {
    if (activeMode === "analyze-text") return analysisResult;
    if (activeMode === "file-analysis") return fileResult;
    if (activeMode === "compare-text") return compareResult;
    if (activeMode === "compare-documents") return compareFilesResult;
    return null;
  }

  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--accent)] sm:text-sm">Hybrid plagiarism detection</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text)] sm:mt-4 sm:text-5xl lg:text-6xl">Plagiarism Detector</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:mt-4 sm:text-base sm:leading-7 lg:text-lg">Hybrid multi-source plagiarism detection system</p>
      </div>

      <ModeSwitcher activeMode={activeMode} onChange={(mode) => { setActiveMode(mode); setResultOpen(false); }} />

      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] backdrop-blur-2xl sm:p-6 lg:p-8">
        {activeMode === "analyze-text" ? (
          <TextAnalyzer
            value={text}
            onChange={(event) => setText(event.target.value)}
            onSubmit={handleAnalyzeSubmit}
            loading={analysisLoading}
            error={analysisError}
          />
        ) : null}

        {activeMode === "file-analysis" ? (
          <FileAnalyzer
            files={files}
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
            onSubmit={handleUploadSubmit}
            loading={fileLoading}
            error={fileError}
          />
        ) : null}

        {activeMode === "compare-text" ? (
          <CompareText
            leftValue={compareTextA}
            rightValue={compareTextB}
            onLeftChange={(event) => setCompareTextA(event.target.value)}
            onRightChange={(event) => setCompareTextB(event.target.value)}
            onSubmit={handleCompareTextSubmit}
            loading={compareLoading}
            error={compareError}
          />
        ) : null}

        {activeMode === "compare-documents" ? (
          <CompareFiles
            leftFile={compareFileA}
            rightFile={compareFileB}
            onLeftChange={(event) => setCompareFileA(event.target.files?.[0] || null)}
            onRightChange={(event) => setCompareFileB(event.target.files?.[0] || null)}
            onSubmit={handleCompareFilesSubmit}
            loading={compareFilesLoading}
            error={compareFilesError}
          />
        ) : null}
      </div>

      {resultOpen && getActiveResult() ? (
        <ResultModal onClose={() => setResultOpen(false)}>
          <ResultDisplay kind={activeMode} result={getActiveResult()} />
        </ResultModal>
      ) : null}
    </section>
  );
}

function ResultModal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 px-3 py-3 backdrop-blur-xl sm:items-center sm:px-4 sm:py-6">
      <div className="max-h-[calc(100vh-1.5rem)] w-full max-w-4xl overflow-hidden rounded-t-[1.75rem] border border-[var(--border)] bg-[var(--surface-strong)] p-3 shadow-[var(--shadow)] sm:max-h-[90vh] sm:rounded-[2rem] sm:p-4 md:p-6">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div className="h-1.5 w-14 rounded-full bg-[var(--border)] sm:hidden" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Close
          </button>
        </div>
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 sm:max-h-[calc(90vh-5rem)] sm:pr-2">
          {children}
        </div>
      </div>
    </div>
  );
}