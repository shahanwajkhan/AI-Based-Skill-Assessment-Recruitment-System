import './ActivityFeed.css';

const ActivityFeed = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="activity-feed empty">
        <p>No recent activity. Start a skill test to see your progress here!</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <button className="view-all-btn">View All</button>
      </div>
      
      <div className="activity-list">
        {activities.map((activity, index) => (
          <div key={activity.id || index} className="activity-item">
            <div className={`activity-icon-wrapper ${activity.type}`}>
              {activity.type === 'test' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <polyline points="9 15 11 17 15 13"></polyline>
                </svg>
              )}
              {activity.type === 'challenge' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              )}
              {activity.type === 'achievement' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
              )}
            </div>
            
            <div className="activity-content">
              <div className="activity-title-row">
                <h4 className="activity-title">{activity.title}</h4>
                <span className="activity-time">{activity.time}</span>
              </div>
              <p className="activity-desc">
                {activity.description}
                {activity.score && (
                  <span className={`activity-score ${activity.score >= 80 ? 'high' : activity.score >= 60 ? 'medium' : 'low'}`}>
                    Score: {activity.score}%
                  </span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
