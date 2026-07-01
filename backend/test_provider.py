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
    # Try the user 'admin' or first user
    user = User.objects.first()
        
    print(f"Testing for user: {user.username}")
    
    # Manually call context
    context = services.get_ai_mentor_context(user)
    print("Context retrieved.")
    
    # Manually call response
    print("Getting AI response...")
    # Wrap safe_chat_completion to see what provider is used
    from api.services import safe_chat_completion
    
    prompt = "Test prompt"
    content, provider = safe_chat_completion(prompt)
    print(f"Default provider: {provider}")
    
    response = services.get_ai_mentor_response(user, "Hello")
    print(f"AI Response received. Length: {len(response) if response else 0}")
    print(f"AI Response preview: {response[:100]}...")

except Exception as e:
    import traceback
    traceback.print_exc()
