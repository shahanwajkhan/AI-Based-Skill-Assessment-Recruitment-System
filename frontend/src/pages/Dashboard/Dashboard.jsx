import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import StatCard from '../../components/StatCard/StatCard';
import Chart from '../../components/Chart/Chart';
import ActivityFeed from '../../components/ActivityFeed/ActivityFeed';
import RecommendationCard from '../../components/RecommendationCard/RecommendationCard';
import { API_URL } from '../../utils/api';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getLocalResults } from '../../utils/resultStorage';
import SkillTests from '../SkillTests/SkillTests';
import AIProctoringExam from '../AIProctoringExam/AIProctoringExam';
import ResultsPage from '../Results/ResultsPage';
import AIInterviewFlow from '../AIInterview/AIInterviewFlow';
import { motion } from 'framer-motion';
import LearningRoadmap from '../../components/LearningRoadmap/LearningRoadmap';
import SkillGapAnalysis from '../SkillGapAnalysis/SkillGapAnalysis';
import ProfileSettings from '../ProfileSettings/ProfileSettings';
import ATSResumeChecker from '../ATSResumeChecker/ATSResumeChecker';
import AIConfidenceAnalyzer from '../AIConfidenceAnalyzer/AIConfidenceAnalyzer';
import AIMentorChat from '../../components/AIMentorChat/AIMentorChat';
import CareerRecommendation from '../../components/CareerRecommendation/CareerRecommendation';
import TopBar from '../../components/TopBar/TopBar';
import RoadmapDetailPage from './RoadmapDetailPage';
import RecruiterDashboard from './RecruiterDashboard';
import NotificationToast from '../../components/NotificationToast/NotificationToast';
import { Map as MapIcon, TrendingUp, Sparkles, Zap, ShieldCheck, FileSearch, Clock, Code } from 'lucide-react';

// Dummy data for the dashboard
// Demo data placeholders removed - now using backend data
const dummyStats = [
  {
    id: 1,
    title: 'Total Tests Taken',
    value: '0',
    trend: 'neutral',
    trendValue: '0%',
    trendLabel: '',
    color: 'primary',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )
  },
  {
    id: 2,
    title: 'Average Score',
    value: '0%',
    trend: 'neutral',
    trendValue: '0%',
    trendLabel: '',
    color: 'success',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
      </svg>
    )
  },
  {
    id: 3,
    title: 'Top Skill',
    value: 'None',
    trend: 'neutral',
    trendValue: '-',
    trendLabel: '',
    color: 'info',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    )
  },
  {
    id: 4,
    title: 'Skill Level',
    value: 'Beginner',
    trend: 'neutral',
    trendValue: '-',
    trendLabel: '',
    color: 'warning',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    )
  }
];

const mockSkillData = [
  { label: 'Python', value: 85, colorClass: 'success' },
  { label: 'System Design', value: 72, colorClass: 'primary' },
  { label: 'React', value: 90, colorClass: 'success' },
  { label: 'Data Structures', value: 60, colorClass: 'warning' },
  { label: 'SQL', value: 78, colorClass: 'primary' },
];

const mockMcqData = [
  { label: 'Correct', value: 16, colorClass: 'success' },
  { label: 'Incorrect', value: 4, colorClass: 'danger' },
];

const mockCodingData = [
  { label: 'Test 1', value: 40, colorClass: 'warning' },
  { label: 'Test 2', value: 65, colorClass: 'primary' },
  { label: 'Test 3', value: 85, colorClass: 'success' },
  { label: 'Test 4', value: 75, colorClass: 'primary' },
  { label: 'Test 5', value: 95, colorClass: 'success' },
];

const mockActivities = [];

/* ─── useScrollReveal: adds 'revealed' class when element enters viewport ─── */
const useScrollReveal = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
};

