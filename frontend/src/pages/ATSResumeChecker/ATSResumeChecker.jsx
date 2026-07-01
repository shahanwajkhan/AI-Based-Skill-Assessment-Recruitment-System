import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import './ATSResumeChecker.css';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';
import FileUpload from '../../components/FileUpload/FileUpload';
import Button from '../../components/Button/Button';
import { saveLocalResult } from '../../utils/resultStorage';

const ATSResumeChecker = () => {
  const { user, profile, fetchUserProfile } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [useExisting, setUseExisting] = useState(true);
  const [expandedSection, setExpandedSection] = useState('content');

  const getScoreColor = (score) => {
    const s = Number(score);
    if (s >= 80) return '#22c55e'; // Green
    if (s >= 65) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getStatusBadgeClass = (score) => {
    const s = Number(score);
    if (s >= 80) return 'badge-high';
    if (s >= 65) return 'badge-mid';
    return 'badge-low';
  };

  const runAnalysis = async (file = null) => {
    setIsAnalyzing(true);
    setError(null);
    const token = localStorage.getItem('access_token');
    
    const formData = new FormData();
    if (file) {
      formData.append('resume', file);
      formData.append('use_existing_cv', 'false');
    } else {
      formData.append('use_existing_cv', 'true');
    }

    try {
      const response = await fetch(`${API_URL}/users/profile/ats-check/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);

        // Unified persistent save
        saveLocalResult({
          testType: 'Resume ATS Check',
          score: data.score || 0,
          duration: 'Instant',
          aiFeedback: 'Your resume was scored based on ATS parsing rules, keyword density, and formatting compliance.',
          strengths: data.matched_roles ? data.matched_roles.map(r => `Strong fit for ${r.role} (${r.fit_score}%)`) : ['Formatting looks mostly standard.'],
          weaknesses: data.section_analysis?.weak_sections?.map(w => w.issue) || data.formatting_issues || [],
          recommendations: data.overall_suggestions || [],
          skillBreakdown: [
            { skill: 'Keyword Match', score: data.detailed_analysis?.keyword_match?.score || 0 },
            { skill: 'Formatting', score: data.detailed_analysis?.formatting?.score || 0 },
            { skill: 'Section Completeness', score: data.detailed_analysis?.section_completeness?.score || 0 }
          ]
        });
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to analyze resume.');
      }
    } catch (err) {
      console.error('ATS Analysis Error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="ats-loading-view">
        <div className="ats-loader-container">
          <div className="spinner lg"></div>
          <h2>AI is analyzing your resume...</h2>
          <p>We're checking formatting, keywords, and ATS alignment.</p>
        </div>
      </div>
    );
  }

  if (report) {
    return (
      <div className="ats-results-view animate-fade-in">
        <div className="results-header">
          <Button variant="secondary" size="sm" onClick={() => setReport(null)}>← Back to Checker</Button>
          <div className="header-text">
            <h2>ATS Compatibility Report</h2>
            <p className="subtitle">Detailed AI Performance Analysis</p>
          </div>
        </div>

        <div className="ats-main-grid">
          {/* Left Column: Sticky Score & Overview */}
          <div className="ats-left-col">
            <div className="ats-score-card premium-sidebar">
              <div className="score-summary-header">
                <h3>Your Score</h3>
                <div className="score-main-value" style={{ color: getScoreColor(report.score) }}>
                  {report.score}/100
                </div>
                <p className="issue-count">{report.total_issues || 0} Issues</p>
              </div>

              <div className="sidebar-divider" />

              <div className="analysis-accordion">
                {report?.detailed_analysis ? Object.entries(report.detailed_analysis).map(([key, section]) => (
                  <div key={key} className={`accordion-section ${expandedSection === key ? 'active' : ''}`}>
                    <div 
                      className="accordion-header" 
                      onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                    >
                      <div className="header-left">
                        <span className="section-title">{key.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <div className="header-right">
                        <span className={`score-pill ${getStatusBadgeClass(section?.score || 0)}`}>
                          {section?.score !== undefined ? `${section.score}%` : '??%'}
                        </span>
                        {expandedSection === key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {expandedSection === key && section?.checks && (
                      <div className="accordion-content">
                        {section.checks.map((check, idx) => (
                          <div key={idx} className="check-item">
                            <div className="check-label-wrap">
                              {check?.status === 'pass' ? 
                                <Check size={16} className="text-emerald-500" /> : 
                                <X size={16} className="text-rose-500" />
                              }
                              <span className="check-label">{check?.label || 'Unknown Check'}</span>
                            </div>
                            <span className={`issue-pill ${check?.status === 'pass' ? 'pass' : 'fail'}`}>
                              {check?.issue_text || 'No issues'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="p-4 text-center text-slate-500">
                    Analysis breakdown not available.
                  </div>
                )}
              </div>

              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setReport(null)} 
                className="mt-8 w-full btn-colorful"
              >
                Re-Analyze Resume
              </Button>
            </div>
          </div>

          {/* Right Column: Detailed Feedback cards */}
          <div className="ats-right-col">
            {/* Analysis Sections */}
            <div className="analysis-card">
              <div className="card-header">
                <div className="icon-box">🔑</div>
                <h4>Keyword Optimization</h4>
              </div>
              <div className="card-content">
                <h5>Missing Impact Keywords:</h5>
                <div className="chip-container">
                  {report.keyword_optimization?.missing_keywords?.map(kw => <span key={kw} className="chip">{kw}</span>)}
                  {(!report.keyword_optimization?.missing_keywords || report.keyword_optimization.missing_keywords.length === 0) && <span className="success-text">Industry standard keywords detected!</span>}
                </div>
                <div className="optimization-advice mt-4">
                  <h6>Implementation Advice:</h6>
                  <p className="fb-suggestion">{report.keyword_optimization?.suggestions}</p>
                </div>
              </div>
            </div>

            <div className="analysis-card">
              <div className="card-header">
                <div className="icon-box">📏</div>
                <h4>Formatting & Structure</h4>
              </div>
              <div className="card-content">
                <ul className="fb-list premium-list">
                  {report.formatting_issues?.map((issue, idx) => (
                    <li key={idx} className="issue-item">
                      <span className="dot"></span>
                      {issue}
                    </li>
                  ))}
                  {(!report.formatting_issues || report.formatting_issues.length === 0) && <li className="success-msg">Your structure is highly ATS-compatible.</li>}
                </ul>
              </div>
            </div>

            {report.matched_roles && (
              <div className="analysis-card">
                <div className="card-header">
                  <div className="icon-box">🎯</div>
                  <h4>Recommended Job Roles</h4>
                </div>
                <div className="roles-grid">
                  {report.matched_roles.map((item, idx) => (
                    <div key={idx} className="role-list-card">
                      <div className="role-info-main">
                        <div className="role-avatar">💼</div>
                        <div className="role-text">
                          <h5>{item.role}</h5>
                          <p>{item.reasoning}</p>
                        </div>
                      </div>
                      <div className="role-meta">
                        <span className={`fit-badge ${getStatusBadgeClass(item.fit_score)}`}>{item.fit_score}% Fit</span>
                        <Button size="sm" variant="secondary" onClick={() => window.location.href = '/skill-gap'}>View Roadmap</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="analysis-card">
              <div className="card-header">
                <div className="icon-box">📉</div>
                <h4>Section Analysis</h4>
              </div>
              <div className="card-content">
                {report.section_analysis?.missing_sections?.length > 0 && (
                  <div className="mb-6">
                    <h5 className="danger-text">Critical Sections Missing:</h5>
                    <div className="chip-container">
                      {Array.isArray(report.section_analysis.missing_sections) 
                        ? report.section_analysis.missing_sections.map(s => <span key={s} className="chip danger">{s}</span>)
                        : <span className="chip danger">{report.section_analysis.missing_sections}</span>
                      }
                    </div>
                  </div>
                )}
                <h5>Required Enhancements:</h5>
                <div className="enhancement-stack">
                  {report.section_analysis?.weak_sections?.map((item, idx) => (
                    <div key={idx} className="enhancement-item">
                      <div className="enhancement-header">
                        <span className="section-name">{item.section}</span>
                      </div>
                      <p className="enhancement-detail">{item.issue}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="analysis-card">
              <div className="card-header">
                <div className="icon-box">🚀</div>
                <h4>Action Plan for Optimization</h4>
              </div>
              <div className="action-grid">
                  {report.overall_suggestions?.map((sug, idx) => (
                    <div key={idx} className="action-item">
                      <span className="action-num">{idx + 1}</span>
                      <p>{sug}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ats-checker-container fade-in">
      <div className="page-header">
        <h1>Smart ATS Resume Checker</h1>
        <p>Optimize your resume for applicant tracking systems and land more interviews.</p>
      </div>

      <div className="ats-checker-card ps-card">
        <div className="checker-options">
          <button 
            className={`option-btn ${useExisting ? 'active' : ''}`}
            onClick={() => setUseExisting(true)}
          >
            Check Existing CV
          </button>
          <button 
            className={`option-btn ${!useExisting ? 'active' : ''}`}
            onClick={() => setUseExisting(false)}
          >
            Upload New Resume
          </button>
        </div>

        <div className="checker-form">
          {useExisting ? (
            <div className="existing-cv-check">
              {profile?.resume ? (
                <div className="cv-preview-box">
                  <div className="cv-icon">📄</div>
                  <div className="cv-details">
                    <p>Current Resume: <strong>{profile.resume.split('/').pop()}</strong></p>
                    <span>Last updated recently</span>
                  </div>
                  <Button onClick={() => runAnalysis()}>Start AI Analysis</Button>
                </div>
              ) : (
                <div className="no-cv-msg">
                  <p>No resume found in your profile. Please upload one first.</p>
                  <Button variant="secondary" onClick={() => setUseExisting(false)}>Upload New Resume</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="new-cv-upload">
              <p className="mb-4">Upload your PDF or DOCX resume to get instant AI feedback.</p>
              <FileUpload 
                label="Select Resume File"
                accept=".pdf,.doc,.docx"
                maxMb={5}
                onChange={(file) => runAnalysis(file)}
              />
            </div>
          )}
        </div>
        
        {error && <div className="ats-error-box mt-4">{error}</div>}
      </div>

      <div className="ats-benefits-grid mt-8">
        <div className="benefit-item">
          <span className="benefit-icon">✨</span>
          <h4>Instant Scoring</h4>
          <p>Get a real-time compatibility score based on industry standards.</p>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">🎯</span>
          <h4>Keyword Mapping</h4>
          <p>Identify missing keywords critical for your target job roles.</p>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">🛠️</span>
          <h4>Formatting Fixes</h4>
          <p>Detect hidden formatting errors that cause ATS rejection.</p>
        </div>
      </div>
    </div>
  );
};

export default ATSResumeChecker;
