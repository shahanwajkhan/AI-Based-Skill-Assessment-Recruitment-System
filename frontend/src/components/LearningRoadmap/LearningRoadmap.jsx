import React, { useState, useEffect } from 'react';
import { Calendar, Play, CheckCircle2, Trash2, Clock, Bell, BookOpen } from 'lucide-react';
import './LearningRoadmap.css';

const LearningRoadmap = ({ roadmap, title = "Personalized Mastery Roadmap", onDelete, resultId, hideHeader = false }) => {
  const [completedTopics, setCompletedTopics] = useState([]);

  useEffect(() => {
    if (resultId) {
      const saved = localStorage.getItem(`roadmap_progress_${resultId}`);
      if (saved) setCompletedTopics(JSON.parse(saved));
    }
  }, [resultId]);

  const toggleTopic = (topicName) => {
    const updated = completedTopics.includes(topicName)
      ? completedTopics.filter(t => t !== topicName)
      : [...completedTopics, topicName];
    setCompletedTopics(updated);
    if (resultId) {
      localStorage.setItem(`roadmap_progress_${resultId}`, JSON.stringify(updated));
    }
  };

  if (!roadmap || !Array.isArray(roadmap)) return null;

  const generateSessionTime = (weekIdx, topicIdx) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const startTime = 10 + (topicIdx % 3);
    return {
      day: days[topicIdx % 5],
      time: `${startTime}:00 AM`,
      duration: '45 mins'
    };
  };

  const totalTopics = roadmap.reduce((acc, week) => acc + (week.topics?.length || 0), 0);
  const progress = Math.round((completedTopics.length / totalTopics) * 100);

  // Always use YouTube search — stored watch URLs may be AI-hallucinated and unavailable
  const getYouTubeUrl = (topic) => {
    // Only use a stored URL if it's already a search URL (safe)
    const existing = topic.youtube_url;
    if (existing && existing.includes('youtube.com/results')) return existing;
    // For all other cases (watch URLs, empty, null), build a fresh search URL
    const query = encodeURIComponent(`${topic.name} tutorial for beginners`);
    return `https://www.youtube.com/results?search_query=${query}`;
  };

  return (
    <div className="learning-roadmap-component">
      {!hideHeader && (
        <div className="roadmap-header">
          <div className="roadmap-header-main">
            <div className="roadmap-icon-wrapper">
               <Calendar className="header-icon" />
            </div>
            <div className="header-text-group">
              <div className="roadmap-tag-pill">AI-GENERATED PATHWAY</div>
              <h3>{title}</h3>
              <p>Based on your skill gaps, we've structured a prioritized learning sequence.</p>
            </div>
          </div>

          <div className="roadmap-stats-header">
            <div className="progress-mini-card">
              <div className="progress-info">
                <span>Overall Completion</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            {onDelete && (
              <button className="delete-roadmap-btn" onClick={onDelete} title="Delete Roadmap">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="roadmap-timeline">
        {roadmap.map((week, wIdx) => (
          <div key={wIdx} className="roadmap-week-group">
            <div className="week-marker">
              <div className="marker-line"></div>
              <div className="marker-pill">Week {week.week || wIdx + 1}</div>
              <div className="week-summary">{week.title}</div>
            </div>

            <div className="sessions-grid">
              {week.topics && week.topics.map((topic, tIdx) => {
                const session = generateSessionTime(wIdx, tIdx);
                const isCompleted = completedTopics.includes(topic.name);
                const videoUrl = getYouTubeUrl(topic);

                return (
                  <div key={tIdx} className={`session-card ${isCompleted ? 'completed' : ''}`}>
                    <div className="session-status" onClick={() => toggleTopic(topic.name)}>
                      {isCompleted
                        ? <CheckCircle2 size={24} className="status-icon done" />
                        : <div className="status-circle"></div>
                      }
                    </div>

                    <div className="session-content">
                      <div className="session-meta">
                        <span className="session-day">{session.day}</span>
                        <div className="session-time">
                          <Clock size={12} />
                          <span>{session.time} • {session.duration}</span>
                        </div>
                      </div>

                      <h5 className="session-topic" title={topic.name}>{topic.name}</h5>

                      <div className="session-actions">
                        <a
                          href={videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="study-btn"
                        >
                          <Play size={14} fill="currentColor" />
                          <span>Study Now</span>
                        </a>
                        <button className="remind-btn" title="Set Reminder">
                          <Bell size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="roadmap-footer">
        <div className="footer-tip">
          <BookOpen size={16} />
          <p>Consistency is key. Follow this schedule to bridge your identified skill gaps within 4 weeks.</p>
        </div>
      </div>
    </div>
  );
};

export default LearningRoadmap;
