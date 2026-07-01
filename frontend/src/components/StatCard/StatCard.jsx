import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, TrendingUp, Target, Award } from 'lucide-react';
import './StatCard.css';

const StatCard = ({ title, value, icon, color = 'primary', details = null }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const target = parseFloat(value);
    if (isNaN(target)) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(ease * target * 10) / 10;
      const suffix = value.toString().includes('%') ? '%' : '';
      setDisplayValue(current + suffix);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <motion.div 
      layout
      className={`stat-card-pill color-grad-${color} ${isExpanded ? 'expanded' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="stat-pill-header">
        <div className="stat-pill-icon">
          {icon}
        </div>
        <motion.div 
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="stat-pill-expand-icon"
        >
          <ChevronDown size={18} />
        </motion.div>
      </div>
      
      <div className="stat-pill-content">
        <h4 className="stat-pill-title">{title}</h4>
        <div className="stat-pill-value">{displayValue}</div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="stat-card-details"
          >
            <div className="details-divider" />
            <div className="details-grid">
              {details ? (
                <>
                  <div className="detail-item">
                    <TrendingUp size={14} />
                    <span>{details.trending || 'Stable'}</span>
                  </div>
                  <div className="detail-item">
                    <Target size={14} />
                    <span>{details.target || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <Award size={14} />
                    <span>{details.achievement || 'General'}</span>
                  </div>
                </>
              ) : (
                <div className="detail-item-placeholder">
                  Keep taking tests to unlock deeper insights.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StatCard;
