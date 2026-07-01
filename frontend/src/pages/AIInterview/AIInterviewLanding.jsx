import React, { useState, useRef } from 'react';
import Button from '../../components/Button/Button';
import './AIInterview.css';
import { API_URL } from '../../utils/api';

const AIInterviewLanding = ({ onStart }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [existingCV, setExistingCV] = useState(null);
  const [isCheckingCV, setIsCheckingCV] = useState(true);
  const [showUploadAnyway, setShowUploadAnyway] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (fileToSet) => {
    setError(null);
    if (!fileToSet) return;
    
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(fileToSet.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }

    if (fileToSet.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB.');
      return;
    }

    setFile(fileToSet);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Check for existing CV on mount
  React.useEffect(() => {
    const checkCV = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/ai-interview/cv-status/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.exists) {
          setExistingCV(data);
        }
      } catch (err) {
        console.error("Failed to check CV status", err);
      } finally {
        setIsCheckingCV(false);
      }
    };
    checkCV();
  }, []);

  const handleSubmit = async (useExistingId = null) => {
    if (!file && !useExistingId) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    if (useExistingId) {
      formData.append('analysis_id', useExistingId);
    } else {
      formData.append('cv_file', file);
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/ai-interview/start/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Smooth transition simulation
        setTimeout(() => {
          setIsUploading(false);
          setAnalyzedData(data);
        }, 1500);
      } else {
        setIsUploading(false);
        setError(data.error || 'Failed to start interview');
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || 'Connection error');
      setIsUploading(false);
    }
  };

  const handleConfirmStart = () => {
    if (onStart && analyzedData) {
        onStart({ 
          step: 'system-check', 
          session_id: analyzedData.session_id,
          first_question: analyzedData.first_question,
          topic: analyzedData.topic,
          skills: analyzedData.skills
        });
    }
  };

  const StepIndicator = ({ current }) => (
    <div className="landing-step-indicator">
      <div className={`l-step ${current > 1 ? 'done' : ''} ${current === 1 ? 'active' : ''}`}>
        <div className="l-step-num">{current > 1 ? '✓' : '1'}</div>
        <span className="l-step-label">Resume</span>
      </div>
      <div className={`l-step ${current > 2 ? 'done' : ''} ${current === 2 ? 'active' : ''}`}>
        <div className="l-step-num">{current > 2 ? '✓' : '2'}</div>
        <span className="l-step-label">Hardware</span>
      </div>
      <div className={`l-step ${current === 3 ? 'active' : ''} ${current > 3 ? 'done' : ''}`}>
        <div className="l-step-num">{current > 3 ? '✓' : '3'}</div>
        <span className="l-step-label">Interview</span>
      </div>
    </div>
  );

  const BrainAnimation = () => (
    <div className="ai-brain-anim-wrap">
      <svg className="brain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.5 2C7.567 2 6 3.567 6 5.5c0 .341.049.669.14 1.01a3.5 3.5 0 1 0 1.71 6.84 3.5 3.5 0 1 0 6.3 0 3.5 3.5 0 1 0 1.71-6.84c.09-.341.14-.669.14-1.01C16 3.567 14.433 2 12.5 2S9.5 3.567 9.5 5.5"></path>
        <path d="M12 12v10"></path>
        <path d="M8 17l4 4 4-4"></path>
      </svg>
      <div className="analysis-status-text">
        Analyzing Resume<span className="typing-dot">.</span><span className="typing-dot">.</span><span className="typing-dot">.</span>
      </div>
    </div>
  );

  return (
    <div className="interview-landing-premium">
      <div className="ai-bg-glow" />
      <div className="ai-bg-glow-alt" />

      <StepIndicator current={analyzedData ? 2 : 1} />

      <div className="landing-card-elevated fade-in">
        {isCheckingCV ? (
          <div className="ai-brain-anim-wrap">
            <div className="thinking-dots"><span></span><span></span><span></span></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Checking for existing resume...</p>
          </div>
        ) : !isUploading && !analyzedData && (
          <div className="hero-heading-reveal">
            {existingCV && !showUploadAnyway ? (
              <div className="welcome-back-cv">
                <div className="success-icon-wrap" style={{ margin: '0 auto 1.5rem', background: 'rgba(92, 92, 252, 0.1)', color: 'var(--primary)' }}>
                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <h2>Welcome Back!</h2>
                <p className="hero-desc">We found your previously analyzed resume: <br/><strong>{existingCV.file_name}</strong></p>
                
                <div className="existing-cv-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
                  <Button className="btn-start-interview-glow" onClick={() => handleSubmit(existingCV.id)}>
                    Continue with Existing CV ➔
                  </Button>
                  <button className="re-upload-btn" onClick={() => setShowUploadAnyway(true)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                    Upload a Different Resume
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1>AI Powered Interview Simulator</h1>
                <p className="hero-desc">Upload your resume and start a personalized AI-powered technical interview tailored to your expertise.</p>

                <div 
                    className={`premium-upload-zone ${file ? 'has-file' : ''} ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleUploadClick}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept=".pdf,.docx" 
                    style={{ display: 'none' }} 
                  />
                  
                  <div className="p-upload-icon-wrap">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  
                  <div className="p-upload-text">
                    <h4>{file ? file.name : 'Upload Resume (PDF/DOCX)'}</h4>
                    <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze` : 'Drag & drop your file here, or click to browse'}</p>
                  </div>
                </div>

                {error && <div className="error-message" style={{ color: 'var(--error)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</div>}

                <div className="upload-actions">
                  <Button 
                    className="btn-start-interview-glow" 
                    onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
                    disabled={!file || isUploading}
                  >
                    Start AI Analysis ➔
                  </Button>
                  {existingCV && (
                    <button className="re-upload-btn" onClick={() => setShowUploadAnyway(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', marginTop: '1rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                       Back to existing CV
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {isUploading && <BrainAnimation />}

        {analyzedData && (
          <div className="analysis-result-view fade-in">
            <div className="analysis-header">
              <div className="success-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2>Ready to Begin!</h2>
              <p>We've analyzed <strong>{file?.name || existingCV?.file_name}</strong> and identified your core competencies.</p>
            </div>

            <div className="skills-preview-v2">
              <h4>Extracted Skills:</h4>
              <div className="skill-cloud-v2">
                {analyzedData.skills && analyzedData.skills.map((skill, idx) => (
                  <span key={idx} className="premium-skill-tag" style={{ animationDelay: `${idx * 0.1}s` }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="confirmation-actions">
                <Button onClick={handleConfirmStart} className="btn-start-interview-glow">
                  Initialize Interview Env ➔
                </Button>
                <button className="re-upload-btn" onClick={() => { setAnalyzedData(null); setFile(null); }}>
                  Upload Different Resume
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInterviewLanding;
