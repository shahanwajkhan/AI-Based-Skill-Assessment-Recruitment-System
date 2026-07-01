import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  ShieldCheck, 
  Mic, 
  BarChart3, 
  Map, 
  TrendingUp, 
  Zap, 
  UserCheck, 
  FileSearch, 
  Settings, 
  LogOut,
  ChevronRight,
  Sparkles,
  Award,
  Briefcase,
  Users,
  Calendar,
  Clock
} from 'lucide-react';
import './Sidebar.css';

/* ─── AI Personality Orb Component ───────────────────────────── */
const AIOrb = ({ active, isExpanded }) => (
  <div className={`ai-nav-orb-container ${isExpanded ? 'expanded' : ''}`}>
    <div className={`ai-nav-orb ${active ? 'active' : ''}`}>
      <div className="orb-inner" />
      <div className="orb-ring r1" />
      <div className="orb-ring r2" />
    </div>
    <AnimatePresence>
      {isExpanded && (
        <motion.div 
          className="orb-status-text"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          {active ? 'AI Assistant Active' : 'SkillGuard AI Ready'}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const studentNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'tests', label: 'Skill Tests', icon: <BookOpen size={20} /> },
  { id: 'proctoring', label: 'AI Proctoring Exams', icon: <ShieldCheck size={20} /> },
  { id: 'ai-interview', label: 'AI Powered Interview', icon: <Mic size={20} /> },
  { id: 'confidence-check', label: 'AI Confidence Checker', icon: <UserCheck size={20} /> },
  { id: 'results', label: 'Results', icon: <BarChart3 size={20} /> },
  { id: 'learning-roadmap', label: 'Learning Roadmap', icon: <Map size={20} /> },
  { id: 'skill-gap-analyzer', label: 'AI Skill Gap Analyzer', icon: <TrendingUp size={20} /> },
  { id: 'recommendations', label: 'Skill Recommendations', icon: <Zap size={20} /> },
  { id: 'ats-checker', label: 'ATS Resume Checker', icon: <FileSearch size={20} /> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <Award size={20} /> },
];

const recruiterNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'jobs', label: 'Active Jobs', icon: <Briefcase size={20} /> },
  { id: 'candidates', label: 'Candidates', icon: <Users size={20} /> },
  { id: 'history', label: 'Assignment History', icon: <Clock size={20} /> },
  { id: 'interviews', label: 'Interviews', icon: <Calendar size={20} /> },
  { id: 'analytics', label: 'hiring Analytics', icon: <BarChart3 size={20} /> },
];

const Sidebar = ({ activeTab, setActiveTab, onLogout, role = 'student' }) => {
  const navItems = role === 'recruiter' ? recruiterNavItems : studentNavItems;
  const navigate = useNavigate();
  const [hoveredTab, setHoveredTab] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, label: '' });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseEnter = (e, item) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTab(item.id);
    setTooltipPos({ 
      top: rect.top + rect.height / 2, 
      label: item.label 
    });
  };

  if (isMobile) {
    return (
      <nav className="mobile-dock">
        {navItems.slice(0, 5).map(item => (
          <button 
            key={item.id}
            className={`dock-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span className="dock-label">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button className="dock-item" onClick={() => setActiveTab('settings')}>
          <Settings size={20} />
          <span className="dock-label">Settings</span>
        </button>
      </nav>
    );
  }

  return (
    <div className="sidebar-pill-wrapper">
      <aside className="sidebar-pill">
        <div className="sidebar-logo">
          <ShieldCheck size={28} color="white" strokeWidth={2.5} />
        </div>

        <div className="sidebar-nav-container">
          {navItems.map(item => (
            <div key={item.id} className="nav-item-pill">
              <button 
                className={`nav-link-pill ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                onMouseEnter={(e) => handleMouseEnter(e, item)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <span style={{ pointerEvents: 'none', display: 'flex' }}>{item.icon}</span>
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="active-glow"
                    className="active-glow-bg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer-pill">
          <button 
            className={`nav-link-pill ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            onMouseEnter={(e) => handleMouseEnter(e, { id: 'settings', label: 'Settings' })}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <Settings size={22} />
          </button>
          <button 
            className="nav-link-pill logout" 
            onClick={onLogout}
            onMouseEnter={(e) => handleMouseEnter(e, { id: 'logout', label: 'Logout' })}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <LogOut size={22} />
          </button>
        </div>
      </aside>

      {/* Persistent Tooltip - Outside the clipping container */}
      <AnimatePresence>
        {hoveredTab && (
          <motion.div 
            className="nav-tooltip-pill"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            style={{ 
              position: 'fixed',
              top: tooltipPos.top,
              left: '96px',
              transform: 'translateY(-50%)'
            }}
          >
            {tooltipPos.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;
