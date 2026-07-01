import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';

const TURNSTILE_SITE_KEY = '0x4AAAAAACyCFjRKKOXzE32R';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [turnstileStatus, setTurnstileStatus] = useState('loading'); // 'loading' | 'solved' | 'error' | 'expired'
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  // Render Turnstile widget
  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !turnstileContainerRef.current) return;
    
    // Clean up any existing widget
    if (turnstileWidgetId.current !== null) {
      try { window.turnstile.remove(turnstileWidgetId.current); } catch (e) { /* ignore */ }
    }

    setTurnstileStatus('loading');
    setTurnstileToken(null);

    turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'light',
      callback: (token) => {
        setTurnstileToken(token);
        setTurnstileStatus('solved');
      },
      'expired-callback': () => {
        setTurnstileToken(null);
        setTurnstileStatus('expired');
      },
      'error-callback': () => {
        setTurnstileToken(null);
        setTurnstileStatus('error');
      },
    });
  }, []);

  useEffect(() => {
    // Wait for the Turnstile script to load
    const checkTurnstile = () => {
      if (window.turnstile) {
        renderTurnstile();
      } else {
        setTimeout(checkTurnstile, 100);
      }
    };
    checkTurnstile();

    return () => {
      if (turnstileWidgetId.current !== null) {
        try { window.turnstile.remove(turnstileWidgetId.current); } catch (e) { /* ignore */ }
      }
    };
  }, [renderTurnstile]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Email or username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!turnstileToken) newErrors.turnstile = 'Please complete the verification';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      
      try {
        const response = await fetch(`${API_URL}/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            turnstile_token: turnstileToken
          })
        });

        if (response.ok) {
            const tokens = await response.json();
            
            // Manually fetch user profile since JWT payload doesn't have it all
            const profileResponse = await fetch(`${API_URL}/users/profile/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${tokens.access}`,
                    'Content-Type': 'application/json'
                }
            });

            if (profileResponse.ok) {
                 const profileData = await profileResponse.json();
                 login(profileData.user, profileData.profile, tokens);
                 console.log('Login success');
                 navigate('/dashboard');
            } else {
                 setErrors({ password: 'Failed to retrieve profile.' });
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.turnstile) {
              setErrors({ turnstile: errorData.turnstile });
              // Reset turnstile on verification failure
              if (window.turnstile && turnstileWidgetId.current !== null) {
                window.turnstile.reset(turnstileWidgetId.current);
                setTurnstileStatus('loading');
                setTurnstileToken(null);
              }
            } else {
              setErrors({ password: errorData.detail || 'Invalid credentials. Please try again.' });
            }
        }
      } catch (err) {
        setErrors({ username: 'Network error communicating with server.' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <AuthLayout 
      mode="login" 
      title="Sign In" 
      subtitle={
        <div className="auth-subtitle-acc">
          Not Registered yet! 
          <button type="button" onClick={() => navigate('/signup')} className="auth-brand-link-green">
            Contact Us Now
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form-inner-content">
        <InputField 
          label="Email address"
          id="username"
          type="text"
          placeholder="your@email.com"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
        />
        
        <InputField 
          label="Enter password"
          id="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />

        {/* Cloudflare Turnstile Widget */}
        <div className="turnstile-wrapper">
          <div ref={turnstileContainerRef} id="turnstile-widget"></div>
          {errors.turnstile && (
            <div className="turnstile-error">{errors.turnstile}</div>
          )}
        </div>

        <Button 
          type="submit" 
          fullWidth 
          isLoading={isLoading}
          className="submit-btn-acc"
          disabled={isLoading}
        >
          Sign in
        </Button>

        <div className="auth-footer-row">
            <div className="afr-left">Privacy policy • Terms of Service</div>
            <button type="button" className="afr-right" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
        </div>
      </form>
    </AuthLayout>

  );
};

export default Login;
