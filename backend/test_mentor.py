import os
import django
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api import services
from django.contrib.auth import get_user_model

User = get_user_model()
try:
    # Try multiple users in case one doesn't exist
    user = None
    for email in ['shah@gmail.com', 'test@example.com', 'admin']:
        try:
            if '@' in email:
                user = User.objects.get(email=email)
            else:
                user = User.objects.get(username=email)
            break
        except User.DoesNotExist:
            continue
            
    if not user:
        print("No test user found.")
        sys.exit(1)
        
    print(f"Testing for user: {user.username}")
    
    # Manually call context to see if it fails
    print("Getting context...")
    context = services.get_ai_mentor_context(user)
    print("Context retrieved successfully.")
    print(f"Context: {context}")
    
    # Manually call response
    print("Getting AI response...")
    response = services.get_ai_mentor_response(user, "Hello")
    print(f"AI Response: {response}")

except Exception as e:
    import traceback
    print("An error occurred:")
    traceback.print_exc()
