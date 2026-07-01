
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { 
  Target, GraduationCap, Map, Link as LinkIcon, 
  ChevronRight, BrainCircuit, Activity, BarChart3,
  Award, Clock, AlertTriangle, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../utils/api';
import './SkillGapAnalysis.css';

const SkillGapAnalysis = ({ embedded = false, forcedSourceId = null, forcedSourceType = null, preloadedAnalysis = null }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const analysisId = searchParams.get('id');
  const sourceId = searchParams.get('source_id');
  const sourceType = searchParams.get('type');

  useEffect(() => {
    if (preloadedAnalysis) {
      setAnalysis(preloadedAnalysis);
      setLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      const token = localStorage.getItem('access_token');
      try {
        let url = '';
        let method = 'GET';
        let body = null;

        if (analysisId) {
          url = `${API_URL}/skill-gap-analysis/${analysisId}/`;
        } else if ((sourceId || forcedSourceId) && (sourceType || forcedSourceType)) {
          url = `${API_URL}/skill-gap-analysis/generate/`;
          method = 'POST';
          body = JSON.stringify({
            source_type: sourceType || forcedSourceType,
            source_id: sourceId || forcedSourceId
          });
        } else {
          // No ID provided, fetch the latest analysis
          url = `${API_URL}/skill-gap-analysis/`;
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            if (data.length > 0) {
              const latest = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
              setAnalysis(latest);
            } else {
              setAnalysis(null);
            }
          } else {
            setAnalysis(data);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching analysis:", error);
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId, sourceId, sourceType, navigate, forcedSourceId, forcedSourceType, preloadedAnalysis]);

  if (loading) {
    return (
      <div className={embedded ? "skill-gap-embedded-container" : "loader-container"} style={embedded ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' } : {}}>
        <div className="spinner"></div>
        <h2>Analyzing your skills...</h2>
        <p>Our AI is generating your personalized career roadmap.</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={embedded ? "skill-gap-embedded-container" : "loader-container"} style={embedded ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' } : {}}>
        <AlertTriangle size={64} color="#ef4444" />
        <h2 style={{ marginTop: '1rem', marginBottom: '1rem' }}>Analysis Not Found</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>You haven't completed any assessments or interviews yet.</p>
        {!embedded && <button className="back-btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>}
      </div>
    );
  }

  // Safely parse JSON fields
  const parseJSON = (data, fallback) => {
    if (!data) return fallback;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch(e) { return fallback; }
    }
    return data;
  };

  const skillBreakdown = parseJSON(analysis.skill_breakdown, {});
  const identifiedGaps = parseJSON(analysis.identified_gaps, []);
  const roadmapData = parseJSON(analysis.roadmap, []);
  const recommendationsData = parseJSON(analysis.recommendations, []);

  // Format data for Recharts
  const chartData = Object.entries(skillBreakdown).map(([skill, score]) => ({
    subject: skill,
    A: score,
    fullMark: 100,
  }));

  return (
    <div className={embedded ? "skill-gap-embedded-container" : "skill-gap-container"}>
      <motion.div 
        className="skill-gap-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <header className="analysis-header">
          <div className="badge-source">{(analysis.source_type || 'System Analysis').replace('_', ' ')}</div>
          <h1>{analysis.skill_level || 'Beginner'} Level Skills</h1>
          <p>
            We've analyzed your performance and identified key areas for improvement 
            to help you reach the next level in your career.
          </p>
        </header>

        {/* Dashboard Grid */}
        <div className="analysis-grid">
          {/* Skill Radar */}
          <motion.div 
            className="glass-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="card-title">
              <BarChart3 className="text-blue-400" />
              Skill Intensity Map
            </div>
            <div className="radar-container">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="45%" outerRadius="72%" data={chartData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} cx="50%" cy="50%" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Skills"
                    dataKey="A"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Identified Gaps */}
          <motion.div 
            className="glass-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card-title">
              <Target className="text-red-400" />
              Critical Skill Gaps
            </div>
            <div className="gaps-list">
              {identifiedGaps.map((gap, idx) => {
                const isObject = typeof gap === 'object' && gap !== null;
                return (
                  <div key={idx} className={`gap-item ${isObject ? 'gap-item-detailed' : ''}`}>
                    <div className="gap-indicator">
                      <div className="gap-dot"></div>
                    </div>
                    <div className="gap-content">
                      <div className="gap-main">
                        <span className="gap-skill">{isObject ? gap.skill : gap}</span>
                        {isObject && gap.detected_on && (
                          <span className="gap-meta">
                            <Clock size={12} /> {gap.detected_on}
                          </span>
                        )}
                      </div>
                      {isObject && gap.correction_plan && (
                        <div className="gap-correction">
                          <AlertTriangle size={14} className="text-amber-400" />
                          <p><strong>Correction Plan:</strong> {gap.correction_plan}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {identifiedGaps.length === 0 && <p>No major gaps identified. Excellent job!</p>}
            </div>
          </motion.div>
        </div>

        {/* Analysis Summary */}
        <motion.div 
          className="glass-card mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-title">
            <BrainCircuit className="text-purple-400" />
            Strategic Performance Analysis
          </div>
          <div className="summary-container">
            {analysis.summary}
          </div>
        </motion.div>


        {/* Smart Recommendations */}
        <section className="roadmap-section">
          <div className="card-title">
            <GraduationCap className="text-indigo-400" />
            Recommended Resources
          </div>
          <div className="recommendations-grid">
            {recommendationsData.map((res, idx) => (
              <motion.a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="resource-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + (idx * 0.1) }}
              >
                <span className="resource-type">{res.type}</span>
                <div className="flex items-start justify-between">
                  <span className="resource-title">{res.title}</span>
                  <LinkIcon size={16} className="text-slate-500" />
                </div>
              </motion.a>
            ))}
          </div>
        </section>

        <div className="flex justify-center mt-12 mb-20">
          <button 
            className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SkillGapAnalysis;
