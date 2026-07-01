import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, Link2, Copy, Sparkles, X, Award, Mic, Code, Zap } from 'lucide-react';
import { API_URL } from '../../utils/api';
import './InviteModal.css';

const InviteModal = ({ isOpen, onClose }) => {
  const [candidates, setCandidates] = useState([]);
  const [newInvite, setNewInvite] = useState({
    candidate_name: '',
    candidate_email: '',
    test_type: 'ai_skill',
    deadline: '',
    custom_message: '',
    send_email: false,
    selected_candidate_id: '' // For dropdown
  });
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [recentInviteSuccess, setRecentInviteSuccess] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch active candidates for the dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchCandidates = async () => {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`${API_URL}/recruiter/candidates/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const result = await response.json();
            setCandidates(result);
          }
        } catch (error) {
          console.error('Failed to fetch candidates:', error);
        }
      };
      fetchCandidates();
    }
  }, [isOpen]);

  const handleCandidateSelect = (e) => {
    const candidateId = e.target.value;
    if (!candidateId) {
      setNewInvite({
        ...newInvite,
        selected_candidate_id: '',
        candidate_name: '',
        candidate_email: ''
      });
      return;
    }
    
    const candidate = Array.isArray(candidates) ? candidates.find(c => c.id.toString() === candidateId) : null;
    if (candidate) {
      setNewInvite({
        ...newInvite,
        selected_candidate_id: candidateId,
        candidate_name: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.username,
        candidate_email: candidate.email || ''
      });
    }
  };

  const handleSendInvite = async () => {
    if (!newInvite.candidate_email) return;
    setIsSendingInvite(true);
    setRecentInviteSuccess(false);

    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        candidate_email: newInvite.candidate_email,
        candidate_name: newInvite.candidate_name,
        test_type: newInvite.test_type,
        custom_message: newInvite.custom_message,
        send_email: newInvite.send_email
      };
      
      if (newInvite.deadline) {
        payload.deadline = new Date(newInvite.deadline).toISOString();
      }
      
      const response = await fetch(`${API_URL}/recruiter/invitations/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (response.ok) {
        setRecentInviteSuccess(true);
        window.dispatchEvent(new CustomEvent('refreshInvitations')); // Notify dashboard
        
        const frontUrl = window.location.origin;
        setGeneratedInviteLink(`${frontUrl}/invite?token=${data.token}`);
        
        if (newInvite.send_email) {
           alert("Invitation dispatched successfully via Email!");
        }
      } else {
        alert(data.error || "Failed to create invitation");
      }
    } catch(err) {
      console.error(err);
      alert("Error sending invitation.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Reset state when closing
  const handleClose = () => {
    setNewInvite({
      candidate_name: '',
      candidate_email: '',
      test_type: 'ai_skill',
      deadline: '',
      custom_message: '',
      send_email: false,
      selected_candidate_id: ''
    });
    setRecentInviteSuccess(false);
    setGeneratedInviteLink('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           className="cam-overlay"
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
             className="cam-modal"
             initial={{ scale: 0.9, opacity: 0, y: 20 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             exit={{ scale: 0.9, opacity: 0, y: 20 }}
             transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="cam-header" style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', position: 'relative' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="cam-header-icon" style={{ background: 'rgba(99, 102, 241, 0.2)', width: '48px', height: '48px', borderRadius: '14px' }}>
                     <Sparkles size={24} color="#818cf8" />
                  </div>
                  <div>
                     <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Invite Candidate</h2>
                     <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>Create a secure assessment link for talent evaluation.</p>
                  </div>
               </div>
               <button 
                 onClick={handleClose}
                 style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
               >
                 <X size={18} />
               </button>
            </div>

            <div className="cam-body" style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
               {!recentInviteSuccess ? (
                 <>
                   <div className="cam-row" style={{ marginBottom: '1.5rem' }}>
                     <div className="cam-field">
                        <label className="cam-label">Select Active Candidate (Optional)</label>
                        <select 
                          className="cam-input" 
                          value={newInvite.selected_candidate_id} 
                          onChange={handleCandidateSelect}
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="">-- Manual entry --</option>
                          {Array.isArray(candidates) && candidates.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.first_name || c.username} {c.last_name || ''} ({c.email})
                            </option>
                          ))}
                        </select>
                     </div>
                   </div>

                   <div className="cam-row">
                     <div className="cam-field">
                        <label className="cam-label">Full Name</label>
                        <input type="text" className="cam-input" placeholder="e.g. John Doe" value={newInvite.candidate_name} onChange={e => setNewInvite({...newInvite, candidate_name: e.target.value})} />
                     </div>
                     <div className="cam-field">
                        <label className="cam-label">Email Address *</label>
                        <input type="email" className="cam-input" placeholder="applicant@example.com" value={newInvite.candidate_email} onChange={e => setNewInvite({...newInvite, candidate_email: e.target.value})} />
                     </div>
                   </div>

                    <div className="cam-row">
                      <div className="cam-field">
                         <label className="cam-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Select Assessment Type</span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Pick one to generate link</span>
                         </label>
                         <div className="cam-category-grid">
                            {[
                              { id: 'ai_skill', label: 'AI Skill Test', icon: <Award size={22} /> }, 
                              { id: 'ai_interview', label: 'AI Interview', icon: <Mic size={22} /> }, 
                              { id: 'coding', label: 'Coding Challenge', icon: <Code size={22} /> }, 
                              { id: 'confidence', label: 'Confidence Analyzer', icon: <Zap size={22} /> }
                            ].map(t => (
                              <button 
                                key={t.id} 
                                className={`cam-category-tag ${newInvite.test_type === t.id ? 'active' : ''}`}
                                onClick={() => setNewInvite({...newInvite, test_type: t.id})}
                              >
                                <span className="category-icon">{t.icon}</span>
                                <span>{t.label}</span>
                              </button>
                            ))}
                         </div>
                      </div>
                    </div>

                   <div className="cam-row">
                     <div className="cam-field">
                        <label className="cam-label">Strict Deadline (Optional)</label>
                        <div style={{ position: 'relative' }}>
                           <input type="datetime-local" className="cam-input" value={newInvite.deadline} onChange={e => setNewInvite({...newInvite, deadline: e.target.value})} />
                        </div>
                     </div>
                   </div>

                   <div className="cam-row">
                     <div className="cam-field">
                        <label className="cam-label">Custom Invitation Message</label>
                        <textarea className="cam-input" placeholder="Write a short personal note for the candidate..." rows={3} style={{ resize: 'none' }} value={newInvite.custom_message} onChange={e => setNewInvite({...newInvite, custom_message: e.target.value})} />
                     </div>
                   </div>

                   <div className="cam-row" style={{ marginTop: '0.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                     <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '10px', color: '#2563eb' }}>
                           <Mail size={18} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#1e293b', display: 'block' }}>Email Delivery</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Send link directly to candidate's inbox</span>
                        </div>
                     </div>
                     <label className="cam-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                        <input type="checkbox" checked={newInvite.send_email} onChange={(e) => setNewInvite({...newInvite, send_email: e.target.checked})} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span className="cam-slider" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: newInvite.send_email ? '#2563eb' : '#cbd5e1', transition: '.4s', borderRadius: '24px' }}>
                           <span style={{ position: 'absolute', height: '18px', width: '18px', left: newInvite.send_email ? '22px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                        </span>
                     </label>
                   </div>
                 </>
               ) : (
             <div className="cam-success-screen" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                   style={{ background: '#ecfdf5', color: '#10b981', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.15)' }}
                >
                   <CheckCircle2 size={40} />
                </motion.div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Link Generated!</h3>
                <p style={{ color: '#64748b', marginBottom: '2.5rem', fontWeight: 500 }}>The secure invitation link is ready to be shared.</p>
                
                <div className="invite-link-box" style={{ background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', transition: 'all 0.3s' }}>
                   <Link2 size={20} color="#6366f1" />
                   <code style={{ flex: 1, color: '#1e293b', fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{generatedInviteLink}</code>
                   <button 
                     onClick={() => { navigator.clipboard.writeText(generatedInviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }} 
                     style={{ background: copied ? '#10b981' : '#6366f1', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                     title="Copy Link"
                   >
                     {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                   </button>
                </div>
                {copied && <p style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700, marginTop: '0.5rem' }}>Copied to clipboard!</p>}
             </div>
               )}
            </div>

            <div className="cam-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9', background: '#ffffff' }}>
               {!recentInviteSuccess ? (
                 <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button className="cam-btn-cancel" style={{ flex: 1, height: '48px' }} onClick={handleClose}>Cancel</button>
                    <button className="cam-btn-create" style={{ flex: 2, height: '48px', background: isSendingInvite ? '#2563eb' : '#0f172a', opacity: isSendingInvite ? 0.7 : 1, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleSendInvite} disabled={isSendingInvite || !newInvite.candidate_email}>
                       {isSendingInvite ? (
                          <>
                             <div className="cam-loader" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                             <span>Creating Link...</span>
                          </>
                       ) : (
                          <>
                             <Sparkles size={18} />
                             <span>{newInvite.send_email ? 'Send & Generate' : 'Generate Secure Link'}</span>
                          </>
                       )}
                    </button>
                 </div>
               ) : (
                 <button className="cam-btn-cancel" style={{ width: '100%', height: '48px', background: '#0f172a', color: 'white', border: 'none' }} onClick={handleClose}>Done & Close</button>
               )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InviteModal;
