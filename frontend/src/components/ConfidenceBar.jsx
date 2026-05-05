/**
 * ConfidenceBar Component
 * Horizontal bar showing confidence level with smooth animations
 */

import { motion } from 'framer-motion';
import React from 'react';

const ConfidenceBar = ({ confidence = 0, label = 'Confidence' }) => {
  const getColor = () => {
    if (confidence < 40) return 'from-red-500 to-orange-500';
    if (confidence < 70) return 'from-yellow-500 to-amber-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-semibold text-indigo-400"
        >
          {Math.round(confidence)}%
        </motion.span>
      </div>
      
      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ConfidenceBar;
