import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Mic, 
  ShieldCheck, 
  BarChart3, 
  Code2, 
  FileSearch, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  UserCheck,
  LayoutDashboard,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Send,
  X,
  Menu,
  Compass,
  LineChart,
  Rocket,
  Users,
  Briefcase,
  BookOpen,
  MessageSquare,
  Zap as ZapIcon,
  FileText,
  HelpCircle,
  ChevronUp,
  Clock,
  Search
} from 'lucide-react';
import { countries } from './countries';
import './LandingPage.css';

/* ─── Reveal Hook ─── */
const useInViewReveal = (ready) => {
  useEffect(() => {
    if (!ready) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('animate-in');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }, 200);
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [ready]);
};

/* ─── Welcome Screen ─────────────────────────────────────────── */
const WelcomeScreen = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const msgs = ["Welcome to SkillGuard AI.", "The Next-Gen Assessment Platform.", "Your AI journey starts now. ⚡"];
  
  useEffect(() => {
    if (step < msgs.length) {
      const t = setTimeout(() => setStep(s => s + 1), step === 0 ? 800 : 1200);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [step, msgs.length, onDone]);

  return (
    <div className={`welcome-screen ${step > msgs.length - 1 ? 'fade-out' : ''}`}>
      <div className="welcome-logo">⚡</div>
      <div className="welcome-messages">
        {msgs.map((m, i) => (
          <div key={i} className={`welcome-msg ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`}>
            {m}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Navigation Overlay ─────────────────────────────────────── */
const NavigationOverlay = ({ isOpen, onClose, navigate, scrollTo }) => {
  const menuItems = [
    { label: 'Home', href: '#home', icon: <LayoutDashboard size={20} /> },
    { label: 'Features', href: '#features', icon: <Zap size={20} /> },
    { label: 'How It Works', href: '#how-it-works', icon: <CheckCircle2 size={20} /> },
    { label: 'Live Demo', href: '#demo', icon: <Mic size={20} /> },
    { label: 'AI Mentor', href: '#ai-mentor', icon: <Brain size={20} /> },
    { label: 'Confidence Analyzer', href: '#confidence', icon: <TrendingUp size={20} /> },
    { label: 'Analytics', href: '#analytics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="nav-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 2000 }}
        >
          <div className="nav-overlay-content">
            <button className="nav-overlay-close" onClick={onClose}>✕</button>
            <motion.div 
              className="nav-overlay-links"
              initial="closed"
              animate="open"
              variants={{
                open: { transition: { staggerChildren: 0.1 } },
                closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
              }}
            >
              {menuItems.map((item, i) => (
                <motion.a
                  key={i}
                  href={item.href}
                  className="nav-overlay-link"
                  whileHover={{ x: 10, color: 'var(--lp-primary)' }}
                  variants={{
                    open: { opacity: 1, y: 0 },
                    closed: { opacity: 0, y: 20 }
                  }}
                  onClick={(e) => {
                    scrollTo(e, item.href);
                    onClose();
                  }}
                >
                  <span className="nav-overlay-icon">{item.icon}</span>
                  {item.label}
                </motion.a>
              ))}
              <motion.div 
                className="nav-overlay-footer"
                variants={{
                  open: { opacity: 1 },
                  closed: { opacity: 0 }
                }}
              >
                <button className="btn btn-primary" onClick={() => navigate('/signup')}>Get Started Free</button>
                <button className="btn btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Shared Mega Dropdown Component ──────────────────────── */
const MegaDropdown = ({ isOpen, onClose, navigate, title, items, previewHeader, footerAction, panelClass = "" }) => {
  const [activeItem, setActiveItem] = useState(items[0]);

  const renderItem = (item, i) => (
    <motion.div 
      key={i} 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05 }}
      whileHover={{ x: 10 }}
      className={`features-dropdown-item ${activeItem.title === item.title ? 'active' : ''}`}
      onMouseEnter={() => setActiveItem(item)}
      onClick={(e) => { 
        onClose(); 
        if (item.href) {
          const target = document.querySelector(item.href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (item.link) {
          navigate(item.link);
        } else {
          navigate('/signup');
        }
      }}
    >
      <div className="fdi-icon" style={{ backgroundColor: item.color }}>{item.icon}</div>
      <div className="fdi-content">
        <h4>{item.title}</h4>
        <p>{item.desc}</p>
      </div>
      <ArrowRight size={14} className="fdi-arrow" />
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="dropdown-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div 
            className={`features-dropdown-panel upgraded ${panelClass}`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="fdp-dual-pane">
              <div className="fdp-features-list">
                <div className="fdp-list-header">
                  <Sparkles size={16} className="pulse-icon" />
                  <span>{title}</span>
                </div>
                <div className="fdp-list-scroll">{items.map(renderItem)}</div>
              </div>

              <div className="fdp-preview-pane">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeItem.title}
                    className="fdp-preview-card"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="preview-icon-large" style={{ backgroundColor: activeItem.color }}>{activeItem.icon}</div>
                    <h4>{activeItem.title}</h4>
                    <p>{activeItem.previewDesc || activeItem.desc}</p>
                    <div className="preview-tag">{previewHeader}</div>
                    <button className="preview-action" onClick={() => { onClose(); navigate('/signup'); }}>
                      {footerAction} <ArrowRight size={14} />
                    </button>
                  </motion.div>
                </AnimatePresence>
                <div className="preview-decoration">
                  <div className="decor-blob b1" />
                  <div className="decor-blob b2" />
                </div>
              </div>
            </div>
            <button className="fdp-mobile-close" onClick={onClose}><X size={24} /></button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── Features Mega Dropdown ─────────────────────────────── */
const FeaturesDropdown = ({ isOpen, onClose, navigate }) => {
  const allFeatures = [
    { title: 'AI Skill Test', id: 'f-skill-test', desc: 'Adaptive technical assessments', icon: <Brain size={18} />, color: '#e8f5e9', previewDesc: 'Questions dynamically adjust to your skill level in real-time, providing an accurate score in half the time.', href: '#f-skill-test' },
    { title: 'AI Interview', id: 'f-interview', desc: 'Real-time conversational AI', icon: <Mic size={18} />, color: '#f3e5f5', previewDesc: 'Simulate high-pressure interviews with specialized AI that provides instant feedback on tone, content, and body language.', href: '#f-interview' },
    { title: 'Coding Challenge', id: 'f-code', desc: 'Interactive live coding env', icon: <Code2 size={18} />, color: '#e3f2fd', previewDesc: 'Solve complex algorithmic problems in a secure, integrated environment that monitors logic and complexity.', href: '#f-code' },
    { title: 'Proctored Exam', id: 'f-proctor', desc: 'Anti-cheat AI monitoring', icon: <ShieldCheck size={18} />, color: '#fff3e0', previewDesc: 'Advanced behavior tracking and biometric verification to ensure full integrity during remote assessments.', href: '#f-proctor' },
    { title: 'ATS Resume Checker', id: 'f-ats', desc: 'Optimize for recruitment bots', icon: <FileSearch size={18} />, color: '#fce4ec', previewDesc: 'Get your resume scanned by our AI to see how recruiters and bots see you. Optimize for top keywords instantly.', href: '#f-ats' },
    { title: 'Confidence Analyzer', id: 'f-confidence', desc: 'Sentiment analysis', icon: <TrendingUp size={18} />, color: '#f1f8e9', previewDesc: 'Understand the subtext of your speech. Our AI detects hesitation and monitors phrasing to build confidence.', href: '#f-confidence' },
    { title: 'Learning Roadmap', id: 'f-roadmap', desc: 'Personalized growth path', icon: <MapPin size={18} />, color: '#fffde7', previewDesc: 'Receive a step-by-step educational guide based specifically on the gaps discovered in your testing performance.', href: '#f-roadmap' },
    { title: 'AI Insights', id: 'f-insights', desc: 'Deep performance analytics', icon: <BarChart3 size={18} />, color: '#e0f7fa', previewDesc: 'Go beyond the score. Get heatmaps and comparative data that show exactly how you stand against industry standards.', href: '#f-insights' },
  ];

  return (
    <MegaDropdown 
      isOpen={isOpen} 
      onClose={onClose} 
      navigate={navigate} 
      title="Platform Features" 
      items={allFeatures} 
      previewHeader="Live Preview" 
      footerAction="Try it out" 
    />
  );
};

/* ─── About Us Dropdown ──────────────────────────────────── */
const AboutDropdown = ({ isOpen, onClose, navigate }) => {
  const aboutItems = [
    { title: 'Our Story', desc: 'How it all started', icon: <Rocket size={18} />, color: '#e0f2fe', previewDesc: 'SkillGuard AI was founded on the belief that talent is universal. We are on a mission to bridge that gap.', href: '#story' },
    { title: 'Our Team', desc: 'The people behind AI', icon: <Users size={18} />, color: '#fef3c7', previewDesc: "A diverse group of engineers and educators dedicated to making assessment fair and efficient.", href: '#team' },
    { title: 'Careers', desc: 'Join our mission', icon: <Briefcase size={18} />, color: '#ecfdf5', previewDesc: 'We’re growing fast! If you’re passionate about AI and education, we’d love to have you on board.', href: '#careers' },
    { title: 'Values', desc: 'What drives us', icon: <Sparkles size={18} />, color: '#fdf2f8', previewDesc: 'Integrity, innovation, and inclusivity. Our core values shape every line of code we write.', href: '#values' },
    { title: 'Blog', desc: 'Latest updates & news', icon: <BookOpen size={18} />, color: '#f5f3ff', previewDesc: 'Read about the latest trends in AI and how modern teams are scaling talent acquisition.', href: '#blog' },
  ];

  return (
    <MegaDropdown 
      isOpen={isOpen} 
      onClose={onClose} 
      navigate={navigate} 
      title="Company DNA" 
      items={aboutItems} 
      previewHeader="Our Vision" 
      footerAction="Read More"
      panelClass="about-dropdown-offset"
    />
  );
};

/* ─── Contact Dropdown ───────────────────────────────────── */
const ContactDropdown = ({ isOpen, onClose, navigate }) => {
  const contactItems = [
    { title: 'Technical Support', desc: 'Help with the platform', icon: <MessageSquare size={18} />, color: '#ecfdf5', previewDesc: 'Need a hand? Our tech team is available 24/7 to help you with any platform issues.', href: '#contact' },
    { title: 'Sales Inquiry', desc: 'Enterprise solutions', icon: <Send size={18} />, color: '#dcfce7', previewDesc: 'Looking for at-scale assessment? Talk to our sales team about custom enterprise plans.', href: '#contact-form' },
    { title: 'Live Chat', desc: 'Instant assistance', icon: <ZapIcon size={18} />, color: '#fffce1', previewDesc: 'Chat with our AI bot or a human representative for immediate answers.', href: '#contact' },
    { title: 'Media Kit', desc: 'Press materials', icon: <FileText size={18} />, color: '#f3e8ff', previewDesc: 'Download our brand assets, logos, and official press releases here.', href: '#footer-bottom' },
    { title: 'FAQ Center', desc: 'Common questions', icon: <HelpCircle size={18} />, color: '#e0f2fe', previewDesc: 'Search our database for answers to the most frequently asked questions.', href: '#faq' },
  ];

  return (
    <MegaDropdown 
      isOpen={isOpen} 
      onClose={onClose} 
      navigate={navigate} 
      title="Request a Live Demo" 
      items={contactItems} 
      previewHeader="Customer Success" 
      footerAction="Start Chat"
      panelClass="contact-dropdown-offset"
    />
  );
};

/* ─── Main Component ─────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Country Selector State (Imported from ./countries.js)
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.code === 'US') || countries[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const countryDropdownRef = useRef(null);

  // Close country dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.dialCode.includes(searchQuery)
  );

  useInViewReveal(!showWelcome);

  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    if (showWelcome) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      setShowScrollToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showWelcome]);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    },
    viewport: { once: true }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollTo = (e, id) => {
    e.preventDefault();
    if (id === '#home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const faqs = [
    { q: "How does the AI Interview work?", a: "Our AI analyzes your resume and generates personalized questions. It then listens to your voice responses, providing real-time feedback on your content, tone, and confidence." },
    { q: "Are the skill tests adaptive?", a: "Yes, the questions dynamically adjust their difficulty based on your previous answers to accurately measure your skill level in less time." },
    { q: "Can I use SkillGuard for hiring?", a: "Absolutely! Companies use SkillGuard to screen candidates quickly with AI-powered reports and proctored environments." },
    { q: "Is there a free trial?", a: "We offer a free tier that includes basic skill tests and one mock AI interview to get you started." }
  ];

  if (showWelcome) return <WelcomeScreen onDone={() => setShowWelcome(false)} />;

  return (
    <div className="landing-page">
      <NavigationOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} navigate={navigate} scrollTo={scrollTo} />
      
      {/* 1. NAVBAR */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container container">
          <a href="#home" onClick={(e) => scrollTo(e, '#home')} className="logo">
            <div className="logo-icon">⚡</div>
            SkillGuard <span className="accent">AI</span>
          </a>
          
          <ul className="nav-links">
            <li className="nav-dropdown-trigger">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setShowFeatures(!showFeatures); setShowAbout(false); setShowContact(false); }}
                className={showFeatures ? 'active' : ''}
              >
                Features <ChevronDown size={14} className={`nav-chevron ${showFeatures ? 'rotated' : ''}`} />
              </a>
              <FeaturesDropdown isOpen={showFeatures} onClose={() => setShowFeatures(false)} navigate={navigate} />
            </li>
            <li className="nav-dropdown-trigger">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setShowAbout(!showAbout); setShowFeatures(false); setShowContact(false); }}
                className={showAbout ? 'active' : ''}
              >
                About Us <ChevronDown size={14} className={`nav-chevron ${showAbout ? 'rotated' : ''}`} />
              </a>
              <AboutDropdown isOpen={showAbout} onClose={() => setShowAbout(false)} navigate={navigate} />
            </li>
            <li><a href="#how-it-works" onClick={(e) => scrollTo(e, '#how-it-works')}>How It Works</a></li>
            <li><a href="#pricing" onClick={(e) => scrollTo(e, '#pricing')}>Pricing</a></li>
            <li className="nav-dropdown-trigger">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setShowContact(!showContact); setShowFeatures(false); setShowAbout(false); }}
                className={showContact ? 'active' : ''}
              >
                Contact <ChevronDown size={14} className={`nav-chevron ${showContact ? 'rotated' : ''}`} />
              </a>
              <ContactDropdown isOpen={showContact} onClose={() => setShowContact(false)} navigate={navigate} />
            </li>
            <li><a href="#why-ai" onClick={(e) => scrollTo(e, '#why-ai')}>Why AI?</a></li>
          </ul>

          <div className="nav-cta">
            <button className="btn btn-outline" onClick={() => navigate('/login')}>Login</button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>Get Started</button>
          </div>
        </div>
      </nav>

      <main>
        {/* 2. HERO SECTION */}
        <section id="home" className="hero-section">
          {/* Animated Background Gradient & Particles */}
          <div className="hero-background">
            <div className="gradient-sphere gs-1" />
            <div className="gradient-sphere gs-2" />
            <div className="floating-particles">
              {[...Array(8)].map((_, i) => <div key={i} className={`particle p-${i+1}`} />)}
            </div>
          </div>

          <div className="container hero-container">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hero-content"
            >
              {/* Center Glow Icon */}
              <div className="hero-icon-wrapper">
                <div className="hero-glow-icon">⚡</div>
              </div>
              
              <div className="hero-badge">
                <span className="badge-dot" />
                Next-Gen AI Assessment Platform
              </div>
              
              <h1 className="stagger-heading">
                {['The', 'Future', 'of', 'AI', 'Skill', 'Assessment'].map((word, i) => (
                  <motion.span
                    key={i}
                    className={['AI', 'Skill', 'Assessment'].includes(word) ? "gradient-text" : ""}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (i * 0.15), duration: 0.6, ease: "easeOut" }}
                  >
                    {word}{' '}
                  </motion.span>
                ))}
              </h1>
              
              <motion.p
                className="hero-subtext"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                AI-powered platform to evaluate skills, analyze resumes, and boost hiring decisions.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="hero-cta"
              >
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(34, 197, 94, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary btn-lg btn-glow" 
                  onClick={() => navigate('/signup')}
                >
                  Get Started <ArrowRight size={18} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-outline btn-lg" 
                  onClick={() => navigate('/login')}
                >
                  View Demo
                </motion.button>
              </motion.div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="hero-visual-area parallax-visual upgraded"
            >
              <div className="visual-glow-halo" />
              <div className="parallax-mockup-wrapper">
                <img src="/hero-brain.png" alt="SkillGuard AI Cinematic" className="hero-img-cinematic mockup-layered" />
              </div>
              
              {/* Floating Layered UI Elements (Mockup style) */}
              <motion.div 
                className="floating-mockup-card h-card-1"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="fmc-icon positive"><CheckCircle2 size={20} /></div>
                <div className="fmc-content">
                  <div className="fmc-title">Skill Match</div>
                  <div className="fmc-value">98.5%</div>
                </div>
              </motion.div>

              <motion.div 
                className="floating-mockup-card h-card-2"
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="fmc-icon neutral"><Sparkles size={20} /></div>
                <div className="fmc-content">
                  <div className="fmc-title">AI Analysis</div>
                  <div className="fmc-progress">
                    <div className="fmc-progress-bar" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="floating-mockup-card h-card-3"
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="fmc-icon timer"><BarChart3 size={20} /></div>
                <div className="fmc-content">
                  <div className="fmc-title">Hiring Speed</div>
                  <div className="fmc-value highlight">+45%</div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Animated Scroll Indicator */}
          <motion.div 
            className="scroll-indicator-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            onClick={(e) => scrollTo(e, '#features')}
          >
            <div className="scroll-indicator-text">Scroll down</div>
            <motion.div 
              className="scroll-arrow"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </motion.div>
        </section>

        {/* 3. DETAILED FEATURES SECTION */}
        <section id="features" className="features-section">
          <div className="container">
            <motion.div {...fadeInUp} className="section-header">
              <span className="section-eyebrow">The SkillGuard Ecosystem</span>
              <h2 className="section-title">Comprehensive <span className="gradient-text">AI Assessment Suite</span></h2>
              <p className="section-subtitle">Every tool you need to evaluate, benchmark, and grow your talent pipeline with precision.</p>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="detailed-features-grid"
            >
              {[
                { 
                  id: 'f-skill-test', 
                  title: 'AI Skill Test', 
                  desc: 'Our adaptive testing engine identifies true proficiency by adjusting difficulty in real-time. Whether it’s Python logic or System Design, we go beyond simple multiple-choice questions.', 
                  icon: <Brain size={24} />, 
                  color: '#e8f5e9' 
                },
                { 
                  id: 'f-interview', 
                  title: 'AI Interview', 
                  desc: 'Scale your screening with conversational AI that asks relevant follow-up questions. It evaluates not just what was said, but the confidence and clarity behind every answer.', 
                  icon: <Mic size={24} />, 
                  color: '#f3e5f5' 
                },
                { 
                  id: 'f-code', 
                  title: 'Coding Challenge', 
                  desc: 'Assess logic and code quality with an integrated development environment. Our AI reviews complexity, efficiency, and edge-case handling automatically.', 
                  icon: <Code2 size={24} />, 
                  color: '#e3f2fd' 
                },
                { 
                  id: 'f-proctor', 
                  title: 'Proctored Exam', 
                  desc: 'Ensure 100% integrity with multi-layered AI monitoring. We track browser activity, focus shifts, and biometric signals to maintain a fair testing environment anywhere.', 
                  icon: <ShieldCheck size={24} />, 
                  color: '#fff3e0' 
                },
                { 
                  id: 'f-ats', 
                  title: 'ATS Resume Checker', 
                  desc: 'Bridge the gap between talent and recruitment bots. Our AI provides instant feedback on how to optimize resumes for industry-standard tracking systems.', 
                  icon: <FileSearch size={24} />, 
                  color: '#fce4ec' 
                },
                { 
                  id: 'f-confidence', 
                  title: 'Confidence Analyzer', 
                  desc: 'Detect hesitation and subtext in real-time. We provide a detailed breakdown of speech patterns, tone, and fillers to help candidates build professional presence.', 
                  icon: <TrendingUp size={24} />, 
                  color: '#f1f8e9' 
                },
                { 
                  id: 'f-roadmap', 
                  title: 'Learning Roadmap', 
                  desc: 'Don’t just test—grow. Every assessment results in a personalized learning path that highlights specifically which skills to develop next based on performance gaps.', 
                  icon: <MapPin size={24} />, 
                  color: '#fffde7' 
                },
                { 
                  id: 'f-insights', 
                  title: 'AI Insights', 
                  desc: 'Actionable data at your fingertips. Get institutional-grade analytics that compare your results against global industry standards and peer benchmarks.', 
                  icon: <BarChart3 size={24} />, 
                  color: '#e0f7fa' 
                }
              ].map((f, i) => (
                <motion.div 
                  key={f.id} 
                  id={f.id} 
                  variants={fadeInUp}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="detailed-feature-card"
                >
                  <div className="dfc-icon" style={{ backgroundColor: f.color }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <motion.button 
                    whileHover={{ x: 5 }}
                    className="btn btn-ghost btn-sm" 
                    onClick={() => navigate('/signup')}
                  >
                    Explore {f.title} <ArrowRight size={14} />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 4. WHY USE SKILL ASSESSMENT AI */}
        <section id="why-ai" className="why-section">
          <div className="container">
            <div className="why-grid">
              <motion.div {...fadeInUp} className="why-content">
                <span className="section-eyebrow">Unlock Your Full Potential</span>
                <h2 className="section-title">Why Use <span className="gradient-text">Skill Assessment AI?</span></h2>
                <p className="section-subtitle">Traditional assessments are often slow, biased, and inconsistent. Our AI-driven platform solves these core challenges instantly.</p>
                
                <motion.div 
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="whileInView"
                  viewport={{ once: true }}
                  className="why-list-detailed"
                >
                  {[
                    { title: 'Bias-Free Evaluation', desc: 'Our AI doesn’t care about your school, background, or appearance. It only cares about your competence and potential.' },
                    { title: 'Real-Time Verification', desc: 'Get results in minutes, not weeks. Our AI verifies skills as they happen, giving you a competitive edge.' },
                    { title: 'Global Benchmarking', desc: 'Compare your results against industry standards and global talent pools to see exactly where you stand.' },
                    { title: 'Actionable Feedback', desc: 'Receive detailed reports that highlight your gaps and provide a direct path to improvement.' }
                  ].map((item, idx) => (
                    <motion.div key={idx} variants={fadeInUp} className="why-list-item">
                      <div className="why-list-icon-box">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="why-list-text">
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="why-visual"
              >
                <div className="why-image-wrapper upgraded">
                  <img src="/why-ai.png" alt="Professional Assessment" className="why-img-new" />
                  <div className="why-overlay-badge">
                    <Sparkles size={20} />
                    <span>AI Analysis Active</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS */}
        <section id="how-it-works" className="how-section">
          <div className="container">
            <motion.div {...fadeInUp} className="section-header">
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle">Simple, efficient, and powerful. Get results in three easy steps.</p>
            </motion.div>
            <div className="steps-grid">
              {[
                { icon: '📝', t: 'Create Test', d: 'Choose from our library of 200+ topics or generate a custom test using AI.' },
                { icon: '✉️', t: 'Invite Candidates', d: 'Invite candidates via email or share a public link. AI handles the proctoring.' },
                { icon: '📊', t: 'Get Reports', d: 'Receive detailed performance heatmaps and AI-driven recommendations instantly.' }
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  {...fadeInUp}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  whileHover={{ y: -5 }} 
                  className="step-card"
                >
                  <span className="step-icon">{step.icon}</span>
                  <h3>{step.t}</h3>
                  <p>{step.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. PRICING SECTION */}
        <section id="pricing" className="pricing-section">
          <div className="container">
            <motion.div {...fadeInUp} className="section-header">
              <span className="section-eyebrow">Flexible Plans</span>
              <h2 className="section-title">Transparent <span className="gradient-text">Pricing</span></h2>
              <p className="section-subtitle">Scale your team with plans that grow with you.</p>
            </motion.div>
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="pricing-grid"
            >
              <motion.div variants={fadeInUp} whileHover={{ y: -10 }} className="pricing-card">
                <div className="pc-header">
                  <h3>Starter</h3>
                  <div className="price">$0<span>/mo</span></div>
                </div>
                <ul className="pc-features">
                  <li><CheckCircle2 size={16} /> 5 Skill Tests / mo</li>
                  <li><CheckCircle2 size={16} /> 1 AI Interview</li>
                  <li><CheckCircle2 size={16} /> Basic Reporting</li>
                </ul>
                <motion.button whileTap={{ scale: 0.95 }} className="btn btn-outline" onClick={() => navigate('/signup')}>Get Started</motion.button>
              </motion.div>
              <motion.div variants={fadeInUp} whileHover={{ y: -10 }} className="pricing-card featured">
                <div className="pc-badge">Most Popular</div>
                <div className="pc-header">
                  <h3>Professional</h3>
                  <div className="price">$49<span>/mo</span></div>
                </div>
                <ul className="pc-features">
                  <li><CheckCircle2 size={16} /> Unlimited Skill Tests</li>
                  <li><CheckCircle2 size={16} /> 10 AI Interviews / mo</li>
                  <li><CheckCircle2 size={16} /> Priority Support</li>
                  <li><CheckCircle2 size={16} /> Advanced Analytics</li>
                </ul>
                <motion.button whileTap={{ scale: 0.95 }} className="btn btn-primary" onClick={() => navigate('/signup')}>Go Pro</motion.button>
              </motion.div>
              <motion.div variants={fadeInUp} whileHover={{ y: -10 }} className="pricing-card">
                <div className="pc-header">
                  <h3>Enterprise</h3>
                  <div className="price">Custom</div>
                </div>
                <ul className="pc-features">
                  <li><CheckCircle2 size={16} /> Custom AI Models</li>
                  <li><CheckCircle2 size={16} /> API Integration</li>
                  <li><CheckCircle2 size={16} /> Dedicated Manager</li>
                  <li><CheckCircle2 size={16} /> SSO & Security</li>
                </ul>
                <motion.button whileTap={{ scale: 0.95 }} className="btn btn-outline" onClick={() => navigate('/signup')}>Contact Sales</motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 6. OUR STORY */}
        <section id="story" className="story-section">
          <div className="container">
            <div className="story-grid">
              <motion.div {...fadeInUp} className="story-content">
                <span className="section-eyebrow">Our Story</span>
                <h2 className="section-title" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>Bridging the Gap Between</span>
                  <span className="gradient-text">Potential & Opportunity</span>
                </h2>
                <p>SkillGuard AI was born in late 2024 from a simple observation: the traditional hiring process is broken, biased, and incredibly slow. We saw brilliant developers overlooked because of resume formatting, and companies struggling to find the right fit despite thousands of applicants.</p>
                <p>We built SkillGuard to normalize the playing field. Our AI doesn't care where you went to school or what font you use—it cares about what you can build and how you solve problems.</p>
                <div className="story-stats">
                  <div className="stat-item">
                    <h4>500k+</h4>
                    <p>Assessments Completed</p>
                  </div>
                  <div className="stat-item">
                    <h4>99%</h4>
                    <p>Accuracy Rate</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="story-visual"
              >
                <div className="glass-card story-card">
                  <Sparkles size={40} color="var(--lp-primary)" />
                  <h3>100k+ Engineers</h3>
                  <p>Hired through SkillGuard AI's fair assessment engine.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 7. OUR TEAM */}
        <section id="team" className="team-section">
          <div className="container">
            <motion.div {...fadeInUp} className="section-header">
              <h2 className="section-title">The Minds Behind <span className="gradient-text">The AI</span></h2>
              <p className="section-subtitle">A global team of engineers, educators, and ethicists.</p>
            </motion.div>
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true }}
              className="team-grid"
            >
              {[
                { name: 'Alex', role: 'Founder & CEO', color: '#e0f2fe' },
                { name: 'Manali', role: 'Lead AI Researcher', color: '#fef3c7' },
                { name: 'Princh', role: 'CTO & Engineering', color: '#ecfdf5' },
                { name: 'Manik', role: 'Head of Security', color: '#fdf2f8' },
                { name: 'Anandita', role: 'Creative Director', color: '#f5f3ff' },
                { name: 'Sahina', role: 'Customer Success', color: '#fff1f2' }
              ].map((member, i) => (
                <motion.div key={member.name} variants={fadeInUp} whileHover={{ y: -5 }} className="team-card">
                  <div className="member-avatar" style={{ backgroundColor: member.color }}>
                    <Users size={32} />
                  </div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 8. CAREERS & VALUES */}
        <section id="careers" className="careers-section">
          <div className="container">
            <div className="careers-grid">
              <motion.div {...fadeInUp} className="careers-info">
                <h2 className="section-title">Join the <span className="gradient-text">Revolution</span></h2>
                <p>We're looking for passionate individuals who want to redefine how the world evaluates talent. At SkillGuard, you'll work on cutting-edge AI that has a real-world impact.</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-secondary" onClick={() => navigate('/signup')}>View Open Roles</motion.button>
              </motion.div>
              <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="row" id="values">
                <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="value-card">
                  <ShieldCheck size={24} color="#22c55e" />
                  <h4>Integrity</h4>
                  <p>Fairness is at the heart of every algorithm we build.</p>
                </motion.div>
                <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="value-card">
                  <Zap size={24} color="#ef4444" />
                  <h4>Speed</h4>
                  <p>Fast assessments that don't compromise on quality.</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 9. BLOG SECTION */}
        <section id="blog" className="blog-section">
          <div className="container">
            <motion.div {...fadeInUp} className="section-header">
              <h2 className="section-title">Latest <span className="gradient-text">Insights</span></h2>
            </motion.div>
            <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="blog-grid">
              {[
                { title: 'The Future of AI Recruiting', date: 'March 15, 2026', tag: 'AI Trends' },
                { title: 'Designing Fair Assessments', date: 'March 10, 2026', tag: 'Product' },
                { title: 'How We Scale AI Models', date: 'March 05, 2026', tag: 'Engineering' }
              ].map((post, i) => (
                <motion.div key={post.title} variants={fadeInUp} whileHover={{ y: -10 }} className="blog-card">
                  <div className="bc-tag">{post.tag}</div>
                  <h3>{post.title}</h3>
                  <p>{post.date}</p>
                  <a href="#" className="read-more">Read Article <ArrowRight size={14} /></a>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 10. FAQ SECTION */}
        <section id="faq" className="faq-section">
          <div className="container">
            <motion.div {...fadeInUp} className="section-header">
              <h2 className="section-title">Frequently Asked Questions</h2>
            </motion.div>
            <motion.div 
              variants={staggerContainer}
              initial="initial"
              whileInView="whileInView"
              className="faq-container"
            >
              {faqs.map((faq, i) => (
                <motion.div key={i} variants={fadeInUp} className={`faq-item ${activeFaq === i ? 'active' : ''}`}>
                  <button className="faq-question" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <motion.div
                      animate={{ rotate: activeFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown size={20} className="faq-icon" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {activeFaq === i && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="faq-answer-wrapper"
                      >
                        <div className="faq-answer">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 9. CONTACT SECTION */}
        <section id="contact" className="contact-section">
          <div className="container">
            <div className="contact-grid">
              <div className="contact-info reveal">
                <div className="section-header" style={{ textAlign: 'left', alignItems: 'flex-start', marginBottom: '3rem' }}>
                  <h2 className="section-title">Request a <span className="gradient-text">Live Demo</span></h2>
                  <p className="section-subtitle" style={{ margin: 0 }}>Experience the future of assessment. Our team will show you how SkillGuard AI can transform your hiring process.</p>
                </div>
                <div className="contact-method reveal">
                  <div className="cm-icon"><Mail size={24} /></div>
                  <div className="cm-text"><h4>Email Us</h4><p>support@skillguard.ai</p></div>
                </div>
                <div className="contact-method reveal">
                  <div className="cm-icon"><Phone size={24} /></div>
                  <div className="cm-text"><h4>Call Us</h4><p>+1 (555) 000-0000</p></div>
                </div>
                <div className="contact-method reveal">
                  <div className="cm-icon"><MapPin size={24} /></div>
                  <div className="cm-text"><h4>Visit Us</h4><p>123 AI Way, San Francisco, CA</p></div>
                </div>
              </div>

              <div id="contact-form" className="contact-container reveal">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="form-row">
                    <div className="form-group"><label>First Name</label><input type="text" placeholder="John" /></div>
                    <div className="form-group"><label>Last Name</label><input type="text" placeholder="Doe" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Work Email</label><input type="email" placeholder="john@company.com" /></div>
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label>Phone Number</label>
                      <div className="phone-input-container">
                        <div 
                          className={`country-selector-trigger ${isCountryDropdownOpen ? 'active' : ''}`}
                          onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          ref={countryDropdownRef}
                        >
                          <img 
                            src={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png`} 
                            alt={selectedCountry.name} 
                            className="country-flag-img"
                          />
                          <span className="country-code">{selectedCountry.dialCode}</span>
                          <ChevronDown size={14} className={`selector-arrow ${isCountryDropdownOpen ? 'rotated' : ''}`} />
                          
                          <AnimatePresence>
                            {isCountryDropdownOpen && (
                              <motion.div 
                                className="country-dropdown-menu"
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="country-search-wrapper">
                                  <Search size={14} className="search-icon" />
                                  <input 
                                    type="text" 
                                    placeholder="Search country..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                  />
                                </div>
                                <div className="country-list-scroll">
                                  {filteredCountries.length > 0 ? (
                                    filteredCountries.map((c) => (
                                      <div 
                                        key={c.code} 
                                        className={`country-option ${selectedCountry.code === c.code ? 'selected' : ''}`}
                                        onClick={() => {
                                          setSelectedCountry(c);
                                          setIsCountryDropdownOpen(false);
                                          setSearchQuery('');
                                        }}
                                      >
                                        <img 
                                          src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} 
                                          alt={c.name} 
                                          className="option-flag-img"
                                        />
                                        <span className="option-name">{c.name}</span>
                                        <span className="option-dial">{c.dialCode}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="no-results">No countries found</div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <input type="tel" placeholder="07400 123456" className="phone-number-field" />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Organization / Company</label>
                    <input type="text" placeholder="SkillGuard AI Inc." />
                  </div>
                  <div className="form-group">
                    <label>Description of your needs</label>
                    <textarea rows="4" placeholder="Tell us about your team and assessment goals..." />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
                    Request Demo <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <a href="#" className="logo" style={{ color: 'white', marginBottom: '1.5rem', display: 'inline-flex' }}>
                <div className="logo-icon" style={{ background: 'rgba(255,255,255,0.2)' }}>⚡</div>
                SkillGuard AI
              </a>
              <p style={{ maxWidth: '250px', opacity: '0.7' }}>The ultimate AI assessment platform for modern teams.</p>
            </div>
            <div>
              <h4>Product</h4>
              <ul><li><a href="#">Skill Tests</a></li><li><a href="#">AI Interview</a></li><li><a href="#">Proctoring</a></li></ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul><li><a href="#">About</a></li><li><a href="#">Careers</a></li><li><a href="#">Contact</a></li></ul>
            </div>
            <div>
              <h4>Connect</h4>
              <ul><li><a href="#">Twitter</a></li><li><a href="#">LinkedIn</a></li><li><a href="#">GitHub</a></li></ul>
            </div>
          </div>
          <div id="footer-bottom" className="footer-bottom">
            <p>© 2026 SkillGuard AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.1, backgroundColor: 'var(--lp-primary)' }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="scroll-to-top"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.button
        className="floating-chat-trigger"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
        transition={{ delay: 1, duration: 3, repeat: Infinity, repeatType: "mirror" }}
        whileHover={{ scale: 1.1 }}
      >
        <MessageSquare size={24} />
        <span className="pulse-ring" />
      </motion.button>
    </div>
  );
};

export default LandingPage;
