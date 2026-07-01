import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ExternalLink, ShieldAlert } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationToast.css';

const NotificationToast = () => {
  const { activeToast, clearToast, markAsRead } = useNotifications();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 8000); // Show for 8 seconds
      return () => clearTimeout(timer);
    }
  }, [activeToast, clearToast]);

  if (!activeToast) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={activeToast.id}
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        className="notification-toast"
      >
        <div className="toast-glow" />
        <div className="toast-content">
          <div className="toast-icon-wrap">
            {activeToast.type === 'assignment' ? (
              <div className="toast-pulse-icon">
                <ShieldAlert size={20} color="#fff" />
              </div>
            ) : (
              <Bell size={20} />
            )}
          </div>
          
          <div className="toast-text">
            <h4 className="toast-title">{activeToast.title}</h4>
            <p className="toast-desc">{activeToast.desc}</p>
          </div>

          <div className="toast-actions">
            <button 
              className="toast-btn toast-btn-view"
              onClick={() => {
                markAsRead(activeToast.id);
                // The Dashboard already lists these, so we just clear toast
                // and maybe navigate if needed, but for now just mark read
              }}
            >
              <ExternalLink size={14} />
              View
            </button>
            <button className="toast-close" onClick={clearToast}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="toast-progress-bar" />
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationToast;
