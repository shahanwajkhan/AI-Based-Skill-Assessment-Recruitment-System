import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  BarChart3, 
  Plus, 
  Search, 
  MoreVertical,
  Trash2,
  MapPin,
  School,
  FileText,
  Layout,
  ChevronRight,
  UserPlus,
  Clock,
  Sparkles,
  TrendingUp,
  Target,
  Download,
  Code,
  Bot,
  ShieldCheck,
  Mail,
  Link2,
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import StatCard from '../../components/StatCard/StatCard';
import Chart from '../../components/Chart/Chart';
import ActivityFeed from '../../components/ActivityFeed/ActivityFeed';
import { API_URL, API_BASE_URL } from '../../utils/api';
import './RecruiterDashboard.css';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';


const RecruiterDashboard = ({ user, globalActiveTab }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Sync with global TopBar
  useEffect(() => {
    if (globalActiveTab) {
      if (globalActiveTab === 'dashboard') setActiveTab('overview');
      else if (globalActiveTab === 'view-assessments' || globalActiveTab === 'create-assessment') setActiveTab('assessments');
      else if (globalActiveTab === 'analytics') setActiveTab('overview'); // For now
      else setActiveTab(globalActiveTab);
    }
  }, [globalActiveTab]);

  // Listen for invitation refresh events from TopBar/InviteModal
  useEffect(() => {
    const handleRefresh = () => {
      fetchInvitations();
    };
    window.addEventListener('refreshInvitations', handleRefresh);
    return () => window.removeEventListener('refreshInvitations', handleRefresh);
  }, []);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [candidateDetail, setCandidateDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoShortlisting, setIsAutoShortlisting] = useState(false);
  const [shortlistRequirements, setShortlistRequirements] = useState('');
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  
  // New States
  const [tailoredQuestions, setTailoredQuestions] = useState(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [atsScore, setAtsScore] = useState(null);
  const [isGeneratingAts, setIsGeneratingAts] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState({ show: false, candidateId: null, assessmentId: null, targetId: null });
  const [createAssessmentModal, setCreateAssessmentModal] = useState(false);
  
  const openInviteModal = () => window.dispatchEvent(new Event('openInviteModal'));

  const [newAssessment, setNewAssessment] = useState({ 
    title: '', 
    assessment_type: 'mcq',
    interview_category: 'technical',
    category: 'Technical', 
    difficulty: 'Intermediate', 
    time: 30,
    proctoring_rules: [
      { icon: "🛡️", text: "AI Camera & Face Verification", enabled: true },
      { icon: "💻", text: "Real-time Screen Monitoring", enabled: true },
      { icon: "🚫", text: "Tab Switching Prevention", enabled: true }
    ]
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [assignmentsHistory, setAssignmentsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Invitation States
  const [invitations, setInvitations] = useState([]);
  const [inviteStatusFilter, setInviteStatusFilter] = useState('all');

  // --- Data Fetching Functions ---
  async function fetchInvitations() {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/invitations/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setInvitations(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  }

  async function fetchAssignmentsHistory() {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/assignments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAssignmentsHistory(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch assignment history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }



  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/recruiter/dashboard-analytics/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch recruiter analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCandidates = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/recruiter/candidates/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setCandidates(result);
        }
      } catch (error) {
        console.error('Failed to fetch candidates:', error);
      }
    };

    const fetchShortlisted = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/recruiter/shortlisted/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setShortlisted(result);
        }
      } catch (error) {
        console.error('Failed to fetch shortlisted candidates:', error);
      }
    };

    const fetchAssessments = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/recruiter/assessments/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setAssessments(result);
        }
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
      }
    };

    if (activeTab === 'overview' || activeTab === 'candidates' || activeTab === 'shortlisted') {
      fetchAnalytics();
      fetchCandidates();
      fetchShortlisted();
      fetchInvitations();
    }
    
    if (activeTab === 'assessments') fetchAssessments();
    if (activeTab === 'history') fetchAssignmentsHistory();
  }, [activeTab]);



  useEffect(() => {
    const fetchCandidateDetail = async () => {
      if (!selectedCandidateId) return;
      
      // Clear previous data and set loading to prevent rendering stale data during new fetch
      setCandidateDetail(null);
      setDetailLoading(true);
      setTailoredQuestions(null);
      setAtsScore(null);
      
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/recruiter/candidates/${selectedCandidateId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          setCandidateDetail(result);
        } else {
          console.error("Failed to fetch candidate details");
          // Fallback to local data to ensure overlay opens even on API failure
          setCandidateDetail({
            profile: { 
              first_name: 'Candidate', 
              last_name: '', 
              username: 'user',
              profile: { bio: '', skills: [], education: '', experience: '', projects: '' }
            },
            stats: { avg_score: 0, top_skill: 'N/A', weakest_skill: 'N/A', skill_level: 'Beginner' },
            intelligence: { recommendation: 'Evaluation Pending', reason: 'Unable to fetch analysis.', insights: [], scorecard: [] },
            assessments: [],
            interviews: [],
            progress: { history: [], skill_performance: [], mcq_accuracy: { correct: 0, incorrect: 0 }, coding_performance: [] },
            coding_submissions: []
          });
        }
      } catch (error) {
        console.error("Error fetching details:", error);
        setCandidateDetail({
            profile: { 
              first_name: 'Candidate', 
              last_name: 'Error', 
              username: 'error',
              profile: { bio: 'Error loading profile.', skills: [], education: '', experience: '', projects: '' }
            },
            stats: { avg_score: 0, top_skill: 'N/A', weakest_skill: 'N/A', skill_level: 'Beginner' },
            intelligence: null,
            assessments: [],
            interviews: [],
            progress: { history: [], skill_performance: [], mcq_accuracy: { correct: 0, incorrect: 0 }, coding_performance: [] },
            coding_submissions: []
        });
      } finally {
        setDetailLoading(false);
      }
    };

    fetchCandidateDetail();
  }, [selectedCandidateId]);

  const handleDownloadCV = async (candidateId, filename) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/candidates/${candidateId}/resume/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Resume not found');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'candidate_cv.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('CV download failed:', err);
      alert('Could not download CV. The file may not exist on the server.');
    }
  };

  const fetchAtsScore = async (candidateId) => {
    setIsGeneratingAts(true);
    setAtsScore(null);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/candidates/${candidateId}/ats/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setAtsScore(data);
      } else {
        alert(data.error || 'Failed to generate ATS score.');
      }
    } catch (err) {
      console.error('ATS generation failed:', err);
      alert('Could not verify ATS score.');
    } finally {
      setIsGeneratingAts(false);
    }
  };

  const handleShortlistToggle = async (candidateId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/candidates/${candidateId}/shortlist/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        // Refresh shortlisted list
        const res = await fetch(`${API_URL}/recruiter/shortlisted/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setShortlisted(result);
        }
      }
    } catch (error) {
      console.error('Failed to toggle shortlist:', error);
    }
  };

  const handleAutoShortlist = async () => {
    if (!shortlistRequirements) return;
    setIsAutoShortlisting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/auto-shortlist/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requirements: shortlistRequirements })
      });
      if (response.ok) {
        // Refresh shortlisted list
        const res = await fetch(`${API_URL}/recruiter/shortlisted/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setShortlisted(result);
          setShortlisted(result);
          setActiveTab('shortlisted');
          setShortlistRequirements('');
        }
      }
    } catch (error) {
      console.error('Failed to auto-shortlist:', error);
    } finally {
      setIsAutoShortlisting(false);
    }
  };

  const toggleCandidateComparison = (id) => {
    setSelectedForComparison(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const fetchComparison = async () => {
    if (selectedForComparison.length < 2) return;
    setIsComparing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/compare/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: selectedForComparison })
      });
      if (response.ok) {
        const result = await response.json();
        setComparisonResults(result);
      }
    } finally {
      setIsComparing(false);
    }
  };

  const fetchTailoredQuestions = async (cid) => {
    setIsGeneratingQuestions(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/candidates/${cid}/tailored-questions/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ job_role: 'Software Engineer' }) // Or get from input
      });
      if (response.ok) {
        const result = await response.json();
        setTailoredQuestions(result);
      }
    } catch (error) {
      console.error('Failed to generate tailored questions:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleAssignTest = async (candId, testId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/assignments/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          candidate: candId, 
          assessment: testId 
        })
      });
      if (response.ok) {
        alert('Test successfully assigned!');
        setAssignmentModal({ show: false, candidateId: null, assessmentId: null, targetId: null });
        fetchAssignmentsHistory(); // Refresh history
      }
    } catch (error) {
       console.error('Failed to assign test:', error);
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assessment? All associated assignments will also be deleted.")) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/recruiter/assessments/${id}/`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setAssessments(prev => prev.filter(a => a.id !== id));
      } else {
        alert('Failed to delete assessment');
      }
    } catch (error) {
      console.error('Failed to delete assessment:', error);
    }
  };

  const handleDownloadReport = async () => {
    const element = document.querySelector('.profile-overlay-content');
    if (!element) return;
    
    const downloadBtn = document.querySelector('.btn-icon-shortlist.report');
    if (downloadBtn) downloadBtn.innerText = 'Generating...';

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${candidateDetail.profile.username}_report.pdf`);
    } catch (error) {
       console.error('PDF generation failed:', error);
    } finally {
        if (downloadBtn) downloadBtn.innerText = 'Download Report';
    }
  };



  const handleCreateAssessment = async () => {
    if (!newAssessment.title || !newAssessment.category) {
      alert('Please fill in the title and select a category.');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const token = localStorage.getItem('access_token');
      
      let generatedQuestions = [];
      if (newAssessment.assessment_type === 'mcq') {
        // Step 1: Generate AI MCQs only for MCQ mode
        const aiResponse = await fetch(`${API_URL}/recruiter/assessments/ai-generate/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            category: newAssessment.category,
            difficulty: newAssessment.difficulty
          })
        });

        if (!aiResponse.ok) {
          const errData = await aiResponse.json();
          throw new Error(errData.error || "AI Generation failed");
        }

        const aiResult = await aiResponse.json();
        generatedQuestions = aiResult.questions;
      }

      // Step 2: Publish Assessment
      const response = await fetch(`${API_URL}/recruiter/assessments/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
         body: JSON.stringify({
           title: newAssessment.title,
           assessment_type: newAssessment.assessment_type,
           interview_category: newAssessment.assessment_type === 'interview' ? newAssessment.interview_category : null,
           category: newAssessment.category,
           difficulty: newAssessment.difficulty,
           estimated_time: parseInt(newAssessment.time) || (newAssessment.assessment_type === 'interview' ? 15 : 30),
           questions: generatedQuestions,
           proctoring_rules: newAssessment.proctoring_rules.filter(r => r.enabled).map(r => ({ icon: r.icon, text: r.text }))
        })
      });

      if (response.ok) {
        const refreshed = await fetch(`${API_URL}/recruiter/assessments/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (refreshed.ok) setAssessments(await refreshed.json());
        
        setCreateAssessmentModal(false);
        setNewAssessment({ 
          title: '', 
          assessment_type: 'mcq',
          interview_category: 'technical',
          category: 'Technical', 
          difficulty: 'Intermediate', 
          time: 30,
          proctoring_rules: [
            { icon: "🛡️", text: "AI Camera & Face Verification", enabled: true },
            { icon: "💻", text: "Real-time Screen Monitoring", enabled: true },
            { icon: "🚫", text: "Tab Switching Prevention", enabled: true }
          ]
        });
        alert(newAssessment.assessment_type === 'mcq' 
          ? 'Assessment published successfully with 30 AI-generated questions!' 
          : 'Proctored AI Interview created successfully!');
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save assessment");
      }
    } catch (error) {
       console.error('Unified publishing flow failed:', error);
       alert(`Workflow Error: ${error.message}`);
    } finally {
      setIsGeneratingAI(false);
    }
  };



  const stats = [
    {
      id: 1,
      title: 'Total Candidates',
      value: data?.metrics?.total_candidates?.toString() || '0',
      trend: 'up',
      trendValue: 'Live',
      trendLabel: 'Platform Wide',
      color: 'primary',
      icon: <Users size={22} />
    },
    {
      id: 2,
      title: 'Assessments Taken',
      value: data?.metrics?.total_assessments?.toString() || '0',
      trend: 'up',
      trendValue: 'Verified',
      trendLabel: 'Total results',
      color: 'success',
      icon: <Briefcase size={22} />
    },
    {
      id: 3,
      title: 'Average Score',
      value: `${data?.metrics?.avg_score || 0}%`,
      trend: 'neutral',
      trendValue: 'Aggregated',
      trendLabel: 'AI + Tests',
      color: 'info',
      icon: <Sparkles size={22} />
    },
    {
      id: 4,
      title: 'Active Interviews',
      value: data?.metrics?.active_interviews?.toString() || '0',
      trend: 'up',
      trendValue: 'Real-time',
      trendLabel: 'Current sessions',
      color: 'warning',
      icon: <Clock size={22} />
    }
  ];

  const pipelineData = data?.pipeline || [];
  const activityData = data?.activity || [];
  
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
      }}
      className="recruiter-dashboard-content"
    >
      {/* ─── TAB CONTENT ─── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="recruiter-tab-container"
          >
            {/* ─── RECRUITER HERO BANNER (Only on Overview) ─── */}
            <motion.div 
              className="recruiter-hero-banner"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
              }}
            >
              <div className="hero-content-left">
                <span className="hero-tagline">✨ Welcome Back, {user?.first_name || 'Hiring Manager'}</span>
                <h1>Your talent pipeline is <br/> thriving today.</h1>
                <p>Monitor candidate performance, review AI interview insights, and shortlist top talent with our intelligence engine.</p>
                
                <div className="hero-status-pills">
                  <div className="status-pill-mini">
                    <span className="dot online" />
                    AI Evaluator Active
                  </div>
                  <div className="status-pill-mini">
                    <span className="dot active" />
                    Pipeline Synced
                  </div>
                </div>
              </div>

              <div className="hero-illustration-container">
                <motion.img 
                  src="/recruiter_hero_illustration.png" 
                  alt="Recruiter Illustration" 
                  className="hero-illustration"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="illustration-glow recruiter-glow" />
              </div>
            </motion.div>

            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="db-header" 
              style={{ marginBottom: '2.5rem' }}
            >
              <div className="db-welcome">
                <div className="db-badge-premium">
                  <Sparkles size={14} />
                  <span>AI Powered System</span>
                </div>
                <h2 className="command-center-title">Recruiter Command Center</h2>
                <p className="command-center-subtitle">Your intelligent talent pipeline is ready for optimization.</p>
              </div>
            </motion.div>

            {/* ─── STATS GRID ─── */}
            <div className="recruiter-stats-row">
              {stats.map(stat => (
                <StatCard key={stat.id} {...stat} />
              ))}
            </div>

            {/* ─── INTELLIGENCE HUB ─── */}
            <div className="recruiter-intelligence-hub">
              <div className="db-section-title">
                <h3>✨ Hiring Intelligence Hub</h3>
                <p>AI-driven tools to accelerate your recruitment</p>
              </div>
              <div className="intelligence-grid">
                <div className="db-analysis-hub-card recruiter-card" onClick={() => setActiveTab('candidates')}>
                  <div className="hub-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                    <Users size={24} />
                  </div>
                  <div className="hub-card-content">
                    <h4>Talent Discovery</h4>
                    <p>AI-powered search across 50k+ qualified candidates with match scoring.</p>
                    <div className="hub-card-action">Launch Search ➔</div>
                  </div>
                </div>

                <div className="db-analysis-hub-card recruiter-card">
                  <div className="hub-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <Sparkles size={24} />
                  </div>
                  <div className="hub-card-content">
                    <h4>AI Filtering</h4>
                    <p>Automatically rank applicants based on skill gap and interview performance.</p>
                    <div className="hub-card-action">View Top Matches ➔</div>
                  </div>
                </div>

                <div className="db-analysis-hub-card recruiter-card" onClick={() => alert('Calendar Hub feature is coming soon!')}>
                  <div className="hub-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <Calendar size={24} />
                  </div>
                  <div className="hub-card-content">
                    <h4>Auto-Scheduling</h4>
                    <p>Hassle-free interview arrangements with automated coordination.</p>
                    <div className="hub-card-action">Manage Calendar ➔</div>
                  </div>
                </div>


              </div>
            </div>

            {/* ─── INVITATIONS TRACKING  ─── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3.5rem' }}>
              <div className="db-section-title">
                <h3>📨 Sent Invitations Hub</h3>
                <p>Track your shared test links and deadlines</p>
              </div>
              <button 
                className="create-job-btn" 
                style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                onClick={openInviteModal}
              >
                <UserPlus size={16} />
                <span>New Invite</span>
              </button>
            </div>
            
            <div className="glass-card-premium" style={{ marginTop: '1.25rem', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                 {['all', 'pending', 'opened', 'completed', 'expired'].map(status => (
                   <span 
                     key={status} 
                     onClick={() => setInviteStatusFilter(status)}
                     style={{ padding: '0.4rem 1rem', background: inviteStatusFilter === status ? '#6366f1' : 'transparent', color: inviteStatusFilter === status ? 'white' : '#64748b', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                   >
                     {status.charAt(0).toUpperCase() + status.slice(1)}
                   </span>
                 ))}

              </div>
              <div style={{ padding: '0', overflowX: 'auto' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                       <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fcfdff' }}>
                          <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>CANDIDATE</th>
                          <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>TEST TYPE</th>
                          <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                          <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>DEADLINE</th>
                       </tr>
                    </thead>
                    <tbody>
                       {Array.isArray(invitations) && invitations.length === 0 ? (
                         <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No invitations sent yet. Click "New Invite" to begin.</td></tr>
                       ) : (
                         invitations.filter(i => inviteStatusFilter === 'all' || i.status === inviteStatusFilter).map(inv => (
                           <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                              <td style={{ padding: '1rem 1.5rem' }}>
                                <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.95rem' }}>{inv.candidate_name || 'Anonymous Applicant'}</strong>
                                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{inv.candidate_email}</span>
                              </td>
                              <td style={{ padding: '1rem 1.5rem', color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
                                {inv.test_type === 'ai_skill' ? 'AI Skill Test' : inv.test_type === 'ai_interview' ? 'AI Interview' : inv.test_type === 'coding' ? 'Coding Test' : 'Confidence Check'}
                              </td>
                              <td style={{ padding: '1rem 1.5rem' }}>
                                 <span style={{ 
                                   display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.35rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                                   ...({
                                     'pending': { background: '#f1f5f9', color: '#64748b' },
                                     'opened': { background: '#fffbeb', color: '#d97706' },
                                     'completed': { background: '#ecfdf5', color: '#059669' },
                                     'expired': { background: '#fef2f2', color: '#dc2626' }
                                   })[inv.status]
                                 }}>
                                    {inv.status === 'completed' && <CheckCircle2 size={12}/>}
                                    {inv.status === 'expired' && <AlertCircle size={12}/>}
                                    {inv.status.toUpperCase()}
                                 </span>
                              </td>
                              <td style={{ padding: '1rem 1.5rem', textAlign: 'right', color: '#64748b', fontSize: '0.85rem' }}>
                                 {inv.deadline ? new Date(inv.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'No strict deadline'}
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
            </div>

            {/* ─── MAIN HUB LAYOUT ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', marginTop: '3rem' }}>
              <div className="db-left-col">
                <div className="glass-card-premium" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
                  <div className="db-section-title" style={{ marginBottom: '2rem' }}>
                    <h3>📈 Hiring Pipeline Analytics</h3>
                    <div className="db-filters-pills">
                      {pipelineData.map((item, idx) => (
                        <div key={idx} className="db-legend-item">
                          <span className={`dot ${item.colorClass}`}></span>
                          <span className="legend-label">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: '340px' }}>
                    <Chart 
                      type="bar" 
                      data={pipelineData} 
                      title="Distribution by Score" 
                      subtitle="Live performance metrics of the candidate pool"
                    />
                  </div>
                </div>

                <div className="db-section-title" style={{ marginTop: '5rem', marginBottom: '1.5rem' }}>
                  <div className="title-with-badge">
                    <h3>🆕 Recently Joined Candidates</h3>
                    <span className="premium-badge-sm">LIVE FEED</span>
                  </div>
                  <span className="db-view-all-modern" onClick={() => setActiveTab('candidates')}>
                    Explore All Talent <ChevronRight size={14} />
                  </span>
                </div>

                <div className="new-talent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                  {Array.isArray(candidates) && candidates.length > 0 ? (
                    candidates.slice(0, 4).map((c) => (
                      <div 
                        key={c.id} 
                        className="glass-card-premium candidate-hub-card" 
                        onClick={() => setSelectedCandidateId(c.id)}
                      >
                        <div className="candidate-card-top">
                          <div className="candidate-avatar-sm">
                            {c.first_name?.charAt(0) || c.username?.charAt(0)}
                          </div>
                          <div className="candidate-score-ring">
                            <span className="score-val">{Math.round(c.avg_score)}</span>
                            <span className="score-pct">%</span>
                          </div>
                        </div>
                        <div className="candidate-card-body">
                          <strong>{c.first_name} {c.last_name}</strong>
                          <span className="candidate-role-tag">{c.profile?.job_title || 'New Candidate'}</span>
                          
                          <div className="candidate-skills-minimal">
                            {c.profile?.skills?.slice(0, 2).map((s, i) => (
                              <span key={i} className="mini-skill-dot">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="candidate-card-footer">
                           <button 
                             className="view-profile-btn-sm"
                             onClick={(e) => {
                               e.stopPropagation();
                               setSelectedCandidateId(c.id);
                             }}
                           >
                             View Profile
                           </button>
                           <ChevronRight size={14} className="card-arrow" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="skeleton-card" style={{ height: '160px', width: '100%', gridColumn: '1 / -1' }}></div>
                  )}
                </div>

                <div className="db-section-title" style={{ marginTop: '3.5rem' }}>
                  <h3>📂 Active Job Postings</h3>
                  <span className="db-view-all">Manage All <ChevronRight size={14} /></span>
                </div>

                <div className="active-jobs-list-premium">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="job-card-modern">
                      <div className="job-card-main">
                        <div className="job-card-icon">
                          <Briefcase size={22} />
                        </div>
                        <div className="job-card-info">
                          <h4>{j === 1 ? 'Senior Technical Architect' : j === 2 ? 'Lead Product Designer' : 'Backend Engineer'}</h4>
                          <span>Full-time • Hybrid • USA</span>
                        </div>
                      </div>
                      <div className="job-card-metrics">
                        <div className="m-item">
                          <span className="m-val">{j === 1 ? '154' : j === 2 ? '82' : '210'}</span>
                          <span className="m-lbl">Applicants</span>
                        </div>
                        <div className="m-item highlight">
                          <span className="m-val">{j === 1 ? '12' : j === 2 ? '5' : '18'}</span>
                          <span className="m-lbl">New Today</span>
                        </div>
                      </div>
                      <div className="job-card-actions">
                        <button className="btn-manage-sm">Manage</button>
                        <button className="btn-more-sm"><MoreVertical size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="db-right-col">
                <ActivityFeed 
                  activities={activityData} 
                  title="Recruitment Pulse"
                />

                <div className="glass-card-premium" style={{ marginTop: '2.5rem', padding: '1.75rem' }}>
                  <div className="db-section-title" style={{ marginBottom: '1.5rem' }}>
                    <h3>📅 Interview Queue</h3>
                    <Clock size={16} color="#64748b" />
                  </div>
                  <div className="interview-modern-list">
                    {Array.isArray(candidates) && candidates.length > 0 ? (
                      candidates.slice(0, 4).map((c, i) => {
                        const hour = 10 + i;
                        const minute = i * 15 === 0 ? '00' : i * 15;
                        const timeStr = `${hour}:${minute}`;
                        return (
                          <div key={c.id || i} className="interview-row-premium">
                            <div className="i-time-badge">{timeStr}</div>
                            <div className="i-body">
                              <strong>{c.first_name} {c.last_name || c.username}</strong>
                              <span>{c.profile?.job_title || 'Initial Screen'}</span>
                            </div>
                            <div className="i-link-arrow">
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: '#64748b', fontSize: '0.9rem', padding: '1rem' }}>No active candidates in queue.</p>
                    )}
                  </div>
                  <button className="btn-calendar-full" onClick={() => alert('Calendar Hub feature is coming soon!')}>Open Calendar Hub</button>
                </div>
                
                <div className="intelligence-card-premium" style={{ marginTop: '2rem' }}>
                   <div className="section-title">
                      <Sparkles size={16} />
                      <h3>Shortlisted Candidates</h3>
                   </div>
                   <div className="mini-activity-list">
                      {Array.isArray(shortlisted) && shortlisted.slice(0, 5).map((s, i) => (
                         <div key={i} className="mini-activity-row" onClick={() => setSelectedCandidateId(s.candidate)} style={{ cursor: 'pointer' }}>
                            <div className="candidate-avatar-sm">{s.candidate_name ? s.candidate_name[0] : 'U'}</div>
                            <div className="activity-info">
                               <strong>{s.candidate_name || 'Candidate'}</strong>
                               <span>Shortlisted on {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <ChevronRight size={16} color="#94a3b8" />
                         </div>
                      ))}
                      {(!Array.isArray(shortlisted) || shortlisted.length === 0) && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No candidates shortlisted yet.</p>}
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'candidates' && (
          <motion.div 
            key="candidates"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="recruiter-tab-container"
          >
            <div className="candidates-toolbar">
              <div className="search-bar-modern">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Search candidates by name or skill..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                 <button className="pill active">All Talent</button>
                 <button className="pill">Top Rated</button>
              </div>
            </div>

            {/* AI AUTO SHORTLIST TOOL */}
            <div className="intelligence-card-premium" style={{ marginBottom: '2rem', borderStyle: 'dashed', background: 'rgba(99, 102, 241, 0.02)' }}>
               <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div className="hub-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: '48px', height: '48px' }}>
                    <Sparkles size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>AI Auto-Shortlist</h4>
                     <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Describe your ideal candidate and let AI rank the best matches.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flex: 2 }}>
                     <input 
                        type="text" 
                        placeholder="e.g. Senior Frontend Engineer with React and System Design skills..." 
                        className="search-bar-modern" // reuse style but tweak
                        style={{ width: '100%', boxShadow: 'none' }}
                        value={shortlistRequirements}
                        onChange={(e) => setShortlistRequirements(e.target.value)}
                     />
                     <button 
                        className="create-job-btn" 
                        style={{ padding: '0.5rem 1.5rem', flexShrink: 0 }}
                        onClick={handleAutoShortlist}
                        disabled={isAutoShortlisting || !shortlistRequirements}
                     >
                        {isAutoShortlisting ? 'AI Analyzing...' : 'Auto Shortlist'}
                     </button>
                  </div>
               </div>
            </div>

            {selectedForComparison.length > 0 && (
                <div 
                   className="glass-card-premium" 
                   style={{ 
                      position: 'sticky', 
                      top: '1rem', 
                      zIndex: 100, 
                      marginBottom: '1.5rem', 
                      padding: '1rem 2rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: '#0f172a',
                      color: 'white'
                   }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                       <Users size={20} />
                       <span style={{ fontWeight: 700 }}>{selectedForComparison.length} candidates selected for comparison</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                       <button className="pill" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setSelectedForComparison([])}>Clear</button>
                       <button className="pill active" style={{ background: '#6366f1' }} onClick={fetchComparison} disabled={selectedForComparison.length < 2}>
                          {isComparing ? 'AI Comparing...' : 'Compare Side-by-Side'}
                       </button>
                    </div>
                </div>
            )}

            <div className="candidates-table-container">
              <table className="candidates-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Candidate</th>
                    <th>Average Score</th>
                    <th>Top Skills</th>
                    <th>Assessments</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(candidates) && candidates.filter(c => 
                    ((c.username || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
                    ((c.first_name || '') + ' ' + (c.last_name || '')).toLowerCase().includes((searchQuery || '').toLowerCase()))
                  ).map(candidate => (
                    <tr key={candidate.id} className={`candidate-row ${selectedForComparison.includes(candidate.id) ? 'selected' : ''}`} onClick={() => setSelectedCandidateId(candidate.id)}>
                      <td style={{ width: '40px' }} onClick={(e) => e.stopPropagation()}>
                         <input 
                            type="checkbox" 
                            checked={selectedForComparison.includes(candidate.id)} 
                            onChange={() => toggleCandidateComparison(candidate.id)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                         />
                      </td>
                      <td>
                        <div className="candidate-info-cell">
                          <div className="candidate-avatar-sm">
                            {candidate.first_name ? candidate.first_name[0] : (candidate.username ? candidate.username[0] : 'U')}
                          </div>
                          <div className="candidate-name-stack">
                            <strong>{candidate.first_name} {candidate.last_name}</strong>
                            <span>@{candidate.username}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`score-badge-pill ${candidate.avg_score >= 80 ? 'high' : candidate.avg_score >= 50 ? 'mid' : 'low'}`}>
                          <Sparkles size={14} />
                          {candidate.avg_score}%
                        </div>
                      </td>
                      <td>
                        <div className="skills-preview-list">
                          {candidate.profile?.skills?.slice(0, 3).map((s, i) => (
                            <span key={i} className="skill-tag-sm">{s}</span>
                          ))}
                          {candidate.profile?.skills?.length > 3 && (
                            <span className="skill-tag-sm">+{candidate.profile.skills.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#64748b' }}>
                        {candidate.test_count} tests completed
                      </td>
                      <td>
                        <div className="job-card-actions">
                          <button 
                            className={`btn-icon-shortlist ${(Array.isArray(shortlisted) && shortlisted.some(s => s.candidate === candidate.id)) ? 'active' : ''}`} 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShortlistToggle(candidate.id);
                            }}
                          >
                            <Sparkles size={18} />
                          </button>
                          <button 
                            className="btn-manage-sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidateId(candidate.id);
                            }}
                          >
                            View Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        No candidates found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'shortlisted' && (
          <motion.div 
            key="shortlisted"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="recruiter-tab-container"
          >
            <div className="db-section-title" style={{ marginBottom: '2rem' }}>
              <h3>⭐ Shortlisted Candidates</h3>
              <p>Top talent prioritized for your active pipelines</p>
            </div>

            <div className="candidates-table-container">
              <table className="candidates-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>AI Score</th>
                    <th>Notes</th>
                    <th>Added On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shortlisted.map(item => (
                    <tr key={item.id} className="candidate-row" onClick={() => setSelectedCandidateId(item.candidate)}>
                      <td>
                        <div className="candidate-info-cell">
                          <div className="candidate-avatar-sm" style={{ background: '#f59e0b' }}>
                            {item.candidate_profile?.first_name ? item.candidate_profile.first_name[0] : item.candidate_profile?.username?.[0] || 'C'}
                          </div>
                          <div className="candidate-name-stack">
                            <strong>{item.candidate_profile?.first_name} {item.candidate_profile?.last_name}</strong>
                            <span>@{item.candidate_profile?.username}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`score-badge-pill high`}>
                          <Sparkles size={14} />
                          {item.ai_score}% Match
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {item.notes || 'No notes added yet'}
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="job-card-actions">
                          <button className="btn-icon-shortlist active" onClick={(e) => {
                            e.stopPropagation();
                            handleShortlistToggle(item.candidate);
                          }}>
                            <Sparkles size={18} />
                          </button>
                           <button 
                            className="btn-manage-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidateId(item.candidate);
                            }}
                          >
                            View Full Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {shortlisted.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        Your shortlist is currently empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'assessments' && (
          <motion.div 
            key="assessments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="recruiter-tab-container"
          >
            {/* ACTION BAR */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <button className="create-job-btn" onClick={() => setCreateAssessmentModal(true)}>
                <Plus size={18} />
                <span>Create Assessment</span>
              </button>
            </div>

            {/* ASSESSMENTS GRID */}
            {loading ? (
              <div className="asmnt-grid">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="asmnt-card-skeleton">
                    <div className="sk-icon" />
                    <div className="sk-line long" />
                    <div className="sk-line short" />
                  </div>
                ))}
              </div>
            ) : assessments.length === 0 ? (
              <div className="asmnt-empty-state">
                <div className="asmnt-empty-icon">
                  <Briefcase size={40} />
                </div>
                <h3>No Assessments Yet</h3>
                <p>Start building your candidate evaluation pipeline by creating your first custom assessment.</p>
                <button className="create-job-btn" onClick={() => setCreateAssessmentModal(true)}>
                  <Plus size={18} />
                  <span>Create Your First Assessment</span>
                </button>
              </div>
            ) : (
              <div className="asmnt-grid">
                {Array.isArray(assessments) && assessments.map(test => (
                  <div key={test.id} className="asmnt-card">
                    <div className="asmnt-card-top">
                      <div 
                        className="asmnt-card-icon-wrap"
                        style={{ 
                          background: test.created_by 
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.1))' 
                            : 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))'
                        }}
                      >
                        <Briefcase size={22} color={test.created_by ? '#6366f1' : '#10b981'} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div className="asmnt-card-type-badge" style={{
                        background: test.created_by ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                        color: test.created_by ? '#6366f1' : '#10b981'
                      }}>
                        {test.created_by ? '✦ Custom' : '◎ Standard'}
                      </div>
                      <div className="asmnt-card-type-badge" style={{
                        background: test.assessment_type === 'interview' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: test.assessment_type === 'interview' ? '#8b5cf6' : '#ef4444',
                        fontWeight: '800'
                      }}>
                        {test.assessment_type === 'interview' ? '🎤 AI Interview' : '📝 MCQ Exam'}
                      </div>
                    </div>

                    <h4 className="asmnt-card-title">{test.title}</h4>
                    <p className="asmnt-card-meta">{test.category} · {test.difficulty}</p>

                    <div className="asmnt-card-stats">
                      <div className="asmnt-stat-item">
                        <Clock size={13} />
                        <span>{test.estimated_time || test.time || 30} min</span>
                      </div>
                      <div className="asmnt-stat-item">
                        <Users size={13} />
                        <span>{test.enrolled_count || 0} taken</span>
                      </div>
                    </div>

                    <div className="asmnt-diff-bar">
                      <span 
                        className="asmnt-diff-tag"
                        style={{
                          background: test.difficulty === 'Beginner' ? 'rgba(16,185,129,0.1)' : test.difficulty === 'Intermediate' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: test.difficulty === 'Beginner' ? '#059669' : test.difficulty === 'Intermediate' ? '#d97706' : '#dc2626',
                        }}
                      >
                        {test.difficulty === 'Beginner' ? '🟢' : test.difficulty === 'Intermediate' ? '🟡' : '🔴'} {test.difficulty}
                      </span>
                    </div>

                    <div className="asmnt-card-actions">
                      <button 
                        className="asmnt-btn-assign"
                        onClick={() => setAssignmentModal({ show: true, candidateId: null, assessmentId: test.id })}
                      >
                        Assign
                      </button>
                      {test.created_by && (
                        <button 
                          className="asmnt-btn-more" 
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeleteAssessment(test.id)}
                          title="Delete Assessment"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button className="asmnt-btn-more">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="recruiter-tab-container"
          >
            <div className="db-section-title" style={{ marginBottom: '2rem' }}>
              <h3>📜 Assignment History</h3>
              <p>Track all assessments assigned to candidates and their current status</p>
            </div>

            <div className="candidates-table-container">
              <table className="candidates-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Assessment</th>
                    <th>Category</th>
                    <th>Assigned On</th>
                    <th>Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(assignmentsHistory) && assignmentsHistory.map(item => (
                    <tr key={item.id} className="candidate-row">
                      <td>
                        <div 
                          className="candidate-info-cell" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedCandidateId(item.candidate)}
                        >
                          <div className="candidate-avatar-sm" style={{ background: '#6366f1' }}>
                            {item.candidate_detail?.first_name ? item.candidate_detail.first_name[0] : item.candidate_detail?.username?.[0] || 'C'}
                          </div>
                          <div className="candidate-name-stack">
                            <strong>{item.candidate_detail?.first_name} {item.candidate_detail?.last_name}</strong>
                            <span>@{item.candidate_detail?.username}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.assessment_detail?.title}</div>
                      </td>
                      <td>
                        <span className="skill-tag-sm" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                          {item.assessment_detail?.category}
                        </span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                         {new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                        {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'No Deadline'}
                      </td>
                      <td>
                        <div className={`status-badge ${item.status?.toLowerCase() || 'pending'}`}>
                          {item.status || 'Pending'}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {assignmentsHistory.length === 0 && !historyLoading && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '4rem' }}>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#64748b' }}>
                            <Clock size={40} opacity={0.3} />
                            <p>No test assignments found in your history.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* ─── CANDIDATE PROFILE OVERLAY ─── */}
      <AnimatePresence>
        {selectedCandidateId && (
          <motion.div 
            key="profile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="profile-overlay-backdrop"
            onClick={() => { setSelectedCandidateId(null); setCandidateDetail(null); }}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="profile-sidebar-overlay"
              onClick={(e) => e.stopPropagation()}
            >
              {detailLoading ? (
                <div className="overlay-loading">
                  <div className="shimmer-avatar" />
                  <div className="shimmer-line" style={{ width: '60%' }} />
                  <div className="shimmer-line" style={{ width: '80%' }} />
                </div>
              ) : candidateDetail ? (
                <div className="profile-overlay-content">
                  <header className="overlay-header">
                    <button className="close-overlay" onClick={() => setSelectedCandidateId(null)}>✕</button>
                    <div className="header-main">
                      <div className="candidate-avatar-lg">
                        {candidateDetail.profile?.first_name ? candidateDetail.profile.first_name[0] : candidateDetail.profile?.username ? candidateDetail.profile.username[0] : 'U'}
                      </div>
                      <div className="header-info">
                        <h2>{candidateDetail.profile?.first_name || 'Candidate'} {candidateDetail.profile?.last_name || ''}</h2>
                        <p>@{candidateDetail.profile?.username || 'user'}</p>
                        <div className="header-badges">
                           <span className={`recommendation-badge ${candidateDetail?.intelligence?.recommendation ? candidateDetail.intelligence.recommendation.toLowerCase().replace(/\s+/g, '-') : 'pending'}`}>
                              {candidateDetail?.intelligence?.recommendation || 'Evaluation Pending'}
                           </span>
                           <span className="pill" style={{ background: '#f1f5f9', color: '#475569' }}>
                              Level: {candidateDetail.stats?.skill_level || 'Beginner'}
                           </span>
                        </div>
                      </div>
                    </div>
                  </header>

                  <div className="overlay-body">
                    {/* Intelligence Section */}
                    <div className="overlay-section">
                      <div className="section-title">
                        <Sparkles size={16} color="#6366f1" />
                        <h3>AI Hiring Intelligence</h3>
                      </div>
                      <div className="intelligence-card-premium">
                        <p className="intelligence-reason">"{candidateDetail.intelligence?.reason}"</p>
                        <div className="intelligence-insights">
                          {Array.isArray(candidateDetail.intelligence?.insights) && candidateDetail.intelligence.insights.map((ins, i) => (
                             <div key={i} className="insight-bullet">
                               <div className="bullet-dot" />
                               <span>{ins}</span>
                             </div>
                          ))}
                        </div>
                        <div className="intelligence-summary">
                          <p>{candidateDetail.intelligence?.summary}</p>
                        </div>
                      </div>
                    </div>

                    <div className="overlay-section">
                      <div className="section-title">
                        <TrendingUp size={16} />
                        <h3>Decision Fit Scorecard</h3>
                      </div>
                      <div className="decision-scorecard-grid">
                         {Array.isArray(candidateDetail?.intelligence?.scorecard) && candidateDetail.intelligence.scorecard.map((item, idx) => (
                            <div key={idx} className="scorecard-item">
                               <div className="scorecard-header">
                                  <span className="area">{item.area}</span>
                                  <span className="score">{item.score}%</span>
                               </div>
                               <div className="scorecard-bar-bg">
                                  <motion.div 
                                     className="scorecard-bar-fill" 
                                     initial={{ width: 0 }}
                                     animate={{ width: `${item.score}%` }}
                                     style={{ background: item.score > 80 ? '#10b981' : item.score > 60 ? '#6366f1' : '#f59e0b' }}
                                  />
                               </div>
                               <p className="analysis">{item.analysis}</p>
                            </div>
                         ))}
                      </div>
                    </div>

                    {/* Progress Charts */}
                    <div className="overlay-section">
                      <div className="section-title">
                        <TrendingUp size={16} />
                        <h3>Performance Growth</h3>
                      </div>
                      <div className="intelligence-card-premium" style={{ height: '240px', padding: '1rem' }}>
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={candidateDetail.progress?.history || []}>
                               <defs>
                                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                               <XAxis dataKey="date" hide />
                               <YAxis domain={[0, 100]} hide />
                               <Tooltip 
                                  contentStyle={{ background: '#0f172a', color: 'white', borderRadius: '8px', border: 'none' }}
                                  itemStyle={{ color: '#818cf8' }}
                               />
                               <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                         </ResponsiveContainer>
                         <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                            Aggregated score improvement over {Array.isArray(candidateDetail.progress?.history) ? candidateDetail.progress.history.length : 0} sessions
                         </div>
                      </div>
                    </div>

                    {/* Mirrored Analytics */}
                    <div className="overlay-section">
                      <div className="section-title">
                        <BarChart3 size={16} />
                        <h3>Twin Performance Analytics</h3>
                      </div>
                      <div className="analytics-mirror-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                         {/* Skill Performance Table/Bar */}
                         <div className="intelligence-card-premium" style={{ height: '220px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Skill Proficiency</span>
                            <ResponsiveContainer width="100%" height="80%">
                               <BarChart data={Array.isArray(candidateDetail.progress?.skill_performance) ? candidateDetail.progress.skill_performance.map(s => ({ name: s.skill, value: s.score })) : []}>
                                  <XAxis dataKey="name" hide />
                                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', background: '#0f172a', color: '#fff' }} />
                                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                         {/* MCQ Accuracy */}
                         <div className="intelligence-card-premium" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Technical Accuracy</span>
                            <ResponsiveContainer width="100%" height="70%">
                               <PieChart>
                                  <Pie
                                     data={[
                                        { name: 'Correct', value: candidateDetail.progress?.mcq_accuracy?.correct || 0 },
                                        { name: 'Incorrect', value: candidateDetail.progress?.mcq_accuracy?.incorrect || 0 }
                                     ]}
                                     innerRadius={45}
                                     outerRadius={60}
                                     paddingAngle={5}
                                     dataKey="value"
                                  >
                                     <Cell fill="#10b981" />
                                     <Cell fill="#ef4444" />
                                  </Pie>
                                  <Tooltip />
                               </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.7rem' }}>
                               <span><span style={{ color: '#10b981' }}>●</span> Correct</span>
                               <span><span style={{ color: '#ef4444' }}>●</span> Incorrect</span>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Coding Performance */}
                    <div className="overlay-section">
                       <div className="section-title">
                          <Code size={16} />
                          <h3>Coding Execution Strength</h3>
                       </div>
                       <div className="intelligence-card-premium" style={{ height: '200px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={Array.isArray(candidateDetail.progress?.coding_performance) ? candidateDetail.progress.coding_performance : []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="label" hide />
                                <Tooltip />
                                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                             </LineChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Coding Submissions Preview */}
                    <div className="overlay-section">
                       <div className="section-title">
                          <Code size={16} color="#6366f1" />
                          <h3>Recent Coding Submissions</h3>
                       </div>
                       <div className="coding-submissions-list">
                          {Array.isArray(candidateDetail.coding_submissions) && candidateDetail.coding_submissions.slice(0, 3).map((sub, i) => (
                             <div key={i} className="intelligence-card-premium" style={{ marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <div style={{ padding: '0.4rem', background: '#f8fafc', borderRadius: '6px' }}>
                                         <Code size={14} color="#6366f1" />
                                      </div>
                                      <strong style={{ fontSize: '0.85rem' }}>{sub.problem_id}</strong>
                                   </div>
                                   <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{sub.language}</span>
                                </div>
                                <div className="code-review-snippet" style={{ background: '#1e293b', color: '#e2e8f0', padding: '1rem', borderRadius: '10px', fontSize: '0.75rem', fontFamily: 'monospace', maxHeight: '120px', overflow: 'hidden', position: 'relative' }}>
                                   <pre style={{ margin: 0 }}>{sub.code}</pre>
                                   <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, #1e293b)', pointerEvents: 'none' }} />
                                </div>
                                <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.8rem' }}>
                                   <div className="mini-stat-xs">
                                      <span className="lbl">Status</span>
                                      <span className="val" style={{ color: sub.status === 'Accepted' ? '#10b981' : '#ef4444' }}>{sub.status}</span>
                                   </div>
                                   <div className="mini-stat-xs">
                                      <span className="lbl">Pass Rate</span>
                                      <span className="val">{sub.performance_metrics?.test_cases_passed_percentage || 0}%</span>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                      <div className="stats-pill-grid">
                        <div className="mini-stat">
                           <span className="lbl">Avg Score</span>
                           <span className="val">{candidateDetail.stats?.avg_score || 0}%</span>
                        </div>
                        <div className="mini-stat">
                           <span className="lbl">Top Skill</span>
                           <span className="val">{candidateDetail.stats?.top_skill || 'N/A'}</span>
                        </div>
                        <div className="mini-stat">
                           <span className="lbl">Growth Area</span>
                           <span className="val">{candidateDetail.stats?.weakest_skill || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Professional Brief & CV */}
                      <div className="overlay-section">
                        <div className="section-title">
                          <FileText size={16} color="#6366f1" />
                          <h3>Professional Portfolio</h3>
                        </div>
                        {/* Bio + CV side by side */}
                        <div className="profile-brief-grid">
                          <div className="bio-card-premium">
                            <h4>Candidate Bio</h4>
                            <p>{candidateDetail.profile?.profile?.bio || "No professional summary provided."}</p>
                          </div>
                          <div className="cv-action-card">
                            <div className="hub-card-icon" style={{ marginBottom: '0.8rem' }}>📄</div>
                            {candidateDetail.profile?.profile?.resume ? (
                               <>
                                 <strong style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.25rem' }}>Resume on File</strong>
                                 <button 
                                   onClick={() => handleDownloadCV(
                                     candidateDetail?.profile?.id,
                                     candidateDetail?.profile?.profile?.resume?.split('/').pop() || 'resume.pdf'
                                   )}
                                   style={{ marginTop: '0.5rem', textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%', padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color:'white', borderRadius:'10px', fontWeight:700, fontSize:'0.8rem', border: 'none', cursor: 'pointer' }}
                                 >
                                    📥 Download CV
                                 </button>

                                 <button 
                                   onClick={() => fetchAtsScore(candidateDetail.profile.id)}
                                   disabled={isGeneratingAts}
                                   style={{ marginTop: '0.5rem', textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%', padding: '0.5rem 1rem', background: 'white', color:'#6366f1', border:'1px solid #6366f1', borderRadius:'10px', fontWeight:700, fontSize:'0.8rem', cursor: isGeneratingAts ? 'not-allowed' : 'pointer' }}
                                 >
                                    {isGeneratingAts ? 'Analyzing...' : '🔍 Scan ATS Score'}
                                 </button>
                                 
                                 {atsScore && (
                                   <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                         <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>ATS MATCH</span>
                                         <span style={{ fontSize: '1.2rem', fontWeight: 900, color: atsScore.ats_score >= 70 ? '#10b981' : '#f59e0b' }}>{atsScore.ats_score}%</span>
                                      </div>
                                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569', lineHeight: 1.4 }}>{atsScore.feedback}</p>
                                   </div>
                                 )}
                               </>
                            ) : (
                               <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No CV Uploaded</span>
                            )}
                          </div>
                        </div>

                        {/* Skills Tags */}
                        {Array.isArray(candidateDetail?.profile?.profile?.skills) && candidateDetail.profile.profile.skills.length > 0 && (
                          <div style={{ marginTop: '1.25rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 800 }}>Skills & Technologies</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                              {candidateDetail.profile.profile.skills.map((skill, idx) => (
                                <span key={idx} style={{
                                  padding: '0.35rem 0.85rem',
                                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
                                  color: '#6366f1',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  border: '1px solid rgba(99,102,241,0.2)'
                                }}>{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Background & Experience */}
                      <div className="overlay-section">
                        <div className="section-title">
                          <Layout size={16} />
                          <h3>Background & Credentials</h3>
                        </div>
                        <div className="professional-experience-grid">
                           <div className="exp-card-premium">
                              <div className="exp-card-header">
                                 <School size={16} />
                                 <span>Education</span>
                              </div>
                              <div className="exp-content">
                                 {candidateDetail.profile?.profile?.education || "Educational history not listed."}
                              </div>
                           </div>
                           <div className="exp-card-premium">
                              <div className="exp-card-header">
                                 <Briefcase size={16} />
                                 <span>Professional Experience</span>
                              </div>
                              <div className="exp-content">
                                 {candidateDetail.profile?.profile?.experience || "No professional experience listed."}
                              </div>
                           </div>
                           <div className="exp-card-premium">
                              <div className="exp-card-header">
                                 <Code size={16} />
                                 <span>Notable Projects</span>
                              </div>
                              <div className="exp-content">
                                 {candidateDetail.profile?.profile?.projects || "No projects listed."}
                              </div>
                           </div>
                        </div>
                      </div>

                    {/* Tailored Questions */}
                    <div className="overlay-section">
                       <div className="section-title">
                          <Target size={16} color="#6366f1" />
                          <h3>AI Tailored Questions</h3>
                       </div>
                       {!tailoredQuestions ? (
                          <button 
                            className="btn-glass-full" 
                            disabled={isGeneratingQuestions}
                            onClick={() => fetchTailoredQuestions(selectedCandidateId)}
                          >
                             {isGeneratingQuestions ? 'AI Thinking...' : 'Generate Tailored Questions'}
                          </button>
                       ) : (
                          <div className="tailored-questions-list">
                             {Array.isArray(tailoredQuestions) && tailoredQuestions.map((q, i) => (
                                <div key={i} className="intelligence-card-premium" style={{ marginBottom: '1rem' }}>
                                   <div style={{ display: 'flex', gap: '0.75rem' }}>
                                      <div className="hub-card-icon" style={{ width: '32px', height: '32px', fontSize: '0.8rem', flexShrink: 0 }}>{i+1}</div>
                                      <div>
                                         <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{q.question}</p>
                                         <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#6366f1', fontWeight: 600 }}>Intent: {q.intent}</p>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>

                    <div className="overlay-section">
                       <div className="section-title">
                         <Clock size={16} />
                         <h3>Detailed Assessment History</h3>
                       </div>
                       <div className="overlay-activity-list">
                          {Array.isArray(candidateDetail.assessments) && candidateDetail.assessments.map(res => (
                             <div key={res.id} className="history-item-premium" style={{ marginBottom: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div className="history-item-header" style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                      <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: '10px' }}>✅</div>
                                      <div>
                                         <strong style={{ fontSize: '0.95rem' }}>{res.assessment?.title}</strong>
                                         <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {res.completed_at ? new Date(res.completed_at).toLocaleDateString() : 'Date N/A'} • {res.time_taken}s
                                         </div>
                                      </div>
                                   </div>
                                   <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: res.score >= 80 ? '#10b981' : '#f59e0b' }}>{res.score}%</div>
                                      <div className="history-badge" style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Technical Test</div>
                                   </div>
                                </div>
                                
                                <div style={{ padding: '1rem' }}>
                                  {res.ai_suggestions && res.ai_suggestions.length > 0 && (
                                     <div style={{ marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>AI Recommendations</strong>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#475569' }}>
                                          {Array.isArray(res.ai_suggestions) ? res.ai_suggestions.map((s, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{s}</li>
                                          )) : <li>{res.ai_suggestions}</li>}
                                        </ul>
                                     </div>
                                  )}
                                  
                                  {Array.isArray(res.skill_breakdown) && res.skill_breakdown.length > 0 && (
                                     <div style={{ marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>Skill Breakdown</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                           {res.skill_breakdown.map((s, idx) => (
                                              <span key={idx} style={{ padding: '0.25rem 0.6rem', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.7rem', color: '#334155', border: '1px solid #e2e8f0' }}>
                                                 {s.skill}: <strong style={{ color: s.score >= 70 ? '#10b981' : '#f59e0b' }}>{s.score}%</strong>
                                              </span>
                                           ))}
                                        </div>
                                     </div>
                                  )}

                                  {Array.isArray(res.roadmap) && res.roadmap.length > 0 && (
                                     <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                                        <strong style={{ fontSize: '0.8rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                           <TrendingUp size={14} /> Recommended Learning Roadmap
                                        </strong>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                          {res.roadmap.slice(0, 3).map((step, idx) => (
                                            <div key={idx} style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', gap: '0.5rem' }}>
                                              <span style={{ fontWeight: 800, color: '#94a3b8' }}>{idx + 1}.</span>
                                              <span>{typeof step === 'object' ? (step.title || step.topic || `Step ${idx+1}`) : step}</span>
                                            </div>
                                          ))}
                                          {res.roadmap.length > 3 && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>+ {res.roadmap.length - 3} more steps...</span>}
                                        </div>
                                     </div>
                                  )}
                                </div>
                             </div>
                          ))}

                          {Array.isArray(candidateDetail.interviews) && candidateDetail.interviews.map(inv => (
                             <div key={inv.id} className="history-item-premium" style={{ marginBottom: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div className="history-item-header" style={{ padding: '1rem', borderBottom: '1px solid #eef2ff', background: '#fcfdff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                      <div style={{ padding: '0.5rem', background: '#eef2ff', borderRadius: '10px' }}>🎤</div>
                                      <div>
                                         <strong style={{ fontSize: '0.95rem' }}>AI Interview (HR/Tech)</strong>
                                         <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.completed_at ? new Date(inv.completed_at).toLocaleDateString() : 'Date N/A'}</div>
                                      </div>
                                   </div>
                                   <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: (inv.overall_score || 0) >= 80 ? '#6366f1' : '#f59e0b' }}>{inv.overall_score || 0}%</div>
                                      <div className="history-badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>AI Voice Interview</div>
                                   </div>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                   {/* Scores Grid */}
                                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                      <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                                         <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Tech Skills</span>
                                         <span style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>{inv.technical_score || 0}%</span>
                                      </div>
                                      <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                                         <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Communication</span>
                                         <span style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>{inv.communication_score || 0}%</span>
                                      </div>
                                      <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                                         <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Confidence</span>
                                         <span style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>{inv.confidence_score || 0}%</span>
                                      </div>
                                      <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                                         <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>Problem Solv.</span>
                                         <span style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>{inv.problem_solving_score || 0}%</span>
                                      </div>
                                   </div>

                                   {/* Feedback Details */}
                                   <div style={{ marginBottom: '1.25rem' }}>
                                      <strong style={{ fontSize: '0.8rem', color: '#334155', display: 'block', marginBottom: '0.4rem' }}>AI Evaluator Feedback</strong>
                                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', lineHeight: 1.5, padding: '0.6rem', background: '#f1f5f9', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                                         {inv.feedback_summary || "Analysis pending or unavailable."}
                                      </p>
                                   </div>

                                   {/* Strengths & Weaknesses */}
                                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                      <div>
                                         <strong style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                            <span style={{ background: '#d1fae5', padding: '0.2rem', borderRadius: '4px' }}>↑</span> Noted Strengths
                                         </strong>
                                         <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#475569' }}>
                                            {Array.isArray(inv.strengths) && inv.strengths.length > 0 ? inv.strengths.map((s, idx) => <li key={idx}>{s}</li>) : <li>N/A</li>}
                                         </ul>
                                      </div>
                                      <div>
                                         <strong style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                                            <span style={{ background: '#fee2e2', padding: '0.2rem', borderRadius: '4px' }}>↓</span> Areas to Improve
                                         </strong>
                                         <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#475569' }}>
                                            {Array.isArray(inv.improvements) && inv.improvements.length > 0 ? inv.improvements.map((i, idx) => <li key={idx}>{i}</li>) : <li>N/A</li>}
                                         </ul>
                                      </div>
                                   </div>

                                   {/* QA Transcript Preview */}
                                   {inv.qa_history?.length > 0 && (
                                     <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                       <div style={{ padding: '0.5rem 0.8rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                                          Interview Response Transcript
                                       </div>
                                       <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '0.8rem', background: '#fcfdff', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                          {Array.isArray(inv.qa_history) && inv.qa_history.map((qa, idx) => (
                                             <div key={idx} style={{ fontSize: '0.75rem' }}>
                                                <div style={{ color: '#4338ca', fontWeight: 600, marginBottom: '0.25rem' }}>Q: {qa.question}</div>
                                                <div style={{ color: '#475569', paddingLeft: '0.5rem', borderLeft: '2px solid #cbd5e1' }}>A: {qa.answer || "(No response)"}</div>
                                             </div>
                                          ))}
                                       </div>
                                     </div>
                                   )}
                                </div>
                             </div>
                          ))}
                          {(!candidateDetail.assessments?.length && !candidateDetail.interviews?.length) && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                               No past assessment history found for this candidate.
                            </div>
                          )}
                       </div>
                    </div>
                  </div>

                  <footer className="overlay-footer">
                     <button 
                        className={`btn-shortlist-full ${(Array.isArray(shortlisted) && shortlisted.some(s => s.candidate === selectedCandidateId)) ? 'active' : ''}`}
                        onClick={() => handleShortlistToggle(selectedCandidateId)}
                      >
                        <Sparkles size={18} />
                        <span>{(Array.isArray(shortlisted) && shortlisted.some(s => s.candidate === selectedCandidateId)) ? 'Shortlisted' : 'Add to Shortlist'}</span>
                     </button>
                     <button className="btn-contact-candidate" onClick={handleDownloadReport}>
                        <Download size={18} />
                        <span className="btn-icon-shortlist report">Download Report</span>
                     </button>
                  </footer>
                </div>
              ) : (
                <div className="overlay-error">Failed to load candidate details.</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CANDIDATE COMPARISON OVERLAY ─── */}
      <AnimatePresence>
        {comparisonResults && (
           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="profile-overlay-backdrop"
              style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem' }}
              onClick={() => { setComparisonResults(null); setSelectedForComparison([]); }}
           >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="comparison-modal-premium"
                onClick={(e) => e.stopPropagation()}
              >
                 <header className="comparison-header">
                    <div>
                      <h2>Side-by-Side Talent Comparison</h2>
                      <p>AI-driven competitive analysis of selected candidates</p>
                    </div>
                    <button className="close-overlay" onClick={() => setComparisonResults(null)}>✕</button>
                 </header>

                 <div className="comparison-body">
                    <div className="comparison-matrix-container">
                       <table className="comparison-table">
                          <thead>
                             <tr>
                                <th>Criteria</th>
                                {Array.isArray(comparisonResults?.candidates) && comparisonResults.candidates.map(c => (
                                   <th key={c.id}>
                                      <div className="comp-candidate-head">
                                         <div className="candidate-avatar-sm" style={{ margin: '0 auto 0.5rem' }}>
                                            {c.username ? c.username[0] : 'U'}
                                         </div>
                                         <span>{c.first_name || ''} {c.last_name || ''}</span>
                                      </div>
                                   </th>
                                ))}
                             </tr>
                          </thead>
                          <tbody>
                             <tr>
                                <td>Overall Score</td>
                                {comparisonResults?.candidates?.map(c => (
                                   <td key={c.id} style={{ fontWeight: 900, color: '#6366f1', fontSize: '1.25rem' }}>{c.avg_score}%</td>
                                ))}
                             </tr>
                             <tr>
                                <td>Top Skill</td>
                                {comparisonResults?.candidates?.map(c => (
                                   <td key={c.id}>{c.profile?.skills?.[0] || 'N/A'}</td>
                                ))}
                             </tr>
                             <tr>
                                <td>Assessments</td>
                                {comparisonResults?.candidates?.map(c => (
                                   <td key={c.id}>{c.test_count} Completed</td>
                                ))}
                             </tr>
                             {/* Add more matrix rows if available in comparisonResults.comparison_matrix */}
                          </tbody>
                       </table>
                    </div>

                    <div className="comparison-ai-analysis">
                        <div className="section-title">
                           <Sparkles size={18} color="#6366f1" />
                           <h3>AI Competitive Insight</h3>
                        </div>
                        <div className="intelligence-card-premium" style={{ borderStyle: 'dashed', borderColor: '#6366f1' }}>
                           <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#334155' }}>
                              {comparisonResults.analysis}
                           </p>
                        </div>
                    </div>
                 </div>

                 <footer className="overlay-footer">
                    <button className="create-job-btn" style={{ background: '#0f172a' }} onClick={() => setComparisonResults(null)}>Done Analysis</button>
                    <div style={{ flex: 1 }} />
                    <button className="btn-icon-shortlist" style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
                       <Users size={18} />
                       <span>Download Report</span>
                    </button>
                 </footer>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ASSIGNMENT MODAL ─── */}
      <AnimatePresence>
         {assignmentModal.show && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="profile-overlay-backdrop"
              style={{ justifyContent: 'center', alignItems: 'center' }}
               onClick={() => setAssignmentModal({ show: false, candidateId: null, assessmentId: null, targetId: null })}
            >
               <motion.div 
                  initial={{ y: 20, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                  className="intelligence-card-premium"
                  style={{ width: '450px', padding: '2.5rem' }}
                  onClick={e => e.stopPropagation()}
               >
                  <h3 style={{ margin: '0 0 1.5rem', fontWeight: 900 }}>{assignmentModal.candidateId ? 'Assign Assessment' : 'Assign Candidate'}</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '2rem' }}>
                     {assignmentModal.candidateId && assessments.map(test => (
                        <div 
                           key={test.id} 
                           className="mini-activity-row" 
                           style={{ cursor: 'pointer', marginBottom: '0.75rem', border: assignmentModal.targetId === test.id ? '2px solid #6366f1' : '1px solid transparent', background: assignmentModal.targetId === test.id ? 'rgba(99, 102, 241, 0.05)' : '' }}
                           onClick={() => setAssignmentModal(prev => ({ ...prev, targetId: test.id }))}
                        >
                           <Briefcase size={18} color="#6366f1" />
                           <div className="activity-info">
                              <strong>{test.title}</strong>
                              <span>{test.category} • {test.difficulty}</span>
                           </div>
                           {assignmentModal.targetId === test.id ? <div style={{width: 12, height: 12, borderRadius: '50%', background: '#6366f1'}} /> : <ChevronRight size={16} color="#94a3b8" />}
                        </div>
                     ))}
                     {assignmentModal.assessmentId && candidates.map(cand => (
                        <div 
                           key={cand.id} 
                           className="mini-activity-row" 
                           style={{ cursor: 'pointer', marginBottom: '0.75rem', border: assignmentModal.targetId === cand.id ? '2px solid #6366f1' : '1px solid transparent', background: assignmentModal.targetId === cand.id ? 'rgba(99, 102, 241, 0.05)' : '' }}
                           onClick={() => setAssignmentModal(prev => ({ ...prev, targetId: cand.id }))}
                        >
                           <div className="candidate-avatar-sm" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span>👤</span>
                           </div>
                           <div className="activity-info">
                              <strong>{cand.candidate_profile?.name || cand.username}</strong>
                              <span>{cand.candidate_profile?.title || 'Candidate'}</span>
                           </div>
                           {assignmentModal.targetId === cand.id ? <div style={{width: 12, height: 12, borderRadius: '50%', background: '#6366f1'}} /> : <ChevronRight size={16} color="#94a3b8" />}
                        </div>
                     ))}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-glass-full" onClick={() => setAssignmentModal({ show: false, candidateId: null, assessmentId: null, targetId: null })}>Cancel</button>
                    <button 
                      className="create-job-btn" 
                      style={{ flex: 1, opacity: assignmentModal.targetId ? 1 : 0.5, cursor: assignmentModal.targetId ? 'pointer' : 'not-allowed' }}
                      disabled={!assignmentModal.targetId}
                      onClick={() => {
                        if (assignmentModal.candidateId) handleAssignTest(assignmentModal.candidateId, assignmentModal.targetId);
                        else if (assignmentModal.assessmentId) handleAssignTest(assignmentModal.targetId, assignmentModal.assessmentId);
                      }}
                    >
                      Assign {assignmentModal.targetId ? (assignmentModal.candidateId ? assessments.find(t => t.id === assignmentModal.targetId)?.title : candidates.find(c => c.id === assignmentModal.targetId)?.candidate_profile?.name || candidates.find(c => c.id === assignmentModal.targetId)?.username) : ''}
                    </button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ─── CREATE ASSESSMENT MODAL ─── */}


      <AnimatePresence>
         {createAssessmentModal && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="profile-overlay-backdrop"
               style={{ justifyContent: 'center', alignItems: 'center' }}
               onClick={() => setCreateAssessmentModal(false)}
            >
               <motion.div 
                  initial={{ y: 30, opacity: 0, scale: 0.95 }} 
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 30, opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="create-assessment-modal"
                  onClick={e => e.stopPropagation()}
               >
                  {/* Modal Header */}
                  <div className="cam-header">
                     <div className="cam-header-icon">
                        <Briefcase size={22} />
                     </div>
                     <div className="cam-header-text">
                        <h3>Create New Assessment</h3>
                        <p>Configure and publish a custom skill evaluation for your candidates</p>
                     </div>
                     <button className="cam-close-btn" onClick={() => setCreateAssessmentModal(false)}>✕</button>
                  </div>

                  {/* Modal Body */}
                  <div className="cam-body">
                      {/* Assessment Type Toggle */}
                      <div className="cam-field">
                         <label className="cam-label">
                            <ShieldCheck size={14} /> Assessment Mode
                         </label>
                         <div className="cam-type-toggle" style={{ display: 'flex', gap: '8px', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <button 
                               className={`cam-type-btn ${newAssessment.assessment_type === 'mcq' ? 'active' : ''}`}
                               style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: newAssessment.assessment_type === 'mcq' ? '#6366f1' : 'transparent', color: newAssessment.assessment_type === 'mcq' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                               onClick={() => setNewAssessment({...newAssessment, assessment_type: 'mcq', interview_category: null})}
                            >
                               MCQ Exam
                            </button>
                            <button 
                               className={`cam-type-btn ${newAssessment.assessment_type === 'interview' ? 'active' : ''}`}
                               style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: newAssessment.assessment_type === 'interview' ? '#6366f1' : 'transparent', color: newAssessment.assessment_type === 'interview' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
                               onClick={() => setNewAssessment({...newAssessment, assessment_type: 'interview', interview_category: 'hr', category: 'Soft Skills'})}
                            >
                               AI Interview
                            </button>
                         </div>
                      </div>

                      {/* Title */}
                      <div className="cam-field">
                         <label className="cam-label">
                            <Target size={14} /> Assessment Title
                         </label>
                        <input 
                           type="text" 
                           className="cam-input"
                           placeholder="e.g. Senior Frontend Architect Challenge"
                           value={newAssessment.title}
                           onChange={e => setNewAssessment({...newAssessment, title: e.target.value})}
                        />
                     </div>

                      {/* Category Selection or Interview Type */}
                      <div className="cam-field">
                         <label className="cam-label">
                            <Code size={14} /> {newAssessment.assessment_type === 'mcq' ? 'Skill Category' : 'Interview Focus'}
                         </label>
                         <div className="cam-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                            {newAssessment.assessment_type === 'mcq' ? (
                              ['Technical', 'Aptitude', 'Soft Skills', 'Communication', 'Psychometric', 'Leadership', 'Data Science', 'DevOps'].map(cat => (
                                <button
                                   key={cat}
                                   className={`cam-category-tag ${newAssessment.category === cat ? 'active' : ''}`}
                                   onClick={() => setNewAssessment({...newAssessment, category: cat})}
                                >
                                   {cat}
                                </button>
                              ))
                            ) : (
                               ['hr', 'technical'].map(type => (
                                <button
                                   key={type}
                                   className={`cam-category-tag ${newAssessment.interview_category === type ? 'active' : ''}`}
                                   onClick={() => setNewAssessment({...newAssessment, interview_category: type, category: type === 'hr' ? 'Soft Skills' : 'Technical'})}
                                >
                                   {type === 'hr' ? 'HR Interview' : 'Technical Interview'}
                                </button>
                               ))
                            )}
                         </div>
                      </div>

                      <div className="cam-row">
                        <div className="cam-field">
                           <label className="cam-label">
                              <TrendingUp size={14} /> Difficulty Level
                           </label>
                           <div className="cam-difficulty-pills">
                              {['Beginner', 'Intermediate', 'Advanced'].map(level => (
                                 <button
                                    key={level}
                                    className={`cam-diff-pill ${newAssessment.difficulty === level ? `active-${level.toLowerCase()}` : ''}`}
                                    onClick={() => setNewAssessment({...newAssessment, difficulty: level})}
                                 >
                                    {level === 'Beginner' ? '🟢' : level === 'Intermediate' ? '🟡' : '🔴'} {level}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="cam-field">
                           <label className="cam-label">
                              <Clock size={14} /> Duration (min)
                           </label>
                           <div className="cam-time-input-wrap">
                              <Clock size={16} className="cam-time-icon" />
                              <input 
                                 type="number" 
                                 className="cam-input cam-time-input"
                                 min="10" max="180"
                                 value={newAssessment.time}
                                 onChange={e => setNewAssessment({...newAssessment, time: e.target.value})}
                              />
                           </div>
                        </div>
                     </div>

                     <div className="cam-field">
                        <label className="cam-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <ShieldCheck size={14} /> Security Rules
                           </div>
                           <span style={{ fontSize: '0.65rem', color: '#6366f1' }}>PROCTORING ENABLED</span>
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                           {newAssessment.proctoring_rules.map((rule, idx) => (
                              <button 
                                 key={idx}
                                 className={`cam-category-tag ${rule.enabled ? 'active' : ''}`}
                                 style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}
                                 onClick={() => {
                                    const updatedRules = [...newAssessment.proctoring_rules];
                                    updatedRules[idx].enabled = !updatedRules[idx].enabled;
                                    setNewAssessment({...newAssessment, proctoring_rules: updatedRules});
                                 }}
                              >
                                 {rule.icon} {rule.text.split(' ')[0]}
                              </button>
                           ))}
                        </div>
                     </div>

                  </div>

                  {/* Modal Footer */}
                  <div className="cam-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9' }}>
                     <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                        <button className="cam-btn-cancel" style={{ flex: 1 }} onClick={() => setCreateAssessmentModal(false)}>Cancel</button>
                        <button 
                           className="cam-btn-create"
                           style={{ flex: 2, background: isGeneratingAI ? '#6366f1' : '', opacity: isGeneratingAI ? 0.7 : 1 }}
                           onClick={handleCreateAssessment}
                           disabled={!newAssessment.title || !newAssessment.category || isGeneratingAI}
                        >
                           {isGeneratingAI ? (
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                               <div className="cam-spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }}></div>
                               <span>{newAssessment.assessment_type === 'mcq' ? 'AI Generating MCQs...' : 'Creating AI Interview...'}</span>
                             </div>
                           ) : (newAssessment.assessment_type === 'mcq' ? 'Publish Assessment' : 'Create AI Interview')}
                        </button>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>


    </motion.div>
  );
};

export default RecruiterDashboard;
