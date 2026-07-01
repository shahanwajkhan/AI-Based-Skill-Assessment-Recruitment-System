import { useState, useEffect } from 'react';
import './ProfileSettings.css';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';
import InputField from '../../components/InputField/InputField';
import FileUpload from '../../components/FileUpload/FileUpload';
import SkillTagInput from '../../components/SkillTagInput/SkillTagInput';
import Button from '../../components/Button/Button';

const ProfileSettings = ({ onTabChange }) => {
  const { user, fetchUserProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    education: [],
    experience: '',
    projects: '',
    primarySkills: [],
  });

  const [newAvatar, setNewAvatar] = useState(null);
  const [newResume, setNewResume] = useState(null);

  useEffect(() => {
    // Initialize form with backend data
    if (user && user.profile) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: user.profile.phone_number || '',
        location: user.profile.location || '',
        bio: user.profile.bio || '',
        education: user.profile.education ? user.profile.education.split('\n').filter(Boolean) : [],
        experience: user.profile.experience || '',
        projects: user.profile.projects || '',
        primarySkills: user.profile.skills || [],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleTagsChange = (id, newTags) => {
    setFormData(prev => ({ ...prev, [id]: newTags }));
  };

  const handleResumeUpload = (file) => {
    if (!isEditing) return;
    setNewResume(file);
  };


  const handleSave = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('access_token');
    
    const data = new FormData();
    if (newAvatar) data.append('avatar', newAvatar);
    if (newResume) data.append('resume', newResume);
    if (formData.firstName) data.append('first_name', formData.firstName);
    if (formData.lastName) data.append('last_name', formData.lastName);
    if (formData.phone) data.append('phone_number', formData.phone);
    if (formData.location) data.append('location', formData.location);
    if (formData.bio) data.append('bio', formData.bio);
    if (formData.education.length > 0) data.append('education', formData.education.join('\n'));
    if (formData.experience) data.append('experience', formData.experience);
    if (formData.projects) data.append('projects', formData.projects);
    data.append('skills', JSON.stringify(formData.primarySkills));

    try {
      const response = await fetch(`${API_URL}/users/profile/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (response.ok) {
        await fetchUserProfile(token); // refresh global context
        setIsEditing(false);
        setNewAvatar(null);
        setNewResume(null);
      } else {
        alert('There was an issue saving your profile.');
      }
    } catch (error) {
       console.error('Error submitting profile', error);
       alert('Network error. Profile could not be updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewAvatar(null);
    setNewResume(null);
    // Reset to existing
    if (user && user.profile) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: user.profile.phone_number || '',
        location: user.profile.location || '',
        bio: user.profile.bio || '',
        education: user.profile.education ? user.profile.education.split('\n').filter(Boolean) : [],
        experience: user.profile.experience || '',
        projects: user.profile.projects || '',
        primarySkills: user.profile.skills || [],
      });
    }
  };

  if (!user) return <div className="p-8 text-center">Loading Profile...</div>;

  return (
    <div className="profile-settings-container fade-in">
      <div className="ps-header">
        <div>
          <h2>Profile Settings</h2>
          <p>Manage your account, professional background, and AI integration features.</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="ps-actions">
            <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
          </div>
        )}
      </div>

      <div className="ps-content">

        <div className="ps-grid">
          {/* Left Column */}
          <div className="ps-left">
            <div className="ps-card">
              <h3>Personal Info</h3>
              
              <div className="ps-avatar-section">
                 <div className="ps-avatar-preview">
                    {newAvatar ? (
                        <img src={URL.createObjectURL(newAvatar)} alt="Preview" />
                    ) : user.profile?.avatar ? (
                        <img 
                          src={`${API_URL.replace('/api', '')}${user.profile.avatar}`} 
                          alt="Avatar" 
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                    ) : null}
                    {/* Fallback placeholder either when no avatar or image fails to load */}
                    <div 
                      className="ps-avatar-placeholder" 
                      style={{ display: (!newAvatar && !user.profile?.avatar) ? 'flex' : 'none' }}
                    >
                       {formData.firstName.charAt(0).toUpperCase() || user.first_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                 </div>
                 {isEditing && (
                    <div className="avatar-upload-control">
                      <FileUpload
                        id="avatar"
                        accept="image/*"
                        isImage={true}
                        maxMb={2}
                        onChange={(file) => setNewAvatar(file)}
                      />
                    </div>
                 )}
              </div>

              <div className="form-group-row">
                <InputField
                  label="First Name"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  readOnly={!isEditing}
                />
                <InputField
                  label="Last Name"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  readOnly={!isEditing}
                />
              </div>

              <InputField
                label="Email Address (Login Required to Change)"
                id="email"
                value={user.email || ''}
                readOnly={true}
              />

              <div className="form-group-row mt-4">
                <InputField
                  label="Phone Number"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  readOnly={!isEditing}
                />
                <InputField
                  label="Location"
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  readOnly={!isEditing}
                />
              </div>

              <div className="input-wrapper mt-4">
                <label className="input-label">Short Bio</label>
                <textarea
                  id="bio"
                  className="textarea-field"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  readOnly={!isEditing}
                ></textarea>
              </div>
            </div>

            <div className="ps-card">
               <h3>Technical Skills</h3>
               <p className="ps-subtext">Used by AI to calibrate interviews and assessments.</p>
               <div className="ps-skills-wrapper">
                  {isEditing ? (
                     <SkillTagInput
                        id="primarySkills"
                        placeholder="Add skill (e.g. Python, React)"
                        maxTags={20}
                        tags={formData.primarySkills}
                        setTags={(tags) => handleTagsChange('primarySkills', tags)}
                     />
                  ) : (
                     <div className="ps-skills-readonly">
                        {formData.primarySkills.map((skill, idx) => (
                           <span key={idx} className="ps-skill-chip">{skill}</span>
                        ))}
                        {formData.primarySkills.length === 0 && <span className="text-gray-400">No skills added yet.</span>}
                     </div>
                  )}
               </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="ps-right">
            
            <div className="ps-card">
               <h3>CV & Resume</h3>
               {isEditing ? (
                  <div className="resume-reupload">
                       <FileUpload
                         label={newResume ? newResume.name : "Upload New CV"}
                         id="resume"
                         accept=".pdf,.doc,.docx"
                         maxMb={5}
                         onChange={handleResumeUpload}
                       />
                       {newResume && (
                         <div className="ps-upload-success mt-2">
                           <Check size={14} className="text-emerald-500" />
                           <span className="text-emerald-600 text-sm font-semibold">File ready to save</span>
                         </div>
                       )}
                  </div>
               ) : (
                  <div className="current-resume">
                     {user.profile?.resume ? (
                         <div className="resume-badge">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            {user.profile.resume.split('/').pop()}
                         </div>
                     ) : (
                        <span className="text-gray-400">No resume uploaded. Click Edit Profile to add one.</span>
                     )}
                  </div>
               )}
            </div>

            <div className="ps-card h-full">
              <h3>Professional Background</h3>
              
              <div className="input-wrapper mb-4">
                <label className="input-label">Education</label>
                {isEditing ? (
                  <SkillTagInput
                    id="education"
                    placeholder="e.g. B.S. Science, Stanford"
                    maxTags={10}
                    tags={formData.education}
                    setTags={(tags) => handleTagsChange('education', tags)}
                    availableSuggestions={[
                      "High School Diploma", "Bachelor of Science", "Master of Science", 
                      "B.Tech in Computer Science", "M.Tech in Software Engineering",
                      "Ph.D. in Artificial Intelligence", "Bachelor of Arts", "MBA",
                      "Associate Degree", "Professional Certification"
                    ]}
                  />
                ) : (
                  <div className="ps-skills-readonly" style={{ minHeight: 'auto' }}>
                    {formData.education.map((edu, idx) => (
                      <span key={idx} className="ps-skill-chip" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>{edu}</span>
                    ))}
                    {formData.education.length === 0 && <span className="text-gray-400">No education details added.</span>}
                  </div>
                )}
              </div>

              <div className="input-wrapper mb-4">
                <label className="input-label">Work Experience</label>
                <textarea
                  id="experience"
                  className="textarea-field"
                  rows={5}
                  value={formData.experience}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder={isEditing ? "e.g. Frontend Developer at TechCorp..." : "Nothing entered yet."}
                ></textarea>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Notable Projects</label>
                <textarea
                  id="projects"
                  className="textarea-field"
                  rows={5}
                  value={formData.projects}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder={isEditing ? "e.g. Built an e-commerce platform using React..." : "Nothing entered yet."}
                ></textarea>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
