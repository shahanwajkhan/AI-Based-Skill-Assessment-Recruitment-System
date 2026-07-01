from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Avg, Q
from django.http import FileResponse, Http404
from django.conf import settings
import os
import mimetypes

from .models import Result, AIInterviewSession, Assessment, ShortlistedCandidate, TestAssignment, CodingSubmission, TestInvitation
from .serializers import (
    CandidateSummarySerializer, 
    AssessmentSerializer, 
    ResultSerializer, 
    AIInterviewSessionSerializer,
    ShortlistedCandidateSerializer,
    UserSerializer,
    TestAssignmentSerializer,
    CodingSubmissionSerializer,
    TestInvitationSerializer
)
from django.core.mail import send_mail
from .import services

User = get_user_model()

class IsRecruiter(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'recruiter'

class CandidateListView(generics.ListAPIView):
    serializer_class = CandidateSummarySerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        queryset = User.objects.filter(role='student', is_active=True)
        search = self.request.query_params.get('search')
        skill = self.request.query_params.get('skill')
        
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) | 
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        if skill:
            queryset = queryset.filter(profile__skills__contains=skill)
            
        return queryset

class CandidateDetailView(views.APIView):
    permission_classes = [IsRecruiter]

    def get(self, request, pk):
        try:
            candidate = User.objects.get(pk=pk, role='student')
        except User.DoesNotExist:
            return Response({"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Performance Stats (safe)
        try:
            stats = services.get_aggregated_user_stats(candidate)
        except Exception as e:
            print(f"[CandidateDetail] Stats error: {e}")
            stats = {"avg_score": 0, "top_skill": "N/A", "weakest_skill": "N/A", "skill_level": "Beginner", "skill_matrix": [], "total_tests": 0, "total_interviews": 0, "cv_skills": []}

        # 2. Intelligence Report (safe - this calls AI so may fail)
        try:
            intelligence = services.generate_hiring_intelligence(candidate)
        except Exception as e:
            print(f"[CandidateDetail] Intelligence error: {e}")
            intelligence = None

        # 3. Assessment History (safe)
        try:
            results = Result.objects.filter(user=candidate).order_by('-completed_at')
            interviews = AIInterviewSession.objects.filter(user=candidate, status='completed').order_by('-completed_at')
            serialized_results = ResultSerializer(results, many=True).data
            serialized_interviews = AIInterviewSessionSerializer(interviews, many=True).data
        except Exception as e:
            print(f"[CandidateDetail] History error: {e}")
            serialized_results = []
            serialized_interviews = []

        # 4. Progress History (safe)
        try:
            progress = services.get_candidate_progress_data(candidate)
        except Exception as e:
            print(f"[CandidateDetail] Progress error: {e}")
            progress = {"history": [], "skill_performance": [], "mcq_accuracy": {"correct": 0, "incorrect": 0}, "coding_performance": []}

        # 5. Assigned Tests + Coding Submissions (safe)
        try:
            assignments = TestAssignment.objects.filter(candidate=candidate)
            coding_submissions = CodingSubmission.objects.filter(user=candidate).order_by('-submitted_at')
            serialized_assignments = TestAssignmentSerializer(assignments, many=True).data
            serialized_coding = CodingSubmissionSerializer(coding_submissions, many=True).data
        except Exception as e:
            print(f"[CandidateDetail] Assignments/coding error: {e}")
            serialized_assignments = []
            serialized_coding = []

        return Response({
            "profile": CandidateSummarySerializer(candidate).data,
            "stats": stats,
            "intelligence": intelligence,
            "assessments": serialized_results,
            "interviews": serialized_interviews,
            "progress": progress,
            "assigned_tests": serialized_assignments,
            "coding_submissions": serialized_coding
        })

class CandidateResumeDownloadView(views.APIView):
    """Serves the candidate resume file directly via the API to avoid CORS issues with /media/ URLs."""
    permission_classes = [IsRecruiter]

    def get(self, request, pk):
        try:
            candidate = User.objects.get(pk=pk, role='student')
        except User.DoesNotExist:
            raise Http404

        profile = getattr(candidate, 'profile', None)
        if not profile or not profile.resume:
            return Response({"error": "No resume on file for this candidate."}, status=status.HTTP_404_NOT_FOUND)

        # The resume field stores a relative path like 'resumes/filename.pdf'
        resume_file = profile.resume
        # Build absolute path
        file_path = os.path.join(settings.MEDIA_ROOT, str(resume_file))

        if not os.path.exists(file_path):
            return Response({"error": "Resume file not found on server."}, status=status.HTTP_404_NOT_FOUND)

        # Guess content type
        content_type, _ = mimetypes.guess_type(file_path)
        content_type = content_type or 'application/octet-stream'

        # Extract filename for Content-Disposition
        filename = os.path.basename(file_path)

        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class RecruiterCandidateATSView(views.APIView):
    """Generates an ATS score for a candidate's existing resume on-demand for the recruiter."""
    permission_classes = [IsRecruiter]

    def get(self, request, pk):
        try:
            candidate = User.objects.get(pk=pk, role='student')
        except User.DoesNotExist:
            return Response({"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND)

        profile = getattr(candidate, 'profile', None)
        if not profile or not profile.resume:
            return Response({"error": "Candidate has no resume uploaded for ATS analysis."}, status=status.HTTP_400_BAD_REQUEST)

        file_path = os.path.join(settings.MEDIA_ROOT, str(profile.resume))
        if not os.path.exists(file_path):
            return Response({"error": "Resume file not found on server."}, status=status.HTTP_404_NOT_FOUND)

        text = ""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        try:
            import PyPDF2
            import docx
            if file_ext == '.pdf':
                with open(file_path, 'rb') as f:
                    pdf_reader = PyPDF2.PdfReader(f)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n"
            elif file_ext in ['.doc', '.docx']:
                doc = docx.Document(file_path)
                for para in doc.paragraphs:
                    text += para.text + "\n"
            else:
                 return Response({"error": "Unsupported file format for ATS scanning."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Error reading resume for ATS: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if len(text.strip()) < 50:
            return Response({"error": "Could not extract enough text from the resume for ATS analysis."}, status=status.HTTP_400_BAD_REQUEST)

        # Call AI Service
        ats_report = services.analyze_resume_ats(text)

        if not ats_report:
            return Response({"error": "Failed to analyze resume with AI."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(ats_report)

class RecruiterAssessmentView(generics.ListCreateAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return Assessment.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        # Default proctoring rules and mock questions for new recruiter assessments
        default_rules = [
            {"icon": "🛡️", "text": "AI Camera & Face Verification"},
            {"icon": "💻", "text": "Real-time Screen Monitoring"},
            {"icon": "🚫", "text": "Tab Switching Prevention"}
        ]
        
        # Standard mock questions if none provided (to ensure test is playable)
        default_questions = [
            {
                "id": 101,
                "text": "What is the primary benefit of using React Virtual DOM?",
                "options": ["Faster direct DOM manipulation", "Efficient diffing and batch updates", "Automatic database synchronization", "Hardware acceleration"],
                "correct_index": 1,
                "skill": "React.js"
            },
            {
                "id": 102,
                "text": "In a distributed system, what does 'Idempotency' refer to?",
                "options": ["Infinite scalability", "Operations that can be repeated safely without changing the result", "Automatic failover capability", "Zero-latency data transfer"],
                "correct_index": 1,
                "skill": "System Design"
            }
        ]
        
        # Use rules from request if provided, otherwise use defaults
        rules = self.request.data.get('proctoring_rules', default_rules)
        assessment_type = self.request.data.get('assessment_type', 'mcq')
        interview_category = self.request.data.get('interview_category')
        
        # Determine questions: MCQs get defaults if empty, Interviews get empty list if empty
        req_questions = self.request.data.get('questions')
        if not req_questions:
            if assessment_type == 'mcq':
                questions_to_save = default_questions
            else:
                questions_to_save = [] # Interviews don't use the standard MCQ question field
        else:
            questions_to_save = req_questions

        serializer.save(
            created_by=self.request.user,
            proctoring_rules=rules,
            assessment_type=assessment_type,
            interview_category=interview_category if assessment_type == 'interview' else None,
            questions=questions_to_save
        )

class RecruiterAssessmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AssessmentSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return Assessment.objects.filter(created_by=self.request.user)

class ShortlistToggleView(views.APIView):
    permission_classes = [IsRecruiter]

    def post(self, request, pk):
        try:
            candidate = User.objects.get(pk=pk, role='student')
            shortlist, created = ShortlistedCandidate.objects.get_or_create(
                recruiter=request.user,
                candidate=candidate
            )
            
            if not created:
                shortlist.delete()
                return Response({"status": "removed"})
            
            # Calculate initial AI score for shortlist if needed
            stats = services.get_aggregated_user_stats(candidate)
            shortlist.ai_score = stats.get('avg_score', 0)
            shortlist.save()
            
            return Response(ShortlistedCandidateSerializer(shortlist).data, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND)

class ShortlistListView(generics.ListAPIView):
    serializer_class = ShortlistedCandidateSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return ShortlistedCandidate.objects.filter(recruiter=self.request.user)

class AutoShortlistView(views.APIView):
    permission_classes = [IsRecruiter]

    def post(self, request):
        job_requirements = request.data.get('requirements')
        if not job_requirements:
            return Response({"error": "Job requirements are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        results = services.auto_shortlist_candidates(job_requirements)
        
        # Save auto-shortlisted candidates to the database
        shortlist_data = results.get('shortlist', [])
        for item in shortlist_data:
            candidate_id = item.get('id')
            ai_score = item.get('score', 0)
            notes = item.get('reason', '')
            if candidate_id:
                try:
                    from .models import ShortlistedCandidate
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    candidate = User.objects.get(id=candidate_id, role='student')
                    obj, created = ShortlistedCandidate.objects.get_or_create(
                        recruiter=request.user,
                        candidate=candidate
                    )
                    obj.ai_score = ai_score
                    obj.notes = notes
                    obj.save()
                except User.DoesNotExist:
                    continue
                    
        return Response(results)

class CandidateComparisonView(views.APIView):
    permission_classes = [IsRecruiter]

    def post(self, request):
        candidate_ids = request.data.get('ids', [])
        if not candidate_ids:
            return Response({"error": "Candidate IDs are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        comparison_results = services.compare_candidates_intelligence(candidate_ids)
        return Response(comparison_results)

class TestAssignmentView(generics.ListCreateAPIView):
    serializer_class = TestAssignmentSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return TestAssignment.objects.filter(recruiter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)

class TailoredQuestionsView(views.APIView):
    permission_classes = [IsRecruiter]

    def post(self, request, pk):
        try:
            candidate = User.objects.get(pk=pk, role='student')
            job_role = request.data.get('job_role', 'Software Engineer')
            questions = services.generate_tailored_questions(candidate, job_role)
            return Response(questions)
        except User.DoesNotExist:
            return Response({"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND)
class AIAssessmentGenerateView(views.APIView):
    permission_classes = [IsRecruiter]

    def post(self, request):
        category = request.data.get('category')
        difficulty = request.data.get('difficulty')
        
        if not category or not difficulty:
            return Response({"error": "Category and difficulty are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        generated_data = services.generate_assessment_by_category(category, difficulty)
        
        if not generated_data:
            return Response({"error": "Failed to generate assessment with AI"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(generated_data)

class InvitationListCreateView(generics.ListCreateAPIView):
    serializer_class = TestInvitationSerializer
    permission_classes = [IsRecruiter]

    def get_queryset(self):
        return TestInvitation.objects.filter(recruiter=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        invitation = serializer.save(recruiter=self.request.user)
        # Send Email if requested 
        send_email = self.request.data.get('send_email', False)
        if send_email:
            frontend_url = self.request.headers.get('origin', 'http://localhost:5173')
            invite_link = f"{frontend_url}/invite?token={invitation.token}"
            
            subject = f"Test Invitation from {self.request.user.username}"
            message = (f"Hello {invitation.candidate_name or ''},\n\n"
                       f"You've been invited to complete a {invitation.get_test_type_display()}.\n")
            
            if invitation.custom_message:
                message += f"\nMessage from Recruiter:\n{invitation.custom_message}\n"
            
            message += f"\nPlease start the test using this secure link:\n{invite_link}\n"
            
            if invitation.deadline:
                message += f"\nStrict Deadline: {invitation.deadline.strftime('%Y-%m-%d %H:%M')}\n"
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.EMAIL_HOST_USER,
                    [invitation.candidate_email],
                    fail_silently=False,
                )
            except Exception as e:
                print(f"Failed to send email: {str(e)}")
