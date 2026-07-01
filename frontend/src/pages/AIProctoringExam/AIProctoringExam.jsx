import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../utils/api';
import './AIProctoringExam.css';
import Button from '../../components/Button/Button';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import { saveLocalResult } from '../../utils/resultStorage';

// Extended mock exam questions
const EXAM_QUESTIONS = [
  {
    id: 1,
    text: "Which of the following describes the time complexity of searching for an element in a balanced Binary Search Tree?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    correct_index: 2,
    skill: "Data Structures & Algorithms"
  },
  {
    id: 2,
    text: "In React, which hook is used to perform side effects in function components?",
    options: ["useContext", "useReducer", "useState", "useEffect"],
    correct_index: 3,
    skill: "React.js"
  },
  {
    id: 3,
    text: "What does CSS stand for?",
    options: [
      "Computer Style Sheets",
      "Cascading Style Sheets",
      "Colorful Style Sheets",
      "Creative Style Sheets"
    ],
    correct_index: 1,
    skill: "Web Fundamentals"
  },
  {
    id: 4,
    text: "Which design pattern restricts the instantiation of a class to one single object?",
    options: ["Factory Method", "Observer", "Singleton", "Decorator"],
    correct_index: 2,
    skill: "Design Patterns"
  },
  {
    id: 5,
    text: "What is the primary purpose of indexing in a database?",
    options: [
      "To compress data",
      "To optimize query performance",
      "To secure sensitive data",
      "To establish foreign key relationships"
    ],
    correct_index: 1,
    skill: "Databases"
  }
];

// Mock CV Test Questions
const CV_MOCK_QUESTIONS = [
  {
    id: 101,
    text: "Based on your experience with React.js, which hook would you use to prevent a costly calculation from running on every render?",
    options: ["useMemo", "useContext", "useEffect", "useCallback"],
    correct_index: 0,
    skill: "React.js Performance"
  },
  {
    id: 102,
    text: "Your CV mentions Node.js. In an Express app, how do you correctly handle a global error to prevent the server from crashing?",
    options: [
      "Wrap every route in a try/catch",
      "Use process.on('uncaughtException')",
      "Add an error-handling middleware function with four arguments (err, req, res, next)",
      "Set app.use(errorHandler) at the very top of the file"
    ],
    correct_index: 2,
    skill: "Node.js/Express"
  },
  {
    id: 103,
    text: "For a Frontend Architecture role, if you are experiencing prop drilling across 5 layers of components, what is the best native React solution?",
    options: ["Redux", "React Context API", "LocalStorage", "Prop spreading"],
    correct_index: 1,
    skill: "React Architecture"
  },
  {
    id: 104,
    text: "In JavaScript (ES6+), what is the output of `typeof null`?",
    options: ["'null'", "'undefined'", "'object'", "'boolean'"],
    correct_index: 2,
    skill: "JavaScript Fundamentals"
  }
];

