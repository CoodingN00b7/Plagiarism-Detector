/**
 * HighlightedText Component
 * Renders text with sentence-level highlighting and rewrite suggestions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import RewritePopup from './RewritePopup';

const HighlightedText = ({ 
  sentences = [], 
  onRewrite = null,
  loading = false 
}) => {
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [showRewrite, setShowRewrite] = useState(false);

  const getSentenceColor = (score) => {
    if (score < 30) return 'bg-green-500/10 border-l-4 border-green-500';
    if (score < 70) return 'bg-yellow-500/10 border-l-4 border-yellow-500';
    return 'bg-red-500/10 border-l-4 border-red-500';
  };

  const getTextColor = (score) => {
    if (score < 30) return 'text-green-100';
    if (score < 70) return 'text-yellow-100';
    return 'text-red-100';
  };

  const handleSentenceClick = (sentence, idx) => {
    setSelectedSentence({ ...sentence, index: idx });
    setShowRewrite(true);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4 bg-slate-800/20 rounded-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="h-4 bg-slate-700/50 rounded w-5/6" />
            <div className="h-4 bg-slate-700/50 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-slate-800/20 rounded-lg">
      {sentences.length > 0 ? (
        sentences.map((sentence, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleSentenceClick(sentence, idx)}
            className={`
              p-3 rounded cursor-pointer transition-all duration-200
              hover:shadow-lg hover:bg-slate-700/30
              ${getSentenceColor(sentence.score || 0)}
            `}
          >
            <div className="flex justify-between items-start gap-3">
              <p className={`text-sm leading-relaxed flex-1 ${getTextColor(sentence.score || 0)}`}>
                {sentence.text || sentence}
              </p>
              <div className="flex-shrink-0 text-right">
                <span className="text-xs font-semibold text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                  {Math.round(sentence.score || 0)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="h-20 flex items-center justify-center text-slate-400">
          <p className="text-sm">No sentences to display</p>
        </div>
      )}

      {/* Rewrite popup */}
      {showRewrite && selectedSentence && (
        <RewritePopup
          sentence={selectedSentence}
          onClose={() => setShowRewrite(false)}
          onRewrite={onRewrite}
        />
      )}
    </div>
  );
};

export default HighlightedText;
