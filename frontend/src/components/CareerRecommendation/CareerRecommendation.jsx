import React from 'react';
import { Briefcase, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { getBestMatchingRoles } from '../../utils/careerData';
import './CareerRecommendation.css';

const CareerRecommendation = ({ userSkills, profileSkills = [], onExplore }) => {
  const matchingRoles = getBestMatchingRoles(userSkills, profileSkills);

  if (!matchingRoles || matchingRoles.length === 0) return null;

  return (
    <section className="career-recommendation-section fade-in">
      <div className="career-header">
        <div className="ai-badge">AI CAREER ENGINE</div>
        <h2>Career Roadmap & Readiness</h2>
        <p>Based on your recent assessment performance and skill profile.</p>
      </div>

      <div className="career-grid">
        {matchingRoles.map((role, idx) => (
          <div key={role.id} className={`career-card ${idx === 0 ? 'top-match' : ''}`}>
            <div className="card-badges-row">
              {idx === 0 && <div className="match-label">BEST MATCH</div>}
              {role.isBackgroundMatch && <div className="profile-match-badge">MATCHED BY PROFILE</div>}
            </div>
            
            <div className="role-main">
              <div className="role-icon-container">
                <Briefcase size={22} />
              </div>
              <div className="role-header-info">
                <h3>{role.title}</h3>
                <span className="category-pill">{role.category}</span>
              </div>
            </div>

            <div className="readiness-meter">
              <div className="meter-header">
                <span>Readiness Score</span>
                <span className="readiness-percent">{role.readiness}%</span>
              </div>
              <div className="meter-bar">
                <div 
                  className="meter-fill" 
                  style={{ width: `${role.readiness}%`, backgroundColor: role.readiness > 70 ? '#22c55e' : role.readiness > 40 ? '#f59e0b' : '#ef4444' }} 
                />
              </div>
            </div>

            <div className="missing-skills">
              <h4>
                <AlertCircle size={14} /> 
                {role.missingSkills.length > 0 ? 'Skills to Improve:' : 'Perfect Alignment!'}
              </h4>
              <div className="skill-chips">
                {role.missingSkills.length > 0 ? (
                  role.missingSkills.map(skill => (
                    <span key={skill} className="skill-chip missing">{skill}</span>
                  ))
                ) : (
                  <span className="skill-chip success">Ready for Hire</span>
                )}
              </div>
            </div>

            <div className="salary-prediction">
              <div className="prediction-label">
                <TrendingUp size={14} /> Predicted Salary
              </div>
              <div className="salary-value">{role.estimatedSalary}</div>
            </div>

            <button 
              className="career-action-btn"
              onClick={() => onExplore && onExplore(role)}
            >
              Explore Role Roadmap <Sparkles size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="career-footer-tip">
        <Sparkles size={18} className="sparkle-icon" />
        <p>
          <strong>AI Tip:</strong> Strengthening your score in <strong>{matchingRoles[0].missingSkills[0] || 'System Design'}</strong> could increase your predicted salary for {matchingRoles[0].title} by up to <strong>15%</strong>.
        </p>
      </div>
    </section>
  );
};

export default CareerRecommendation;
