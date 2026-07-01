import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api import services
from django.contrib.auth import get_user_model
from api.models import UserProfile, Result, Assessment

User = get_user_model()

def test_robustness():
    # 1. Test for a NEW user (no profile, no results)
    break_user, created = User.objects.get_or_create(username="new_user_testing", email="new_test@example.com")
    
    print(f"Testing for 'new' user: {break_user.username}")
    try:
        response = services.get_ai_mentor_response(break_user, "How can you help me?")
        print(f"Response for new user: {response[:100]}...")
        print("SUCCESS: New user handled correctly.")
    except Exception as e:
        print(f"FAILED: New user caused crash: {e}")
        import traceback
        traceback.print_exc()

    # 2. Test with a user that has empty skills/gaps
    empty_data_user, created = User.objects.get_or_create(username="empty_data_user", email="empty@example.com")
    profile, _ = UserProfile.objects.get_or_create(user=empty_data_user)
    profile.skills = [] # Empty list
    profile.save()
    
    print(f"\nTesting for user with EMPTY skills: {empty_data_user.username}")
    try:
        response = services.get_ai_mentor_response(empty_data_user, "What are my skills?")
        print(f"Response for empty-skill user: {response[:100]}...")
        print("SUCCESS: Empty-skill user handled correctly.")
    except Exception as e:
        print(f"FAILED: Empty-skill user caused crash: {e}")
        import traceback
        traceback.print_exc()

    print("\nRobustness tests completed.")

if __name__ == "__main__":
    test_robustness()
