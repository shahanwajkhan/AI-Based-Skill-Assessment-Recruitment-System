import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import { API_URL } from '../../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'done'
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Submit email to request reset
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: 'Email address is required' });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('done');
        setSuccessMsg(data.message || 'An email has been sent with a password reset link.');
      } else {
        setErrors({ email: data.error || 'No account found with this email.' });
      }
    } catch (err) {
      setErrors({ email: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      mode="login"
      title={step === 'email' ? 'Forgot Password' : 'Check Your Email'}
      subtitle={
        step === 'email' 
          ? "Enter your registered email and we'll send you a password reset link." 
          : "If an account exists with that email, a password reset link has been sent. Please check your inbox and spam folder."
      }
    >
      {/* Step 1: Email */}
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="auth-form-inner-content">
          <div className="fp-icon-wrap">
            <div className="fp-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#22c55e" strokeWidth="1.8"/>
                <path d="M3 7l9 5 9-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <InputField
            label="Registered Email Address"
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({});
            }}
            error={errors.email}
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="submit-btn-acc"
          >
            Verify & Continue
          </Button>

          <button
            type="button"
            className="fp-back-link"
            onClick={() => navigate('/login')}
          >
            ← Back to Sign In
          </button>
        </form>
      )}

      {/* Step 2: Done */}
      {step === 'done' && (
        <div className="auth-form-inner-content fp-done-section" style={{ textAlign: 'center' }}>
          <div className="fp-done-icon" style={{ marginBottom: '2rem' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto' }}>
              <circle cx="12" cy="12" r="10" fill="#22c55e"/>
              <path d="M8 12.5L10.5 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <Button
            fullWidth
            className="submit-btn-acc"
            onClick={() => navigate('/login')}
          >
            Go to Sign In
          </Button>
        </div>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
