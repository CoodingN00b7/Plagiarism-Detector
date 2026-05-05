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

  async function handleAnalyzeSubmit(e) {
    e.preventDefault();
    setAnalysisLoading(true);
    setAnalysisError("");

    try {
      const result = await analyzeText({ text });
      setAnalysisResult(result);
      setResultOpen(true);
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    setFileLoading(true);
    setFileError("");

    try {
      const result = await analyzeFiles(files);
      setFileResult(result);
      setResultOpen(true);
    } catch (err) {
      setFileError(err.message);
    } finally {
      setFileLoading(false);
    }
  }

  async function handleCompareSubmit(e) {
    e.preventDefault();
    setCompareLoading(true);
    setCompareError("");

    try {
      const result = await compareText({
        text_a: compareTextA,
        text_b: compareTextB,
      });
      setCompareResult(result);
      setResultOpen(true);
    } catch (err) {
      setCompareError(err.message);
    } finally {
      setCompareLoading(false);
    }
  }

  function getResult() {
    if (activeMode === "analyze-text") return analysisResult;
    if (activeMode === "file-analysis") return fileResult;
    if (activeMode === "compare-text") return compareResult;
    return null;
  }

  return (
    <section className="space-y-8">

      {/*  HERO */}
      <div className="card p-10 text-center">
        <h1 className="text-5xl font-bold">
          AI Plagiarism Detector
        </h1>

        <p className="mt-4 text-lg text-[var(--muted)]">
          Detect plagiarism using hybrid AI + semantic matching
        </p>
      </div>

      {/*  MODE SWITCH */}
      <ModeSwitcher
        activeMode={activeMode}
        onChange={(mode) => {
          setActiveMode(mode);
          setResultOpen(false);
        }}
      />

      {/*  MAIN INPUT CARD */}
      <div className="card p-6">

        {activeMode === "analyze-text" && (
          <TextAnalyzer
            value={text}
            onChange={(e) => setText(e.target.value)}
            onSubmit={handleAnalyzeSubmit}
            loading={analysisLoading}
            error={analysisError}
          />
        )}

        {activeMode === "file-analysis" && (
          <FileAnalyzer
            files={files}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            onSubmit={handleUploadSubmit}
            loading={fileLoading}
            error={fileError}
          />
        )}

        {activeMode === "compare-text" && (
          <CompareText
            leftValue={compareTextA}
            rightValue={compareTextB}
            onLeftChange={(e) => setCompareTextA(e.target.value)}
            onRightChange={(e) => setCompareTextB(e.target.value)}
            onSubmit={handleCompareSubmit}
            loading={compareLoading}
            error={compareError}
          />
        )}
      </div>

      {/*  RESULT MODAL */}
      {resultOpen && getResult() && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg">
          <div className="card w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setResultOpen(false)}
                className="text-sm text-[var(--muted)] hover:text-white"
              >
                Close
              </button>
            </div>

            <ResultDisplay kind={activeMode} result={getResult()} />
          </div>
        </div>
      )}
    </section>
  );
}
