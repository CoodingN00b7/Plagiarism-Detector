/**
 * Heatmap Component
 * Grid visualization showing plagiarism distribution across text segments
 */

import { motion } from 'framer-motion';
import React from 'react';

const Heatmap = ({ segments = [], maxScore = 100 }) => {
  const getSegmentColor = (score) => {
    const intensity = (score / (maxScore || 100)) * 100;
    if (intensity < 25) return 'bg-green-900/40 border-green-700/50';
    if (intensity < 50) return 'bg-yellow-900/40 border-yellow-700/50';
    if (intensity < 75) return 'bg-orange-900/40 border-orange-700/50';
    return 'bg-red-900/40 border-red-700/50';
  };

  const getAccentColor = (score) => {
    const intensity = (score / (maxScore || 100)) * 100;
    if (intensity < 25) return 'text-green-400';
    if (intensity < 50) return 'text-yellow-400';
    if (intensity < 75) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">Text Segment Analysis</h3>
      
      <div className="grid grid-cols-4 gap-2">
        {segments.length > 0 ? (
          segments.map((segment, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`
                p-2 rounded border cursor-pointer
                transition-all duration-200
                hover:shadow-lg hover:border-indigo-500/50
                ${getSegmentColor(segment.score)}
              `}
              title={`Segment ${idx + 1}: ${Math.round(segment.score)}% match`}
            >
              <div className="text-center">
                <p className={`text-xs font-bold ${getAccentColor(segment.score)}`}>
                  {Math.round(segment.score)}%
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {segment.text?.substring(0, 8)}...
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-4 h-20 flex items-center justify-center text-slate-400">
            <p className="text-sm">No segments to display</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-2 text-xs mt-4 pt-3 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-900/60" />
          <span className="text-slate-400">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-900/60" />
          <span className="text-slate-400">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-900/60" />
          <span className="text-slate-400">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-900/60" />
          <span className="text-slate-400">Critical</span>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;
