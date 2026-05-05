/**
 * RewritePopup Component
 * Modal showing rewrite suggestions for highlighted sentences
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Zap } from 'lucide-react';

const RewritePopup = ({ sentence, onClose, onRewrite }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    // Fetch rewrite suggestions
    fetchSuggestions();
  }, [sentence]);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: sentence.text || sentence })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.alternatives || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback suggestions
      setSuggestions([
        'Consider rephrasing with original wording.',
        'Try using synonyms and restructuring sentences.',
        'Add your own perspective and analysis.'
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRewrite = (suggestion) => {
    if (onRewrite) {
      onRewrite(sentence.index, suggestion);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-slate-100">Rewrite Suggestions</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700/50 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Original sentence */}
          <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-1">Original:</p>
            <p className="text-sm text-slate-200">{sentence.text || sentence}</p>
          </div>

          {/* Suggestions */}
          <div className="space-y-2 mb-4">
            <p className="text-xs text-slate-400 font-semibold">Alternatives:</p>
            
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-slate-700/30 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              suggestions.map((suggestion, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 group hover:border-indigo-500/50 transition-colors"
                >
                  <p className="text-sm text-slate-300 mb-2">{suggestion}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(suggestion, idx)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700/50 hover:bg-slate-700 rounded transition-colors text-slate-400"
                    >
                      {copied === idx ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRewrite(suggestion)}
                      className="flex-1 px-2 py-1 text-xs bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-300 rounded transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors text-sm"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RewritePopup;
