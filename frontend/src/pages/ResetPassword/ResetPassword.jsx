import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPassword.css';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import { API_URL } from '../../utils/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [step, setStep] = useState('reset'); // 'reset' | 'done'
  const [passwords, setPasswords] = useState({ new_password: '', confirm_password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!uid || !token) {
      setErrors({ global: 'Invalid or missing reset token.' });
    }
  }, [uid, token]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!uid || !token) return;

    const newErrors = {};
    if (!passwords.new_password) newErrors.new_password = 'New password is required';
    else if (passwords.new_password.length < 8) newErrors.new_password = 'Minimum 8 characters';
    if (passwords.new_password !== passwords.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uid,
          token: token,
          new_password: passwords.new_password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('done');
      } else {
        setErrors({ global: data.error || 'Reset failed. Please try again or request a new link.' });
      }
    } catch (err) {
      setErrors({ global: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { id, value } = e.target;
    setPasswords(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: null }));
  };

  return (
    <AuthLayout
      mode="login"
      title={step === 'reset' ? 'Set New Password' : 'Password Reset Complete'}
      subtitle={step === 'reset' ? 'Enter your new password below.' : null}
    >
      {step === 'reset' && (
        <form onSubmit={handleResetSubmit} className="auth-form-inner-content">
          <div className="fp-icon-wrap">
            <div className="fp-icon fp-icon-lock">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke="#22c55e" strokeWidth="1.8"/>
                <path d="M8 11V7a4 4 0 118 0v4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="#22c55e"/>
              </svg>
            </div>
          </div>

          {errors.global && (
            <div className="error-message" style={{ color: 'var(--color-danger)', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {errors.global}
            </div>
          )}

          <InputField
            label="New Password"
            id="new_password"
            type="password"
            placeholder="Min. 8 characters"
            value={passwords.new_password}
            onChange={handlePasswordChange}
            error={errors.new_password}
            disabled={!uid || !token}
          />

          <InputField
            label="Confirm New Password"
            id="confirm_password"
            type="password"
            placeholder="Repeat new password"
            value={passwords.confirm_password}
            onChange={handlePasswordChange}
            error={errors.confirm_password}
            disabled={!uid || !token}
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="submit-btn-acc"
            disabled={!uid || !token}
          >
            Reset Password
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

      {step === 'done' && (
        <div className="auth-form-inner-content fp-done-section">
          <div className="fp-done-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#22c55e"/>
              <path d="M8 12.5L10.5 15L16 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="fp-done-title">Password Updated!</h3>
          <p className="fp-done-text">
            Your password has been reset successfully. You can now sign in with your new credentials.
          </p>
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

export default ResetPassword;
