import { useState, useEffect } from 'react';
import './SkillTests.css';
import TestCard from '../../components/TestCard/TestCard';
import FileUpload from '../../components/FileUpload/FileUpload';
import Button from '../../components/Button/Button';
import { API_URL } from '../../utils/api';

/* ─── Category config ─────────────────────────────────────── */
const CATEGORIES_META = [
  { key: 'All',            icon: '🌐', desc: 'Browse all available tests' },
  { key: 'Technical',      icon: '💻', desc: 'Programming & core technical skills' },
  { key: 'Aptitude',       icon: '🧩', desc: 'Logic, reasoning & problem solving' },
  { key: 'Soft Skills',    icon: '🌍', desc: 'Communication & interpersonal skills' },
  { key: 'Leadership',     icon: '🏆', desc: 'Management & strategic thinking' },
  { key: 'Data Science',   icon: '📊', desc: 'Data analysis & machine learning' },
  { key: 'DevOps',         icon: '⚙️', desc: 'Cloud, CI/CD & infrastructure' },
];

const RECOMMENDED = [
  { icon: '🐍', title: 'Python Fundamentals', diff: 'Beginner',     time: 20, questions: 25, cat: 'Technical', tag: 'Popular' },
  { icon: '⚛️', title: 'React & Hooks',       diff: 'Intermediate', time: 35, questions: 30, cat: 'Technical', tag: 'Trending' },
  { icon: '🧮', title: 'Logic & Reasoning',    diff: 'Intermediate', time: 30, questions: 20, cat: 'Aptitude',  tag: 'Recommended' },
  { icon: '📊', title: 'Data Analysis',        diff: 'Beginner',     time: 25, questions: 20, cat: 'Data Science', tag: 'New' },
];

const DIFF_COLOR = { Beginner: '#10b981', Intermediate: '#f59e0b', Advanced: '#ef4444' };

