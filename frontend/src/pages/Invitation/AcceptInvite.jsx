import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Calendar, Clock, ArrowRight, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState(null);
  const [recruiterName, setRecruiterName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (!token) {
        setError("Invalid invitation link: No token provided.");
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/invitations/verify/${token}/`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to verify invitation.");
        }
        
        setInvitation(data.invitation);
        setRecruiterName(data.recruiter_name);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvitation();
  }, [token]);

  const handleStartTest = () => {
    // Store token in session tracking so tests can complete it later
    sessionStorage.setItem('invite_token', token);
    
    // Route to appropriate test based on type
    if (invitation.test_type === 'ai_skill') {
      navigate('/assessments');
    } else if (invitation.test_type === 'ai_interview') {
      navigate('/ai-interview/setup');
    } else if (invitation.test_type === 'coding') {
      navigate('/dashboard/practice'); 
    } else if (invitation.test_type === 'confidence') {
      navigate('/confidence-check');
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
         <div style={{ animation: 'spin 1s linear infinite', border: '4px solid #f3f3f3', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '450px', textAlign: 'center' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
          <h2 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>Invitation Error</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>{error}</p>
          <button onClick={() => navigate('/')} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
             Return Home
          </button>
        </div>
      </div>
    );
  }

  const getTestName = (type) => {
    const types = {
      'ai_skill': 'AI Skill Test',
      'ai_interview': 'AI Voice Interview',
      'coding': 'Coding Challenge',
      'confidence': 'Confidence Analyzer'
    };
    return types[type] || 'Skill Assessment';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
       {/* Background decorative elements */}
       <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
       <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

       <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', width: '100%', maxWidth: '520px', borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}
       >
          <div style={{ padding: '3rem 2rem 2rem', textAlign: 'center', position: 'relative' }}>
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #6366f1, #a855f7, #6366f1)', backgroundSize: '200% 100%', animation: 'shimmer 3s infinite linear' }} />
             
             <div style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)', transform: 'rotate(-5deg)' }}>
                <Target size={40} color="white" />
             </div>
             
             <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>You're Invited!</h1>
             <p style={{ margin: '0.75rem 0 0 0', color: '#94a3b8', fontSize: '1.1rem', fontWeight: 500 }}>
                <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{recruiterName}</span> has requested a skill assessment.
             </p>
          </div>
          
          <div style={{ padding: '0 2rem 3rem' }}>
             <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                   <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '1rem', borderRadius: '16px', color: '#818cf8' }}>
                      <Calendar size={28} />
                   </div>
                   <div>
                      <strong style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Evaluation Target</strong>
                      <span style={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>{getTestName(invitation.test_type)}</span>
                   </div>
                </div>

                {invitation.deadline && (
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem' }}>
                     <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '1rem', borderRadius: '16px', color: '#fb7185' }}>
                        <Clock size={28} />
                     </div>
                     <div>
                        <strong style={{ display: 'block', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Submission Deadline</strong>
                        <span style={{ color: '#fb7185', fontWeight: 800, fontSize: '1.1rem' }}>{new Date(invitation.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                     </div>
                  </div>
                )}
             </div>

             {invitation.custom_message && (
               <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(99, 102, 241, 0.05)', borderLeft: '4px solid #6366f1', borderRadius: '8px' }}>
                 <p style={{ margin: 0, fontSize: '1rem', color: '#cbd5e1', fontStyle: 'italic', lineHeight: '1.6' }}>
                   "{invitation.custom_message}"
                 </p>
               </div>
             )}

             <motion.button 
               whileHover={{ scale: 1.02, translateY: -2 }}
               whileTap={{ scale: 0.98 }}
               onClick={handleStartTest}
               style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', padding: '1.25rem', borderRadius: '18px', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)' }}
             >
                Start Assessment <ArrowRight size={22} />
             </motion.button>
             
             <p style={{ textAlign: 'center', margin: '1.5rem 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>
                By starting, you agree to SkillGuard AI's <span style={{ color: '#818cf8', cursor: 'pointer' }}>Academic Integrity Policies</span>.
             </p>
          </div>
       </motion.div>

       <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
       `}</style>
    </div>
  );
};

export default AcceptInvite;
