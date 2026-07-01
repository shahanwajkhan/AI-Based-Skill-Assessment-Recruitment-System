from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import recruiter_views
from .views import (
    TurnstileLoginView,
    RegisterView,
    ForgotPasswordView,
    ResetPasswordView,
    UserProfileView,
    CVProfileExtractView,
    RecentActivityView,
    DashboardStatsView,
    AssessmentListView,
    AssessmentMetadataView,
    CVTestGenerateView,
    AssessmentSessionStartView,
    ProctoringViolationLogView,
    AssessmentSessionCompleteView,
    CodeforcesProblemFetchView,
    CodingSubmissionView,
    ResultListView,
    ResultDetailView,
    AIInterviewStartView,
    AIInterviewNextQuestionView,
    AIInterviewSubmitView,
    AIInterviewCVStatusView,
    SkillGapAnalysisListView,
    SkillGapAnalysisDetailView,
    SkillGapAnalysisGenerateView,
    ATSResumeCheckView,
    ConfidenceCheckView,
    AIMentorChatView,
    LeaderboardView,
    LatestAnalysisView,
    RecruiterDashboardAnalyticsView,
    StudentTestAssignmentView,
    VerifyInvitationView,
    CompleteInvitationView,
)
from .recruiter_views import (
    CandidateListView,
    CandidateDetailView,
    CandidateResumeDownloadView,
    RecruiterCandidateATSView,
    RecruiterAssessmentView,
    RecruiterAssessmentDetailView,
    ShortlistToggleView,
    ShortlistListView,
    AutoShortlistView,
    CandidateComparisonView,
    AIAssessmentGenerateView,
    InvitationListCreateView
)

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TurnstileLoginView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
    
    # Profile Endpoints
    path('users/profile/', UserProfileView.as_view(), name='user_profile'),
    path('users/profile/extract-cv/', CVProfileExtractView.as_view(), name='extract_cv_profile'),
    path('users/profile/ats-check/', ATSResumeCheckView.as_view(), name='ats_check'),
    path('users/profile/confidence-check/', ConfidenceCheckView.as_view(), name='confidence_check'),
    path('ai-mentor/chat/', AIMentorChatView.as_view(), name='ai_mentor_chat'),
    
    # Dashboard Endpoints
    path('dashboard/recent-activity/', RecentActivityView.as_view(), name='dashboard_recent_activity'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('dashboard/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('dashboard/latest-analysis/', LatestAnalysisView.as_view(), name='latest_analysis'),
    
    # AI Test Generation
    path('assessments/', AssessmentListView.as_view(), name='assessment_list'),
    path('assessments/assignments/', StudentTestAssignmentView.as_view(), name='student_assignments'),
    path('assessments/metadata/', AssessmentMetadataView.as_view(), name='assessment_metadata'),
    path('assessments/generate-cv/', CVTestGenerateView.as_view(), name='generate_cv_test'),
    
    # Assessment Sessions & Proctoring Logs
    path('assessments/sessions/start/', AssessmentSessionStartView.as_view(), name='session_start'),
    path('assessments/sessions/<int:session_id>/log-violation/', ProctoringViolationLogView.as_view(), name='log_violation'),
    path('assessments/sessions/<int:session_id>/complete/', AssessmentSessionCompleteView.as_view(), name='session_complete'),
    path('coding/fetch-codeforces/', CodeforcesProblemFetchView.as_view(), name='fetch_codeforces'),
    path('coding/submit/', CodingSubmissionView.as_view(), name='coding_submit'),
    
    # Result Endpoints
    path('results/', ResultListView.as_view(), name='result_list'),
    path('results/<int:pk>/', ResultDetailView.as_view(), name='result_detail'),
    
    # AI Interview Subsystem
    path('ai-interview/start/', AIInterviewStartView.as_view(), name='ai_interview_start'),
    path('ai-interview/next-question/', AIInterviewNextQuestionView.as_view(), name='ai_interview_next'),
    path('ai-interview/submit/', AIInterviewSubmitView.as_view(), name='ai_interview_submit'),
    path('ai-interview/cv-status/', AIInterviewCVStatusView.as_view(), name='ai_interview_cv_status'),

    # Skill Gap Analyzer
    path('skill-gap-analysis/', SkillGapAnalysisListView.as_view(), name='skill_gap_list'),
    path('skill-gap-analysis/<int:pk>/', SkillGapAnalysisDetailView.as_view(), name='skill_gap_detail'),
    path('skill-gap-analysis/generate/', SkillGapAnalysisGenerateView.as_view(), name='skill_gap_generate'),
    
    path('recruiter/dashboard-analytics/', RecruiterDashboardAnalyticsView.as_view(), name='recruiter_analytics'),
    
    # Recruiter Management Endpoints
    path('recruiter/candidates/', CandidateListView.as_view(), name='recruiter_candidates'),
    path('recruiter/candidates/<int:pk>/', CandidateDetailView.as_view(), name='recruiter_candidate_detail'),
    path('recruiter/candidates/<int:pk>/resume/', CandidateResumeDownloadView.as_view(), name='recruiter_candidate_resume'),
    path('recruiter/candidates/<int:pk>/ats/', RecruiterCandidateATSView.as_view(), name='recruiter_candidate_ats'),
    path('recruiter/candidates/<int:pk>/shortlist/', ShortlistToggleView.as_view(), name='recruiter_shortlist_toggle'),
    path('recruiter/shortlisted/', ShortlistListView.as_view(), name='recruiter_shortlisted_list'),
    path('recruiter/assessments/', RecruiterAssessmentView.as_view(), name='recruiter_assessments'),
    path('recruiter/assessments/<int:pk>/', RecruiterAssessmentDetailView.as_view(), name='recruiter_assessment_detail'),
    path('recruiter/auto-shortlist/', AutoShortlistView.as_view(), name='recruiter_auto_shortlist'),
    path('recruiter/compare/', recruiter_views.CandidateComparisonView.as_view(), name='recruiter-compare'),
    path('recruiter/assignments/', recruiter_views.TestAssignmentView.as_view(), name='recruiter-assignments'),
    path('recruiter/candidates/<int:pk>/tailored-questions/', recruiter_views.TailoredQuestionsView.as_view(), name='candidate-tailored-questions'),
    path('recruiter/assessments/ai-generate/', AIAssessmentGenerateView.as_view(), name='ai_assessment_generate'),
    path('recruiter/invitations/', InvitationListCreateView.as_view(), name='recruiter_invitations'),

    # Public / Candidate Endpoints 
    path('invitations/verify/<uuid:token>/', VerifyInvitationView.as_view(), name='verify_invitation'),
    path('invitations/complete/<uuid:token>/', CompleteInvitationView.as_view(), name='complete_invitation'),
]
