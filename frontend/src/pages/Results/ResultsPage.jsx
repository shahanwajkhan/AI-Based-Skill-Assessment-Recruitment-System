import React, { useState, useEffect, useRef } from 'react';
import Chart from '../../components/Chart/Chart';
import Button from '../../components/Button/Button';
import './ResultsPage.css';
import LearningRoadmap from '../../components/LearningRoadmap/LearningRoadmap';
import CareerRecommendation from '../../components/CareerRecommendation/CareerRecommendation';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useNotifications } from '../../context/NotificationContext';
import { Shield, Brain, Target, Award, Clock, Download, Share2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ResultsPage = ({ result, history = [], onBack, onViewPast }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { addNotification } = useNotifications();
  const hasNotified = useRef(false);

  useEffect(() => {
    if (result && !hasNotified.current) {
      addNotification({
        type: 'test',
        icon: '✅',
        title: 'Assessment Completed!',
        desc: `You scored ${result.score}% in ${result.assessment?.title || result.testType}. Check your report below.`,
        section: 'results',
        role: 'student'
      });
      hasNotified.current = true;
    }
  }, [result, addNotification]);

  if (!result) return (
    <div className="results-page-loading">
      <div className="premium-loader"></div>
      <p>Analyzing Performance Dynamics...</p>
    </div>
  );

  // Normalize data from both Backend and LocalStorage
  const score = result.score || 0;
  const testTitle = result.assessment?.title || result.testType || 'Skill Assessment';
  const displayDate = result.completed_at 
    ? new Date(result.completed_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : `${result.date} ${result.time}`;
  
  const skillBreakdown = result.skill_breakdown || result.skillBreakdown || [];
  const aiFeedback = result.aiFeedback || result.feedback || result.proctoring_summary?.ai_feedback || "Overall performance was evaluated based on accuracy and technical depth.";
  const recommendations = result.recommendations || result.ai_suggestions || [];
  const strengths = result.strengths || [];
  const weaknesses = result.weaknesses || result.improvements || [];
  const duration = result.duration || (result.time_taken ? `${Math.round(result.time_taken / 60)}m` : 'N/A');
  const integrity = result.proctoring_summary?.integrity || 100;

  const getScoreColor = (s) => {
    if (s >= 80) return '#10b981'; // Emerald
    if (s >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Rose
  };

  const handleDownload = async () => {
    if (isGeneratingPDF) return;
    try {
      setIsGeneratingPDF(true);
      const element = document.querySelector('.results-container');
      const actionButtons = document.querySelectorAll('.header-actions, .results-footer, .back-link');
      actionButtons.forEach(btn => btn.style.display = 'none');

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
      actionButtons.forEach(btn => btn.style.display = '');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SkillGuard_${testTitle.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (error) {
       console.error('PDF Error:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="results-page fade-in">
      <div className="premium-bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <div className="results-container">
        {/* Navigation & Actions */}
        <header className="report-header">
          <button className="back-link" onClick={onBack}>
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="header-main-info">
             <div className="test-badge">{result.testType || 'Proctored Assessment'}</div>
             <h1>{testTitle}</h1>
             <p className="completion-date">Completed on {displayDate} • Duration: {duration}</p>
          </div>

          <div className="header-actions">
            <Button onClick={handleDownload} variant="secondary" size="sm">
              <Download size={16} /> Download PDF
            </Button>
            <Button onClick={() => {}} variant="primary" size="sm" className="share-btn-glow">
              <Share2 size={16} /> Share Report
            </Button>
          </div>
        </header>

        <div className="report-main-content">
          {/* Full-Width Score Hero Card */}
          <section className="report-card score-hero-card hero-full-width premium-border">
            <div className="score-viz">
              <div className="circular-progress-container">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle-fill" 
                    strokeDasharray={`${score}, 100`} 
                    stroke={getScoreColor(score)}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  />
                </svg>
                <div className="score-value">
                  <span className="number">{score}%</span>
                  <span className="label">Overall Rank</span>
                </div>
              </div>
            </div>
            <div className="score-narrative">
              <div className="status-indicator" style={{ backgroundColor: `${getScoreColor(score)}15`, color: getScoreColor(score) }}>
                <CheckCircle2 size={16} />
                <span>{score >= 80 ? 'Mastery Level' : score >= 60 ? 'Professional' : 'Development Required'}</span>
              </div>
              <h3>Performance Summary</h3>
              <p className="ai-feedback-text">{aiFeedback}</p>
              <div className="quick-stats">
                <div className="q-stat"><Clock size={14}/> <span>{duration}</span></div>
                <div className="q-stat"><Shield size={14}/> <span>{integrity}% Integrity</span></div>
                <div className="q-stat"><Award size={14}/> <span>Verified</span></div>
              </div>
            </div>
          </section>

          <div className="report-secondary-grid">
            {/* Competency Breakdown */}
            <section className="report-card breakdown-card premium-border">
              <div className="card-header-v2">
                <div className="icon-box"><Target size={20} /></div>
                <h3>Competency Breakdown</h3>
              </div>
              <div className="skill-meter-stack">
                {skillBreakdown.length > 0 ? skillBreakdown.map((s, idx) => (
                  <div key={idx} className="skill-meter-item">
                    <div className="meter-label-wrap">
                      <span className="meter-name">{s.skill}</span>
                      <span className="meter-val">{s.score}%</span>
                    </div>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${s.score}%`, backgroundColor: getScoreColor(s.score) }}></div>
                    </div>
                  </div>
                )) : (
                  <div className="empty-state-mini">No skill data detected.</div>
                )}
              </div>
            </section>

            {/* AI Insights & Analysis */}
            <section className="report-card ai-insights-card premium-border">
              <div className="card-header-v2">
                <div className="icon-box ai-icon"><Brain size={20} color="#8b5cf6" /></div>
                <h3>Detailed AI Analysis</h3>
              </div>
              
              <div className="sw-grid-v2">
                <div className="sw-item-v2 strength">
                  <div className="sw-tag">🌟 STRENGTHS</div>
                  <ul>
                    {strengths.length > 0 ? strengths.slice(0, 3).map((s, i) => <li key={i}>{s}</li>) : <li>Fundamental Technical Accuracy</li>}
                  </ul>
                </div>
                <div className="sw-item-v2 weakness">
                  <div className="sw-tag">⚡ GROWTH AREAS</div>
                  <ul>
                    {weaknesses.length > 0 ? weaknesses.slice(0, 3).map((w, i) => <li key={i}>{w}</li>) : <li>Complexity Benchmarking</li>}
                  </ul>
                </div>
              </div>

              <div className="strategic-advice-stack">
                <div className="advice-label">💡 Strategic Recommendations</div>
                <div className="advice-items">
                  {recommendations.slice(0, 3).map((rec, i) => (
                    <div key={i} className="advice-card">
                      <div className="advice-bullet" style={{ backgroundColor: getScoreColor(score) }}></div>
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrity Shield (Internalized) */}
              <div className="integrity-footer-pill">
                <Shield size={18} color="#10b981" />
                <span>Verified Assessment Integrity: {integrity}%</span>
              </div>
            </section>
          </div>
        </div>

        {/* Dynamic Roadmap (If exists) */}
        {result.roadmap && (
          <div className="report-roadmap-section premium-border">
             <LearningRoadmap roadmap={result.roadmap} resultId={result.id || result.completed_at || result.date} />
          </div>
        )}

        {/* Global Action Footer */}
        <footer className="report-footer">
          <Button onClick={onBack} variant="outline" size="lg">Return to Dashboard</Button>
          <Button onClick={() => window.location.reload()} variant="primary" size="lg">Retake Assessment</Button>
        </footer>
      </div>
    </div>
  );
};

export default ResultsPage;

