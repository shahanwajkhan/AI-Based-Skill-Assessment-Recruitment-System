import './AuthLayout.css';
import dashboardPreview from '../../assets/dashboard_preview.png';

const AuthLayout = ({ children, title, subtitle, showLogo = true, mode = 'login' }) => {
  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-form-wrapper">
          {showLogo && (
            <div className="auth-logo-header">
              <div className="auth-logo-wrap-acc">
                <span className="auth-logo-icon">⚡</span>
                <div className="auth-logo-info">
                  <span className="auth-logo-text">SKILLGUARD <strong>AI</strong></span>
                  <span className="auth-logo-tagline">Evaluate Faster. Hire Smarter.</span>
                </div>
              </div>
            </div>
          )}
          
          {title && (
            <div className="auth-titles-acc">
              <h1>{title}</h1>
              {subtitle && <div className="auth-subtitle-render">{subtitle}</div>}
            </div>
          )}
          
          <div className="auth-content">
            {children}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-visual-content">
          <div className="auth-visual-text">
            <h1>{mode === 'login' ? 'Welcome Back!' : 'Start Your Journey!'}</h1>
            <p>
              {mode === 'login' 
                ? 'Empower your career with SkillGuard AI. Log in to access your dashboard, track your assessments, and unlock new opportunities.' 
                : 'Join the revolution in AI-driven skill validation. Create your account today and start showcasing your true potential to world-class recruiters.'}
            </p>
          </div>
          <div className="auth-visual-image-wrap">
             <img src={dashboardPreview} alt="Dashboard Preview" className="auth-visual-image" />
             <div className="auth-image-overlay"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

