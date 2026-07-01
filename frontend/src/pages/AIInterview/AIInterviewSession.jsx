import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Button from '../../components/Button/Button';
import './AIInterview.css';
import { API_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { saveLocalResult } from '../../utils/resultStorage';

const AIInterviewSession = forwardRef(({ data, onComplete, mode, onCountdownComplete }, ref) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [interviewStatus, setInterviewStatus] = useState('initializing'); // initializing, greeting, active, processing-answer, complete
  const [responses, setResponses] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [timeLeft, setTimeLeft] = useState(120);
  const [greetingText, setGreetingText] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [proctorViolation, setProctorViolation] = useState(false);
  const [violationType, setViolationType] = useState(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Global 10-minute timer and Question timer
  const [globalTimeLeft, setGlobalTimeLeft] = useState(600);
  
  // New state for conversational flow
  const [chatHistory, setChatHistory] = useState([]);
  const [showCountdown, setShowCountdown] = useState(mode === 'countdown');
  const [countdownValue, setCountdownValue] = useState(3);

  const startTimeRef = useRef(Date.now());
  const currentQuestionIndexRef = useRef(0);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const isListeningRef = useRef(false);
  const currentUtteranceRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  // Handle Countdown
  useEffect(() => {
    if (mode === 'countdown' && showCountdown) {
      if (countdownValue > 0) {
        const timer = setTimeout(() => setCountdownValue(v => v - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setShowCountdown(false);
        if (onCountdownComplete) onCountdownComplete();
      }
    }
  }, [mode, showCountdown, countdownValue]);

  // Load voices early to ensure they're available
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, transcript, interimTranscript]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Global 10-Minute Timer Logic
  useEffect(() => {
    let globalTimer;
    if (['greeting', 'active', 'processing-answer'].includes(interviewStatus)) {
      globalTimer = setInterval(() => {
        setGlobalTimeLeft((prev) => {
          if (prev <= 1) {
             clearInterval(globalTimer);
             if (interviewStatus !== 'complete') {
                 handleForceSubmit();
             }
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(globalTimer);
  }, [interviewStatus]);

  const handleForceSubmit = (isManual = false) => {
     if (interviewStatus === 'complete' || isSubmitting) return;
     setInterviewStatus('processing-answer');
     const msg = isManual ? "Ending interview and generating your report..." : "The interview time is up. I am submitting your responses now.";
     speak(msg, () => {});
     
     const rawAnswer = transcript + (interimTranscript ? ' ' + interimTranscript : '');
     const finalAnswer = rawAnswer.trim();
     handleAnswerSubmit(finalAnswer || "[Session terminated early]", 0, true);
  };

  useImperativeHandle(ref, () => ({
    forceSubmit: () => {
        handleForceSubmit(true);
    }
  }));

  // Initialize and Greeting Sequence
  useEffect(() => {
    if (mode === 'countdown') return; // Don't init logic in countdown mode

     if (data && data.first_question && user) {
        setQuestions([
            { id: 1, text: data.first_question, skill: data.topic || 'General', difficulty: data.difficulty || 'Medium' }
        ]);
        
        const displayName = user.first_name || user.username;
        const introText = `Hello ${displayName}. I am your AI interviewer. I've analyzed your resume and prepared a few questions to evaluate your skills. Let's begin.`;
        
        setGreetingText(introText);
        setInterviewStatus('greeting');
        
        const introTimeout = setTimeout(() => {
            speakIntro(introText);
        }, 1000);

        return () => clearTimeout(introTimeout);
     }
  }, [data, user, mode]);

  const getVoice = () => {
    if (selectedVoice) return selectedVoice;
    if (!('speechSynthesis' in window)) return null;
    let voices = window.speechSynthesis.getVoices();
    
    // Priorities for a sweet, professional Indian female voice (like Internshala AI)
    const priorities = [
      'Microsoft Neerja Online (Natural)', // Premium Windows Indian Female
      'Microsoft Neerja', // Standard Windows Indian Female
      'Google UK English Female', // Sweet, highly professional UK voice
      'Google हिन्दी', // Often provides a clear Indian English accent
      'Microsoft Jenny Online (Natural)', // Premium Natural Voice
      'Heera', // Alternative Indian Female
      'Samantha', // macOS premium female
      'Zira' // Windows fallback
    ];
    
    let voice = null;
    for (const name of priorities) {
      voice = voices.find(v => v.name.includes(name));
      if (voice) break;
    }
    
    // Fallbacks
    if (!voice) voice = voices.find(v => v.lang === 'en-IN' && (v.name.includes('Female') || v.name.includes('Woman') || v.name.includes('Girl')));
    if (!voice) voice = voices.find(v => v.lang === 'en-IN');
    if (!voice) voice = voices.find(v => v.lang.includes('en') && v.name.includes('Female'));
    if (!voice) voice = voices.find(v => v.lang.includes('en'));
    
    if (voice) setSelectedVoice(voice);
    return voice;
  };

  const speak = (text, onEndCallback) => {
    if (!('speechSynthesis' in window)) { if (onEndCallback) onEndCallback(); return; }
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    window.speechSynthesis.cancel();
    setAiSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Adjust pitch and rate for a natural, sweet, and professional tone (Internshala-style)
    utterance.pitch = 1.05;
    utterance.rate = 0.95;
    
    currentUtteranceRef.current = utterance;
    const voice = getVoice();
    if (voice) utterance.voice = voice;
    const handleEnd = () => {
      setAiSpeaking(false);
      currentUtteranceRef.current = null;
      if (onEndCallback) onEndCallback();
    };
    utterance.onend = handleEnd;
    utterance.onerror = () => handleEnd();
    window.speechSynthesis.speak(utterance);
  };

  const speakIntro = (text) => {
    // Add to chat history
    setChatHistory([{ type: 'ai', text, id: 'intro' }]);
    speak(text, () => {
      setInterviewStatus('active');
    });
  };

  const speakQuestion = (text) => {
    setChatHistory(prev => [...prev.filter(c => c.id !== 'thinking'), { type: 'ai', text, id: Date.now() }]);
    speak(text, () => {
      startListening();
    });
  };

  // Timer Logic
  useEffect(() => {
    let timer;
    if (interviewStatus === 'active' && !aiSpeaking && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isListening) {
      stopListeningAndSubmit();
    }
    return () => clearInterval(timer);
  }, [interviewStatus, aiSpeaking, isListening, timeLeft]);

  useEffect(() => {
    if (interviewStatus === 'active') {
        const currentQ = questions[currentQuestionIndex];
        let diffConfig = 120; // Medium
        if (currentQ?.difficulty === 'Easy') diffConfig = 90;
        if (currentQ?.difficulty === 'Hard') diffConfig = 150;
        
        setTimeLeft(diffConfig);
        startTimeRef.current = Date.now();
        currentQuestionIndexRef.current = currentQuestionIndex;
    }
  }, [currentQuestionIndex, interviewStatus, questions]);

  // Hook up Camera and Proctoring
  useEffect(() => {
    let active = true;
    const initCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (active && videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) { console.error("Camera access denied", e); }
    }
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    
    // TAB SWITCHING PROCTORING
    const handleVisibilityChange = () => {
        if (document.hidden && ['greeting', 'active', 'processing-answer'].includes(interviewStatus)) {
            handleProctorViolation('visibility', "Candidate switched tabs or minimized the window.");
        }
    };

    const handleWindowBlur = () => {
        if (['greeting', 'active', 'processing-answer'].includes(interviewStatus)) {
            handleProctorViolation('blur', "Candidate lost focus on the interview window.");
        }
    };

    initCamera();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
        active = false;
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
  }, [interviewStatus]); // Re-run when status changes to ensure correct context

  const handleProctorViolation = async (type, comment) => {
    if (interviewStatus === 'complete' || !data?.session_id) return;
    
    const newStrike = violationCount + 1;
    setViolationCount(newStrike);
    setViolationType(type);
    setProctorViolation(true);
    
    // Auto-dismiss warning after 4 seconds
    setTimeout(() => setProctorViolation(false), 4000);

    // AI Voice Warning if active
    if (newStrike === 1) {
        speak("I've noticed you switched tabs. Please stay focused on our conversation to ensure a fair evaluation.", () => {});
    }

    // Log to backend
    try {
        const token = localStorage.getItem('access_token');
        await fetch(`${API_URL}/assessments/sessions/${data.session_id}/log-violation/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                strike_number: newStrike,
                comment,
                is_interview: true
            })
        });
    } catch (err) {
        console.error("Failed to log proctoring violation:", err);
    }

    if (newStrike >= 3) {
        speak("You have multiple proctoring violations. I am ending this interview session now of the integrity policy.", () => {
            handleForceSubmit();
        });
    }
  };

  // Web Speech API
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final) setTranscript(prev => prev + (prev ? ' ' : '') + final);
      setInterimTranscript(interim);
    };
    recognition.onend = () => { if (isListeningRef.current) try { recognition.start(); } catch(e) {} };
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
      if (interviewStatus === 'active' && questions[currentQuestionIndex]) {
          speakQuestion(questions[currentQuestionIndex].text);
      }
  }, [currentQuestionIndex, interviewStatus]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript(''); setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true); isListeningRef.current = true;
    }
  };

  const stopListeningAndSubmit = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false); isListeningRef.current = false;
    }
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const rawAnswer = transcript + (interimTranscript ? ' ' + interimTranscript : '');
    const finalAnswer = rawAnswer.trim();
    
    // Add user message to chat
    setChatHistory(prev => [...prev, { 
      type: 'user', 
      text: finalAnswer || "[No speech detected]", 
      id: Date.now() 
    }]);
    
    handleAnswerSubmit(finalAnswer || "[No speech detected]", timeTaken);
  };

  const handleAnswerSubmit = async (answerText, timeTakenSeconds, forceFinal = false) => {
    if (isSubmitting || interviewStatus === 'complete') return;
    setIsSubmitting(true);
    setInterviewStatus('processing-answer');
    
    // Add thinking state to chat
    setChatHistory(prev => [...prev, { type: 'ai', text: 'Analyzing your response...', id: 'thinking', isThinking: true }]);

    const token = localStorage.getItem('access_token');
    const currentIndex = currentQuestionIndexRef.current;
    const isActuallyFinal = currentIndex >= 4 || forceFinal;
    const endpoint = isActuallyFinal ? '/ai-interview/submit/' : '/ai-interview/next-question/';

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          session_id: data.session_id,
          answer: answerText || "No answer provided.",
          question: questions[currentQuestionIndex].text,
          topic: questions[currentQuestionIndex].skill,
          time_taken: timeTakenSeconds
        })
      });

      const resData = await response.json();

      const currentResponse = { 
        question: questions[currentQuestionIndex].text, 
        answer: answerText || "[No response detected]" 
      };
      
      setResponses(prev => [...prev, currentResponse]);

      if (isActuallyFinal) {
          const closingText = `Thank you ${user.first_name || user.username}. I've completed your assessment. Your performance report is ready.`;
          setChatHistory(prev => [...prev.filter(c => c.id !== 'thinking'), { type: 'ai', text: closingText, id: 'closing' }]);
          
          speak(closingText, () => {
              setInterviewStatus('complete');
              
              const finalResultPayload = {
                  score: resData.overall_score,
                  responses: [...responses, currentResponse],
                  communication: resData.communication_score,
                  technicalDepth: resData.technical_score,
                  confidence: resData.confidence_score,
                  answerQuality: resData.answer_quality_score,
                  problemSolving: resData.problem_solving_score,
                  feedback: resData.feedback_summary,
                  strengths: resData.strengths,
                  improvements: resData.improvements
              };

              // Unified persistent save
              saveLocalResult({
                testType: 'AI Mock Interview',
                score: resData.overall_score,
                duration: `${Math.round((600 - globalTimeLeft)/60)}m`,
                aiFeedback: resData.feedback_summary,
                strengths: resData.strengths || [],
                weaknesses: resData.improvements || [],
                recommendations: resData.improvements || [],
                skillBreakdown: [
                  { skill: 'Communication', score: resData.communication_score },
                  { skill: 'Technical Depth', score: resData.technical_score },
                  { skill: 'Confidence', score: resData.confidence_score },
                  { skill: 'Answer Quality', score: resData.answer_quality_score },
                  { skill: 'Problem Solving', score: resData.problem_solving_score }
                ]
              });

              onComplete(finalResultPayload);
          });
      } else {
        const nextIndex = currentIndex + 1;
        const encouragements = [
          "Great explanation, let's keep going.",
          "Clear points. Moving to the next one.",
          "Good depth. Here is the next question.",
          "That was insightful. Let's continue."
        ];
        
        const hasSubstantialAnswer = answerText && answerText.trim().length > 10 && !answerText.includes("[No response detected]");
        const randomMsg = encouragements[Math.floor(Math.random() * encouragements.length)];

        setQuestions(prev => [...prev, { id: nextIndex + 1, text: resData.next_question, skill: resData.topic || 'General', difficulty: resData.difficulty || 'Medium' }]);
        
        // Briefly show encouragement ONLY if answer was good
        if (hasSubstantialAnswer) {
           setChatHistory(prev => [...prev.filter(c => c.id !== 'thinking'), { type: 'ai', text: randomMsg, id: `encouragement-${nextIndex}` }]);
        } else {
           setChatHistory(prev => prev.filter(c => c.id !== 'thinking'));
        }
        
        setTimeout(() => {
            setCurrentQuestionIndex(nextIndex);
            currentQuestionIndexRef.current = nextIndex;
            setInterviewStatus('active');
            setIsSubmitting(false);
        }, answerText && answerText.length > 5 ? 1500 : 500);
      }
    } catch (err) {
      console.error(err);
      setInterviewStatus('active'); setIsSubmitting(false);
      setChatHistory(prev => prev.filter(c => c.id !== 'thinking'));
    }
  };

  // COUNTDOWN OVERLAY
  if (showCountdown) {
    return (
      <div className="countdown-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, #f8faff 0%, #ebefff 100%)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="countdown-content" style={{ textAlign: 'center', animation: 'popIn 0.5s ease-out' }}>
          <div className="ai-prep-anim" style={{ marginBottom: '2rem' }}>
            <div className="brain-svg" style={{ fontSize: '4.5rem', animation: 'brainPulse 2s infinite ease-in-out' }}>🧠</div>
          </div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Interview Starting In</h3>
          <div className="countdown-number" style={{ fontSize: '6rem', fontWeight: 900, color: '#1e293b', textShadow: '0 10px 30px rgba(99, 102, 241, 0.2)' }}>{countdownValue}</div>
          <p style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '1.2rem', fontWeight: 500 }}>System is configuring your personalized session...</p>
        </div>
      </div>
    );
  }

  // Waveform animation bars
  const Waveform = ({ active }) => (
    <div className="waveform-container">
      {[...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className={`waveform-bar ${active ? 'active' : ''}`} 
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  return (
    <div className="interview-session-v3">
      {/* Top Header Card */}
      <div className="is-top-header-card fade-in">
        <div className="is-header-left">
          <div className="is-progress-v3">
            <div className="is-prog-text">
              <span>Interview Progress</span>
              <span>Question {currentQuestionIndex + 1} of 5</span>
            </div>
            <div className="is-prog-bar-v3">
              <div 
                className="is-prog-fill-v3" 
                style={{ width: `${(currentQuestionIndex + 1) * 20}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="is-header-right">
          <div className="user-status-card">
            <div className="status-dot-online"></div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.first_name || user?.username}</span>
          </div>
          
          <div className="is-timer" style={{ display: 'flex', gap: '0.5rem' }}>
            <span className={`timer-badge ${globalTimeLeft < 60 ? 'urgent' : ''}`} style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)', padding: '0.5rem 0.8rem' }}>
              ⏳ Total: {formatTime(globalTimeLeft)}
            </span>
            <span className={`timer-badge ${timeLeft < 20 ? 'urgent' : ''}`} style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '12px', padding: '0.5rem 0.8rem' }}>
              ⏱ Q: {timeLeft}s
            </span>
          </div>
          <Button 
            className="btn-exit-session" 
            onClick={() => {
                if (window.confirm("Are you sure you want to end the interview early? Your answers so far will be analyzed.")) {
                    handleForceSubmit(true); 
                }
            }}
            style={{ 
              padding: '0.6rem 1.2rem', 
              fontSize: '0.85rem', 
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)', 
              color: 'white', 
              border: 'none',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
            }}
          >
            End Interview
          </Button>
        </div>
      </div>

      <div className="is-three-col-layout">
        {/* Column 1: Chat Flow */}
        <div className="is-section-card is-chat-column slide-up">
          <div className="is-card-header">
            <span>💬</span>
            <h3>Interview Conversation</h3>
          </div>
          <div className="chat-history-container">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`chat-entry-v3 ${msg.type}`}>
                <div className="entry-avatar-v3">
                  {msg.type === 'ai' ? '👩🏽‍💼' : '👤'}
                </div>
                <div className="entry-bubble-v3">
                  {msg.isThinking ? (
                    <div className="thinking-dots"><span></span><span></span><span></span></div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            
            {isListening && (
              <div className="chat-entry-v3 user">
                <div className="entry-avatar-v3">👤</div>
                <div className="entry-bubble-v3" style={{ background: 'var(--surface)', border: '1px dashed var(--primary)', color: 'var(--text-main)' }}>
                  {transcript || interimTranscript ? (
                    <>
                      {transcript} <span style={{ opacity: 0.7, color: 'var(--primary)' }}>{interimTranscript}</span>
                    </>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Listening...</span>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Column 2: Interaction Center */}
        <div className="is-section-card is-interaction-column slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="is-card-header">
            <span>🎤</span>
            <h3>Voice Interaction</h3>
          </div>
          
          <div className="interaction-center-wrap">
            <Waveform active={isListening} />
            
            <button 
              className={`mic-pulsar-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListeningAndSubmit : startListening}
              disabled={aiSpeaking || interviewStatus === 'processing-answer'}
            >
              {isListening ? '🛑' : '🎤'}
            </button>

            <div className="interaction-status-labels">
              {isListening ? (
                <p style={{ color: '#818cf8', fontWeight: 600 }}>System is listening...</p>
              ) : aiSpeaking ? (
                <p style={{ color: '#a855f7', fontWeight: 600 }}>Interviewer is speaking...</p>
              ) : (
                <p style={{ color: '#94a3b8' }}>Click the mic to speak your answer</p>
              )}
            </div>

            {isListening && (
              <Button onClick={stopListeningAndSubmit} className="btn-stop-submit-v3">
                Stop & Submit Answer
              </Button>
            )}
          </div>
        </div>

        {/* Column 3: Proctoring Panel */}
        <div className="is-section-card is-proctor-column slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="is-card-header">
            <span>🛡️</span>
            <h3>Live Proctoring</h3>
          </div>
          
          <div className="proctor-video-container">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="proctor-live-badge">Live</div>
          </div>

          <div className="proctor-metrics-list">
            <div className={`pm-item ${isFullscreen ? 'ok' : 'warn'}`}>
              <div className="pm-label">
                <span>🖥️</span> Fullscreen Mode
              </div>
              <span className={`pm-status ${isFullscreen ? 'ok' : 'warn'}`}>
                {isFullscreen ? 'Secure' : 'Warning'}
              </span>
            </div>
            <div className="pm-item">
              <div className="pm-label">
                <span>👤</span> Face Detection
              </div>
              <span className="pm-status ok">Active</span>
            </div>
            <div className="pm-item">
              <div className="pm-label">
                <span>📡</span> Connection
              </div>
              <span className="pm-status ok">Stable</span>
            </div>
          </div>

          <div className="proctor-footer-alert">
            <span>⚠️</span>
            <span>Security protocol active. All interactions are monitored for quality and integrity.</span>
          </div>
        </div>
      </div>

      {/* Proctoring Warning Overlay */}
      {proctorViolation && (
        <div className="proctoring-alert-overlay fade-in" style={{
          position: 'fixed',
          top: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontWeight: 'bold',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ fontSize: '1.5rem' }}>⚠️</div>
          <div>
            <div style={{ fontSize: '1.1rem' }}>Proctoring Violation: Strike {violationCount}/3</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{violationType === 'visibility' ? 'Tab switching detected' : 'Window focus lost'}</div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AIInterviewSession;
