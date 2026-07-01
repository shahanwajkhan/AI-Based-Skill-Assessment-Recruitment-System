import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../../utils/api';
import AIInterviewLanding from './AIInterviewLanding';
import AIInterviewSystemCheck from './AIInterviewSystemCheck';
import AIInterviewSession from './AIInterviewSession';
import AIInterviewReport from './AIInterviewReport';
import { useAuth } from '../../context/AuthContext';

const AIInterviewFlow = ({ onExit, assignedData = null }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(assignedData ? 'initializing' : 'landing');
  const [sessionData, setSessionData] = useState(null);
  const [initError, setInitError] = useState(null);
  const sessionRef = useRef(null);

  // Automatically initialize assigned interview if present
  useEffect(() => {
    if (assignedData && currentStep === 'initializing') {
      const initializeAssigned = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`${API_URL}/ai-interview/start/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              assessment_id: assignedData.id
            })
          });

          if (response.ok) {
            const data = await response.json();
            setSessionData({ 
              session_id: data.session_id,
              first_question: data.first_question,
              topic: data.topic,
              skills: data.skills
            });
            setCurrentStep('system-check');
          } else {
            const errData = await response.json();
            setInitError(errData.error || "Failed to initialize assigned interview.");
          }
        } catch (err) {
          console.error("Initialization Error:", err);
          setInitError("Network error. Please check your connection.");
        }
      };
      initializeAssigned();
    }
  }, [assignedData, currentStep]);

  const handleStartFromLanding = (data) => {
    setSessionData(data);
    setCurrentStep('system-check');
  };

  const handleEndInterviewEarly = () => {
    if (currentStep === 'interview-session' && sessionRef.current) {
        if (window.confirm("Are you sure you want to end the interview now? Your current responses will be analyzed to generate a partial report.")) {
            sessionRef.current.forceSubmit();
        }
    } else {
        onExit();
    }
  };

  const handleSystemCheckComplete = async () => {
    setCurrentStep('countdown');
  };

  const handleCountdownComplete = async () => {
    // Attempt to enter Full Screen when moving to the session
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn("Full-screen request failed or denied:", err);
    }
    setCurrentStep('interview-session');
  };

  const handleInterviewComplete = (reportData) => {
    // Exit full screen if we are in it
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setSessionData(prev => ({ ...prev, report: reportData }));
    setCurrentStep('report');
  };

  return (
    <div className="ai-interview-flow" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#f8faff', zIndex: 1000, overflowY: 'auto' }}>
      
      {/* Top Bar with User Info and End Button - Hidden on Landing and Report */}
      {currentStep !== 'landing' && currentStep !== 'report' && currentStep !== 'countdown' && currentStep !== 'interview-session' && (
        <div style={{ position: 'absolute', top: '1.2rem', right: '1.5rem', zIndex: 1010, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user && (
            <div className="user-info-tag" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.8rem', 
              color: '#1e293b', 
              background: '#ffffff', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)' }}></div>
              <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                {user?.first_name 
                  ? `${user.first_name} ${user.last_name || ''}`.trim() 
                  : (user?.username || 'User')}
              </span>
            </div>
          )}
          <button 
            onClick={handleEndInterviewEarly}
            style={{ 
              background: 'linear-gradient(135deg, #ef4444, #991b1b)', 
              color: 'white', 
              border: 'none', 
              padding: '0.6rem 1.2rem', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            End Interview
          </button>
        </div>
      )}
      {currentStep === 'initializing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem' }}>
           <div className="initializing-spinner" style={{ width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
           <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
           <h3 style={{ color: '#1e293b' }}>{initError || 'Initializing Your Proctored Interview...'}</h3>
           {initError && (
             <button 
                onClick={onExit}
                style={{ padding: '0.6rem 1.2rem', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
             >
                Return to Dashboard
             </button>
           )}
        </div>
      )}

      {currentStep === 'landing' && (
        <AIInterviewLanding onStart={handleStartFromLanding} />
      )}

      {currentStep === 'system-check' && (
        <AIInterviewSystemCheck onComplete={handleSystemCheckComplete} />
      )}

      {currentStep === 'countdown' && (
        <AIInterviewSession 
            mode="countdown"
            data={sessionData}
            onCountdownComplete={handleCountdownComplete}
        />
      )}

      {currentStep === 'interview-session' && (
        <AIInterviewSession 
            ref={sessionRef}
            data={sessionData} 
            onComplete={handleInterviewComplete} 
        />
      )}

      {currentStep === 'report' && (
        <div style={{ minHeight: '100%', width: '100%' }}>
            <AIInterviewReport 
              data={sessionData.report} 
              sessionId={sessionData.session_id}
              onHome={onExit} 
              onFinish={onExit} 
            />
        </div>
      )}

    </div>
  );
};

class AIInterviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AI Interview Flow crashed:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', width: '100vw', height: '100vh', background: '#fef2f2', color: '#991b1b', position: 'fixed', top: 0, left: 0, zIndex: 9999 }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong.</h2>
          <p style={{ marginBottom: '2rem' }}>A critical error occurred while loading the interview interface.</p>
          <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '1.5rem', borderRadius: '8px', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.9rem' }}>
             <strong>Error:</strong> {this.state.error && this.state.error.toString()}
             <br /><br />
             <strong>Component Stack:</strong>
             <br />
             {this.state.errorInfo && this.state.errorInfo.componentStack}
          </div>
          <button 
             onClick={this.props.onExit} 
             style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
            Return to Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AIInterviewFlowSafe = (props) => (
  <AIInterviewErrorBoundary onExit={props.onExit}>
    <AIInterviewFlow {...props} />
  </AIInterviewErrorBoundary>
);

export default AIInterviewFlowSafe;
