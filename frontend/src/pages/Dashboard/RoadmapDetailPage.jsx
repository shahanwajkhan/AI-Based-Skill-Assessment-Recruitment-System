import React from 'react';
import { ArrowLeft, Map, Clock, Target, Calendar } from 'lucide-react';
import Button from '../../components/Button/Button';
import LearningRoadmap from '../../components/LearningRoadmap/LearningRoadmap';
import './Dashboard.css';

const RoadmapDetailPage = ({ result, onBack }) => {
  if (!result || !result.roadmap) return (
    <div className="db-empty-state">
      <span>🗺️</span>
      <p>No roadmap available for this assessment.</p>
      <Button onClick={onBack}>Go Back</Button>
    </div>
  );

  const testTitle = result.assessment?.title || 
                    result.assessment_result?.assessment?.title || 
                    result.interview_session?.job_title || 
                    result.testType || 
                    'Skill Assessment';

  const displayDate = result.completed_at 
    ? new Date(result.completed_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : result.created_at
    ? new Date(result.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : result.date;
  
  const score = result.score || 
                result.assessment_result?.score || 
                result.interview_session?.overall_score || 
                0;

  return (
    <div className="roadmap-detail-page fade-in" style={{ position: 'relative' }}>
      <button className="back-link" onClick={onBack} style={{ 
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        background: 'rgba(255, 255, 255, 0.8)', 
        border: '1px solid rgba(0,0,0,0.05)', 
        color: 'var(--text-muted)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        cursor: 'pointer',
        padding: '0.6rem 1.2rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: 700,
        transition: 'all 0.2s',
        backdropFilter: 'blur(10px)',
        zIndex: 10
      }}>
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <header className="report-header" style={{ 
        marginBottom: '4rem', 
        paddingTop: '3rem',
        paddingBottom: '3.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        borderBottom: '1px solid rgba(0,0,0,0.06)'
      }}>
        <div className="header-main-info" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}>
           <div className="test-badge" style={{ 
             background: 'rgba(99, 102, 241, 0.1)', 
             color: 'var(--primary)', 
             padding: '0.5rem 1.25rem',
             borderRadius: '100px',
             fontSize: '0.75rem',
             fontWeight: 900,
             textTransform: 'uppercase',
             letterSpacing: '0.1em',
             marginBottom: '1.25rem',
             border: '1px solid rgba(99, 102, 241, 0.2)'
           }}>Learning Journey</div>
           
           <h1 style={{ 
             fontSize: '3.5rem', 
             fontWeight: 900, 
             color: '#1e293b', 
             margin: '0 0 1.25rem 0', 
             letterSpacing: '-0.05em',
             lineHeight: 1.1,
             maxWidth: '900px'
           }}>
             Roadmap for {testTitle}
           </h1>
           
           <div style={{ 
             display: 'flex', 
             gap: '2.5rem', 
             color: 'var(--text-muted)', 
             fontWeight: 700,
             fontSize: '1rem',
             justifyContent: 'center',
             background: 'rgba(255, 255, 255, 0.5)',
             padding: '0.75rem 2rem',
             borderRadius: '100px',
             border: '1px solid rgba(0,0,0,0.03)'
           }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
               <Calendar size={18} style={{ color: 'var(--primary)' }} /> {displayDate}
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
               <Target size={18} style={{ color: 'var(--primary)' }} /> Score: {score}%
             </div>
           </div>
        </div>
      </header>

      <div className="roadmap-content-wrapper" style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderRadius: '32px',
        padding: '2.5rem',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.04)'
      }}>
        <LearningRoadmap 
          roadmap={typeof result.roadmap === 'string' ? JSON.parse(result.roadmap) : result.roadmap} 
          resultId={result.id || result.completed_at || result.date}
          title={`Priority: ${testTitle} Mastery`}
          hideHeader={true}
        />
        
        <div className="roadmap-actions-footer" style={{ 
          marginTop: '3rem', 
          paddingTop: '2rem', 
          borderTop: '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'center'
        }}>
           <Button onClick={onBack} variant="secondary" size="lg">Finished Reviewing</Button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapDetailPage;