const CATEGORIES = ['Technical', 'Aptitude', 'Soft Skills', 'Communication', 'Psychometric', 'Leadership', 'Data Science', 'DevOps'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeExamId, setActiveExamId] = useState(null);
  const [viewingResult, setViewingResult] = useState(null);
  const [viewingRoadmap, setViewingRoadmap] = useState(null);
  const [viewingSkillGap, setViewingSkillGap] = useState(null);
  const [viewingCareerIntelligence, setViewingCareerIntelligence] = useState(null);
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();

  // Dashboard Data State
  const [stats, setStats] = useState(dummyStats);
  const [activities, setActivities] = useState(mockActivities);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [userRoadmaps, setUserRoadmaps] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statsReady, setStatsReady] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [assignedTests, setAssignedTests] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Technical');

  // Scroll reveal refs
  const revealStats = useScrollReveal();
  const revealActions = useScrollReveal();
  const revealCharts = useScrollReveal();
  const revealBottom = useScrollReveal();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Poll for Recruiter Assigned Tests
  useEffect(() => {
    const fetchAssignments = async () => {
      if (user?.role === 'recruiter') return;
      const token = localStorage.getItem('access_token');
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/assessments/assignments/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAssignedTests(prev => {
            // Check for new assignments to trigger notification
            const currentIds = new Set(prev.map(t => t.id));
            let newCount = 0;
            data.forEach(t => {
              if (!currentIds.has(t.id)) newCount++;
            });
            
            if (newCount > 0 && prev.length > 0) { // Don't notify on initial mount load
              const lastAdditions = data.filter(t => !currentIds.has(t.id));
              const hasInterview = lastAdditions.some(t => t.assessment_detail?.assessment_type === 'interview');
              
              if (hasInterview) {
                addNotification({
                  type: 'assignment',
                  icon: '🎤',
                  title: 'New AI Interview',
                  desc: `You have been invited to a ${lastAdditions.find(t => t.assessment_detail?.assessment_type === 'interview')?.assessment_detail?.title || 'new AI Interview'}.`,
                  section: 'dashboard',
                  role: 'student'
                });
              } else {
                addNotification({
                  type: 'assignment',
                  icon: '🚨',
                  title: 'New Proctored Exam',
                  desc: `A recruiter has assigned a new mandatory evaluation to you.`,
                  section: 'dashboard',
                  role: 'student'
                });
              }
            }
            return data;
          });
        }
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
      }
    };

    fetchAssignments();
    const intervalId = setInterval(fetchAssignments, 15000); // 15s polling for more "real-time" feel
    return () => clearInterval(intervalId);
  }, [user, addNotification]);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchData = async () => {
      if (user?.role === 'recruiter') return;
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        // 1. Fetch Stats
        const statsRes = await fetch(`${API_URL}/dashboard/stats/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          const avgScore = statsData.average_score || 0;
          let computedLevel = 'Beginner';
          if (avgScore >= 80) computedLevel = 'Advanced';
          else if (avgScore >= 50) computedLevel = 'Intermediate';

          setStats([
            { 
              ...dummyStats[0], 
              value: (statsData?.total_tests ?? 0).toString(),
              details: { trending: 'Active this week', target: 'Goal: 10', achievement: 'Skill Explorer' }
            },
            { 
              ...dummyStats[1], 
              value: `${avgScore}%`,
              details: { trending: 'Up 4% overall', target: 'Goal: 85%', achievement: 'Top 20% User' }
            },
            { 
              ...dummyStats[2], 
              value: statsData?.top_skill || 'None',
              details: { trending: 'Consistency: High', target: 'Level: Expert', achievement: 'Mastery Peak' }
            },
            { 
              ...dummyStats[3], 
              value: computedLevel, 
              color: computedLevel === 'Advanced' ? 'success' : computedLevel === 'Intermediate' ? 'primary' : 'warning',
              details: { trending: 'Steady Phase', target: 'Next: Pro', achievement: 'Career Ready' }
            },
            { id: 5, title: 'Total Interviews', value: (statsData?.total_interviews ?? 0).toString(), color: 'info' },
            { id: 6, title: 'Integrity Score', value: statsData?.integrity_score || '0%', color: 'success' },
          ]);
          if (statsData.ai_insights) {
            setAiInsights(statsData.ai_insights);
          }
          
          // 2. Fetch Leaderboard
          const leaderRes = await fetch(`${API_URL}/dashboard/leaderboard/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (leaderRes.ok) setLeaderboard(await leaderRes.json());

          // 6. Fetch Available Assessments
          const assessRes = await fetch(`${API_URL}/assessments/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (assessRes.ok) setAvailableAssessments(await assessRes.json());

          // 3. Fetch Latest Analysis
          const analRes = await fetch(`${API_URL}/dashboard/latest-analysis/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (analRes.ok) {
            const analData = await analRes.json();
            if (analData.exists) {
              setLatestAnalysis(analData.data);
            }
          }

          setStatsReady(true);

          // 1b. SMART NOTIFICATIONS: Check for Improvements & New Tests
          const lastAvg = parseFloat(localStorage.getItem('skillguard_last_avg') || '0');
          const lastTestCount = parseInt(localStorage.getItem('skillguard_last_count') || '0');

          if (avgScore > lastAvg && lastAvg > 0) {
            const diff = (avgScore - lastAvg).toFixed(1);
            addNotification({
              type: 'improvement',
              icon: '🚀',
              title: `Performance Boost!`,
              desc: `You improved your average score by ${diff}% this week. Keep it up!`,
              section: 'recommendations',
              role: 'student'
            });
          }

          if (statsData.total_tests > lastTestCount && lastTestCount > 0) {
            addNotification({
              type: 'system',
              icon: '📚',
              title: 'New Test Available',
              desc: 'A recruiter has added a new assessment for your domain.',
              section: 'skill-tests',
              role: 'student'
            });
          }

          localStorage.setItem('skillguard_last_avg', avgScore.toString());
          localStorage.setItem('skillguard_last_count', (statsData.total_tests || 0).toString());
        }

        // 2. Fetch Activity (Recent for dashboard, all for results)
        const activityUrl = activeTab === 'results' ? `${API_URL}/results/` : `${API_URL}/dashboard/recent-activity/`;
        const activityRes = await fetch(activityUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          // Map backend Result objects to UI Activity objects
          const backendMapped = (activityData || []).map(res => ({
            id: res.id,
            type: 'test',
            title: res.assessment?.title || (res.skill_breakdown?.some(s => s.skill === 'Communication') ? 'AI Interview' : 'Custom Assessment'),
            score: res.score,
            status: res.score >= 80 ? 'Excellent' : res.score >= 60 ? 'Good' : 'Needs Improvement',
            date: new Date(res.completed_at).toLocaleDateString('en-GB'),
            time: new Date(res.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fullData: res
          }));

          // Merge with local storage results
          const localResults = getLocalResults().map(res => ({
            ...res,
            title: res.testType, // map field names for consistency
            isLocal: true
          }));

          // 3. Deduplicate and Sort
          const dedupedMap = new Map();
          [...localResults, ...backendMapped].forEach(item => {
            // Prefer backend results if IDs match (assuming synced)
            const key = item.isLocal ? `local_${item.id}` : `backend_${item.id}`;
            dedupedMap.set(key, item);
          });

          const allActivities = Array.from(dedupedMap.values()).sort((a, b) => {
            const timeA = a.timestamp || new Date(a.date.split('/').reverse().join('-') + ' ' + a.time).getTime();
            const timeB = b.timestamp || new Date(b.date.split('/').reverse().join('-') + ' ' + b.time).getTime();
            return timeB - timeA;
          });

          setActivities(allActivities);

          if (allActivities.length > 0) {
            const latest = allActivities[0];
            
            // 4. Update skills for Career AI
            if (!latest.isLocal) {
              try {
                const latestRes = await fetch(`${API_URL}/results/${latest.id}/`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (latestRes.ok) {
                  const latestData = await latestRes.json();
                  setUserSkills(latestData.skill_breakdown || []);
                }
              } catch (err) {
                console.error("Error fetching latest skills for Career AI:", err);
              }
            } else {
              setUserSkills(latest.skillBreakdown || []);
            }
          }
        }

        // 4. Fetch Roadmap History
        const roadmapRes = await fetch(`${API_URL}/skill-gap-analysis/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json();
          if (roadmapData.length > 0) {
            // Sort by creation date
            const sortedRoadmaps = roadmapData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            // Set active (latest) roadmap
            setActiveRoadmap(sortedRoadmaps[0].roadmap);
            
            // Map for the history list
            const mappedRoadmaps = sortedRoadmaps.map(item => {
              const testTitle = item.assessment_result?.assessment?.title || item.interview_session?.assessment?.title || (item.interview_session ? 'AI Mock Interview' : 'AI Assessment');
              const score = item.assessment_result?.score || item.interview_session?.overall_score || 0;
              
              return {
                ...item,
                title: `${testTitle} Roadmap`,
                testType: item.source_type === 'skill_test' ? 'Skill Assessment' : 'AI Interview',
                score: score,
                date: new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                status: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement',
                fullData: item // Ensure viewing logic works
              };
            });
            setUserRoadmaps(mappedRoadmaps);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'dashboard' || activeTab === 'results' || activeTab === 'learning-roadmap' || activeTab === 'skill-gap-analyzer') {
      fetchData();
    }

    // Listen for manual refreshes (e.g. after a test completion)
    const handleManualRefresh = () => fetchData();
    window.addEventListener('refreshDashboard', handleManualRefresh);

    return () => {
      window.removeEventListener('refreshDashboard', handleManualRefresh);
    };
  }, [activeTab]);

  const handleTabChange = (tabId) => {
    setViewingResult(null);
    setViewingRoadmap(null);
    setViewingSkillGap(null);
    setViewingCareerIntelligence(null);
    setActiveTab(tabId);
  };

  const handleDeleteRoadmap = async () => {
    if (!activeRoadmap?.id) {
      setActiveRoadmap(null);
      return;
    }

    if (window.confirm("Are you sure you want to delete this learning roadmap?")) {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/skill-gap-analysis/${activeRoadmap.id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setActiveRoadmap(null);
        }
      } catch (err) {
        console.error("Error deleting roadmap:", err);
        // Fallback: just hide it
        setActiveRoadmap(null);
      }
    }
  };

  const handleExploreRoadmap = (role) => {
    // We use the latest activity as the source for the roadmap
    if (activities.length > 0) {
      const latest = activities[0];
      setSelectedSource({ id: latest.id, type: 'assessment' });
      setActiveTab('skill-gap-analyzer');
    } else {
      // If no activities, just go to the analyzer (it will show empty state)
      setActiveTab('skill-gap-analyzer');
    }
  };

  return (
    <div className={`dashboard-wrapper ${user?.role === 'recruiter' ? 'is-recruiter-view' : ''}`}>
      {!activeExamId && activeTab !== 'ai-interview' && (
        <TopBar user={user} onLogout={handleLogout} onTabChange={handleTabChange} activeTab={activeTab} />
      )}
      
      <div className={`dashboard-content-area ${(activeTab === 'ai-interview' || activeExamId) ? 'full-bleed' : ''} ${user?.role === 'recruiter' ? 'full-width' : ''}`}>
        <main className={`dashboard-main-view ${(activeTab === 'ai-interview' || activeExamId || user?.role === 'recruiter') ? 'full-width' : ''}`}>
            {activeTab === 'dashboard' || activeTab === 'candidates' || activeTab === 'shortlisted' || activeTab === 'view-assessments' || activeTab === 'create-assessment' || activeTab === 'analytics' ? (
            user?.role === 'recruiter' ? (
              <RecruiterDashboard user={user} globalActiveTab={activeTab} />
            ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="smart-dashboard-content"
            >
              {/* ─── SMART HERO BANNER ─── */}
              <motion.div 
                className="smart-hero-banner"
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
                }}
              >
                <div className="hero-content-left">
                  <span className="hero-tagline">✨ Welcome Home, {user?.first_name || 'Scarlett'}</span>
                  <h1>Your AI talent journey is <br/> looking bright today.</h1>
                  <p>Check your latest skill growth and upcoming proctored assessments.</p>
                  
                  <div className="hero-status-pills">
                    <div className="status-pill-mini">
                      <span className="dot online" />
                      AI Mentor Online
                    </div>
                    <div className="status-pill-mini">
                      <span className="dot active" />
                      System Optimized
                    </div>
                  </div>
                </div>

                <div className="hero-illustration-container">
                  <motion.img 
                    src="/ai_talent_illustration.png" 
                    alt="Hero Illustration" 
                    className="hero-illustration"
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="illustration-glow" />
                </div>
              </motion.div>

              {/* ─── ONBOARDING GUIDE (shows for new users with 0 tests) ─── */}
              {parseInt(stats[0]?.value) === 0 && (
                <div className="db-onboarding">
                  <div className="db-onboarding-header">
                    <span>🗺️ Get Started — Complete these steps to unlock your potential</span>
                  </div>
                  <div className="db-onboarding-steps">
                    {[
                      { icon: '📝', title: 'Take your first Skill Test', action: () => setActiveTab('skill-tests'), done: false },
                      { icon: '🎤', title: 'Try the AI Interview Simulator', action: () => setActiveExamId({ type: 'ai-interview' }), done: false },
                      { icon: '📊', title: 'Explore your Skill Analytics', action: null, done: false },
                      { icon: '🏆', title: 'Earn your first achievement badge', action: null, done: false },
                    ].map((step, i) => (
                      <div key={i} className={`db-ob-step ${step.done ? 'done' : ''}`} onClick={step.action} style={{ cursor: step.action ? 'pointer' : 'default' }}>
                        <div className="db-ob-num">{step.done ? '✓' : i + 1}</div>
                        <span className="db-ob-icon">{step.icon}</span>
                        <span className="db-ob-title">{step.title}</span>
                        {step.action && <span className="db-ob-arrow">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── SKILL CATEGORIES ─── */}
              <div className="db-category-section" style={{ marginBottom: '2.5rem' }}>
                <div className="db-section-label" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                  <Code size={18} color="#6366f1" />
                  <span style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>Skill Category</span>
                </div>
                <div className="db-category-tags">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat} 
                      className={`db-cat-tag ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── AI PROCTORED EXAM (ASSIGNED) ─── */}
              {assignedTests && assignedTests.length > 0 && assignedTests.some(a => (a.assessment_detail?.assessment_type === 'mcq') && (a.assessment_detail?.category === selectedCategory)) && (
                <div style={{ marginBottom: '2.5rem' }}>
                   <div className="db-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <ShieldCheck size={24} color="#ef4444" />
                      <h3 style={{ margin: 0, color: '#ef4444' }}>AI Proctored Exam: {selectedCategory}</h3>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                      {assignedTests
                        .filter(a => a.assessment_detail?.assessment_type === 'mcq' && a.assessment_detail?.category === selectedCategory)
                        .map(assignment => {
                         const test = assignment.assessment_detail;
                         if (!test) return null;
                         return (
                            <div key={assignment.id} className="test-card" style={{ border: '2px solid #fee2e2', background: '#fff5f5' }}>
                               <div className="test-card-header">
                                  <span className="test-category" style={{ background: '#ef4444', color: 'white' }}>PROCTORED EXAM</span>
                                   <div className="test-difficulty" style={{ color: 'var(--danger-red)' }}>
                                     <span className="difficulty-dot" style={{ backgroundColor: 'var(--danger-red)' }}></span>
                                     Mandatory Requirement
                                  </div>
                               </div>
                               <h3 className="test-title">{test.title}</h3>
                               <p className="test-description">{test.description || `Required mandatory evaluation. Completing this test is required.`}</p>
                               <div className="test-meta">
                                  <div className="meta-item">
                                     <Clock size={15} /> {test.estimated_time || 30} mins
                                  </div>
                                  <div className="meta-item">
                                     <FileSearch size={15} /> {test.questions?.length || 0} questions
                                  </div>
                               </div>
                               <div className="test-card-footer" style={{ marginTop: '1.5rem' }}>
                                  <button 
                                     className="db-btn-primary" 
                                     style={{ width: '100%', background: '#ef4444', border: 'none' }}
                                     onClick={() => {
                                        setActiveExamId(test);
                                     }}
                                  >
                                     Start Proctored Exam
                                  </button>
                                </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
              )}

              {/* ─── AI PROCTORED INTERVIEW (ASSIGNED) ─── */}
              {assignedTests && assignedTests.length > 0 && assignedTests.some(a => a.assessment_detail?.assessment_type === 'interview') && (
                <div style={{ marginBottom: '2.5rem' }}>
                   <div className="db-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Sparkles size={24} color="#8b5cf6" />
                      <h3 style={{ margin: 0, color: '#8b5cf6' }}>AI Proctored Interview</h3>
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                      {assignedTests
                        .filter(a => a.assessment_detail?.assessment_type === 'interview')
                        .map(assignment => {
                         const test = assignment.assessment_detail;
                         if (!test) return null;
                         return (
                            <div key={assignment.id} className="test-card" style={{ border: '2px solid #ddd6fe', background: '#f5f3ff' }}>
                               <div className="test-card-header">
                                  <span className="test-category" style={{ background: '#8b5cf6', color: 'white' }}>AI INTERVIEW</span>
                                   <div className="test-difficulty" style={{ color: '#7c3aed' }}>
                                     <span className="difficulty-dot" style={{ backgroundColor: '#7c3aed' }}></span>
                                     {test.interview_category === 'hr' ? 'HR Focus' : 'Technical Focus'}
                                  </div>
                               </div>
                               <h3 className="test-title">{test.title}</h3>
                               <p className="test-description">{test.description || `Required AI-driven interview session as part of your application.`}</p>
                               <div className="test-meta">
                                  <div className="meta-item">
                                     <Clock size={15} /> {test.estimated_time || 15} mins
                                  </div>
                                  <div className="meta-item">
                                     <ShieldCheck size={15} /> Fully Proctored
                                  </div>
                               </div>
                               <div className="test-card-footer" style={{ marginTop: '1.5rem' }}>
                                  <button 
                                     className="db-btn-primary" 
                                     style={{ width: '100%', background: '#8b5cf6', border: 'none' }}
                                     onClick={() => {
                                        setActiveExamId({ 
                                          ...test, 
                                          type: 'assigned-interview',
                                          assignmentId: assignment.id 
                                        });
                                     }}
                                  >
                                     Start AI Interview
                                  </button>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
              )}

              {/* ─── STAT CARDS ─── */}
              <div ref={revealStats} className="section-reveal">
                <div className="db-section-title">
                  <h3>📊 Performance Overview</h3>
                  <div className="date-filter">
                    <select defaultValue="30">
                      <option value="7">Last 7 Days</option>
                      <option value="30">Last 30 Days</option>
                      <option value="90">Last 3 Months</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                </div>
                {isLoading ? (
                  <div className="stats-grid">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="skeleton skeleton-card" style={{ animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    className="stats-grid"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                  >
                    {stats.slice(0, 4).map(stat => (
                      <motion.div key={stat.id} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
                        <StatCard {...stat} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* ─── SMART PROFILE SUMMARY ─── */}
              <div style={{ marginTop: '2.5rem' }}>
                <div className="db-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>👤 Smart Profile Overview</h3>
                  <button onClick={() => setActiveTab('settings')} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', background: '#ffffff', color: '#4f46e5', border: '1px solid #e0e7ff', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 10px rgba(79, 70, 229, 0.08)', transition: 'all 0.2s ease' }}>Update Profile</button>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>Top Skills</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                       {user?.profile?.skills && user.profile.skills.length > 0 ? (
                         user.profile.skills.slice(0, 5).map((skill, i) => (
                           <span key={i} style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))', color: '#4f46e5', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(99, 102, 241, 0.2)' }}>{skill}</span>
                         ))
                       ) : (
                         <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No skills currently analyzed. Upload CV to auto-fill.</span>
                       )}
                       {user?.profile?.skills?.length > 5 && <span style={{ color: '#64748b', fontSize: '0.85rem', padding: '0.2rem' }}>+{user.profile.skills.length - 5} more</span>}
                    </div>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid rgba(0,0,0,0.06)', paddingLeft: '2rem' }}>
                    <h4 style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>Experience Snapshot</h4>
                    <p style={{ color: '#334155', fontSize: '1rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.6' }}>
                      {user?.profile?.experience ? user.profile.experience : 'No experience details available. Update your profile to add your background.'}
                    </p>
                  </div>
                </div>
              </div>

                {/* ─── LATEST ANALYSIS HUB (PRO FEATURE) ─── */}
                {latestAnalysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="section-reveal revealed" 
                    style={{ marginBottom: '2.5rem', marginTop: '1rem' }}
                  >
                    <div className="db-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', fontWeight: 800 }}>
                        <Zap size={18} color="#6366f1" fill="#6366f1" />
                        Latest Deep Intelligence
                      </span>
                      <span className="db-ai-badge">Personalized for your last test</span>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                      gap: '1.25rem' 
                    }}>
                      {/* Roadmap Card */}
                      <div 
                        className="db-analysis-hub-card" 
                        onClick={() => {
                          setViewingRoadmap(latestAnalysis);
                          setActiveTab('roadmap');
                        }}
                      >
                        <div className="hub-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                          <MapIcon size={24} />
                        </div>
                        <div className="hub-card-content">
                          <h4>Roadmap</h4>
                          <p>Targeted learning path to master your gap areas.</p>
                          <span className="hub-card-action">Continue Journey ➔</span>
                        </div>
                      </div>

                      {/* Skill Gap Card */}
                      <div 
                        className="db-analysis-hub-card" 
                        onClick={() => {
                          setViewingAnalysis(latestAnalysis);
                          setActiveTab('skill-gap');
                        }}
                      >
                        <div className="hub-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          <TrendingUp size={24} />
                        </div>
                        <div className="hub-card-content">
                          <h4>Skill Gap</h4>
                          <p>Visual report of your strengths vs industry standards.</p>
                          <span className="hub-card-action">View Breakdown ➔</span>
                        </div>
                      </div>

                      {/* Career AI Card */}
                      <div 
                        className="db-analysis-hub-card" 
                        onClick={() => {
                          setViewingCareerIntelligence(latestAnalysis);
                          setActiveTab('career-engine');
                        }}
                      >
                        <div className="hub-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                          <Sparkles size={24} />
                        </div>
                        <div className="hub-card-content">
                          <h4>Career AI</h4>
                          <p>Strategic role matching and salary predictions.</p>
                          <span className="hub-card-action">Analyze Path ➔</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

               {/* ─── QUICK ACTIONS ─── */}
              <div ref={revealActions} className="section-reveal">
                <motion.h3 
                  className="db-section-label"
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                >
                  ⚡ Quick Actions
                </motion.h3>
                <motion.div 
                  className="db-quick-actions"
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
                >
                {[
                  { icon: '🧠', title: 'Skill Test', desc: 'AI adaptive assessment', color: '#5c5cfc', action: () => setActiveTab('skill-tests'), isPrimary: true },
                  { icon: '🎤', title: 'AI Interview', desc: 'Voice-based mock interview', color: '#8b5cf6', action: () => setActiveTab('ai-interview') },
                  { icon: '📉', title: 'Confidence', desc: 'Voice analysis coach', color: '#ec4899', action: () => setActiveTab('confidence-check') },
                  { icon: '💻', title: 'Coding Challenge', desc: 'Solve live problems', color: '#10b981', action: () => setActiveTab('skill-tests') },
                  { icon: '🛡️', title: 'Proctored Exam', desc: 'Verified assessment', color: '#f59e0b', action: () => setActiveTab('proctoring') },
                  { icon: '📄', title: 'ATS Checker', desc: 'Analyze CV compatibility', color: '#06b6d4', action: () => setActiveTab('ats-checker') },
                ].map((action, i) => (
                  <motion.div 
                    key={i} 
                    className={`db-qa-card ${action.isPrimary ? 'primary-action' : ''}`}
                    onClick={action.action} 
                    style={{ '--qa-color': action.color, '--qa-color-glow': `${action.color}33` }}
                    variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={{ scale: 1.03, y: -5 }}
                  >
                    <div className="db-qa-icon" style={{ background: `${action.color}18` }}>{action.icon}</div>
                    <div>
                      <div className="db-qa-title">{action.title}</div>
                      <div className="db-qa-desc">{action.desc}</div>
                    </div>
                    <span className="db-qa-arrow">→</span>
                  </motion.div>
                ))}
              </motion.div>
              </div>

              {/* ─── CHARTS + AI INSIGHTS ─── */}
              <div ref={revealCharts} className="section-reveal">
                <div className="db-analytics-row">
                  <div className="db-charts-col">
                    <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                      <div className="analytics-card">
                        <Chart type="bar" title="Skill Performance" subtitle="Your percentile across tested skills" data={mockSkillData} />
                      </div>
                      <div className="analytics-card">
                        <Chart type="doughnut" title="MCQ Accuracy" subtitle="Overall correctness ratio" data={mockMcqData} />
                      </div>
                      <div className="analytics-card">
                        <Chart type="line" title="Coding Success Rate" subtitle="Performance across challenges" data={mockCodingData} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── BOTTOM GRID: Timeline + Insights + Leaderboard ─── */}
              <div ref={revealBottom} className="section-reveal">
              <motion.div 
                className="db-bottom-grid"
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } } }}
              >

                {/* Activity Timeline */}
                <div className="db-timeline-card">
                  <div className="db-card-header">
                    <h4>🕒 Recent Activity</h4>
                  </div>
                  {activities.length > 0 ? (
                    <div className="db-timeline">
                      {activities.slice(0, 5).map((act, i) => (
                        <div key={act.id} className="db-timeline-item">
                          <div className="db-tl-dot" style={{ background: i === 0 ? '#5c5cfc' : '#e2e8f0' }} />
                          <div className="db-tl-content">
                            <div className="db-tl-title">{act.title}</div>
                            <div className="db-tl-meta">Score: <strong>{act.score}%</strong> · {act.time}</div>
                          </div>
                          <div className="db-tl-badge" style={{ background: act.score >= 80 ? '#ecfdf5' : act.score >= 50 ? '#fffbeb' : '#fff1f2', color: act.score >= 80 ? '#059669' : act.score >= 50 ? '#d97706' : '#e11d48' }}>
                            {act.score >= 80 ? '🏆' : act.score >= 50 ? '✅' : '⚠️'} {act.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="db-empty-state">
                      <span>📋</span>
                      <p>No activity yet. Take your first test to get started!</p>
                      <button className="db-btn-primary" onClick={() => setActiveTab('skill-tests')}>Start Now →</button>
                    </div>
                  )}
                </div>

                 <div className="db-insights-card">
                   <div className="db-card-header">
                     <h4>🤖 AI Insights</h4>
                     <span className="db-ai-badge">Powered by Gemini</span>
                   </div>
                   <div className="db-insights-list">
                    {isLoading ? (
                      // Skeleton Loading State
                      [1, 2, 3].map(i => (
                        <div key={i} className="db-insight-item" style={{ opacity: 0.5, borderStyle: 'dashed' }}>
                          <div className="db-insight-icon" style={{ background: '#f1f5f9' }}>⏳</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ height: '12px', width: '60%', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }}></div>
                            <div style={{ height: '8px', width: '90%', background: '#f1f5f9', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      ))
                    ) : aiInsights.length > 0 ? (
                      aiInsights.map((ins, i) => (
                        <div key={i} className="db-insight-item" style={{ '--ins-color': ins.color || '#6366f1' }}>
                          <div className="db-insight-icon" style={{ background: `${ins.color || '#6366f1'}15`, color: ins.color || '#6366f1' }}>
                            {ins.icon || '✨'}
                          </div>
                          <div>
                            <div className="db-insight-title">{ins.title}</div>
                            <div className="db-insight-desc">{ins.desc}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="db-empty-state" style={{ padding: '1rem' }}>
                        <p>Complete a test to unlock personalized AI insights.</p>
                      </div>
                    )}
                   </div>
                  <div className="db-recommendations-below">
                    <div className="section-header" style={{ marginBottom: '0.75rem' }}>
                      <h3>Recommended for You</h3>
                      <p>Targeted to improve your weak areas</p>
                    </div>
                    <div className="recommendations-list">
                      <RecommendationCard title="System Design Fundamentals" skill="System Design" difficulty="Intermediate" estimatedTime="45 mins" matchScore="98" />
                      <RecommendationCard title="Node.js Error Handling" skill="Node.js" difficulty="Beginner" estimatedTime="30 mins" matchScore="85" />
                    </div>
                  </div>
                </div>

                {/* Gamification + Leaderboard */}
                <div className="db-gamification-col">
                  {/* Badges */}
                  <div className="db-badges-card">
                    <div className="db-card-header">
                      <h4>🏅 Achievements</h4>
                    </div>
                    <div className="db-badges-grid">
                      {[
                        { icon: '🚀', name: 'First Test', unlocked: parseInt(stats[0]?.value) > 0 },
                        { icon: '🔥', name: '3-Day Streak', unlocked: false },
                        { icon: '💎', name: 'Top Scorer', unlocked: false },
                        { icon: '🎤', name: 'Interviewer', unlocked: false },
                        { icon: '⚡', name: 'Speed Coder', unlocked: false },
                        { icon: '🧠', name: 'AI Master', unlocked: false },
                      ].map((b, i) => (
                        <div key={i} className={`db-badge ${b.unlocked ? 'unlocked' : 'locked'}`} title={b.name}>
                          <span>{b.icon}</span>
                          <div className="db-badge-name">{b.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini Leaderboard */}
                  <div className="db-leaderboard-card">
                    <div className="db-card-header">
                      <h4>🏆 Global Leaderboard</h4>
                      <span className="db-view-all">Real-time Ranking</span>
                    </div>
                    <div className="db-leaderboard-list">
                      {(leaderboard.length > 0 ? leaderboard : [
                        { rank: 1, name: 'Aisha R.', score: 98, avatar: '👩‍💻' },
                        { rank: 2, name: 'Carlos M.', score: 95, avatar: '👨‍💻' },
                        { rank: 3, name: 'Priya S.', score: 91, avatar: '👩‍💼' },
                        { rank: 4, name: user ? `${user.first_name} ${user.last_name?.charAt(0) || ''}.` : 'You', score: parseInt(stats[1]?.value) || 0, avatar: '⭐', isUser: true },
                      ]).map((lb) => (
                        <div key={lb.rank} className={`db-lb-row ${lb.isUser ? 'db-lb-you' : ''}`}>
                          <span className="db-lb-rank" style={{ color: lb.rank === 1 ? '#f59e0b' : lb.rank === 2 ? '#94a3b8' : lb.rank === 3 ? '#cd7c2f' : '#5c5cfc' }}>
                            {lb.rank === 1 ? '🥇' : lb.rank === 2 ? '🥈' : lb.rank === 3 ? '🥉' : `#${lb.rank}`}
                          </span>
                          <span className="db-lb-avatar">{lb.avatar || '👤'}</span>
                          <span className="db-lb-name">{lb.name}</span>
                          <span className="db-lb-score">{lb.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              </div>
            </motion.div>
            )
            ) : (activeTab === 'tests' || activeTab === 'skill-tests') ? (
            <SkillTests onStartTest={(id) => setActiveExamId(id)} />
          ) : activeTab === 'proctoring' ? (
            <div className="proctoring-view fade-in">
              <div className="page-header">
                <h2>AI Proctored Exams</h2>
                <p className="page-subtitle">Strictly monitored assessments with screen and camera verification.</p>
              </div>
              <div className="stats-grid">
                <StatCard
                  title="Secure Exams Taken"
                  value={stats.find(s => s.id === 5)?.value || "0"}
                  color="primary"
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
                />
                <StatCard
                  title="Integrity Score"
                  value={stats.find(s => s.id === 6)?.value || "100%"}
                  color="success"
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>}
                />
              </div>
              <div className="recommendations-list mt-8">
                {assignedTests.length > 0 ? (
                  assignedTests.map(assignment => {
                    const test = assignment.assessment_detail;
                    if (!test) return null;
                    return (
                      <RecommendationCard
                        key={assignment.id}
                        title={test.title}
                        skill={test.category}
                        difficulty={test.difficulty}
                        estimatedTime={`${test.estimated_time} mins`}
                        matchScore="Assigned Required"
                        onClick={() => setActiveExamId(test)}
                      />
                    );
                  })
                ) : (
                  <div className="db-empty-state" style={{ padding: '2rem' }}>
                    <p>No mandatory proctored exams assigned to you currently.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ai-interview' ? (
             <AIInterviewFlow onExit={() => { setActiveTab('dashboard'); window.dispatchEvent(new CustomEvent('refreshDashboard')); }} />
          ) : activeTab === 'results' ? (
            <div className="results-view fade-in" style={{ padding: '1rem' }}>
              {viewingRoadmap ? (
                <RoadmapDetailPage
                  result={viewingRoadmap}
                  onBack={() => setViewingRoadmap(null)}
                />
              ) : viewingResult ? (
                <ResultsPage
                  result={viewingResult}
                  onBack={() => setViewingResult(null)}
                />
              ) : (
                <div className="results-dashboard-list">
                  <div className="results-list-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.04em' }}>Performance History</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.25rem' }}>Review your growth markers across all modules</p>
                    </div>
                    <div className="results-meta-pill" style={{ background: 'white', border: '1px solid var(--border-color)', padding: '0.6rem 1.25rem', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                       <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{activities.length}</span> <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Assessments</span>
                    </div>
                  </div>

                  {activities.length === 0 && !isLoading ? (
                    <div className="empty-results-fallback" style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                       <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔍</div>
                       <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1b4b' }}>No assessment history found</h3>
                       <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 2rem' }}>Complete any test or interview to populate your personal results dashboard.</p>
                       <Button onClick={() => setActiveTab('skill-tests')}>Launch First Assessment</Button>
                    </div>
                  ) : (
                    <div className="results-grid-v2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                      {activities.map((res) => {
                        const uniqueKey = res.isLocal ? `local_${res.id}` : `backend_${res.id}`;
                        return (
                          <div 
                            key={uniqueKey} 
                            className="result-card-premium" 
                            style={{ 
                              background: 'white', 
                              padding: '2rem', 
                              borderRadius: '24px', 
                              border: '1px solid var(--border-color)', 
                              boxShadow: '0 10px 30px rgba(0,0,0,0.02)', 
                            }}
                            onClick={() => setViewingResult(res.isLocal ? res : res.fullData)}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 0.9rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {res.testType || 'Skill Assessment'}
                              </div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{res.date}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                              <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                 <span style={{ fontWeight: 900, fontSize: '1.4rem', color: res.score >= 80 ? '#10b981' : res.score >= 60 ? '#f59e0b' : '#ef4444' }}>{res.score}%</span>
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{res.title || res.testType}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: res.score >= 80 ? '#10b981' : res.score >= 60 ? '#f59e0b' : '#ef4444' }}></div>
                                   <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>{res.status}</span>
                                </div>
                              </div>
                            </div>

                             <Button fullWidth onClick={(e) => { e.stopPropagation(); setViewingResult(res.isLocal ? res : res.fullData); }} variant="secondary">
                                View Detailed Report ➔
                             </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'learning-roadmap' ? (
            <div className="learning-roadmap-view fade-in">
              <div className="roadmap-page-header" style={{ 
                textAlign: 'center', 
                marginBottom: '3rem',
                padding: '1rem 0'
              }}>
                <h2 style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 900, 
                  color: '#1a1b4b',
                  letterSpacing: '-0.04em',
                  marginBottom: '1rem'
                }}>Your Personalized Learning Path</h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem'
                }}>
                  <p style={{ 
                    fontSize: '1.2rem', 
                    color: '#64748b',
                    margin: 0
                  }}>A structured 4-week roadmap to bridge your skill gaps</p>
                  <span style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#6366f1',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '100px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}>✨ Generated by AI</span>
                </div>
              </div>
               {viewingRoadmap ? (
                 <RoadmapDetailPage 
                   result={viewingRoadmap}
                   onBack={() => setViewingRoadmap(null)}
                 />
               ) : (
                 <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                   {userRoadmaps.length === 0 && !isLoading ? (
                     <div className="db-empty-state" style={{ marginTop: '2rem' }}>
                       <span>🗺️</span>
                       <p>No learning roadmaps found. Complete a Skill Test or AI Interview to generate your personalized learning path!</p>
                       <div className="db-welcome-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                         <button className="db-btn-primary" onClick={() => setActiveTab('skill-tests')}>🚀 Start Skill Test</button>
                       </div>
                     </div>
                   ) : (
                    <div className="results-grid-v2">
                       {userRoadmaps.map((item) => {
                         const uniqueKey = `roadmap_${item.id}`;
                         return (
                           <div 
                             key={uniqueKey} 
                             className="result-card-premium" 
                             style={{ 
                               background: 'white', 
                               padding: '2rem', 
                               borderRadius: '24px', 
                               border: '1px solid var(--border-color)', 
                               boxShadow: '0 10px 30px rgba(0,0,0,0.02)', 
                             }} 
                             onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                             onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                           >
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                               <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 0.9rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                 {item.testType}
                               </div>
                               <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{item.date}</span>
                             </div>

                             <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                               <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                  <span style={{ fontWeight: 900, fontSize: '1.4rem', color: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444' }}>{item.score}%</span>
                               </div>
                               <div>
                                 <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{item.title}</h4>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444' }}></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>{item.status}</span>
                                 </div>
                               </div>
                             </div>

                              <Button fullWidth onClick={(e) => { e.stopPropagation(); setViewingRoadmap(item.fullData || item); }} variant="primary">
                                 View Roadmap ➔
                              </Button>
                           </div>
                         );
                       })}
                     </div>
                   )}
                 </div>
               )}
            </div>
          ) : activeTab === 'skill-gap-analyzer' ? (
            <div className="skill-gap-analyzer-view fade-in">
              <div className="roadmap-page-header" style={{ 
                textAlign: 'center', 
                marginBottom: '3rem',
                padding: '1rem 0'
              }}>
                <h2 style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 900, 
                  color: '#1a1b4b',
                  letterSpacing: '-0.04em',
                  marginBottom: '1rem'
                }}>Skill Gap Analysis History</h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem'
                }}>
                  <p style={{ 
                    fontSize: '1.2rem', 
                    color: '#64748b',
                    margin: 0
                  }}>Comprehensive breakdown of your skill proficiencies based on past tests</p>
                </div>
              </div>
               {viewingSkillGap ? (
                 <div className="fade-in skill-gap-embedded-wrapper" style={{ margin: '-2rem', padding: '2rem', height: '100%', overflowY: 'auto' }}>
                   <div style={{ marginBottom: '2rem' }}>
                    <Button onClick={() => setViewingSkillGap(null)} variant="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      ← Back to Dashboard
                    </Button>
                   </div>
                   <SkillGapAnalysis 
                     embedded={true} 
                     preloadedAnalysis={viewingSkillGap}
                   />
                 </div>
               ) : (
                 <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                   {userRoadmaps.length === 0 && !isLoading ? (
                     <div className="db-empty-state" style={{ marginTop: '2rem' }}>
                       <span>📊</span>
                       <p>No skill gap analyses found. Complete a Skill Test or AI Interview to generate an analysis!</p>
                       <div className="db-welcome-actions" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                         <button className="db-btn-primary" onClick={() => setActiveTab('skill-tests')}>🚀 Start Skill Test</button>
                       </div>
                     </div>
                   ) : (
                    <div className="results-grid-v2">
                       {userRoadmaps.map((item) => {
                         const uniqueKey = `skillgap_${item.id}`;
                         return (
                           <div 
                             key={uniqueKey} 
                             className="result-card-premium" 
                             style={{ 
                               background: 'white', 
                               padding: '2rem', 
                               borderRadius: '24px', 
                               border: '1px solid var(--border-color)', 
                               boxShadow: '0 10px 30px rgba(0,0,0,0.02)', 
                             }} 
                             onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                             onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                           >
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                               <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 0.9rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                 {item.testType}
                               </div>
                               <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{item.date}</span>
                             </div>

                             <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                               <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                  <span style={{ fontWeight: 900, fontSize: '1.4rem', color: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444' }}>{item.score}%</span>
                               </div>
                               <div>
                                 <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{item.title.replace(' Roadmap', ' Analysis')}</h4>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444' }}></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>{item.status}</span>
                                 </div>
                               </div>
                             </div>

                              <Button fullWidth onClick={(e) => { e.stopPropagation(); setViewingSkillGap(item.fullData || item); }} variant="primary">
                                 View Skill Gap ➔
                              </Button>
                           </div>
                         );
                       })}
                     </div>
                   )}
                 </div>
               )}
            </div>
          ) : activeTab === 'recommendations' ? (
            <div className="recommendations-view fade-in">
              <div className="page-header">
                <h2>Personalized Skill Path</h2>
              </div>
              <div className="recommendations-list">
                <RecommendationCard
                  title="System Design Fundamentals"
                  skill="System Design"
                  difficulty="Intermediate"
                  estimatedTime="45 mins"
                  matchScore="98"
                />
                <RecommendationCard
                  title="Node.js Error Handling"
                  skill="Node.js"
                  difficulty="Beginner"
                  estimatedTime="30 mins"
                  matchScore="85"
                />
                <RecommendationCard
                  title="Cloud Architecture Patterns"
                  skill="AWS/GCP"
                  difficulty="Advanced"
                  estimatedTime="120 mins"
                  matchScore="72"
                />
              </div>
            </div>
          ) : activeTab === 'career-engine' ? (
            <div className="career-hub-view fade-in">
              <div className="page-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e1b4b' }}>AI Career Intelligence</h2>
                <p style={{ fontSize: '1.1rem', color: '#64748b' }}>Strategic role matching based on your live performance and skill matrix.</p>
              </div>

              {viewingCareerIntelligence ? (
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  <div style={{ marginBottom: '2rem' }}>
                    <Button onClick={() => setViewingCareerIntelligence(null)} variant="secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      ← Back to Dashboard
                    </Button>
                  </div>
                  <CareerRecommendation 
                    userSkills={
                      typeof viewingCareerIntelligence.skill_breakdown === 'string' 
                        ? JSON.parse(viewingCareerIntelligence.skill_breakdown)
                        : Object.entries(viewingCareerIntelligence.skill_breakdown || {}).map(([skill, score]) => ({ skill, score }))
                    } 
                    profileSkills={user?.profile?.skills || []}
                    onExplore={handleExploreRoadmap} 
                  />
                </div>
              ) : (
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                   {userRoadmaps.length === 0 && !isLoading ? (
                     <div className="db-empty-state" style={{ 
                       padding: '4rem 2rem', 
                       background: 'var(--surface-glass)', 
                       borderRadius: '24px',
                       border: '1px solid var(--border-color)',
                       textAlign: 'center'
                     }}>
                       <div className="empty-icon" style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎯</div>
                       <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem' }}>Unlock Your AI Career Roadmap</h3>
                       <p style={{ maxWidth: '500px', margin: '0 auto 2rem', color: '#64748b', fontSize: '1.1rem' }}>
                         Complete your first Skill Test or AI Interview to generate a professional career matching report and salary prediction.
                       </p>
                       <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                         <button className="db-btn-primary" onClick={() => setActiveTab('skill-tests')}>🚀 Start Your First Test</button>
                         <button className="db-btn-ghost" onClick={() => setActiveTab('ai-interview')}>🎤 AI Interview</button>
                       </div>
                     </div>
                   ) : (
                    <div className="results-grid-v2">
                       {userRoadmaps.map((item) => {
                         const uniqueKey = `career_${item.id}`;
                         return (
                           <div 
                             key={uniqueKey} 
                             className="result-card-premium" 
                             style={{ 
                               background: 'white', 
                               padding: '2rem', 
                               borderRadius: '24px', 
                               border: '1px solid var(--border-color)', 
                               boxShadow: '0 10px 30px rgba(0,0,0,0.02)', 
                             }} 
                             onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                             onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                           >
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                               <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.4rem 0.9rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                 {item.testType}
                               </div>
                               <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{item.date}</span>
                             </div>

                             <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                               <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                                  <span style={{ fontWeight: 900, fontSize: '1.4rem', color: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444' }}>{item.score}%</span>
                               </div>
                               <div>
                                 <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>Career Readiness Analysis</h4>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444' }}></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>{item.status}</span>
                                 </div>
                               </div>
                             </div>

                              <Button fullWidth onClick={(e) => { e.stopPropagation(); setViewingCareerIntelligence(item.fullData || item); }} variant="primary">
                                 Analyze Career Path ➔
                              </Button>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>
              )}
             </div>
           ) : activeTab === 'proctored-exams' ? (
             <div className="db-tab-content">
               <div className="premium-header-v2" style={{ padding: '2rem 3rem', background: 'linear-gradient(135deg, #fff, #fee2e2)' }}>
                 <div className="premium-header-main">
                    <ShieldCheck size={32} color="#ef4444" />
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Proctored Exams</h2>
                      <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600, marginTop: '0.2rem' }}>
                        Required multiple-choice assessments with AI monitoring
                      </p>
                    </div>
                 </div>
               </div>
               
               <div style={{ padding: '2.5rem 3rem' }}>
                 {!assignedTests || assignedTests.filter(a => a.assessment_detail?.assessment_type === 'mcq').length === 0 ? (
                   <div className="empty-state-v2">
                     <h3>No Exams Assigned</h3>
                     <p>You have no pending proctored MCQ assessments at this time.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                     {assignedTests
                       .filter(a => a.assessment_detail?.assessment_type === 'mcq')
                       .map(assignment => {
                         const test = assignment.assessment_detail;
                         return (
                            <div key={assignment.id} className="test-card" style={{ border: '2px solid #fee2e2', background: '#fff' }}>
                               <div className="test-card-header">
                                  <span className="test-category" style={{ background: '#ef4444', color: 'white' }}>PROCTORED EXAM</span>
                                   <div className="test-difficulty" style={{ color: '#ef4444' }}>
                                      {test.category}
                                   </div>
                               </div>
                               <h3 className="test-title">{test.title}</h3>
                               <p className="test-description">{test.description || `Required mandatory evaluation.`}</p>
                               <div className="test-meta">
                                  <div className="meta-item"><Clock size={15} /> {test.estimated_time || 30} mins</div>
                                  <div className="meta-item"><FileSearch size={15} /> {test.questions?.length || 0} questions</div>
                               </div>
                               <div className="test-card-footer" style={{ marginTop: '1.5rem' }}>
                                  <button className="db-btn-primary" style={{ width: '100%', background: '#ef4444', border: 'none' }} onClick={() => setActiveExamId(test)}>
                                     Start Proctored Exam
                                  </button>
                                </div>
                            </div>
                         );
                       })}
                   </div>
                 )}
               </div>
             </div>
           ) : activeTab === 'ai-proctored-interview' ? (
             <div className="db-tab-content">
               <div className="premium-header-v2" style={{ padding: '2rem 3rem', background: 'linear-gradient(135deg, #fff, #f5f3ff)' }}>
                 <div className="premium-header-main">
                    <Sparkles size={32} color="#8b5cf6" />
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>AI Proctored Interview</h2>
                      <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600, marginTop: '0.2rem' }}>
                        Interactive AI-driven interview sessions
                      </p>
                    </div>
                 </div>
               </div>

               <div style={{ padding: '2.5rem 3rem' }}>
                 {!assignedTests || assignedTests.filter(a => a.assessment_detail?.assessment_type === 'interview').length === 0 ? (
                   <div className="empty-state-v2">
                     <h3>No Interviews Assigned</h3>
                     <p>You have no pending AI proctored interview sessions at this time.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                     {assignedTests
                       .filter(a => a.assessment_detail?.assessment_type === 'interview')
                       .map(assignment => {
                         const test = assignment.assessment_detail;
                         return (
                            <div key={assignment.id} className="test-card" style={{ border: '2px solid #ddd6fe', background: '#fff' }}>
                               <div className="test-card-header">
                                  <span className="test-category" style={{ background: '#8b5cf6', color: 'white' }}>AI INTERVIEW</span>
                                   <div className="test-difficulty" style={{ color: '#7c3aed' }}>
                                      {test.interview_category === 'hr' ? 'HR Interview' : 'Technical Interview'}
                                   </div>
                               </div>
                               <h3 className="test-title">{test.title}</h3>
                               <p className="test-description">{test.description || `AI automated interview session.`}</p>
                               <div className="test-meta">
                                  <div className="meta-item"><Clock size={15} /> {test.estimated_time || 15} mins</div>
                                  <div className="meta-item"><ShieldCheck size={15} /> Fully Proctored</div>
                               </div>
                               <div className="test-card-footer" style={{ marginTop: '1.5rem' }}>
                                  <button 
                                     className="db-btn-primary" 
                                     style={{ width: '100%', background: '#8b5cf6', border: 'none' }}
                                     onClick={() => setActiveExamId({ ...test, type: 'assigned-interview', assignmentId: assignment.id })}
                                  >
                                     Start AI Interview
                                  </button>
                               </div>
                            </div>
                         );
                       })}
                   </div>
                 )}
               </div>
             </div>
           ) : activeTab === 'ats-checker' ? (
            <ATSResumeChecker />
          ) : activeTab === 'confidence-check' ? (
            <AIConfidenceAnalyzer />
          ) : activeTab === 'settings' ? (
            <ProfileSettings onTabChange={setActiveTab} />
          ) : (
            <div className="placeholder-view">
              <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View</h2>
              <p>ID: [{activeTab}] - Coming soon: The {activeTab} section is being finalized.</p>
              <button
                className="mt-4"
                style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setActiveTab('dashboard')}
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </main>
        </div>
      
      {/* Conditionally float the test over everything else */}
      {activeExamId && activeExamId.type === 'assigned-interview' ? (
        <AIInterviewFlow 
          assignedData={activeExamId}
          onExit={() => { 
            setActiveExamId(null); 
            window.dispatchEvent(new CustomEvent('refreshDashboard')); 
            
            // Check if completing an invitation
            const activeToken = sessionStorage.getItem('invite_token');
            if (activeToken) {
              fetch(`${API_URL}/invitations/complete/${activeToken}/`, { method: 'POST' })
                .then(() => sessionStorage.removeItem('invite_token'))
                .catch(err => console.error("Could not complete invitation", err));
            }
          }}
        />
      ) : activeExamId ? (
        <AIProctoringExam
          examData={activeExamId}
          onExit={() => { 
            setActiveExamId(null); 
            window.dispatchEvent(new CustomEvent('refreshDashboard')); 
          }}
          onComplete={(result) => {
            setActiveExamId(null);
            setViewingResult(result);
            setActiveTab('results');
            window.dispatchEvent(new CustomEvent('refreshDashboard'));
            
            // Check if completing an invitation
            const activeToken = sessionStorage.getItem('active_invitation');
            if (activeToken) {
              fetch(`${API_URL}/invitations/complete/${activeToken}/`, { method: 'POST' })
                .then(() => sessionStorage.removeItem('active_invitation'))
                .catch(err => console.error("Could not complete invitation", err));
            }
          }}
        />
      ) : null}
      {activeTab === 'dashboard' && !activeExamId && user?.role !== 'recruiter' && <AIMentorChat />}
      <NotificationToast />
    </div>
  );
};

export default Dashboard;
