import { useState, useEffect, useRef } from 'react';
import './AIConfidenceAnalyzer.css';
import { API_URL } from '../../utils/api';
import Button from '../../components/Button/Button';
import { saveLocalResult } from '../../utils/resultStorage';

const TOPICS = [
  "Tell me about yourself and your background.",
  "Describe your greatest professional strength.",
  "What is your biggest weakness and how do you handle it?",
  "Why should we hire you for your dream role?",
  "Describe a time you solved a complex problem.",
  "Where do you see yourself in 5 years?",
  "Talk about a project you are most proud of.",
  "Why are you passionate about your chosen career path?"
];

const AIConfidenceAnalyzer = () => {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds target
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const startTimeRef = useRef(null);

  // Speech Recognition Setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setError(null);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        setError("Microphone access denied. Please enable mic permissions in your browser settings.");
      } else {
        setError(`Error: ${event.error}. Please try again.`);
      }
      setIsRecording(false);
    };

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        setTranscript(prev => prev + (prev ? ' ' : '') + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      // If we are still supposed to be recording, restart it
      // This handles the browser's auto-stop after silence
      if (window.isRecordingActive) {
        try { recognition.start(); } catch (e) { /* already started */ }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval;
    if (isRecording && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRecording) {
      stopRecording();
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  const handleRefreshTopic = () => {
    const next = TOPICS[(TOPICS.indexOf(activeTopic) + 1) % TOPICS.length];
    setActiveTopic(next);
  };

  const startRecording = () => {
    setTranscript('');
    setInterimTranscript('');
    setReport(null);
    setError(null);
    setIsRecording(true);
    window.isRecordingActive = true;
    setTimeLeft(45);
    startTimeRef.current = Date.now();

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Recognition start error", e);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    window.isRecordingActive = false;
    if (recognitionRef.current) recognitionRef.current.stop();
    
    // Auto-analyze after a short delay
    setTimeout(() => {
      analyzeConfidence();
    }, 1000);
  };

  const analyzeConfidence = async () => {
    const finalTranscript = (transcript + ' ' + interimTranscript).trim();
    if (!finalTranscript) {
      setError("No speech detected. Please try speaking louder or check your mic.");
      return;
    }

    setIsAnalyzing(true);
    const duration = Math.max(1, (Date.now() - startTimeRef.current) / 1000);
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${API_URL}/users/profile/confidence-check/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transcript: finalTranscript,
          duration: duration
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);

        // Unified persistent save
        saveLocalResult({
          testType: 'Confidence Analyzer',
          score: data.overall_confidence_score,
          duration: `${Math.round(duration)}s`,
          aiFeedback: data.ai_feedback,
          strengths: data.strengths || [],
          weaknesses: data.improvements || [],
          recommendations: data.improvements || [],
          skillBreakdown: [
            { skill: 'Fluency', score: data.metrics?.fluency_score || 0 },
            { skill: 'Hesitation Control', score: (100 - (data.metrics?.hesitation_score || 0)) },
            { skill: 'Clarity', score: data.clarity_rating === 'High' ? 90 : data.clarity_rating === 'Low' ? 40 : 65 }
          ]
        });
      } else {
        setError("Failed to analyze your confidence. Please try again.");
      }
    } catch (err) {
      setError("Network error. Could not connect to analysis service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setReport(null);
    setTranscript('');
    setError(null);
    setTimeLeft(45);
  };

  return (
    <div className="confidence-analyzer-container fade-in">
      <div className="confidence-intro">
        <h1>Check Your Speaking Confidence</h1>
        <p>Speak for a few seconds and let AI analyze your confidence, communication, and speaking style.</p>
      </div>

      {!report ? (
        <div className="confidence-main-card">
          <div className="topic-selector">
            <h3>Current Prompt</h3>
            <div className="current-topic-box">
              <span className="topic-text">{activeTopic}</span>
              <button 
                className="refresh-topic-btn" 
                onClick={handleRefreshTopic} 
                title="New Topic"
                disabled={isRecording || isAnalyzing}
              >
                🔄
              </button>
            </div>
          </div>

          <div className="recording-interaction">
            <div className="mic-container">
              <button 
                className={`record-btn ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
            </div>

            {isRecording && (
              <div className="recording-status">
                <div className="sound-waves">
                  {[...Array(6)].map((_, i) => <div key={i} className="wave-bar" />)}
                </div>
                <div className="status-text">LISTENING...</div>
                <div className="timer-box">{timeLeft}s</div>
                <div className="live-transcript-preview">
                  {transcript} <span className="interim-text">{interimTranscript}</span>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="analyzing-state">
                <div className="spinner"></div>
                <p>AI is analyzing your voice patterns...</p>
              </div>
            )}

            {!isRecording && !isAnalyzing && (
              <p className="hint-text">Click the microphone to start your 45-second practice</p>
            )}

            {error && <div className="error-msg">{error}</div>}
          </div>
        </div>
      ) : (
        <div className="report-section">
          <h2>Your Confidence Report</h2>
          <div className="report-grid">
            <div className="report-summary-card">
              <div className="score-circle">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle" 
                    strokeDasharray={`${report.overall_confidence_score}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    style={{ stroke: report.overall_confidence_score >= 80 ? '#10b981' : report.overall_confidence_score >= 50 ? '#f59e0b' : '#ef4444' }}
                  />
                  <text x="18" y="18" className="percentage" dominantBaseline="middle" textAnchor="middle">{report.overall_confidence_score}%</text>
                </svg>
              </div>
              <h3>Overall Confidence</h3>
              <p className="ai-summary-text">{report.ai_feedback}</p>
            </div>

            <div className="report-main-content">
              <div className="metric-bar-group">
                <div className="metric-header">
                  <span className="metric-label">Fluency (WPM: {report.metrics.wpm})</span>
                  <span className="metric-value">{report.fluency_rating}</span>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: `${report.metrics.fluency_score}%` }}></div>
                </div>
              </div>

              <div className="metric-bar-group">
                <div className="metric-header">
                  <span className="metric-label">Hesitation (Fillers: {report.metrics.filler_count})</span>
                  <span className="metric-value">{report.metrics.hesitation_score > 70 ? 'Low' : 'High'}</span>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: `${report.metrics.hesitation_score}%`, background: '#f59e0b' }}></div>
                </div>
              </div>

              <div className="metric-bar-group">
                <div className="metric-header">
                  <span className="metric-label">Clarity</span>
                  <span className="metric-value">{report.clarity_rating}</span>
                </div>
                <div className="progress-bg">
                  <div className="progress-fill" style={{ width: '85%', background: '#8b5cf6' }}></div>
                </div>
              </div>

              <div className="feedback-grid">
                <div className="feedback-card strengths">
                  <div className="fb-title">🌟 Strengths</div>
                  <ul className="fb-list">
                    {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div className="feedback-card improvements">
                  <div className="fb-title">💡 Improvements</div>
                  <ul className="fb-list">
                    {report.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Button className="practice-again-btn" onClick={reset}>Practice Again →</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConfidenceAnalyzer;