// Fallback coding problems used if the AI or backend fail to provide them
const FALLBACK_CODING_PROBLEMS = [
  {
    id: 901,
    problem_title: "Reverse a String",
    description: "Write a function that takes a string as input and returns the string reversed. Do not use any built-in reverse methods.",
    input_output_examples: "Input: 'hello' → Output: 'olleh'\nInput: 'world' → Output: 'dlrow'",
    difficulty: "Easy",
    skill: "Programming",
    points: 25,
    test_cases: [
      { input: "hello", expected_output: "olleh", hidden: false },
      { input: "world", expected_output: "dlrow", hidden: true }
    ]
  },
  {
    id: 902,
    problem_title: "FizzBuzz",
    description: "Write a program that prints numbers from 1 to N. For multiples of 3 print 'Fizz', for multiples of 5 print 'Buzz', and for multiples of both print 'FizzBuzz'.",
    input_output_examples: "Input: n=15 → Output: 1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz",
    difficulty: "Easy",
    skill: "Programming",
    points: 25,
    test_cases: [
      { input: "5", expected_output: "1\n2\nFizz\n4\nBuzz", hidden: false },
      { input: "15", expected_output: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", hidden: true }
    ]
  }
];

const AIProctoringExam = ({ examData, onExit, onComplete }) => {
  const isCVTest = examData?.id === 'cv-test';
  const dynamicQuestions = examData?.questions || [];

  // Create default mock questions if API returned empty
  const fallbackQuestions = CV_MOCK_QUESTIONS;

  // Use the API questions if we successfully sent/received them, else fallback to either 
  // the mock CV questions or the standard exam questions
  const questionsToUse = dynamicQuestions && dynamicQuestions.length > 0
    ? dynamicQuestions
    : (isCVTest ? CV_MOCK_QUESTIONS : EXAM_QUESTIONS);

  const examTitle = examData?.title || (isCVTest ? "AI Personalized Skills Assessment" : "Advanced Software Engineering Assessment");
  const platformName = "SkillGuard AI";
  
  // Mock logged-in user for display (In real app, this comes from Auth Context/Redux)
  const loggedInUser = {
    name: "Manali Jaiswal",
    initials: "M"
  };

  // Exam State
  const [examPhase, setExamPhase] = useState('checking'); // 'checking' or 'active'
  const [examSection, setExamSection] = useState('mcq'); // 'mcq' or 'coding'
  const [systemCheckStep, setSystemCheckStep] = useState('camera-align'); // 'camera-align', 'mic-speak', 'ready'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null); // Will be set dynamically
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [codingScore, setCodingScore] = useState(0); // For the coding portion

  const [servedQuestions, setServedQuestions] = useState([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState(new Set());
  const [currentDifficulty, setCurrentDifficulty] = useState('Medium');
  // Use coding problems from examData; fall back to built-in problems so the coding section never hangs blank
  const rawCodingProblems = examData?.coding_problems || [];
  const codingProblems = rawCodingProblems.length > 0 ? rawCodingProblems : FALLBACK_CODING_PROBLEMS;

  useEffect(() => {
    if (examPhase === 'active' && servedQuestions.length === 0) {
      if (dynamicQuestions && dynamicQuestions.length > 0) {
        if (isCVTest) {
          // Adaptive flow for CV tests
          let firstQ = dynamicQuestions.find(q => q.difficulty === 'Medium') || dynamicQuestions[0];
          setServedQuestions([firstQ]);
          setUsedQuestionIds(new Set([firstQ.id]));
        } else {
          // Full set flow for Recruiter assigned tests
          setServedQuestions(dynamicQuestions);
          setUsedQuestionIds(new Set(dynamicQuestions.map(q => q.id)));
        }
      } else {
        const staticQ = isCVTest ? CV_MOCK_QUESTIONS : EXAM_QUESTIONS;
        setServedQuestions(staticQ);
      }
    }
  }, [examPhase, dynamicQuestions, isCVTest]);

  // Proctoring & Validation State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const screenStreamRef = useRef(null); // Ref for screen share stream
  const lastWarningTimeRef = useRef(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [systemChecks, setSystemChecks] = useState({
    camera: false,
    microphone: false,
    lighting: 'checking',
    noise: 'checking',
  });
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSTTActive, setIsSTTActive] = useState(false);
  const micSentence = "I am ready to start my test";
  const recognitionRef = useRef(null);

  const [proctoringFlags, setProctoringFlags] = useState({
    faceDetected: true,
    multipleFaces: false,
    audioSpike: false,
    tabSwitched: false
  });
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [examResult, setExamResult] = useState(null); // To store final score/stats
  const [startTime] = useState(Date.now());
  const noiseCounterRef = useRef(0); // For sustained noise check
  const faceMissingCounterRef = useRef(0); // For sustained face absence check
  const faceDetectedRef = useRef(true); // For instant detection tracking in loop

  // --- Voice AI Warnings ---
  const issueVoiceWarning = (message) => {
    const now = Date.now();
    // Debounce warnings to every 10 seconds (unless it's a critical violation warning)
    if (now - lastWarningTimeRef.current > 10000 || message.includes("Violation")) {
      const utterance = new SpeechSynthesisUtterance(message);

      // Attempt to find a more robotic/serious voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google UK English Male") || v.name.includes("Microsoft David")) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.rate = 1.0;
      utterance.pitch = 0.8; // Deeper pitch for more serious tone
      window.speechSynthesis.speak(utterance);
      lastWarningTimeRef.current = now;
    }
  };

  // --- RE-ATTACH CAMERA STREAM ON PHASE CHANGE ---
  // Ensuring the video element always has the stream even after re-mounts
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  }, [examPhase, cameraActive, systemCheckStep, showViolationWarning]);

  // --- Real-time Hardware Analysis ---

  useEffect(() => {
    if (!cameraActive) return;

    let animationFrame;
    const analyzeHardware = () => {
      // 1. Lighting & Alignment Analysis (Canvas)
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let totalBrightness = 0;
        let brightnessSqrDiff = 0;
        const pixelCount = imageData.length / 4;

        // Calculate average brightness
        for (let i = 0; i < imageData.length; i += 4) {
          const b = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
          totalBrightness += b;
        }
        const avgBrightness = totalBrightness / pixelCount;
        setBrightness(Math.round(avgBrightness));

        // Calculate variance to detect if the screen is solid black or static
        for (let i = 0; i < imageData.length; i += 4) {
          const b = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
          brightnessSqrDiff += Math.pow(b - avgBrightness, 2);
        }
        const variance = Math.sqrt(brightnessSqrDiff / pixelCount);

        // --- FIXED: Presence Detection for 64x48 Canvas ---
        // We check a central area (where the face should be)
        let skinPixels = 0;
        const centerX = canvas.width / 2; // 32
        const centerY = canvas.height / 2; // 24
        const sampleW = 20;
        const sampleH = 20;

        const startY = Math.max(0, centerY - sampleH);
        const endY = Math.min(canvas.height, centerY + sampleH);
        const startX = Math.max(0, centerX - sampleW);
        const endX = Math.min(canvas.width, centerX + sampleW);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const i = (y * canvas.width + x) * 4;
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];

            // --- ADVANCED SKIN TONE FILTER ---
            // Thresholds based on typical YCbCr-inspired skin color models 
            // but simplified for RGB: R > 70, G > 30, B > 20, R > G, R > B, |R-B| > 15
            const isSkinColor = r > 70 && g > 30 && b > 20 &&
              r > g && r > b &&
              (r - g > 15) && (r - b > 15);

            if (isSkinColor) {
              skinPixels++;
            }
          }
        }
        const totalSampleArea = (endY - startY) * (endX - startX);
        const facePresenceRatio = skinPixels / totalSampleArea;

        // --- TUNED: Inclusive Security Thresholds ---
        const isLightingGood = avgBrightness > 50 && avgBrightness < 240; // Relaxed floor to 50
        const isDynamic = variance > 15; // Relaxed floor to 15
        const isFacePresent = facePresenceRatio > 0.20; // Relaxed floor to 0.20

        let status = 'poor';
        if (!isLightingGood) status = 'dark';
        else if (!isDynamic) status = 'static';
        else if (!isFacePresent) status = 'no-face';
        else status = 'good';

        setSystemChecks(prev => ({
          ...prev,
          lighting: status
        }));

        // --- FACE VISIBILITY ENFORCEMENT DURING EXAM ---
        if (examPhase === 'active') {
          if (status !== 'good') {
            faceDetectedRef.current = false;
            faceMissingCounterRef.current += 1;

            // UI Status Update (Immediate visual feedback)
            if (proctoringFlags.faceDetected) {
              setProctoringFlags(prev => ({ ...prev, faceDetected: false }));
            }

            // Warning after ~2 seconds (approx 80 frames at ~40fps)
            if (faceMissingCounterRef.current === 80) {
              issueVoiceWarning("Face not detected. Please show your face to avoid automated test termination.");
              handleViolation('face'); // PERSISTENCE: Log as violation
            }

            // Auto-submit after ~15 seconds (approx 600 frames)
            if (faceMissingCounterRef.current > 600) {
              issueVoiceWarning("Face missing for too long. Automated termination initiated.");
              setIsTerminated(true);
              handleSubmit(true); // submission from termination
              faceMissingCounterRef.current = 0;
            }
          } else {
            // Reset if face is back
            faceDetectedRef.current = true;
            if (!proctoringFlags.faceDetected) {
              setProctoringFlags(prev => ({ ...prev, faceDetected: true }));
            }
            faceMissingCounterRef.current = 0;
          }
        }
      }

      // 2. Audio Analysis
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avgVolume = dataArray.reduce((src, val) => src + val, 0) / dataArray.length;
        setNoiseLevel(avgVolume);

        // Legacy volume check (now just for visual feedback, not triggering progress)
        if (systemCheckStep === 'mic-speak' && avgVolume > 15) {
          // We keep this block for noise level monitoring but remove the setVoiceDetected trigger
        }

        if (avgVolume > 80) { // Increased threshold from 60 to 80
          noiseCounterRef.current += 1;

          // Require sustained noise (approx 10-15 frames/ ~0.5s) before warning
          if (noiseCounterRef.current > 15) {
            setSystemChecks(prev => ({ ...prev, noise: 'noisy' }));

            // ONLY issue voice warning if the exam is ACTIVE
            if (examPhase === 'active') {
              issueVoiceWarning("Sustained noise detected. Please ensure a quiet environment.");
              handleViolation('audio'); // PERSISTENCE: Log as violation
              setProctoringFlags(prev => ({ ...prev, audioSpike: true }));
              setTimeout(() => setProctoringFlags(prev => ({ ...prev, audioSpike: false })), 4000);
            }
            noiseCounterRef.current = 0; // Reset after warning
          }
        } else {
          noiseCounterRef.current = Math.max(0, noiseCounterRef.current - 1); // Slowly decay
          setSystemChecks(prev => ({ ...prev, noise: 'quiet' }));
        }
      }

      animationFrame = requestAnimationFrame(analyzeHardware);
    };

    analyzeHardware();
    return () => cancelAnimationFrame(animationFrame);
  }, [examPhase, cameraActive, systemCheckStep]);

  // --- Exam Logic --- //

  useEffect(() => {
    if (examPhase !== 'active') return;
    if (timeLeft <= 0 && !isSubmitted) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, examPhase]);

  const formatTime = (seconds) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId, optionIndex) => {
    // We use the question Index as the dict key now to ensure uniqueness even if API IDs collide
    setAnswers({
      ...answers,
      [currentQuestionIndex]: optionIndex
    });
  };

  const currentQuestion = (Array.isArray(servedQuestions) && servedQuestions.length > currentQuestionIndex) 
    ? servedQuestions[currentQuestionIndex] 
    : (isCVTest ? (CV_MOCK_QUESTIONS?.[0] || null) : (EXAM_QUESTIONS?.[0] || null));

  const handleSubmit = async (terminated = false) => {
    setIsSubmitted(true);
    stopCamera();

    // Calculate Metrics (Adaptive Scoring)
    let correctCount = 0;
    let earnedPoints = 0;
    let totalPoints = 0;

    servedQuestions.forEach((q, idx) => {
      const correctIdx = q.correct_index !== undefined ? q.correct_index : 0;
      const difficultyMultiplier = q.difficulty === 'Hard' ? 3 : (q.difficulty === 'Medium' ? 2 : 1);

      totalPoints += difficultyMultiplier;
      if (answers[idx] === correctIdx) {
        correctCount++;
        earnedPoints += difficultyMultiplier;
      }
    });

    const totalCount = servedQuestions.length || 1;
    const incorrectCount = totalCount - correctCount;

    // Weighted final score: 60% MCQs, 40% Coding (if coding problems exist)
    const mcqPercent = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    let finalScore = Math.round(mcqPercent);
    if (codingProblems.length > 0) {
      finalScore = Math.round((mcqPercent * 0.6) + (codingScore * 0.4));
    }

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const integrity = Math.max(0, 100 - (violationCount * 15));

    // Dynamic AI Suggestions based on performance
    const aiSuggestions = [];
    const missedSkills = new Set();
    
    servedQuestions.forEach((q, idx) => {
      const correctIdx = q.correct_index !== undefined ? q.correct_index : 0;
      if (answers[idx] !== correctIdx && q.skill) {
        missedSkills.add(q.skill);
      }
    });

    if (missedSkills.size > 0) {
      aiSuggestions.push(`Based on your missed questions, you should prioritize strengthening your knowledge in: ${Array.from(missedSkills).join(', ')}.`);
      missedSkills.forEach(skill => {
        if (skill === 'Data Structures & Algorithms') {
          aiSuggestions.push("Practice identifying time and space complexity for recursive algorithms.");
          aiSuggestions.push("Review 'Big O' notation and worst-case scenarios for common sorting methods.");
        }
        if (skill === 'React.js' || skill.includes('React')) {
          aiSuggestions.push("Deep dive into the 'useEffect' dependency array and how it affects component re-renders.");
          aiSuggestions.push("Explore 'React.memo' and 'useCallback' to optimize your component tree performance.");
        }
        if (skill === 'Databases') {
          aiSuggestions.push("Review SQL Joins (Left vs Inner) and how to write efficient subqueries.");
          aiSuggestions.push("Understand the difference between Clustered and Non-clustered indexing.");
        }
        if (skill === 'JavaScript Fundamentals' || skill === 'Programming') {
          aiSuggestions.push("Master 'Closures' and the 'this' keyword binding in different execution contexts.");
          aiSuggestions.push("Practice asynchronous programming patterns using Promises and Async/Await.");
        }
        if (skill === 'Design Patterns') {
          aiSuggestions.push("Study the 'Observer' and 'Factory' patterns and how they are applied in modern frameworks.");
        }
      });
    }

    if (finalScore >= 85) {
      aiSuggestions.push("Excellent result! You have a strong grasp of the core concepts. To reach the next level, start contributing to open-source or building high-scale architecture projects.");
    } else if (finalScore >= 65) {
      aiSuggestions.push("Good effort. You've passed the baseline, but focusing on the specific topics above will help you transition from a 'Competent' to an 'Expert' level.");
    } else {
      aiSuggestions.push("It looks like there are some fundamental gaps in your current stack. We recommend following our 'Roadmap' (available on the dashboard) to rebuild your foundation topic-by-topic.");
    }

    const proctoringSummary = {
      violations: violationCount,
      integrity: integrity,
      status: terminated ? 'terminated' : 'verified'
    };

    // Calculate dynamic skill breakdown
    const skillsMap = {};
    servedQuestions.forEach((q, idx) => {
      if (q.skill) {
        if (!skillsMap[q.skill]) skillsMap[q.skill] = { total: 0, correct: 0 };
        skillsMap[q.skill].total += 1;
        const correctIdx = q.correct_index !== undefined ? q.correct_index : 0;
        if (answers[idx] === correctIdx) skillsMap[q.skill].correct += 1;
      }
    });

    const skillBreakdown = Object.keys(skillsMap).map(skillName => ({
      skill: skillName,
      score: Math.round((skillsMap[skillName].correct / skillsMap[skillName].total) * 100)
    }));

    if (codingProblems.length > 0) {
      skillBreakdown.push({
        skill: 'Applied Algorithm / Coding',
        score: codingScore
      });
    }

    const resultObj = {
      score: finalScore,
      mcq_score: Math.round(mcqPercent),
      coding_score: codingScore,
      skill_breakdown: skillBreakdown,
      correct_answers: correctCount,
      incorrect_answers: incorrectCount,
      total_questions: totalCount,
      time_taken: timeTaken,
      ai_suggestions: aiSuggestions,
      proctoring_summary: proctoringSummary
    };

    setExamResult(resultObj);

    // Sync with Backend
    if (sessionId) {
      const token = localStorage.getItem('access_token');
      try {
        const response = await fetch(`${API_URL}/assessments/sessions/${sessionId}/complete/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: terminated ? 'terminated' : 'completed',
            score: finalScore,
            ...resultObj // Send all new fields
          })
        });

        if (response.ok && onComplete) {
          const finalData = await response.json();
          const finalPayload = finalData.result || resultObj;

          saveLocalResult({
            testType: isCVTest ? 'Custom AI Test' : 'Proctored Skill Test',
            score: finalScore,
            duration: `${Math.round(timeTaken/60)}m`,
            aiFeedback: aiSuggestions.join(' '),
            strengths: ['Identified based on category accuracy'],
            weaknesses: ['Reviewed in topic recommendations'],
            recommendations: aiSuggestions,
            skillBreakdown: skillBreakdown
          });

          // Pass the full result object back to Dashboard
          onComplete(finalPayload);
        } else if (onComplete) {
          saveLocalResult({
            testType: isCVTest ? 'Custom AI Test' : 'Proctored Skill Test',
            score: finalScore,
            duration: `${Math.round(timeTaken/60)}m`,
            aiFeedback: aiSuggestions.join(' '),
            strengths: ['Identified based on category accuracy'],
            weaknesses: ['Reviewed in topic recommendations'],
            recommendations: aiSuggestions,
            skillBreakdown: skillBreakdown
          });

          // Fallback if network was ok but response structure unexpected
          onComplete(resultObj);
        }
      } catch (err) {
        console.error("Failed to sync final results with backend:", err);
      }
    }

    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };


  // --- Proctoring Logic --- //

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setSystemChecks(prev => ({ ...prev, camera: true, microphone: true }));

      // Setup AudioContext for analysis
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

    } catch (err) {
      console.error("Error accessing camera/mic:", err);
      setSystemChecks(prev => ({ ...prev, camera: false, microphone: false }));
    }
  };

  // --- Speech-to-Text Logic ---
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      // Fallback: allow manual proceed if not supported? 
      // For now, let's assume it's supported as per user request.
      return;
    }

    if (recognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);

      // Check if sentence matches (lenient comparison)
      const cleanTarget = micSentence.toLowerCase().replace(/[.,!]/g, "").trim();
      const cleanInput = currentTranscript.toLowerCase().replace(/[.,!]/g, "").trim();

      // Allow partial matches (e.g. if the user says "I'm" instead of "I am")
      if (cleanInput.includes(cleanTarget) || cleanInput.includes("ready to start my test")) {
        setVoiceDetected(true);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
    };

    recognition.onend = () => {
      if (isSTTActive) recognition.start(); // Restart if still active
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsSTTActive(true);
  };

  const stopSpeechRecognition = () => {
    setIsSTTActive(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
      recognitionRef.current = null;
    }
  };

  useEffect(() => {
    if (systemCheckStep === 'mic-speak') {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
    return () => stopSpeechRecognition();
  }, [systemCheckStep]);

  const stopCamera = () => {
    console.log("Stopping all media tracks and cleaning up proctoring session...");

    // 1. Stop webcam/mic tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    setCameraActive(false);

    // 2. Stop screen share tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped screen track: ${track.kind}`);
      });
      screenStreamRef.current = null;
    }

    // 3. Close audio context
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.warn("AudioContext close error:", e));
      }
      audioContextRef.current = null;
    }

    // 4. Ensure video element is cleared
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // 5. Explicitly stop STT
    stopSpeechRecognition();
  };

  const handleStartExam = async () => {
    try {
      // 1. Request Screen Share
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false // We already have mic from getUserMedia
      });
      screenStreamRef.current = screenStream;

      // Stop screen share when user manually clicks "Stop sharing" browser banner
      screenStream.getVideoTracks()[0].onended = () => {
        if (!isSubmitted && !isTerminated) {
          handleViolation('screenshare-stopped');
        }
      };

      // 2. Create session in Backend
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/assessments/sessions/start/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assessment: isCVTest ? null : examData?.id,
          is_custom: isCVTest,
          custom_data: {
            questions: servedQuestions,
            system_checks: systemChecks // PERSISTENCE: Save initial hardware validation results
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.id);
      } else {
        console.error("Failed to start session on backend");
      }

      // 3. Request Full Screen (Mandatory)
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (fsErr) {
        console.warn("Full-screen rejected, continuing with screen-share only.");
      }

      // 4. Calculate dynamic time (use backend provided time or fall back to 1 min per question)
      // Since it's dynamic now, standard is 20 mins for MCQs + 30 mins for coding
      const defaultDuration = isCVTest ? 50 : 30;
      const durationInMinutes = examData?.estimated_time || defaultDuration;
      setTimeLeft(durationInMinutes * 60);

      // 5. Set Phase to active
      setExamPhase('active');

    } catch (err) {
      console.error("Screen share was denied or failed:", err);
      // Alert user that screen share is mandatory
      alert("Screen sharing is mandatory to proceed with this AI-proctored assessment. Please try again.");
    }
  };

  useEffect(() => {
    // Start camera on mount ONLY if not already finished
    if (!isSubmitted && !isTerminated) {
      startCamera();
    }

    // Monitor for Tab switching / Minimization / Fullscreen Exit
    const handleViolation = async (type) => {
      if (examPhase !== 'active' || isSubmitted || isTerminated) return;

      setViolationCount(prev => {
        const newCount = prev + 1;

        // Log to Backend
        if (sessionId) {
          const token = localStorage.getItem('access_token');
          fetch(`${API_URL}/assessments/sessions/${sessionId}/log-violation/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              type: type,
              strike_number: newCount,
              comment: `Detected via browser event: ${type}`
            })
          });
        }

        if (newCount === 1) {
          issueVoiceWarning(`Violation detected. Please stay in full screen mode.`);
          setShowViolationWarning(true);
        } else if (newCount === 2) {
          issueVoiceWarning("Second warning. Your test will be automatically submitted on the next violation.");
          setShowViolationWarning(true);
        } else if (newCount >= 3) {
          issueVoiceWarning("Final violation. Your test has been terminated and submitted.");
          setIsTerminated(true);
          handleSubmit(true); // submission from termination
        }

        return newCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('visibility');
        setProctoringFlags(prev => ({ ...prev, tabSwitched: true }));
      } else {
        setProctoringFlags(prev => ({ ...prev, tabSwitched: false }));
      }
    };

    const handleBlur = () => {
      handleViolation('blur');
      setProctoringFlags(prev => ({ ...prev, tabSwitched: true }));
    };

    const handleFocus = () => {
      setProctoringFlags(prev => ({ ...prev, tabSwitched: false }));
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && examPhase === 'active' && !isSubmitted && !isTerminated) {
        handleViolation('fullscreen');
      }
    };

    // Initial check if active but not in FS (e.g. after a refresh or manual exit)
    if (examPhase === 'active' && !document.fullscreenElement && !isSubmitted && !isTerminated) {
      handleViolation('fullscreen-init');
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      stopCamera();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [examPhase, isSubmitted, isTerminated]);

  const handleNextQuestion = () => {
    if (isCVTest && dynamicQuestions.length > 0) {
      if (currentQuestionIndex === servedQuestions.length - 1) {
        if (servedQuestions.length >= 20) {
          // For CV tests, always go to coding (using fallback if AI didn't return coding problems).
          // For fixed assessments, only go to coding if the assessment has real coding problems.
          const hasCodingPhase = isCVTest ? codingProblems.length > 0 : rawCodingProblems.length > 0;
          if (hasCodingPhase) {
            setExamSection('coding');
          } else {
            handleSubmit();
          }
          return;
        }

        const lastAnswerIndex = answers[currentQuestionIndex];
        const lastQuestion = servedQuestions[currentQuestionIndex];
        const isCorrect = lastAnswerIndex === lastQuestion.correct_index;

        let nextDifficulty = currentDifficulty;
        if (isCorrect) {
          nextDifficulty = currentDifficulty === 'Easy' ? 'Medium' : 'Hard';
        } else {
          nextDifficulty = currentDifficulty === 'Hard' ? 'Medium' : 'Easy';
        }
        setCurrentDifficulty(nextDifficulty);

        let pool = dynamicQuestions.filter(q => q.difficulty === nextDifficulty && !usedQuestionIds.has(q.id));
        if (pool.length === 0) pool = dynamicQuestions.filter(q => !usedQuestionIds.has(q.id));

        if (pool.length > 0) {
          const nextQ = pool[Math.floor(Math.random() * pool.length)];
          setServedQuestions(prev => [...prev, nextQ]);
          setUsedQuestionIds(prev => new Set([...prev, nextQ.id]));
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          // All dynamic questions exhausted before 20 — transition to coding or submit
          const hasCodingPhase = isCVTest ? codingProblems.length > 0 : rawCodingProblems.length > 0;
          if (hasCodingPhase) setExamSection('coding');
          else handleSubmit();
        }
      } else {
        // Bounds check for safety before incrementing
        if (Array.isArray(servedQuestions) && currentQuestionIndex < servedQuestions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          // If we are at the end somehow, handle phase transition
          if (rawCodingProblems.length > 0) setExamSection('coding');
          else handleSubmit();
        }
      }
    } else {
      if (Array.isArray(servedQuestions) && currentQuestionIndex < servedQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        if (rawCodingProblems.length > 0) setExamSection('coding');
        else handleSubmit();
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Simulate AI proctoring background checks periodically
  useEffect(() => {
    if (isSubmitted) return;

    const interval = setInterval(() => {
      // In a real app, this would be sending video frames to a WebGL/WASM model (like TensorFlow.js)
      // For this demo, we simulate occasional "Audio Spikes" arbitrarily every ~30 seconds randomly
      if (Math.random() > 0.95) {
        setProctoringFlags(prev => ({ ...prev, audioSpike: true }));
        setTimeout(() => setProctoringFlags(prev => ({ ...prev, audioSpike: false })), 3000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isSubmitted]);


  // --- Render --- //

  if (isSubmitted) {
    return (
      <div className="exam-submitted-view">
        <div className="completion-card">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>{isTerminated ? "Assessment Terminated" : "Assessment Completed"}</h2>
          <p className="completion-subtitle">
            {isTerminated
              ? "Your test was terminated due to proctoring violations. Results have been logged."
              : "Your responses have been securely uploaded along with the AI proctoring logs."}
          </p>

          {examResult && (
            <div className="results-summary-card premium-fade-in">
              <div className="result-main">
                <div className="result-score-circle" style={{ '--score-percent': `${examResult.score}%` }}>
                  <span className="score-val">{examResult.score}%</span>
                  <span className="score-label">Final Score</span>
                </div>
                <div className="result-stats">
                  <div className="res-stat-item">
                    <span className="res-label">Accuracy</span>
                    <span className="res-val">{examResult.correct_answers} / {examResult.total_questions} Correct</span>
                  </div>
                  <div className="res-stat-item">
                    <span className="res-label">AI Integrity</span>
                    <span className={`res-val ${examResult.proctoring_summary?.integrity < 70 ? 'danger-text' : 'safe-text'}`}>
                      {examResult.proctoring_summary?.integrity}% Secure
                    </span>
                  </div>
                </div>
              </div>

              <div className="integrity-log">
                <h4>Proctoring Overview</h4>
                <ul>
                  <li><span className="dot safe-res"></span> Browser Environment: Verified</li>
                  <li><span className="dot safe-res"></span> Audio Feed: Analyzed</li>
                  <li>
                    <span className={`dot ${examResult.proctoring_summary?.violations > 0 ? 'warning-res' : 'safe-res'}`}></span>
                    Integrity Violations: {examResult.proctoring_summary?.violations}
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="completion-actions">
            <Button onClick={() => {
              if (onComplete) {
                onComplete({
                  ...examResult,
                  assessment: examData,
                  completed_at: new Date().toISOString()
                });
              }
              // Redirect to skill gap analysis
              window.location.href = `/skill-gap-analysis?type=skill_test&source_id=${examResult?.result_id || ''}`;
            }} className="premium-btn w-full">View Detailed Skill Gap Report</Button>
          </div>
        </div>
      </div>
    );
  }

  // Violation Warning Overlay
  if (showViolationWarning && !isTerminated) {
    return (
      <div className="violation-overlay premium-fade-in">
        <div className="violation-card premium">
          <div className="violation-glass-effect"></div>
          <div className="violation-icon pulse-red">⚠️</div>
          <h2 className="glitch-text" data-text="INTEGRITY ALERT">INTEGRITY ALERT</h2>
          <p className="violation-msg">
            You switched tabs, minimized the window, or lost focus. This action has been logged by the AI.
          </p>
          <div className="strike-container">
            <div className="strike-label">Violation Strike</div>
            <div className="strike-bars">
              <div className={`strike-bar ${violationCount >= 1 ? 'active' : ''}`}></div>
              <div className={`strike-bar ${violationCount >= 2 ? 'active' : ''}`}></div>
              <div className={`strike-bar ${violationCount >= 3 ? 'active danger' : ''}`}></div>
            </div>
            <div className="strike-count">{violationCount} / 3</div>
          </div>
          <div className="violation-warning-text highlight">
            {violationCount === 1 ?
              "This is your first warning. Any further attempt to exit will result in automated failure." :
              "CRITICAL WARNING: The next violation will result in IMMEDIATE TERMINATION."}
          </div>
          <Button
            onClick={async () => {
              try {
                if (document.documentElement.requestFullscreen) {
                  await document.documentElement.requestFullscreen();
                }
                setShowViolationWarning(false);
              } catch (err) {
                console.error("Failed to re-enter FS:", err);
                setShowViolationWarning(false); // Fallback
              }
            }}
            className="premium-btn w-full"
          >
            I understand, Resume Assessment
          </Button>
        </div>
      </div>
    );
  }

  // Pre-flight check UI (Wizard)
  if (examPhase === 'checking') {
    return (
      <div className="preflight-overlay">
        <div className="background-blur-elements">
          <div className="blur-circle circle-1"></div>
          <div className="blur-circle circle-2"></div>
          <div className="blur-circle circle-3"></div>
        </div>
        <canvas ref={canvasRef} width="64" height="48" style={{ display: 'none' }} />
        <div className="preflight-card wizard glass-card">
          {systemCheckStep !== 'ready' && (
            <div className="wizard-progress">
              <div className={`progress-step ${systemCheckStep === 'camera-align' ? 'active' : 'done'}`}>1</div>
              <div className="progress-line" />
              <div className={`progress-step ${systemCheckStep === 'mic-speak' ? 'active' : systemCheckStep === 'ready' ? 'done' : ''}`}>2</div>
              <div className="progress-line" />
              <div className={`progress-step ${systemCheckStep === 'ready' ? 'active' : ''}`}>3</div>
            </div>
          )}

          {systemCheckStep !== 'ready' && (
            <div className="preflight-header centered">
              <h2>{
                systemCheckStep === 'camera-align' ? 'Camera Alignment' :
                  systemCheckStep === 'mic-speak' ? 'Microphone Validation' :
                    'Ready to Begin'
              }</h2>
            </div>
          )}

          <div className="wizard-content">
            {systemCheckStep === 'camera-align' && (
              <div className="alignment-step">
                <p className="step-instruction">Please center your face within the green circle to calibrate the AI proctoring system.</p>
                <div className="video-check-box align-check">
                  <video ref={videoRef} autoPlay playsInline muted className="preflight-video" />
                  <div className={`camera-overlay-circle ${systemChecks.lighting === 'good' ? 'pass' : 'fail'}`} />
                  <div className={`alignment-status-badge ${systemChecks.lighting === 'good' ? 'pass' : 'warn'}`}>
                    {
                      systemChecks.lighting === 'good' ? 'Position: Good' :
                        systemChecks.lighting === 'dark' ? 'Lighting: Too Dark' :
                          systemChecks.lighting === 'static' ? 'Camera Error: Static' :
                            systemChecks.lighting === 'no-face' ? 'Put your face in the circle' :
                              'Analyzing...'
                    }
                  </div>
                </div>
                <div className="preflight-footer">
                  <Button variant="secondary" onClick={onExit}>Cancel</Button>
                  <Button
                    onClick={() => setSystemCheckStep('mic-speak')}
                    disabled={systemChecks.lighting !== 'good'}
                  >
                    Next: Audio Check
                  </Button>
                </div>
              </div>
            )}

            {systemCheckStep === 'mic-speak' && (
              <div className="speech-step">
                <p className="step-instruction">To verify your microphone, please clearly speak the following sentence:</p>
                <div className="mic-sentence-box">
                  "{micSentence}"
                </div>

                <div className="transcript-preview">
                  <div className="transcript-label">Your Voice:</div>
                  <div className={`transcript-text ${voiceDetected ? 'success' : ''}`}>
                    {transcript || "..."}
                  </div>
                </div>

                <div className="audio-visualizer-box">
                  <div className="level-text">{voiceDetected ? 'Sentence Verified ✓' : 'Listening for sentence...'}</div>
                  <div className="noise-bar-bg">
                    <div className={`noise-bar-fill ${voiceDetected ? 'success' : ''}`} style={{ width: `${Math.min(noiseLevel * 3, 100)}%` }} />
                  </div>
                </div>

                <div className="preflight-footer">
                  <Button variant="secondary" onClick={() => setSystemCheckStep('camera-align')}>Back</Button>
                  <Button
                    onClick={() => setSystemCheckStep('ready')}
                    disabled={!voiceDetected}
                  >
                    Next: Final Step
                  </Button>
                </div>
              </div>
            )}

            {systemCheckStep === 'ready' && (
              <div className="ready-step ready-step-grid fade-in">
                {/* Left Column: Instructions & Actions */}
                <div className="ready-left-col">
                  <div className="instruction-panel glass-panel unified-panel">
                    {/* Step Indicator */}
                    <div className="wizard-progress ready-indicator">
                      <div className="progress-step done">1</div>
                      <div className="progress-line" />
                      <div className="progress-step done">2</div>
                      <div className="progress-line" />
                      <div className="progress-step active">3</div>
                    </div>

                    <div className="ready-header-section">
                      <h1 className="ready-title">Ready to Begin Assessment</h1>
                      <div className="validation-msg">
                        <span className="shield-icon">🛡️</span>
                        System validation successful. Your environment is secure.
                      </div>
                    </div>

                    <h2 className="panel-title">Assessment Structure</h2>
                    
                    <div className="assessment-grid">
                      <div className="assessment-block glass-block">
                        <div className="block-header">
                          <span className="block-icon">📝</span>
                          <h3>MCQ Assessment</h3>
                        </div>
                        <ul className="feature-list">
                          <li>• 20 Adaptive Multiple Choice Questions</li>
                          <li>• Questions based on detected resume skills</li>
                          <li>• AI monitors answering pattern</li>
                        </ul>
                      </div>
                      
                      <div className="assessment-block glass-block">
                        <div className="block-header">
                          <span className="block-icon">💻</span>
                          <h3>Coding Assessment</h3>
                        </div>
                        <ul className="feature-list">
                          <li>• Skill-based coding problems</li>
                          <li>• Built-in IDE with syntax highlighting</li>
                          <li>• Automatic evaluation with test cases</li>
                        </ul>
                      </div>
                    </div>

                    <div className="rules-section" style={{ marginTop: '1.5rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proctoring Protocol</p>
                      <div className="rules-icon-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                        {(examData?.proctoring_rules?.length > 0 ? examData.proctoring_rules : [
                          {"icon": "🚫", "text": "No Tab Switching"},
                          {"icon": "📺", "text": "Full Screen Mode"},
                          {"icon": "🔇", "text": "Silence Required"},
                          {"icon": "👤", "text": "Face Visibility"}
                        ]).map((rule, idx) => (
                          <div key={idx} className="rule-card" style={{ padding: '0.75rem', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="rule-card-icon" style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>{rule.icon}</div>
                            <div className="rule-card-content">
                              <strong style={{ fontSize: '0.75rem', color: '#1e293b' }}>{rule.text}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="ready-footer-actions">
                      <div className="system-status-indicators">
                        <div className="status-badge ok-glow">
                          <span className="status-indicator-dot"></span>
                          Cam OK
                        </div>
                        <div className="status-badge ok-glow">
                          <span className="status-indicator-dot"></span>
                          Mic OK
                        </div>
                        <div className="status-badge ok-glow">
                          <span className="status-indicator-dot"></span>
                          Env OK
                        </div>
                      </div>

                      <div className="action-button-container">
                        <Button
                          onClick={handleStartExam}
                          className="start-assessment-btn immersion-btn"
                        >
                          Start AI Proctored Assessment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Motivational Quote & Inspiration */}
                <div className="ready-right-col quote-pane">
                  <div className="quote-container glass-panel">
                    <div className="quote-decoration">“</div>
                    <div className="quote-content">
                      <p className="quote-text">
                        Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.
                      </p>
                      <cite className="quote-author">— Albert Schweitzer</cite>
                    </div>
                    <div className="quote-footer-msg">
                      Your skills are your strongest asset. Stay focused and do your best.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="proctoring-exam-container immersive-bg exam-mode-view">
      <div className="ai-exam-page">
      {/* Top Header strictly for the Exam Environment */}
      <header className="exam-header">
        <div className="exam-brand">
          <span className="exam-title" style={{ color: '#4f46e5', fontWeight: 800 }}>{platformName}</span>
          <span style={{ color: '#cbd5e1', margin: '0 0.5rem' }}>|</span>
          <span className="exam-title">{examTitle}</span>
        </div>

        <div className="header-right-section">
          <div className="header-user-info">
            <div className="user-avatar">{loggedInUser.initials}</div>
            <span className="user-name">{loggedInUser.name}</span>
          </div>

          <div className={`exam-timer ${timeLeft < 300 ? 'warning' : ''}`}>
            <span className="time-display">⏱ {formatTime(timeLeft)}</span>
          </div>

          <Button variant="danger" onClick={() => {
            if (window.confirm("Are you sure you want to finish the exam early?")) handleSubmit();
          }}>
            End Test
          </Button>
        </div>
      </header>

      <div className="exam-workspace">
        {/* Left Side: Question Panel */}
        <div className="question-panel-container">
          {examSection === 'mcq' ? (
            <div className="question-card">
              <div className="question-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.75rem' }}>
                  <span className="question-progress" style={{ fontSize: '1.25rem', color: '#111827', textTransform: 'none', letterSpacing: 'normal' }}>Question {currentQuestionIndex + 1} / {isCVTest ? 20 : (servedQuestions?.length || 0)}</span>
                  <span className="question-points">10 points</span>
                </div>
                <div className="question-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '1rem', color: '#4b5563' }}>
                  {currentQuestion?.skill && (
                    <div className="skill-info"><strong>Skill:</strong> <span className="skill-tag" style={{ marginLeft: '0.5rem', display: 'inline-block', padding: '0.25rem 0.5rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>{currentQuestion.skill}</span></div>
                  )}
                </div>
              </div>

                {currentQuestion ? (
                  <h2 className="question-text">{currentQuestion.text}</h2>
                ) : (
                  <div className="question-loading-shimmer" style={{ padding: '2rem', background: '#f3f4f6', borderRadius: '8px', marginBottom: '2rem', animation: 'shimmer 1.5s infinite' }}>
                    Loading next question...
                  </div>
                )}

              <div className="options-list">
                {currentQuestion?.options ? (
                  currentQuestion.options.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`option-btn ${answers[currentQuestionIndex] === idx ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(currentQuestion.id, idx)}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                      <span className="option-text">{opt}</span>
                      {answers[currentQuestionIndex] === idx && (
                        <svg className="selected-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ height: '60px', background: '#f9fafb', borderRadius: '8px', animation: 'shimmer 2s infinite' }}></div>
                    ))}
                  </div>
                )}
              </div>

              <div className="question-navigation">
                <Button
                  variant="secondary"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>

                {(!isCVTest && currentQuestionIndex === (servedQuestions?.length || 0) - 1 && (rawCodingProblems?.length || 0) === 0) ? (
                  <Button onClick={() => handleSubmit()}>Submit Test</Button>
                ) : (
                  <Button onClick={handleNextQuestion}>
                    {((isCVTest && (servedQuestions?.length || 0) >= 20 && currentQuestionIndex === (servedQuestions?.length || 0) - 1) || (!isCVTest && currentQuestionIndex === (servedQuestions?.length || 0) - 1)) && (rawCodingProblems?.length || 0) > 0 ? "Go to Coding Phase" : "Next"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            codingProblems && codingProblems.length > 0 && codingProblems[0] ? (
              <div className="coding-split-layout premium-fade-in">
                {/* Left Pane: Details & Examples */}
                <div className="problem-details-pane">
                  <div className="problem-tabs-header">
                    <div className="problem-tab active">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      Description
                    </div>
                  </div>
                  
                  <div className="problem-content-scroll custom-scrollbar">
                    <div className="question-header" style={{ marginBottom: '1rem' }}>
                      <span className="question-progress">Coding Challenge 1 of {codingProblems?.length || 0}</span>
                    </div>

                    <h2 className="question-text">
                      {codingProblems[0]?.problem_title || codingProblems[0]?.title || "Coding Challenge"}
                    </h2>

                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge badge-difficulty-${(codingProblems[0]?.difficulty || 'Medium').toLowerCase()}`}>
                        {codingProblems[0]?.difficulty || 'Medium'}
                      </span>
                      <span className="badge badge-points">
                        Points: {codingProblems[0]?.points || 50}
                      </span>
                    </div>

                    <div className="coding-description leetcode-style">
                      <p>{codingProblems[0]?.description || "Please solve the required algorithm below."}</p>
                    </div>

                    {codingProblems[0]?.input_output_examples && (
                      <div className="io-examples-block" style={{ marginTop: '2rem' }}>
                        <strong className="io-title">Example:</strong>
                        <div className="io-content">
                          {typeof codingProblems[0].input_output_examples === 'string' 
                            ? codingProblems[0].input_output_examples 
                            : Array.isArray(codingProblems[0].input_output_examples)
                              ? codingProblems[0].input_output_examples.map((ex, i) => (
                                  <div key={i} className="io-case">
                                    <p><strong>Input:</strong> <code>{ex.input}</code></p>
                                    <p><strong>Output:</strong> <code>{ex.output}</code></p>
                                  </div>
                                ))
                              : JSON.stringify(codingProblems[0].input_output_examples)
                          }
                        </div>
                      </div>
                    )}

                    <div className="problem-nav-bottom">
                      <Button variant="outline" onClick={() => setExamSection('mcq')} style={{ flex: '1', borderRadius: '4px' }}>
                        Back to MCQs
                      </Button>
                      <Button onClick={() => console.log('Next problem placeholder')} className="submit-exam-btn" style={{ flex: '1', borderRadius: '4px' }}>
                        Next
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Middle Pane: Editor Component */}
                <div className="editor-pane">
                  <CodeEditor
                    problem={codingProblems[0]}
                    onScoreUpdate={(score) => setCodingScore(score)}
                  />
                </div>

                {/* Right Pane: AI Proctoring Sidebar (Moves here in 3-column layout) */}
                <div className="proctoring-sidebar coding-sidebar">
                  <div className="camera-preview-container" style={{ padding: '1rem' }}>
                    <div className="video-wrapper">
                      {!cameraActive && <div className="camera-loading">Requesting Camera...</div>}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`proctoring-video ${!cameraActive ? 'hidden' : ''}`}
                      />
                      <div className="recording-indicator">
                        <span className="red-dot pulse"></span>
                        REC
                      </div>
                    </div>
                    <div className="ai-scan-overlay"></div>
                  </div>

                  <div className="status-panel" style={{ padding: '0 1rem 1rem 1rem' }}>
                    <div className="user-identity-card">
                      <h4>Candidate Information</h4>
                      <div className="identity-item">
                        <span className="identity-label">Name:</span>
                        <span className="identity-value">{loggedInUser.name}</span>
                      </div>
                      <div className="identity-item">
                        <span className="identity-label">Test ID:</span>
                        <span className="identity-value">AI-SKILL-2025</span>
                      </div>
                      <div className="identity-item">
                        <span className="identity-label">Session:</span>
                        <span className="identity-value" style={{ color: '#10b981' }}>Active</span>
                      </div>
                    </div>

                    <h3 className="status-title" style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>AI Proctoring Intelligence</h3>

                    <div className="proctoring-status-grid">
                      <div className={`proctoring-tile ${cameraActive ? 'safe' : 'danger'}`}>
                        <div className="tile-glow"></div>
                        <div className="tile-icon-area">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="4"></circle><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"></path></svg>
                        </div>
                        <div className="tile-info">
                          <span className="tile-label">Webcam Feed</span>
                          <span className="tile-state">{cameraActive ? 'Live & Secure' : 'Feed Missing'}</span>
                        </div>
                        <div className="status-dot-outer"><div className="status-dot-inner"></div></div>
                      </div>

                      <div className={`proctoring-tile ${proctoringFlags.faceDetected ? 'safe' : 'danger'}`}>
                        <div className="tile-glow"></div>
                        <div className="tile-icon-area">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div className="tile-info">
                          <span className="tile-label">Identity Match</span>
                          <span className="tile-state">{proctoringFlags.faceDetected ? 'Identity Verified' : 'No Face Detected'}</span>
                        </div>
                        <div className="status-dot-outer"><div className="status-dot-inner"></div></div>
                      </div>

                      <div className={`proctoring-tile ${!proctoringFlags.audioSpike ? 'safe' : 'warning'}`}>
                        <div className="tile-glow"></div>
                        <div className="tile-icon-area">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                        </div>
                        <div className="tile-info">
                          <span className="tile-label">Privacy Monitor</span>
                          <span className="tile-state">{proctoringFlags.audioSpike ? 'Noise Anomaly' : 'Environment Quiet'}</span>
                        </div>
                        <div className="status-dot-outer"><div className="status-dot-inner"></div></div>
                      </div>

                      <div className={`proctoring-tile ${!proctoringFlags.tabSwitched ? 'safe' : 'danger'}`}>
                        <div className="tile-glow"></div>
                        <div className="tile-icon-area">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>
                        </div>
                        <div className="tile-info">
                          <span className="tile-label">Window Focus</span>
                          <span className="tile-state">{proctoringFlags.tabSwitched ? 'Window Mismatched' : 'Secured Window'}</span>
                        </div>
                        <div className="status-dot-outer"><div className="status-dot-inner"></div></div>
                      </div>
                    </div>

                    <div className="trust-score-container" style={{ marginTop: '1rem', padding: '1rem' }}>
                      <div className="trust-header">
                        <span>Integrity Score</span>
                        <span className={`score ${proctoringFlags.tabSwitched ? 'danger-text' : 'safe-text'}`}>{proctoringFlags.tabSwitched ? '65%' : '99%'}</span>
                      </div>
                      <div className="trust-bar-bg">
                        <div className={`trust-bar-fill ${proctoringFlags.tabSwitched ? 'bg-danger' : 'bg-safe'}`} style={{ width: proctoringFlags.tabSwitched ? '65%' : '99%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              // This branch should no longer be hit because codingProblems always has a fallback.
              // But if it somehow is, provide a clear escape rather than an infinite spinner.
              <div className="editor-loading-fallback glass-card" style={{ 
                margin: '2rem auto', 
                padding: '4rem', 
                maxWidth: '600px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '1.5rem',
                borderRadius: '20px'
              }}>
                <div style={{ fontSize: '3rem' }}>⚠️</div>
                <div className="fallback-text">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '0.5rem' }}>Coding Problems Unavailable</h3>
                  <p style={{ color: '#64748b', fontSize: '1rem' }}>The coding challenge data could not be loaded. You can still submit your MCQ results.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                   <Button onClick={() => handleSubmit()}>Submit Test Now</Button>
                   <Button variant="outline" onClick={() => setExamSection('mcq')}>Back to MCQs</Button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Side: AI Proctoring Sidebar (Only show if MCQ section, Coding handles it internally) */}
        {examSection === 'mcq' && (
          <div className="proctoring-sidebar">

            <div className="camera-preview-container">
              <div className="video-wrapper">
                {!cameraActive && <div className="camera-loading">Requesting Camera...</div>}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`proctoring-video ${!cameraActive ? 'hidden' : ''}`}
                />
                <div className="recording-indicator">
                  <span className="red-dot pulse"></span>
                  REC
                </div>
              </div>
              <div className="ai-scan-overlay"></div>
            </div>

            <div className="status-panel">
              <h3 className="status-title">AI Proctoring Status</h3>

              <div className="status-list">
                <div className="status-item">
                  <div className={`status-icon-box ${cameraActive ? 'safe' : 'danger'}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </div>
                  <div className="status-info">
                    <span className="label">Webcam Feed</span>
                    <span className={`state ${cameraActive ? 'safe-text' : 'danger-text'}`}>
                      {cameraActive ? 'Active' : 'Missing'}
                    </span>
                  </div>
                </div>

                <div className="status-item">
                  <div className={`status-icon-box ${proctoringFlags.faceDetected ? 'safe' : 'danger'}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div className="status-info">
                    <span className="label">Face Verification</span>
                    <span className={`state ${proctoringFlags.faceDetected ? 'safe-text' : 'danger-text'}`}>
                      {proctoringFlags.faceDetected ? 'Verified' : 'Face Missing'}
                    </span>
                  </div>
                </div>

                <div className="status-item">
                  <div className={`status-icon-box ${!proctoringFlags.audioSpike ? 'safe' : 'warning'}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </div>
                  <div className="status-info">
                    <span className="label">Audio Environment</span>
                    <span className={`state ${!proctoringFlags.audioSpike ? 'safe-text' : 'warning-text'}`}>
                      {proctoringFlags.audioSpike ? 'Noise Detected' : 'Quiet'}
                    </span>
                  </div>
                </div>

                <div className="status-item">
                  <div className={`status-icon-box ${!proctoringFlags.tabSwitched ? 'safe' : 'danger'}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <div className="status-info">
                    <span className="label">Tab Focus</span>
                    <span className={`state ${!proctoringFlags.tabSwitched ? 'safe-text' : 'danger-text'}`}>
                      {proctoringFlags.tabSwitched ? 'Violation Logged' : 'In Focus'}
                    </span>
                  </div>
                </div>

              </div>

              <div className="trust-score-container">
                <div className="trust-header">
                  <span>AI Integrity Score</span>
                  <span className={`score ${proctoringFlags.tabSwitched ? 'danger-text' : 'safe-text'}`}>
                    {proctoringFlags.tabSwitched ? '65%' : '99%'}
                  </span>
                </div>
                <div className="trust-bar-bg">
                  <div className={`trust-bar-fill ${proctoringFlags.tabSwitched ? 'bg-danger' : 'bg-safe'}`}
                    style={{ width: proctoringFlags.tabSwitched ? '65%' : '99%' }}></div>
                </div>
                <p className="trust-helper">Score updates continuously based on behavioral anomalies.</p>
              </div>

            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AIProctoringExam;
