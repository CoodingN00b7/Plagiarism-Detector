/**
 * AIPanel Component
 * Shows AI-generated explanations and insights about plagiarism
 */

import { motion } from 'framer-motion';
import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

const AIPanel = ({ explanation = '', loading = false }) => {
  const defaultExplanation = `
    This text shows moderate plagiarism concerns with multiple instances of 
    phrase matching in the introduction and methodology sections. The writing 
    demonstrates both original content and paraphrased passages without proper attribution.
  `;

  const displayText = explanation || defaultExplanation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-300">AI Analysis</h3>
        {loading && <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />}
      </div>

      {/* Explanation box */}
      <div className="p-4 rounded-lg bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 bg-slate-700/50 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-slate-700/50 rounded w-full animate-pulse" />
            <div className="h-3 bg-slate-700/50 rounded w-4/5 animate-pulse" />
          </div>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed">
            {displayText}
          </p>
        )}
      </div>

      {/* Key insights */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <p className="text-slate-400">Matched Phrases</p>
          <p className="font-semibold text-indigo-400 mt-1">12 instances</p>
        </div>
        <div className="p-2 rounded bg-slate-800/50 border border-slate-700/50">
          <p className="text-slate-400">Avg Match Length</p>
          <p className="font-semibold text-indigo-400 mt-1">8.5 words</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AIPanel;
