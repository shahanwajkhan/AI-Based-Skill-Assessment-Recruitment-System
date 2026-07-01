import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.services import get_common_client

def test_fallback_logic():
    print("Testing AI provider fallback...")
    
    # Save original environment to restore later
    orig_gemini = os.environ.get('GEMINI_API_KEY')
    orig_openai = os.environ.get('OPENAI_API_KEY')
    orig_groq = os.environ.get('GROQ_API_KEY')

    try:
        # Mocking environment keys to test fallback: Gemini and OpenAI missing, Groq present
        os.environ['GEMINI_API_KEY'] = ""
        os.environ['OPENAI_API_KEY'] = ""
        os.environ['GROQ_API_KEY'] = "gsk_mock_test_key"
        
        client, provider = get_common_client(preferred="gemini")
        print(f"Provider selected: {provider}")
        
        # In services.py, get_common_client(preferred="gemini") will:
        # 1. Try gemini (fails because key is empty)
        # 2. Try openai (not checked in the first block if preferred is "gemini")
        # 3. Try groq (not checked in the first block if preferred is "gemini")
        # 4. Fallback order checks gemini_key (empty), then openai_key (empty), then groq_key (present) -> returns groq
        
        assert provider == "groq"
        print("Test passed!")
    finally:
        # Restore original environment
        if orig_gemini: os.environ['GEMINI_API_KEY'] = orig_gemini
        if orig_openai: os.environ['OPENAI_API_KEY'] = orig_openai
        if orig_groq: os.environ['GROQ_API_KEY'] = orig_groq

if __name__ == "__main__":
    test_fallback_logic()
