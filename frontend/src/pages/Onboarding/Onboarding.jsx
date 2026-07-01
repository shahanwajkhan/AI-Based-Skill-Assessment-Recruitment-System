import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import InputField from '../../components/InputField/InputField';
import Select from '../../components/Select/Select';
import FileUpload from '../../components/FileUpload/FileUpload';
import SkillTagInput from '../../components/SkillTagInput/SkillTagInput';
import Button from '../../components/Button/Button';
import { API_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const steps = ['Smart Import', 'Personal Details', 'Professional Background', 'Skills & Interests'];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { fetchUserProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    resume: null,
    avatar: null,
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    education: [],
    experience: '',
    projects: '',
    primarySkills: [],
    assessmentCategories: [],
  });

  const [errors, setErrors] = useState({});

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleFileChange = async (id, file) => {
    setFormData(prev => ({
      ...prev,
      [id]: file
    }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }

    // Auto-extract logic if we just uploaded a resume on Step 1
    if (id === 'resume' && file && currentStep === 1) {
      await extractResumeData(file);
    }
  };

  const extractResumeData = async (file) => {
    setIsExtracting(true);
    setExtractionSuccess(false);
    const token = localStorage.getItem('access_token');
    const data = new FormData();
    data.append('resume', file);

    try {
      const response = await fetch(`${API_URL}/users/profile/extract-cv/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (response.ok) {
        const profile = await response.json();
        setFormData(prev => ({
          ...prev,
          firstName: profile.first_name || prev.firstName,
          lastName: profile.last_name || prev.lastName,
          phone: profile.phone_number || prev.phone,
          education: profile.education ? profile.education.split('\n').filter(Boolean) : prev.education,
          experience: profile.experience || prev.experience,
          projects: profile.projects || prev.projects,
          primarySkills: profile.skills && profile.skills.length > 0 ? profile.skills : prev.primarySkills
        }));
        setExtractionSuccess(true);
      } else {
        console.error("Failed to extract CV data");
      }
    } catch (err) {
      console.error("Network error during extraction", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTagsChange = (id, newTags) => {
    setFormData(prev => ({
      ...prev,
      [id]: newTags
    }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    let isValid = true;

    switch (step) {
      case 1:
        // Resume optional
        break;
      case 2:
        if (!formData.firstName) newErrors.firstName = 'First Name is required';
        if (!formData.lastName) newErrors.lastName = 'Last Name is required';
        break;
      case 3:
        if (formData.education.length === 0) newErrors.education = 'Please provide at least one education entry';
        if (!formData.experience) newErrors.experience = 'Please provide some work experience';
        break;
      case 4:
        if (formData.primarySkills.length === 0) newErrors.primarySkills = 'Please add at least one primary skill';
        break;
      default:
        break;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('access_token');
    
    // Use FormData for file uploads alongside text
    const data = new FormData();
    if (formData.avatar) data.append('avatar', formData.avatar);
    if (formData.resume) data.append('resume', formData.resume);
    if (formData.firstName) data.append('first_name', formData.firstName);
    if (formData.lastName) data.append('last_name', formData.lastName);
    if (formData.phone) data.append('phone_number', formData.phone);
    if (formData.location) data.append('location', formData.location);
    if (formData.bio) data.append('bio', formData.bio);
    if (formData.education.length > 0) data.append('education', formData.education.join('\n'));
    if (formData.experience) data.append('experience', formData.experience);
    if (formData.projects) data.append('projects', formData.projects);
    if (formData.primarySkills.length > 0) data.append('skills', JSON.stringify(formData.primarySkills));

    try {
      const response = await fetch(`${API_URL}/users/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (response.ok) {
        console.log('Onboarding complete');
        await fetchUserProfile(token);
        navigate('/dashboard');
      } else {
        console.error('Failed to update profile', await response.json());
        alert('There was an issue saving your profile. Please try again.');
      }
    } catch (error) {
       console.error('Error submitting onboarding', error);
       alert('Network error. Profile could not be updated.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'software_engineering', label: 'Software Engineering' },
    { value: 'data_science', label: 'Data Science & AI' },
    { value: 'design', label: 'UI/UX Design' },
    { value: 'marketing', label: 'Digital Marketing' },
    { value: 'product', label: 'Product Management' },
  ];

  return (
    <div className="onboarding-layout">
      <div className="onboarding-container" style={{ maxWidth: '800px' }}>
        
        <div className="onboarding-header">
          <div className="brand-logo sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="brand-name sm">SkillGuard AI</span>
          </div>
          <h1>Complete Your Profile</h1>
          <p>Let's tailor your experience to match your career goals.</p>
        </div>

        <ProgressBar steps={steps} currentStep={currentStep} />

        <div className="onboarding-content-card">
          <div className="step-content">
            
            {/* Step 1: Smart Import */}
            {currentStep === 1 && (
              <div className="form-step slide-in">
                <h3>Smart Resume Import</h3>
                <p className="step-description">Upload your CV (PDF/DOCX) and our AI will automatically extract your details to build your profile in seconds.</p>

                <div className="resume-upload-section" style={{ minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {!isExtracting ? (
                    <FileUpload
                      label={formData.resume ? "Resume Uploaded" : "Upload CV/Resume"}
                      id="resume"
                      accept=".pdf,.doc,.docx"
                      maxMb={5}
                      hint="Supports PDF, DOC, DOCX. We'll extract your skills automatically."
                      onChange={(file) => handleFileChange('resume', file)}
                      error={errors.resume}
                    />
                  ) : (
                     <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                        <h4 style={{ color: 'var(--primary-glow)' }}>Extracting Intelligence...</h4>
                        <p style={{ color: 'var(--text-secondary)' }}>Analyzing your experience, education, and skills.</p>
                     </div>
                  )}

                  {extractionSuccess && !isExtracting && (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', marginTop: '1rem', color: '#10b981', textAlign: 'center' }}>
                       ✅ CV Parsed Successfully! Click Continue to review your auto-filled profile.
                    </div>
                  )}
                </div>
                
                <div className="skip-note mt-6">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <p>Don't have a resume handy? You can skip this step and enter details manually.</p>
                </div>
              </div>
            )}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <div className="form-step slide-in">
                <h3>Personal Details</h3>
                <p className="step-description">Review and edit your basic contact info.</p>
                
                <div className="avatar-upload-section">
                  <FileUpload
                    id="avatar"
                    accept="image/*"
                    isImage={true}
                    maxMb={2}
                    onChange={(file) => handleFileChange('avatar', file)}
                    error={errors.avatar}
                  />
                  <div className="avatar-help-text">
                    <strong>Profile Picture</strong>
                    <span>Upload a professional photo (JPG, PNG). Max 2MB.</span>
                  </div>
                </div>

                <div className="form-grid">
                  <InputField
                    label="First Name"
                    id="firstName"
                    placeholder="e.g. Jane"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                  />
                  <InputField
                    label="Last Name"
                    id="lastName"
                    placeholder="e.g. Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                  />
                </div>

                <div className="form-grid mt-4">
                  <InputField
                    label="Phone Number"
                    id="phone"
                    placeholder="e.g. +1 234 567 890"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <InputField
                    label="Location (City, Country)"
                    id="location"
                    placeholder="e.g. San Francisco, US"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-wrapper mt-4">
                  <label htmlFor="bio" className="input-label">Short Bio</label>
                  <textarea
                    id="bio"
                    className="textarea-field"
                    placeholder="Tell us a little bit about yourself and your career goals..."
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            {/* Step 3: Professional Background */}
            {currentStep === 3 && (
              <div className="form-step slide-in">
                <h3>Professional Background</h3>
                <p className="step-description">Review your extracted education, experience, and projects. You can edit these manually.</p>

                <div className="input-wrapper mb-4">
                  <label htmlFor="education" className="input-label">Education <span className="text-red-500">*</span></label>
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
                    error={errors.education}
                  />
                </div>

                <div className="input-wrapper mb-4">
                  <label htmlFor="experience" className="input-label">Work Experience <span className="text-red-500">*</span></label>
                  <textarea
                    id="experience"
                    className={`textarea-field ${errors.experience ? 'error' : ''}`}
                    placeholder="e.g. Software Engineer at TechCorp (2022-Present)..."
                    rows={4}
                    value={formData.experience}
                    onChange={handleChange}
                  ></textarea>
                  {errors.experience && <span className="error-message">{errors.experience}</span>}
                </div>

                <div className="input-wrapper">
                  <label htmlFor="projects" className="input-label">Notable Projects</label>
                  <textarea
                    id="projects"
                    className="textarea-field"
                    placeholder="List your key technical projects..."
                    rows={4}
                    value={formData.projects}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
            )}

            {/* Step 4: Skills & Interests */}
            {currentStep === 4 && (
              <div className="form-step slide-in">
                <h3>Skills & Interests</h3>
                <p className="step-description">Verify the technical skills extracted from your resume and select your targets.</p>

                <SkillTagInput
                  label="Primary Skills"
                  id="primarySkills"
                  placeholder="e.g. React, Python, Data Analysis"
                  maxTags={15}
                  tags={formData.primarySkills}
                  setTags={(tags) => handleTagsChange('primarySkills', tags)}
                  error={errors.primarySkills}
                />

                <SkillTagInput
                  label="Preferred Assessment Categories"
                  id="assessmentCategories"
                  placeholder="e.g. Web Development, Machine Learning"
                  maxTags={5}
                  tags={formData.assessmentCategories}
                  setTags={(tags) => handleTagsChange('assessmentCategories', tags)}
                />
                
                <div className="suggested-tags mt-2">
                  <span className="suggested-label">Suggested categories:</span>
                  <div className="suggested-chips">
                    {categoryOptions.map(cat => (
                      <button 
                        key={cat.value}
                        type="button" 
                        className={`suggested-chip ${formData.assessmentCategories.includes(cat.label) ? 'selected' : ''}`}
                        onClick={() => {
                          if (!formData.assessmentCategories.includes(cat.label) && formData.assessmentCategories.length < 5) {
                            handleTagsChange('assessmentCategories', [...formData.assessmentCategories, cat.label]);
                          }
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="onboarding-actions">
            {currentStep > 1 ? (
              <Button variant="secondary" onClick={handleBack} className="back-btn" disabled={isExtracting}>
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            <Button onClick={handleNext} className="next-btn" isLoading={isSubmitting} disabled={isExtracting}>
              {currentStep === 1 ? 'Skip / Continue' : currentStep === steps.length ? 'Complete Setup' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
