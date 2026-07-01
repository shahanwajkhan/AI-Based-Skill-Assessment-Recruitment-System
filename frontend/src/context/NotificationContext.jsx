import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('skillguard_notifications_v2');
    return saved ? JSON.parse(saved) : [
      { id: 'initial-1', type: 'analysis', icon: '📈', title: 'Skill Gap Analysis Ready', desc: 'Your personalized roadmap has been generated.', unread: true, section: 'learning-roadmap', role: 'student', createdAt: new Date().toISOString() },
      { id: 'initial-2', type: 'interview', icon: '🎤', title: 'Interview Feedback Available', desc: 'Review your latest technical interview score.', unread: true, section: 'results', role: 'student', createdAt: new Date().toISOString() },
    ];
  });

  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('skillguard_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notif) => {
    // Check for duplicates (e.g. same title in the last hour)
    const isDuplicate = notifications.some(n => 
      n.title === notif.title && 
      (new Date() - new Date(n.createdAt)) < 3600000
    );
    if (isDuplicate) return;

    const newNotif = {
      id: Date.now().toString(),
      unread: true,
      createdAt: new Date().toISOString(),
      ...notif
    };
    
    setNotifications(prev => [newNotif, ...prev].slice(0, 20)); // Keep last 20
    
    // Auto-trigger toast for critical notifications (like assignments)
    if (notif.type === 'assignment') {
      setActiveToast(newNotif);
    }
  };

  const clearToast = () => setActiveToast(null);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    if (activeToast?.id === id) clearToast();
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      markAsRead, 
      markAllRead, 
      clearNotifications,
      activeToast,
      clearToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
