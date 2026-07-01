import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  Mic,
  BarChart3,
  Map,
  TrendingUp,
  Zap,
  Award,
  Menu,
  X,
  FileSearch,
  UserCheck,
  Users,
  Plus,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InviteModal from '../InviteModal/InviteModal';
import './TopBar.css';

const TopBar = ({ user, onLogout, onTabChange, activeTab }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const openInviteModal = () => window.dispatchEvent(new Event('openInviteModal'));

  const { notifications, markAsRead, markAllRead } = useNotifications();
  const hoverTimeoutRef = useRef(null);

  const dropdownRef = useRef(null);
  const navRef = useRef(null);

  // Listen for global invite modal trigger
  useEffect(() => {
    const handleOpen = () => setIsInviteModalOpen(true);
    window.addEventListener('openInviteModal', handleOpen);
    return () => window.removeEventListener('openInviteModal', handleOpen);
  }, []);

  // Filter notifications by user role
  const relevantNotifications = notifications.filter(n => {
    if (user?.role === 'recruiter') {
      return n.role === 'recruiter';
    }
    // Students see generic or student-specific ones
    return n.role === 'student' || !n.role;
  });

  const unreadCount = relevantNotifications.filter(n => n.unread).length;

  const handleNotificationMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsNotificationsOpen(true);
  };

  const handleNotificationMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsNotificationsOpen(false);
    }, 300);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
        setIsNotificationsOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const studentNavGroups = [
    {
      id: 'assessments',
      label: 'Assessments',
      icon: <BookOpen size={18} />,
      type: 'dropdown',
      items: [
        { id: 'skill-tests', label: 'Skill Tests', icon: <BookOpen size={16} /> },
        { id: 'proctored-exams', label: 'Proctored Exams', icon: <ShieldCheck size={16} /> },
        { id: 'ai-proctored-interview', label: 'AI Proctored Interview', icon: <Sparkles size={16} /> },
        { id: 'ai-interview', label: 'AI Interview', icon: <Mic size={16} /> }
      ]
    },
    { id: 'ats-checker', label: 'ATS Checker', icon: <FileSearch size={18} />, type: 'link' },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TrendingUp size={18} />,
      type: 'dropdown',
      items: [
        { id: 'results', label: 'Results', icon: <BarChart3 size={16} /> },
        { id: 'learning-roadmap', label: 'Roadmap', icon: <Map size={16} /> },
        { id: 'skill-gap-analyzer', label: 'Skill Gap', icon: <TrendingUp size={16} /> },
        { id: 'career-engine', label: 'Career AI', icon: <Sparkles size={16} /> },
        { id: 'recommendations', label: 'Insights', icon: <Zap size={16} /> }
      ]
    },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Award size={18} />, type: 'link' },
    { id: 'confidence-check', label: 'Confidence', icon: <UserCheck size={18} />, type: 'link' }
  ];

  const recruiterNavGroups = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, type: 'link' },
    { id: 'candidates', label: 'Candidates', icon: <Users size={18} />, type: 'link' },
    { id: 'shortlisted', label: 'Shortlisted', icon: <UserCheck size={18} />, type: 'link' },
    {
      id: 'assessments',
      label: 'Assessments',
      icon: <BookOpen size={18} />,
      type: 'dropdown',
      items: [
        { id: 'view-assessments', label: 'Manage All', icon: <BookOpen size={16} /> },
        { id: 'create-assessment', label: 'Create New', icon: <Plus size={16} /> }
      ]
    },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} />, type: 'link' }
  ];

  const navGroups = user?.role === 'recruiter' ? recruiterNavGroups : studentNavGroups;

  return (
    <nav className={`dashboard-navbar-premium ${user?.role === 'recruiter' ? 'navbar-recruiter' : ''}`}>
      <div className="navbar-inner">
        {/* LOGO & BRAND */}
        <div 
          className={`navbar-brand ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
          role="button"
          tabIndex={0}
        >
          <div className="brand-logo-main">
            <ShieldCheck size={28} className="logo-icon-svg" />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-name">
              {user?.role === 'recruiter' ? 'SkillGuard Hire' : 'SkillGuard AI'} 
              {user?.role !== 'recruiter' && <span className="brand-accent"> AI</span>}
            </span>
            <span className="brand-tagline">
              {user?.role === 'recruiter' ? 'Enterprise Talent Intelligence' : 'Intelligent Talent Guard'}
            </span>
          </div>
        </div>

        {/* MOBILE HAMBURGER - left side next to logo */}
        <button 
          className="navbar-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Open menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* CENTER NAVIGATION */}
        <div className="navbar-center-nav" ref={navRef}>
          {navGroups.map(group => (
            <div key={group.id} className="nav-group-container">
              {group.type === 'link' ? (
                <button
                  className={`nav-main-link ${activeTab === group.id ? 'active' : ''}`}
                  onClick={() => { onTabChange(group.id); setIsMobileMenuOpen(false); }}
                >
                  {group.icon}
                  <span>{group.label}</span>
                  {activeTab === group.id && <motion.div layoutId="nav-glow" className="nav-active-indicator" />}
                </button>
              ) : (
                <div className="nav-dropdown-wrapper">
                  <button
                    className={`nav-main-link ${activeDropdown === group.id ? 'active' : ''} ${group.items.some(i => i.id === activeTab) ? 'child-active' : ''}`}
                    onClick={() => setActiveDropdown(activeDropdown === group.id ? null : group.id)}
                  >
                    {group.icon}
                    <span>{group.label}</span>
                    <ChevronDown size={14} className={`nav-chevron ${activeDropdown === group.id ? 'rotated' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === group.id && (
                      <motion.div
                        className="nav-dropdown-menu"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      >
                        {group.items.map(item => (
                          <button
                            key={item.id}
                            className={`dropdown-nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => {
                              onTabChange(item.id);
                              setActiveDropdown(null);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <span className="item-icon-small">{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* RIGHT ACTIONS */}
        <div className="navbar-right-tools">


          <div className="tool-actions-flex">
            {user?.role === 'recruiter' && (
              <button 
                className="create-job-btn" 
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                onClick={openInviteModal}
              >
                Generate Link
              </button>
            )}
            {/* Notifications */}
            <div 
              className="notification-wrapper" 
              ref={dropdownRef}
              onMouseEnter={handleNotificationMouseEnter}
              onMouseLeave={handleNotificationMouseLeave}
            >
              <button
                className={`navbar-icon-btn ${isNotificationsOpen ? 'active' : ''}`}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="navbar-notif-badge">{unreadCount}</span>}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    className="navbar-dropdown-panel notifications-panel"
                    initial={{ opacity: 0, y: 10, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: 10, rotateX: -10 }}
                  >
                    <div className="pan-header">
                      <h4>Notifications</h4>
                      <button onClick={markAllRead}>Mark all read</button>
                    </div>
                    <div className="pan-items">
                      {relevantNotifications.length > 0 ? relevantNotifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`pan-item ${n.unread ? 'unread' : ''}`} 
                          onClick={() => {
                            markAsRead(n.id);
                            onTabChange(n.section);
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <span className="pan-icon">{n.icon}</span>
                          <div className="pan-content">
                            <p>{n.title}</p>
                            <span>{n.desc}</span>
                          </div>
                          {n.unread && <div className="unread-dot-notif" />}
                        </div>
                      )) : (
                        <div className="pan-empty-state">
                          <Bell size={32} />
                          <p>All caught up!</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile */}
            <div className="user-nav-wrapper" ref={dropdownRef}>
              <button
                className={`nav-profile-btn ${isProfileOpen ? 'active' : ''} ${user?.role === 'recruiter' ? 'is-recruiter-btn' : ''}`}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="nav-avatar-wrap">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="nav-avatar-img" />
                  ) : (
                    user?.first_name?.charAt(0) || <User size={18} />
                  )}
                </div>
                <div className="nav-profile-info-compact">
                    <span className="nav-user-name">{user?.first_name || 'Guest'}</span>
                    {user?.role === 'recruiter' && <span className="nav-role-badge">Recruiter</span>}
                </div>
                <ChevronDown size={14} className={`nav-chevron-icon ${isProfileOpen ? 'rotated' : ''}`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    className="navbar-dropdown-panel profile-panel"
                    initial={{ opacity: 0, y: 10, rotateX: -10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: 10, rotateX: -10 }}
                  >
                    <div className="profile-pan-header">
                      <p className="p-name">{user?.first_name} {user?.last_name}</p>
                      <p className="p-email">{user?.email}</p>
                    </div>
                    <div className="pan-divider" />
                    <button className="pan-link" onClick={() => { onTabChange('settings'); setIsProfileOpen(false); }}>
                      <User size={16} />
                      <span>Edit Profile</span>
                    </button>
                    <button className="pan-link" onClick={() => { onTabChange('settings'); setIsProfileOpen(false); }}>
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <div className="pan-divider" />
                    <button className="pan-link logout" onClick={onLogout}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Hamburger Toggle — hidden on desktop, visible CSS-side */}
          </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="navbar-mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="mobile-menu-scroll">
              {navGroups.map(group => (
                <div key={group.id} className="mobile-nav-group">
                  {group.type === 'link' ? (
                    <button onClick={() => { onTabChange(group.id); setIsMobileMenuOpen(false); }}>
                      {group.icon} <span>{group.label}</span>
                    </button>
                  ) : (
                    <>
                      <div className="mobile-group-label">{group.label}</div>
                      {group.items.map(i => (
                        <button key={i.id} onClick={() => { onTabChange(i.id); setIsMobileMenuOpen(false); }}>
                          {i.icon} <span>{i.label}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              ))}
              <div className="pan-divider" />
              <button onClick={onLogout} className="mobile-logout"><LogOut size={18} /> <span>Sign Out</span></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
      />
    </nav>
  );
};

export default TopBar;
