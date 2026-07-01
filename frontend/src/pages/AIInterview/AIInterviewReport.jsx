import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button/Button';
import './AIInterview.css';
import LearningRoadmap from '../../components/LearningRoadmap/LearningRoadmap';

const AIInterviewReport = ({ data, onFinish, sessionId }) => {
  const navigate = useNavigate();
  const { 
      score = 0, 
      communication = 0, 
      technicalDepth = 0, 
      confidence = 0,
      answerQuality = 0,
      problemSolving = 0,
      feedback = '',
      strengths = [],
      improvements = [],
      responses = [],
      roadmap = null
  } = data || {};

  const metrics = [
    { label: 'Technical Depth', value: technicalDepth, color: '#89b4fa', icon: '💻', desc: 'Core knowledge' },
    { label: 'Communication', value: communication, color: '#f5c2e7', icon: '🗣️', desc: 'Articulation' },
    { label: 'Confidence', value: confidence, color: '#a6e3a1', icon: '💎', desc: 'Poise & Flow' },
    { label: 'Problem Solving', value: problemSolving, color: '#fab387', icon: '🧠', desc: 'Logic quality' }
  ];

  return (
    <div className="interview-report-premium fade-in">
        <div className="report-header-v2">
            <div className="report-badge">AI ANALYSIS COMPLETE</div>
            <h1>Performance Dashboard</h1>
            <p>A deep dive into your technical interview performance.</p>
        </div>

        <div className="report-stats-grid">
            {/* Main Score Circular */}
            <div className="report-card main-score-viz">
                <div className="circular-progress-wrap">
                    <svg viewBox="0 0 36 36" className="circular-chart-v2">
                        <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle-fill" strokeDasharray={`${score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" className="percentage-text" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{score}%</text>
                    </svg>
                </div>
                <div className="score-label">Overall Readiness</div>
            </div>

            {/* Metric Cards */}
            <div className="metrics-cards-container">
                {metrics.map((m, i) => (
                    <div key={i} className="mini-metric-card" style={{ '--accent': m.color }}>
                        <div className="mm-icon">{m.icon}</div>
                        <div className="mm-body">
                            <span className="mm-label">{m.label}</span>
                            <div className="mm-val-row">
                                <span className="mm-value">{m.value}/10</span>
                                <span className="mm-desc">{m.desc}</span>
                            </div>
                            <div className="mm-bar-bg">
                                <div className="mm-bar-fill" style={{ width: `${m.value * 10}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="report-detailed-grid">
            <div className="report-card ai-summary-card">
                <div className="card-header-v3">
                    <span className="ai-status-dot"></span>
                    <h3>AI Executive Summary</h3>
                </div>
                <div className="summary-content-v3">
                   <p>{feedback || 'You demonstrated strong fundamental knowledge with clear growth potential in architectural scaling.'}</p>
                    <div className="summary-tags-v3">
                       {strengths.slice(0, 4).map((s, i) => (
                           <span key={i} className="report-tag-v3">
                               <span className="tag-hash">#</span>{s}
                           </span>
                       ))}
                    </div>
                </div>
            </div>

            <div className="report-card strengths-card">
                <h3><span className="icon">✅</span> Key Strengths</h3>
                <ul>
                    {strengths.map((s, i) => <li key={i}>{s}</li>)}
                    {strengths.length === 0 && (
                        <>
                            <li>Detailed articulating of technical concepts</li>
                            <li>Confident delivery of project experiences</li>
                        </>
                    )}
                </ul>
            </div>

            <div className="report-card improvements-card">
                <h3><span className="icon">📈</span> Growth Areas</h3>
                <ul>
                    {improvements.map((s, i) => <li key={i}>{s}</li>)}
                    {improvements.length === 0 && (
                        <>
                            <li>Elaborate more on trade-off analysis</li>
                            <li>Include specific performance metrics in examples</li>
                        </>
                    )}
                </ul>
            </div>
        </div>

        <div className="transcript-section-v2">
            <div className="ts-header">
                <h3>Full Session Transcript</h3>
                <span>{responses.length} Questions Evaluated</span>
            </div>
            <div className="ts-timeline">
                {responses.map((item, idx) => (
                    <div key={idx} className="ts-item">
                        <div className="ts-q">
                            <span className="ts-label">Question {idx + 1}</span>
                            <p>{item.question}</p>
                        </div>
                        <div className="ts-a">
                            <p>{item.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {roadmap && <LearningRoadmap roadmap={roadmap} title="Your 4-Week Interview Prep Plan" />}

        <div className="report-actions-v2">
            <button className="st-btn-primary btn-finish-premium" onClick={onFinish}>Back to Dashboard</button>
            <button 
                className="btn-finish-premium" 
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', border: 'none' }}
                onClick={() => navigate(`/skill-gap-analysis?type=ai_interview&source_id=${sessionId}`)}
            >
                View Detailed Skill Gap Analysis
            </button>
            <button className="btn-download-pdf" onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
    </div>
  );
};

export default AIInterviewReport;
