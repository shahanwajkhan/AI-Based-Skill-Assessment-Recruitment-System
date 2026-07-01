from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('recruiter', 'Recruiter'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')

    def __str__(self):
        return f"{self.username} ({self.role})"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    location = models.CharField(max_length=150, blank=True)
    bio = models.TextField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    education = models.TextField(blank=True)
    experience = models.TextField(blank=True)
    projects = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True) # Storing array of skill strings
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)
    
    # Recruiter Specific Fields
    company_name = models.CharField(max_length=200, blank=True)
    job_title = models.CharField(max_length=150, blank=True)
    company_website = models.URLField(max_length=500, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    company_size = models.CharField(max_length=50, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Assessment(models.Model):
    TYPE_CHOICES = (
        ('mcq', 'MCQ Exam'),
        ('interview', 'AI Interview'),
    )
    INTERVIEW_CHOICES = (
        ('hr', 'HR Interview'),
        ('technical', 'Technical Interview'),
    )

    title = models.CharField(max_length=200)
    assessment_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='mcq')
    interview_category = models.CharField(max_length=20, choices=INTERVIEW_CHOICES, null=True, blank=True)
    category = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    estimated_time = models.IntegerField(help_text="Time in minutes")
    questions = models.JSONField(default=list, blank=True) # Array of question objects
    image_url = models.URLField(max_length=500, blank=True, null=True)
    enrolled_count = models.IntegerField(default=0)
    
    # UI Content Fields
    proctoring_rules = models.JSONField(default=list, blank=True) # Array of strings or {icon, text}
    structure_instructions = models.JSONField(default=dict, blank=True) # Map of sections/descriptions
    
    # Recruiter Fields
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_assessments')
    
    def __str__(self):
        return self.title


class ShortlistedCandidate(models.Model):
    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shortlists')
    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shortlisted_by')
    notes = models.TextField(blank=True)
    ai_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('recruiter', 'candidate')

    def __str__(self):
        return f"{self.candidate.username} shortlisted by {self.recruiter.username}"


class AssessmentSession(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('terminated', 'Terminated'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assessment_sessions')
    assessment = models.ForeignKey(Assessment, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    score = models.FloatField(default=0.0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # For CV-based dynamic tests
    is_custom = models.BooleanField(default=False)
    custom_data = models.JSONField(null=True, blank=True) # Stores questions generated for this session

    def __str__(self):
        return f"{self.user.username} - {self.assessment or 'Custom'} - {self.status}"


class ProctoringViolation(models.Model):
    VIOLATION_TYPES = (
        ('visibility', 'Tab Switched/Hidden'),
        ('blur', 'Lost Window Focus'),
        ('fullscreen', 'Exited Full Screen'),
        ('fullscreen-init', 'Started Not In Full Screen'),
        ('audio', 'Audio Spike'),
        ('face', 'Face Detection Issue'),
    )
    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name='violations', null=True, blank=True)
    interview_session = models.ForeignKey('AIInterviewSession', on_delete=models.CASCADE, related_name='violations', null=True, blank=True)
    type = models.CharField(max_length=20, choices=VIOLATION_TYPES)
    strike_number = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True)

    def __str__(self):
        return f"Strike {self.strike_number} for {self.session.user.username} ({self.type})"


class CVAnalysis(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cv_analyses')
    file_name = models.CharField(max_length=255)
    extracted_text = models.TextField()
    skills = models.JSONField(default=list)
    generated_questions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "CV Analyses"

    def __str__(self):
        return f"CV Analysis for {self.user.username} ({self.file_name})"


class CodingSubmission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coding_submissions')
    problem_id = models.CharField(max_length=100)
    language = models.CharField(max_length=50)
    code = models.TextField()
    performance_metrics = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=50) # e.g., 'Accepted', 'Failed'
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.problem_id} ({self.status})"


class Result(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='results')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='results', null=True, blank=True)
    score = models.FloatField()
    
    # New Analytics Fields
    correct_answers = models.IntegerField(default=0)
    incorrect_answers = models.IntegerField(default=0)
    total_questions = models.IntegerField(default=0)
    time_taken = models.IntegerField(default=0, help_text="Time taken in seconds")
    ai_suggestions = models.JSONField(default=list, blank=True)
    proctoring_summary = models.JSONField(default=dict, blank=True)
    skill_breakdown = models.JSONField(default=list, blank=True)
    coding_score = models.FloatField(null=True, blank=True)
    
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        title = self.assessment.title if self.assessment else "General Assessment"
        return f"{self.user.username} - {title}: {self.score}%"

class AIInterviewSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_interviews')
    assessment = models.ForeignKey(Assessment, on_delete=models.SET_NULL, null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    extracted_text = models.TextField(blank=True)
    detected_skills = models.JSONField(default=list)
    
    # Store history of the interview (questions asked and user answers)
    qa_history = models.JSONField(default=list)
    
    # Final AI Evaluation
    overall_score = models.IntegerField(default=0)
    communication_score = models.IntegerField(default=0)
    technical_score = models.IntegerField(default=0)
    confidence_score = models.IntegerField(default=0)
    answer_quality_score = models.IntegerField(default=0)
    problem_solving_score = models.IntegerField(default=0)
    feedback_summary = models.TextField(blank=True, null=True)
    strengths = models.JSONField(default=list, blank=True)
    improvements = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default='initialized') # initialized, in-progress, completed

    def __str__(self):
        return f"AI Interview for {self.user.username} ({self.created_at.strftime('%Y-%m-%d')})"

class SkillGapAnalysis(models.Model):
    SOURCE_CHOICES = [
        ('skill_test', 'Skill Test'),
        ('ai_interview', 'AI Interview'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skill_gap_analyses')
    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    
    # Links to the source data
    assessment_result = models.ForeignKey('Result', on_delete=models.SET_NULL, null=True, blank=True)
    interview_session = models.ForeignKey('AIInterviewSession', on_delete=models.SET_NULL, null=True, blank=True)
    
    overall_score = models.FloatField(default=0.0)
    skill_level = models.CharField(max_length=50, default='Beginner') # e.g., Beginner, Intermediate, Advanced
    
    # JSON Data for detailed breakdown
    skill_breakdown = models.JSONField(default=dict) # { "Python": 85, "React": 40, ... }
    identified_gaps = models.JSONField(default=list) # [ "Missing knowledge of React Hooks", "Weak in System Design" ]
    
    # The Learning Roadmap
    roadmap = models.JSONField(default=list) 
    # [
    #   { "milestone": "Master React Hooks", "duration": "1 week", "topics": ["useState", "useEffect", "Custom Hooks"] },
    #   ...
    # ]
    
    recommendations = models.JSONField(default=list) # [ { "title": "React Docs", "url": "..." }, ... ]
    
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Skill Gap Analysis for {self.user.username} ({self.source_type}) - {self.created_at.strftime('%Y-%m-%d')}"

    class Meta:
        verbose_name_plural = "Skill Gap Analyses"
        ordering = ['-created_at']


class TestAssignment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    )
    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tests')
    candidate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_assignments')
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.assessment.title} assigned to {self.candidate.username} by {self.recruiter.username}"

class TestInvitation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('opened', 'Opened'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    )
    TEST_TYPES = (
        ('ai_skill', 'AI Skill Test'),
        ('ai_interview', 'AI Interview'),
        ('coding', 'Coding Test'),
        ('confidence', 'Confidence Analyzer'),
    )
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    candidate_email = models.EmailField()
    candidate_name = models.CharField(max_length=150, blank=True)
    test_type = models.CharField(max_length=20, choices=TEST_TYPES)
    skills = models.JSONField(default=list, blank=True)
    custom_message = models.TextField(blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invite: {self.candidate_email} for {self.get_test_type_display()}"
