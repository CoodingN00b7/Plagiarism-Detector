/**
 * AnimatedCard Component
 * Reusable glass-morphism card with smooth animations
 * Used throughout the UI for modern AI SaaS aesthetic
 */

import { motion } from 'framer-motion';
import React from 'react';

const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0, 
  onClick = null,
  hover = true 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -5, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)' } : {}}
      onClick={onClick}
      className={`
        relative rounded-2xl p-6
        bg-gradient-to-br from-slate-800/40 to-slate-900/40
        backdrop-blur-xl border border-slate-700/50
        hover:border-indigo-500/50 transition-colors duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Gradient border glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent)',
          pointerEvents: 'none'
        }}
      />
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default AnimatedCard;
