import { useState, useEffect } from 'react';
import './PasswordStrength.css';

const PasswordStrength = ({ password }) => {
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    let score = 0;
    
    if (!password) {
      setStrength(0);
      return;
    }

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    setStrength(score);
  }, [password]);

  const getLabel = () => {
    if (password.length === 0) return '';
    if (strength <= 1) return 'Weak';
    if (strength === 2 || strength === 3) return 'Medium';
    return 'Strong';
  };

  const getStrengthClass = () => {
    if (password.length === 0) return '';
    if (strength <= 1) return 'strength-weak';
    if (strength === 2 || strength === 3) return 'strength-medium';
    return 'strength-strong';
  };

  if (!password) return null;

  return (
    <div className="password-strength-container">
      <div className="strength-bars">
        <div className={`strength-bar ${strength >= 1 ? getStrengthClass() : ''}`}></div>
        <div className={`strength-bar ${strength >= 2 ? getStrengthClass() : ''}`}></div>
        <div className={`strength-bar ${strength >= 3 ? getStrengthClass() : ''}`}></div>
        <div className={`strength-bar ${strength >= 4 ? getStrengthClass() : ''}`}></div>
      </div>
      <span className={`strength-label ${getStrengthClass()}`}>
        {getLabel()}
      </span>
    </div>
  );
};

export default PasswordStrength;
