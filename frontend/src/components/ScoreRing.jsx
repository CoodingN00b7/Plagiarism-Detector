/**
 * ScoreRing Component
 * SVG circular progress ring showing plagiarism score
 * Features: smooth animations, color coding (green/yellow/red)
 */

import { motion } from 'framer-motion';
import React from 'react';

const ScoreRing = ({ score = 0, className = '' }) => {
  const circumference = 2 * Math.PI * 45; // 45 is radius
  const offset = circumference - (score / 100) * circumference;

  // Color coding: green (0-30), yellow (30-70), red (70-100)
  const getColor = () => {
    if (score < 30) return '#10b981'; // green
    if (score < 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getLabel = () => {
    if (score < 30) return 'Low';
    if (score < 70) return 'Medium';
    return 'High';
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg width="200" height="200" viewBox="0 0 100 100" className="drop-shadow-lg">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="6"
        />
        
        {/* Animated progress circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getColor()}
          strokeWidth="6"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
          style={{ transformOrigin: '50% 50%', transform: 'rotate(-90deg)' }}
        />

        {/* Center text */}
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dy=".3em"
          className="text-2xl font-bold fill-white"
        >
          {score}%
        </text>
      </svg>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 text-center"
      >
        <p className="text-sm text-slate-400">Plagiarism Score</p>
        <p className={`text-lg font-semibold mt-1 ${
          score < 30 ? 'text-green-400' : score < 70 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {getLabel()}
        </p>
      </motion.div>
    </div>
  );
};

export default ScoreRing;
