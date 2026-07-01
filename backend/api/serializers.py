from rest_framework import serializers
from .models import User, UserProfile, Assessment, Result, AssessmentSession, ProctoringViolation, CVAnalysis, CodingSubmission, AIInterviewSession, SkillGapAnalysis, ShortlistedCandidate, TestAssignment, TestInvitation

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'location', 'bio', 'phone_number', 'education', 'experience', 'projects', 'skills', 'resume', 'company_name', 'job_title', 'company_website', 'industry', 'company_size']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'student'),
        )
        
        # Create empty profile right after registration
        UserProfile.objects.create(user=user)
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = UserProfile
        fields = ['avatar', 'location', 'bio', 'phone_number', 'education', 'experience', 'projects', 'skills', 'resume', 'first_name', 'last_name', 'company_name', 'job_title', 'company_website', 'industry', 'company_size']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        
        # Handle skills if they come as a JSON string (common in multipart/form-data)
        skills = validated_data.get('skills')
        if isinstance(skills, str):
            try:
                import json
                validated_data['skills'] = json.loads(skills)
            except (ValueError, TypeError):
                pass

        # Update UserProfile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update User fields if provided
        if user_data:
            user = instance.user
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
            user.save()

        return instance

class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__'

class ProctoringViolationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProctoringViolation
        fields = ['type', 'strike_number', 'timestamp', 'comment']

class AssessmentSessionSerializer(serializers.ModelSerializer):
    violations = ProctoringViolationSerializer(many=True, read_only=True)
    violation_count = serializers.IntegerField(source='violations.count', read_only=True)
    
    class Meta:
        model = AssessmentSession
        fields = ['id', 'assessment', 'status', 'score', 'started_at', 'completed_at', 'is_custom', 'custom_data', 'violations', 'violation_count']

class CVAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVAnalysis
        fields = ['id', 'file_name', 'extracted_text', 'skills', 'generated_questions', 'created_at']

class ResultSerializer(serializers.ModelSerializer):
    assessment = AssessmentSerializer(read_only=True)
    roadmap = serializers.SerializerMethodField()
    
    class Meta:
        model = Result
        fields = ['id', 'assessment', 'score', 'correct_answers', 'incorrect_answers', 'total_questions', 'time_taken', 'ai_suggestions', 'skill_breakdown', 'proctoring_summary', 'completed_at', 'roadmap']

    def get_roadmap(self, obj):
        analysis = SkillGapAnalysis.objects.filter(assessment_result=obj).first()
        return analysis.roadmap if analysis else None

class CodingSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CodingSubmission
        fields = ['id', 'problem_id', 'language', 'code', 'performance_metrics', 'status', 'submitted_at']
        read_only_fields = ['id', 'submitted_at']

class AIInterviewSessionSerializer(serializers.ModelSerializer):
    roadmap = serializers.SerializerMethodField()

    class Meta:
        model = AIInterviewSession
        fields = '__all__'

    def get_roadmap(self, obj):
        analysis = SkillGapAnalysis.objects.filter(interview_session=obj).first()
        return analysis.roadmap if analysis else None

class SkillGapAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SkillGapAnalysis
        fields = '__all__'


class CandidateSummarySerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    avg_score = serializers.SerializerMethodField()
    test_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile', 'avg_score', 'test_count']

    def get_avg_score(self, obj):
        from .services import get_aggregated_user_stats
        try:
            return get_aggregated_user_stats(obj).get('avg_score', 0)
        except Exception:
            return 0

    def get_test_count(self, obj):
        return Result.objects.filter(user=obj).count()

class ShortlistedCandidateSerializer(serializers.ModelSerializer):
    candidate_profile = CandidateSummarySerializer(source='candidate', read_only=True)
    class Meta:
        model = ShortlistedCandidate
        fields = ['id', 'candidate', 'candidate_profile', 'notes', 'ai_score', 'created_at']
        read_only_fields = ['id', 'created_at', 'recruiter']

class TestAssignmentSerializer(serializers.ModelSerializer):
    assessment_detail = AssessmentSerializer(source='assessment', read_only=True)
    candidate_detail = CandidateSummarySerializer(source='candidate', read_only=True)
    
    class Meta:
        model = TestAssignment
        fields = ['id', 'recruiter', 'candidate', 'candidate_detail', 'assessment', 'assessment_detail', 'deadline', 'status', 'created_at']
        read_only_fields = ['id', 'recruiter', 'created_at']

class TestInvitationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestInvitation
        fields = '__all__'
        read_only_fields = ['id', 'token', 'recruiter', 'created_at']
