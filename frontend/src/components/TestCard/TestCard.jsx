import './TestCard.css';
import Button from '../Button/Button';

const TestCard = ({ test, onStart }) => {
  const getDifficultyColor = (level) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'var(--success-green)';
      case 'intermediate': return 'var(--warning-yellow)';
      case 'advanced': return 'var(--danger-red)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="test-card">
      <div className="test-card-header">
        <span className="test-category">{test.category}</span>
        <div className="test-difficulty" style={{ color: getDifficultyColor(test.difficulty) }}>
          <span className="difficulty-dot" style={{ backgroundColor: getDifficultyColor(test.difficulty) }}></span>
          {test.difficulty}
        </div>
      </div>
      
      <h3 className="test-title">{test.title}</h3>
      <p className="test-description">{test.description}</p>
      
      <div className="test-meta">
        <div className="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {test.estimated_time} mins
        </div>
        <div className="meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          {test.questions?.length || 0} questions
        </div>
      </div>

      <div className="test-card-footer">
        <div className="test-stats">
          <span className="enrolled">{(test.enrolled_count || 0).toLocaleString()} enrolled</span>
        </div>
        <Button onClick={() => onStart(test.id)} className="start-test-btn">
          Start Test
        </Button>
      </div>
    </div>
  );
};

export default TestCard;
