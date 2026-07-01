import './RecommendationCard.css';
import Button from '../Button/Button';

const RecommendationCard = ({ title, skill, difficulty, estimatedTime, matchScore, onClick }) => {
  return (
    <div className="recommendation-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="recommendation-header">
        <div className="recommendation-badge">Recommended</div>
        <div className="match-score" style={{ background: isNaN(parseInt(matchScore)) ? '#fef2f2' : 'var(--success-light)', color: isNaN(parseInt(matchScore)) ? '#ef4444' : 'var(--success)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          {isNaN(parseInt(matchScore)) ? matchScore : `${matchScore}% Match`}
        </div>
      </div>
      
      <h3 className="recommendation-title">{title}</h3>
      <p className="recommendation-target" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {isNaN(parseInt(matchScore)) ? 
          <span style={{ color: '#ef4444', fontWeight: 600 }}>Mandatory Assessment Requirement</span> :
          <>Targets your weak skill: <strong>{skill}</strong></>
        }
      </p>
      
      <div className="recommendation-meta">
        <span className="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20h.01"></path>
            <path d="M7 20v-4"></path>
            <path d="M12 20v-8"></path>
            <path d="M17 20V8"></path>
            <path d="M22 4v16"></path>
          </svg>
          {difficulty}
        </span>
        <span className="meta-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {estimatedTime}
        </span>
      </div>
      
      <Button variant="primary" size="sm" fullWidth className="recommendation-btn" onClick={onClick}>
        Start Test
      </Button>
    </div>
  );
};

export default RecommendationCard;