const SkillTests = ({ onStartTest }) => {
  const [assessments, setAssessments]         = useState([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy]                   = useState('popular');
  const [availableCategories, setAvailableCategories]   = useState(['All']);
  const [availableDifficulties, setAvailableDifficulties] = useState(['All']);

  // CV Upload State
  const [cvFile, setCvFile]                   = useState(null);
  const [isAnalyzingCV, setIsAnalyzingCV]     = useState(false);
  const [analyzedSkills, setAnalyzedSkills]   = useState(null);
  const [cvGeneratedQuestions, setCvGeneratedQuestions] = useState(null);
  const [cvError, setCvError]                 = useState(null);
  const [showCVPanel, setShowCVPanel]         = useState(false);
  const [existingCV, setExistingCV]           = useState(null);
  const [isCheckingCV, setIsCheckingCV]       = useState(true);
  const [showUploadAnyway, setShowUploadAnyway] = useState(false);

  // Fetch metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const response = await fetch(`${API_URL}/assessments/metadata/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(['All', ...data.categories]);
          setAvailableDifficulties(['All', ...data.difficulties]);
        }
      } catch (err) { console.error('Failed to fetch metadata:', err); }
    };
    fetchMetadata();
  }, []);

  // Check for existing CV
  useEffect(() => {
    const checkCV = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/ai-interview/cv-status/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.exists) setExistingCV(data);
      } catch (err) { console.error("CV check failed", err); }
      finally { setIsCheckingCV(false); }
    };
    checkCV();
  }, []);

  // Fetch Assessments
  useEffect(() => {
    const fetchAssessments = async () => {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'All') params.append('difficulty', selectedDifficulty);
      let ordering = '-enrolled_count';
      if (sortBy === 'newest')   ordering = '-id';
      if (sortBy === 'shortest') ordering = 'estimated_time';
      params.append('ordering', ordering);
      try {
        const response = await fetch(`${API_URL}/assessments/?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setAssessments(await response.json());
      } catch (err) { console.error('Failed to fetch assessments:', err); }
    };
    const t = setTimeout(fetchAssessments, 300);
    return () => clearTimeout(t);
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const handleCVUpload = async (file, useExistingId = null) => {
    if (!file && !useExistingId) return;
    setCvFile(file); setCvError(null);
    setAnalyzedSkills(null); setCvGeneratedQuestions(null);
    setIsAnalyzingCV(true);

    const formData = new FormData();
    if (useExistingId) {
      formData.append('analysis_id', useExistingId);
    } else {
      formData.append('cv_file', file);
    }
    formData.append('api_key', import.meta.env.VITE_GROQ_API_KEY || '');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/assessments/generate-cv/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze CV.');
      const payload = data.questions;
      setCvGeneratedQuestions(payload);
      setAnalyzedSkills(payload.skills || ['Technical Skills', 'Domain Expertise']);
    } catch (err) {
      console.error(err); setCvError(err.message); setAnalyzedSkills(null);
    } finally { setIsAnalyzingCV(false); }
  };

  const handleStartCVTest = () => {
    if (onStartTest) {
      onStartTest({
        id: 'cv-test',
        questions: cvGeneratedQuestions.questions || [],
        coding_problems: cvGeneratedQuestions.coding_problems || [],
        title: 'AI Personalized Skills Assessment'
      });
    }
  };

  const handleStartTest = (testId) => {
    const selectedTest = assessments.find(t => t.id === testId);
    if (onStartTest && selectedTest) {
      onStartTest({
        id: selectedTest.id, title: selectedTest.title,
        questions: selectedTest.questions || [],
        coding_problems: selectedTest.coding_problems || [],
        estimated_time: selectedTest.estimated_time
      });
    }
  };

  return (
    <div className="st-page">

      {/* ─── HERO INTRO ─── */}
      <div className="st-hero">
        <div className="st-hero-bg-blob" />
        <div className="st-hero-content">
          <span className="st-hero-tag">⚡ AI-Powered Assessments</span>
          <h1>Test Your Skills with Confidence</h1>
          <p>Our adaptive AI evaluates your expertise in real-time, adjusting question difficulty to precisely measure your knowledge — then gives you a personalized improvement plan.</p>
          <div className="st-hero-actions">
            <button className="st-btn-primary" onClick={() => setShowCVPanel(p => !p)}>
              📄 {showCVPanel ? 'Hide CV Upload' : 'Generate Test from CV'}
            </button>
            <button className="st-btn-ghost" onClick={() => document.querySelector('.st-grid')?.scrollIntoView({ behavior: 'smooth' })}>
              Browse All Tests ↓
            </button>
          </div>
        </div>
        <div className="st-hero-visual">
          <div className="st-hero-card">
            <div className="st-hc-header">
              <span className="st-hc-dot red" /><span className="st-hc-dot yellow" /><span className="st-hc-dot green" />
              <span className="st-hc-title">🧠 AI Adaptive Test</span>
            </div>
            <div className="st-hc-body">
              <div className="st-q-block">
                <span className="st-q-num">Q1</span>
                <p>What is the time complexity of binary search?</p>
                <div className="st-q-options">
                  {['O(n)', 'O(log n)', 'O(n²)', 'O(1)'].map((opt, i) => (
                    <div key={i} className={`st-q-opt ${i === 1 ? 'correct' : ''}`}>{opt}</div>
                  ))}
                </div>
              </div>
              <div className="st-hc-footer">
                <span className="st-hc-tag beginner">Beginner</span>
                <span className="st-hc-score">Score: <strong>88%</strong></span>
              </div>
            </div>
          </div>
          <div className="st-float-chip st-fc-1">📊 Skill Analysis</div>
          <div className="st-float-chip st-fc-2">🎯 Adaptive AI</div>
        </div>
      </div>

      {/* ─── CV UPLOAD PANEL ─── */}
      {showCVPanel && (
        <div className="st-cv-panel">
          <div className="st-cv-panel-header">
            <div>
              <h3>🤖 Generate Personalized Test from Your Resume</h3>
              <p>Upload your CV and our AI will detect your skills and create a custom assessment tailored to your expertise.</p>
            </div>
            <button className="st-close-btn" onClick={() => setShowCVPanel(false)}>✕</button>
          </div>

          {!analyzedSkills && !isAnalyzingCV && (
            isCheckingCV ? (
              <div className="st-cv-analyzing">
                <div className="st-cv-spinner" />
                <p>Checking for previous resume...</p>
              </div>
            ) : existingCV && !showUploadAnyway ? (
              <div className="st-existing-cv-card">
                <div className="st-existing-icon">📄</div>
                <div className="st-existing-info">
                  <h4>Welcome Back!</h4>
                  <p>Found your analyzed resume: <strong>{existingCV.file_name}</strong></p>
                </div>
                <div className="st-existing-actions">
                  <Button onClick={() => handleCVUpload(null, existingCV.id)}>
                    Generate Test from This CV ➔
                  </Button>
                  <button className="st-alt-upload" onClick={() => setShowUploadAnyway(true)}>
                    Upload Different Resume
                  </button>
                </div>
              </div>
            ) : (
              <FileUpload id="cv-upload" accept=".pdf,.doc,.docx" maxMb={5} onChange={handleCVUpload} />
            )
          )}

          {isAnalyzingCV && (
            <div className="st-cv-analyzing">
              <div className="st-cv-spinner" />
              <p>🧠 AI is reading your CV and generating personalized questions...</p>
            </div>
          )}

          {cvError && (
            <div className="st-cv-error">⚠️ {cvError}</div>
          )}

          {analyzedSkills && (
            <div className="st-cv-result">
              <div className="st-cv-result-header">
                <span className="st-cv-check">✅ Analysis Complete</span>
                <p>Skills detected from your resume:</p>
              </div>
              <div className="st-detected-skills">
                {analyzedSkills.map((skill, i) => (
                  <span key={i} className="st-skill-pill">{skill}</span>
                ))}
              </div>
              <div className="st-cv-result-footer">
                <Button onClick={handleStartCVTest}>🚀 Start Personalized Test</Button>
                <button className="st-reset-btn" onClick={() => { setAnalyzedSkills(null); setCvFile(null); setCvGeneratedQuestions(null); }}>
                  Upload Different CV
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CATEGORY CHIPS ─── */}
      <div className="st-categories">
        <h3 className="st-section-label">📂 Browse by Category</h3>
        <div className="st-category-grid">
          {CATEGORIES_META.map((cat) => (
            <button
              key={cat.key}
              className={`st-cat-card ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <span className="st-cat-icon">{cat.icon}</span>
              <div>
                <div className="st-cat-name">{cat.key}</div>
                <div className="st-cat-desc">{cat.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── RECOMMENDED TESTS ─── */}
      <div className="st-recommended">
        <div className="st-section-header">
          <h3 className="st-section-label">⭐ Recommended for You</h3>
          <span className="st-view-all">View All →</span>
        </div>
        <div className="st-rec-grid">
          {RECOMMENDED.map((rec, i) => (
            <div key={i} className="st-rec-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="st-rec-tag" style={{ background: rec.tag === 'Popular' ? '#ecfdf5' : rec.tag === 'Trending' ? '#eff6ff' : rec.tag === 'New' ? '#fdf4ff' : '#fffbeb', color: rec.tag === 'Popular' ? '#059669' : rec.tag === 'Trending' ? '#3b82f6' : rec.tag === 'New' ? '#9333ea' : '#d97706' }}>
                {rec.tag}
              </div>
              <div className="st-rec-icon">{rec.icon}</div>
              <div className="st-rec-title">{rec.title}</div>
              <div className="st-rec-meta">
                <span className="st-diff-badge" style={{ background: `${DIFF_COLOR[rec.diff]}15`, color: DIFF_COLOR[rec.diff] }}>{rec.diff}</span>
                <span className="st-rec-info">⏱ {rec.time}m · {rec.questions}Q</span>
              </div>
              <div className="st-rec-bottom">
                <span className="st-rec-cat">{rec.cat}</span>
                <button className="st-start-mini" onClick={() => document.querySelector('.st-grid')?.scrollIntoView({ behavior: 'smooth' })}>Start →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── FILTERS + SEARCH ─── */}
      <div className="st-filters-bar">
        <div className="st-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search tests, skills, topics..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button className="st-clear-search" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
        <div className="st-filter-row">
          <div className="st-filter-chip-group">
            {availableDifficulties.map(d => (
              <button key={d} className={`st-filter-chip ${selectedDifficulty === d ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(d)}
                style={d !== 'All' && selectedDifficulty === d ? { background: `${DIFF_COLOR[d]}15`, color: DIFF_COLOR[d], borderColor: DIFF_COLOR[d] } : {}}>
                {d}
              </button>
            ))}
          </div>
          <div className="st-sort-select">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="shortest">Shortest</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── TESTS GRID ─── */}
      <div className="st-grid-section">
        <h3 className="st-section-label">
          {selectedCategory !== 'All' ? `${CATEGORIES_META.find(c => c.key === selectedCategory)?.icon} ${selectedCategory}` : '🗂️ All Tests'}
          {assessments.length > 0 && <span className="st-count-badge">{assessments.length}</span>}
        </h3>

        {assessments.length === 0 ? (
          <div className="st-empty">
            <span className="st-empty-icon">🔍</span>
            <h4>No tests found</h4>
            <p>Try different filters or search terms</p>
            <button className="st-btn-primary" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedDifficulty('All'); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="tests-grid st-grid">
            {assessments.map(test => (
              <TestCard key={test.id} test={test} onStart={handleStartTest} />
            ))}
          </div>
        )}
      </div>

      {/* ─── LEARNING SUGGESTIONS ─── */}
      <div className="st-suggestions">
        <h3 className="st-section-label">💡 AI Learning Suggestions</h3>
        <div className="st-suggestions-grid">
          {[
            { icon: '📚', title: 'Practice Topics', desc: 'Review React hooks, async/await, and REST API design patterns.', color: '#5c5cfc' },
            { icon: '💻', title: 'Coding Challenges', desc: 'Try "Two Sum", "LRU Cache" and "Binary Tree Traversal" on our sandbox.', color: '#10b981' },
            { icon: '📈', title: 'Skill Improvement', desc: 'Focus on System Design — your weakest area based on recent tests.', color: '#f59e0b' },
          ].map((sg, i) => (
            <div key={i} className="st-suggestion-card" style={{ '--sg-color': sg.color }}>
              <div className="st-sg-icon" style={{ background: `${sg.color}12`, color: sg.color }}>{sg.icon}</div>
              <div className="st-sg-title">{sg.title}</div>
              <div className="st-sg-desc">{sg.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SkillTests;
