from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, UserProfile, Assessment, AssessmentSession, 
    ProctoringViolation, CVAnalysis, CodingSubmission, Result
)

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Platform Info', {'fields': ('role',)}),
    )
    list_display = ('username', 'email', 'role', 'is_staff')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'location', 'education', 'experience', 'created_at')

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'difficulty', 'estimated_time', 'enrolled_count')
    list_filter = ('category', 'difficulty')
    search_fields = ('title', 'description')

@admin.register(AssessmentSession)
class AssessmentSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'assessment', 'status', 'score', 'started_at', 'completed_at')
    list_filter = ('status', 'is_custom')
    search_fields = ('user__username', 'assessment__title')

@admin.register(ProctoringViolation)
class ProctoringViolationAdmin(admin.ModelAdmin):
    list_display = ('session', 'type', 'strike_number', 'timestamp')
    list_filter = ('type',)
    search_fields = ('session__user__username',)

@admin.register(CVAnalysis)
class CVAnalysisAdmin(admin.ModelAdmin):
    list_display = ('user', 'file_name', 'created_at')
    search_fields = ('user__username', 'file_name')

@admin.register(CodingSubmission)
class CodingSubmissionAdmin(admin.ModelAdmin):
    list_display = ('user', 'problem_id', 'language', 'status', 'submitted_at')
    list_filter = ('status', 'language')
    search_fields = ('user__username', 'problem_id')

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('user', 'assessment', 'score', 'completed_at')
    list_filter = ('assessment',)
    search_fields = ('user__username', 'assessment__title')

admin.site.register(User, CustomUserAdmin)
