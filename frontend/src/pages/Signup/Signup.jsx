import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import FileUpload from '../../components/FileUpload/FileUpload';
import SkillTagInput from '../../components/SkillTagInput/SkillTagInput';
import { API_URL } from '../../utils/api';
import PasswordStrength from '../../components/PasswordStrength/PasswordStrength';
import { useAuth } from '../../context/AuthContext';

const STUDENT_STEPS = ['Role', 'Account', 'Smart Import', 'Background', 'Skills'];
const RECRUITER_STEPS = ['Role', 'Account', 'Company Details', 'Professional Profile'];

const Signup = () => {
  const navigate = useNavigate();
  const { login, fetchUserProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const [role, setRole] = useState('student'); // 'student' or 'recruiter'
  const steps = role === 'student' ? STUDENT_STEPS : RECRUITER_STEPS;
  const totalSteps = steps.length;
  
  useEffect(() => {
    // If user is already logged in (e.g. page refresh during onboarding), skip to step 3
    const token = localStorage.getItem('access_token');
    if (token && currentStep < 3) {
      setCurrentStep(3);
    }
  }, [currentStep]);

  const [formData, setFormData] = useState({
    // Step 2: Account
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 3-5: Profile (populated via CV or manual entry)
    resume: null,
    avatar: null,
    phone: '',
    location: '',
    bio: '',
    education: [],
    experience: '',
    projects: '',
    primarySkills: [],
    assessmentCategories: [],
    
    // Recruiter Specific
    company_name: '',
    company_website: '',
    industry: '',
    company_size: '',
    job_title: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: null }));
  };

  const handleFileChange = async (id, file) => {
    setFormData(prev => ({ ...prev, [id]: file }));
    if (id === 'resume' && file) {
      await extractResumeData(file);
    }
  };

  const handleTagsChange = (id, newTags) => {
    setFormData(prev => ({ ...prev, [id]: newTags }));
  };

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 2) {
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Min 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else if (currentStep === 3 && role === 'recruiter') {
        if (!formData.company_name) newErrors.company_name = 'Company name is required';
        if (!formData.industry) newErrors.industry = 'Industry is required';
    } else if (currentStep === 4 && role === 'student') {
        if (formData.education.length === 0) newErrors.education = 'Add at least one education entry';
        if (!formData.experience) newErrors.experience = 'Experience is required';
    } else if (currentStep === 4 && role === 'recruiter') {
        if (!formData.job_title) newErrors.job_title = 'Job title is required';
    } else if (currentStep === 5 && role === 'student') {
        if (formData.primarySkills.length === 0) newErrors.primarySkills = 'Add at least one skill';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await handleAccountCreation();
    } else if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      await handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  // Step 2: Register & Auto-Login
  const handleAccountCreation = async () => {
    setIsLoading(true);
    const names = formData.fullName.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');

    try {
      // 1. Register
      const regRes = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.email,
          email: formData.email,
          password: formData.password,
          password_confirm: formData.confirmPassword,
          first_name: firstName,
          last_name: lastName,
          role: role
        })
      });

      if (regRes.ok) {
        // 2. Login to get token
        const logRes = await fetch(`${API_URL}/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.email, password: formData.password })
        });

        if (logRes.ok) {
          const tokens = await logRes.json();
          // Initial profile fetch to sync context
          const profileRes = await fetch(`${API_URL}/users/profile/`, {
              headers: { 'Authorization': `Bearer ${tokens.access}` }
          });
          if (profileRes.ok) {
              const profileData = await profileRes.json();
              login(profileData.user, profileData.profile, tokens);
              setCurrentStep(3);
          }
        }
      } else {
        const errorData = await regRes.json();
        setErrors({ email: errorData.detail || errorData.email?.[0] || 'Registration failed.' });
      }
    } catch (err) {
      setErrors({ email: 'Network error communicating with server.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: CV Extraction
  const extractResumeData = async (file) => {
    setIsExtracting(true);
    setExtractionSuccess(false);
    const token = localStorage.getItem('access_token');
    const data = new FormData();
    data.append('resume', file);

    try {
      const response = await fetch(`${API_URL}/users/profile/extract-cv/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (response.ok) {
        const profile = await response.json();
        setFormData(prev => ({
          ...prev,
          phone: profile.phone_number || prev.phone,
          education: profile.education ? profile.education.split('\n').filter(Boolean) : prev.education,
          experience: profile.experience || prev.experience,
          projects: profile.projects || prev.projects,
          primarySkills: profile.skills && profile.skills.length > 0 ? profile.skills : prev.primarySkills
        }));
        setExtractionSuccess(true);
      }
    } catch (err) {
      console.error("Extraction error", err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Final Step: Profile PATCH
  const handleFinalSubmit = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');
    const data = new FormData();
    
    if (formData.avatar) data.append('avatar', formData.avatar);
    if (formData.phone) data.append('phone_number', formData.phone);
    if (formData.location) data.append('location', formData.location);
    if (formData.bio) data.append('bio', formData.bio);
    
    if (role === 'student') {
        if (formData.resume) data.append('resume', formData.resume);
        if (formData.education.length > 0) data.append('education', formData.education.join('\n'));
        if (formData.experience) data.append('experience', formData.experience);
        if (formData.projects) data.append('projects', formData.projects);
        if (formData.primarySkills.length > 0) data.append('skills', JSON.stringify(formData.primarySkills));
    } else {
        if (formData.company_name) data.append('company_name', formData.company_name);
        if (formData.company_website) data.append('company_website', formData.company_website);
        if (formData.industry) data.append('industry', formData.industry);
        if (formData.company_size) data.append('company_size', formData.company_size);
        if (formData.job_title) data.append('job_title', formData.job_title);
    }

    try {
      const response = await fetch(`${API_URL}/users/profile/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      if (response.ok) {
        await fetchUserProfile(token);
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        const firstError = Object.entries(errorData)[0];
        const errorMsg = firstError ? `${firstError[0]}: ${firstError[1]}` : 'Unknown error';
        alert(`Problem finalizing profile: ${errorMsg}`);
        console.error('Profile update failed:', errorData);
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      mode="signup" 
      title={
        currentStep === 1 ? "Create Account" : 
        currentStep === 2 ? "Account Details" : 
        "Complete Profile"
      }
      subtitle={
        currentStep === 1 ? (
          <div className="auth-subtitle-acc">
            Already have an account? 
            <button type="button" onClick={() => navigate('/login')} className="auth-brand-link-green">
              Log in
            </button>
          </div>
        ) : 
        currentStep === 2 ? "Set up your secure login credentials" :
        `Step ${currentStep} of ${totalSteps}: ${steps[currentStep-1]}`
      }
    >
      <div className="signup-container">
        {currentStep > 1 && currentStep < 3 && (
          <div className="signup-progress-wrap">
             <ProgressBar steps={steps} currentStep={currentStep} />
          </div>
        )}

        <div className="signup-step-wrapper">
          <div className="step-content">
            
            {/* Step 1: Role */}
            {currentStep === 1 && (
              <div className="form-step slide-in">
                 <div className="role-selection">
                    <button type="button" className={`role-btn ${role === 'student' ? 'active' : ''}`} onClick={() => setRole('student')}>
                        <div className="role-icon">📚</div>
                        <div className="role-text">
                          <strong>Professional</strong>
                          <span>I want to test my skills</span>
                        </div>
                    </button>
                    <button type="button" className={`role-btn ${role === 'recruiter' ? 'active' : ''}`} onClick={() => setRole('recruiter')}>
                        <div className="role-icon">💼</div>
                        <div className="role-text">
                          <strong>Recruiter</strong>
                          <span>I want to hire talent</span>
                        </div>
                    </button>
                 </div>
                 <Button fullWidth className="submit-btn-acc" onClick={() => setCurrentStep(2)}>Continue</Button>
              </div>
            )}

            {/* Step 2: Account */}
            {currentStep === 2 && (
              <div className="form-step slide-in">
                <InputField label="Full Name" id="fullName" placeholder="Jane Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} />
                <InputField label="Email Address" id="email" type="email" placeholder="jane@example.com" value={formData.email} onChange={handleChange} error={errors.email} />
                <div className="password-group">
                  <InputField label="Password" id="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} error={errors.password} />
                  {formData.password && <PasswordStrength password={formData.password} />}
                </div>
                <InputField label="Confirm Password" id="confirmPassword" type="password" placeholder="Verify password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
              </div>
            )}

            {/* Step 3: CV Import (Student) or Company Details (Recruiter) */}
            {currentStep === 3 && role === 'student' && (
              <div className="form-step slide-in">
                <div className="resume-upload-section">
                  {!isExtracting ? (
                    <FileUpload
                      label={formData.resume ? "CV Uploaded" : "Upload Resume (PDF/DOCX)"}
                      id="resume"
                      accept=".pdf,.doc,.docx"
                      onChange={(file) => handleFileChange('resume', file)}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <div className="spinner" style={{margin: '0 auto'}}></div>
                      <p className="mt-4">AI Analyzing Resume...</p>
                    </div>
                  )}
                  {extractionSuccess && <div className="extraction-success-badge">✅ Profile Data Extracted Successfully!</div>}
                </div>
                <div className="skip-note">
                  <span>💡</span>
                  <p>Skip this if you'd rather enter your details manually in the next steps.</p>
                </div>
              </div>
            )}

            {currentStep === 3 && role === 'recruiter' && (
              <div className="form-step slide-in">
                <InputField label="Company Name *" id="company_name" placeholder="E.g. Acme Corp" value={formData.company_name} onChange={handleChange} error={errors.company_name} />
                <InputField label="Company Website" id="company_website" type="url" placeholder="https://acme.com" value={formData.company_website} onChange={handleChange} error={errors.company_website} />
                <InputField label="Industry *" id="industry" placeholder="E.g. Technology, Finance" value={formData.industry} onChange={handleChange} error={errors.industry} />
                <InputField label="Company Size" id="company_size" placeholder="E.g. 50-200" value={formData.company_size} onChange={handleChange} error={errors.company_size} />
              </div>
            )}

            {/* Step 4: Background (Student) or Professional Profile (Recruiter) */}
            {currentStep === 4 && role === 'student' && (
              <div className="form-step slide-in">
                
                <div className="avatar-upload-section">
                   <FileUpload id="avatar" accept="image/*" isImage={true} onChange={(file) => setFormData(prev => ({...prev, avatar: file}))} />
                   <div className="avatar-help-text"><strong>Profile Photo</strong><span>Optional professional avatar.</span></div>
                </div>

                <InputField label="Phone" id="phone" value={formData.phone} onChange={handleChange} />
                <InputField label="Location" id="location" value={formData.location} onChange={handleChange} />
                
                <div className="input-wrapper mt-4">
                  <label className="input-label">Education <span className="text-red-500">*</span></label>
                  <SkillTagInput 
                    tags={formData.education} 
                    setTags={(tags) => handleTagsChange('education', tags)} 
                    placeholder="e.g. B.Tech Computer Science" 
                    error={errors.education} 
                    helperText="Enter your degrees, certifications, or schools."
                    availableSuggestions={[
                      "High School Diploma", "Bachelor of Science", "Master of Science", 
                      "B.Tech in Computer Science", "M.Tech in Software Engineering",
                      "Ph.D. in Artificial Intelligence", "Bachelor of Arts", "MBA",
                      "Associate Degree", "Professional Certification"
                    ]}
                  />
                </div>

                <div className="input-wrapper mt-4">
                  <label className="input-label">Work Experience <span className="text-red-500">*</span></label>
                  <textarea id="experience" className={`textarea-field ${errors.experience ? 'error' : ''}`} value={formData.experience} onChange={handleChange} placeholder="Role, Company, Dates..." />
                </div>
              </div>
            )}

            {currentStep === 4 && role === 'recruiter' && (
              <div className="form-step slide-in">
                <div className="avatar-upload-section">
                   <FileUpload id="avatar" accept="image/*" isImage={true} onChange={(file) => setFormData(prev => ({...prev, avatar: file}))} />
                   <div className="avatar-help-text"><strong>Profile Photo</strong><span>Optional professional avatar.</span></div>
                </div>
                <InputField label="Your Job Title *" id="job_title" placeholder="E.g. Talent Acquisition Manager" value={formData.job_title} onChange={handleChange} error={errors.job_title} />
                <InputField label="Phone Number" id="phone" placeholder="+1 234 567 8900" value={formData.phone} onChange={handleChange} error={errors.phone} />
                <InputField label="Location" id="location" placeholder="City, Country" value={formData.location} onChange={handleChange} />
              </div>
            )}

            {/* Step 5: Skills (Student Only) */}
            {currentStep === 5 && role === 'student' && (
              <div className="form-step slide-in">
                <SkillTagInput 
                    label="Primary Skills" 
                    tags={formData.primarySkills} 
                    setTags={(tags) => handleTagsChange('primarySkills', tags)} 
                    placeholder="e.g. React, Node.js, Python"
                    error={errors.primarySkills} 
                />
                <div className="input-wrapper mt-6">
                  <label className="input-label">Short Bio</label>
                  <textarea id="bio" className="textarea-field" value={formData.bio} onChange={handleChange} placeholder="Tell us about your career goals..." />
                </div>
              </div>
            )}

          </div>

          {currentStep > 1 && (
            <div className="signup-actions">
              <Button variant="secondary" onClick={handleBack} disabled={isLoading || isExtracting}>Back</Button>
              <Button onClick={handleNext} isLoading={isLoading} disabled={isExtracting}>
                {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default Signup;
