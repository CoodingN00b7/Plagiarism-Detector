/**
 * ReasoningBlock Component
 * Displays AI reasoning steps and analysis signals
 */

import { motion } from 'framer-motion';
import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp, Zap } from 'lucide-react';

const ReasoningBlock = ({ signals = [] }) => {
  const defaultSignals = [
    { type: 'warning', text: 'Multiple sentences match source material' },
    { type: 'info', text: 'Sentence structure is heavily paraphrased' },
    { type: 'success', text: 'Original citations detected' },
  ];

  const signalsToDisplay = signals.length > 0 ? signals : defaultSignals;

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'spark':
        return <Zap className="w-4 h-4 text-purple-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Analysis Signals</h3>
      
      <div className="space-y-2">
        {signalsToDisplay.map((signal, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="mt-1 flex-shrink-0">
              {getIcon(signal.type)}
            </div>
            <p className="text-sm text-slate-300">{signal.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReasoningBlock;
