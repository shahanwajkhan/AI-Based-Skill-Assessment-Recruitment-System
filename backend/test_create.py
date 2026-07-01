import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token # or simplejwt
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_api():
    # Find a recruiter user
    user = User.objects.filter(role='recruiter').first()
    if not user:
        print("No recruiter user found")
        return

    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)

    client = Client()
    
    payload = {
        "title": "Test Assessment",
        "category": "Technical",
        "difficulty": "Intermediate",
        "estimated_time": 30
    }
    
    response = client.post(
        '/api/recruiter/assessments/', 
        data=json.dumps(payload),
        content_type='application/json',
        HTTP_AUTHORIZATION=f'Bearer {token}'
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.content.decode()}")

if __name__ == '__main__':
    test_api()
