import hashlib
import time
import random
import requests
import os
import json
from groq import Groq
from openai import OpenAI
import PyPDF2
import docx
from django.conf import settings
from django.utils import timezone
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

def get_common_client(preferred="gemini"):
    """
    Returns an AI client and provider name.
    If preferred is 'gemini' and it fails, it falls back to 'openai' -> 'groq'.
    """
    gemini_key = os.getenv('GEMINI_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')
    groq_key = os.getenv('GROQ_API_KEY')
    
    if preferred == "gemini" and gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            # Use 1.5-flash as it has higher stability/quota for free tier
            return genai.GenerativeModel('gemini-1.5-flash'), "gemini"
        except Exception as e:
            print(f"Gemini Client Init Error: {e}")

    if preferred == "openai" and openai_key:
        try:
            return OpenAI(api_key=openai_key), "openai"
        except Exception as e:
            print(f"OpenAI Client Init Error: {e}")
    
    if preferred == "groq" and groq_key:
        try:
            return Groq(api_key=groq_key), "groq"
        except Exception as e:
            print(f"Groq Client Init Error: {e}")

    # Dual check in case preferred wasn't chosen
    if not gemini_key and not openai_key and groq_key:
        return Groq(api_key=groq_key), "groq"
    
    # Final fallback order
    if gemini_key:
        genai.configure(api_key=gemini_key)
        return genai.GenerativeModel('gemini-1.5-flash'), "gemini"
    if openai_key:
        return OpenAI(api_key=openai_key), "openai"
    if groq_key:
        return Groq(api_key=groq_key), "groq"
    
    return None, None

def safe_chat_completion(prompt, system_prompt=None, response_format=None, temperature=0.7):
    """
    Attempts preferred provider (Gemini), then falls back to OpenAI -> Groq.
    """
    client, provider = get_common_client(preferred="gemini")
    
    if not client:
        return None, None

    # Try Gemini
    if provider == "gemini":
        try:
            generation_config = {
                "temperature": temperature,
                "response_mime_type": "application/json" if response_format and response_format.get("type") == "json_object" else "text/plain",
            }
            full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
            response = client.generate_content(full_prompt, generation_config=generation_config)
            
            # Additional cleaning for code blocks if present
            text = response.text
            if text and ("```json" in text or "```" in text):
                import re
                match = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
                if match:
                    text = match.group(1)
            
            return text, "gemini"
        except Exception as e:
            print(f"Gemini Completion Error (falling back to OpenAI/Groq): {e}")
            # Try falling back to next available provider
            client, provider = get_common_client(preferred="openai")
            if not client: return None, None
    
    # Try OpenAI
    if provider == "openai":
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=temperature,
                response_format=response_format
            )
            return completion.choices[0].message.content, "openai"
        except Exception as e:
            print(f"OpenAI Completion Error (falling back to Groq): {e}")
            client, provider = get_common_client(preferred="groq")
            if not client: return None, None
            # Fall through to Groq logic
    
    # Try Groq
    if provider == "groq":
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=temperature,
                response_format=response_format
            )
            return completion.choices[0].message.content, "groq"
        except Exception as e:
            print(f"Groq Completion Error: {e}")
            return None, None

    return None, None

def get_groq_api_key():
    """Retrieves the Groq API key from environment variables."""
    return os.getenv('GROQ_API_KEY')

def validate_cv_content(text):
    """Checks if the extracted text contains common CV keywords with stricter thresholds."""
    # Group keywords by category to ensure variety
    categories = {
        "work": ["experience", "employment", "professional experience", "work history", "career history", "projects"],
        "education": ["education", "university", "college", "degree", "academic", "certification"],
        "skills": ["skills", "technical skills", "languages", "technologies", "expertise", "competencies"],
        "profile": ["summary", "profile", "contact", "about me", "personal statement"]
    }
    
    text_lower = text.lower()
    matches = 0
    categories_matched = set()

    for cat, words in categories.items():
        for word in words:
            if word in text_lower:
                matches += 1
                categories_matched.add(cat)
    
    # Requirement: At least 3 different categories must be partially matched OR high total match count
    # This makes it very hard for a random PDF to pass.
    return len(categories_matched) >= 3 or matches >= 5

def extract_text_from_file(file_obj):
    """Extracts text from a given uploaded file based on its type."""
    text = ""
    filename = file_obj.name.lower()
    
    try:
        if filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(file_obj)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif filename.endswith('.docx'):
            doc = docx.Document(file_obj)
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            # Fallback for plain text
            text = file_obj.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error extracting text: {e}")
        
    return text

def generate_mcqs_from_cv(cv_text, api_key):
    """Calls Groq API to extract skills from the CV and generate specialized MCQs and coding problems. Returns JSON string."""
    client = Groq(api_key=api_key)
    
    prompt = f"""
    You are an expert technical interviewer system. I am going to provide you with the text extracted from a candidate's CV/Resume. 
    
    Your task:
    1. Identify the 3-5 most prominent technical skills mentioned in the resume.
    2. Generate an adaptive question pool testing those skills. You MUST generate exactly 10 Easy, 10 Medium, and 10 Hard questions (30 MCQs total) so the frontend system can select 20 adaptively based on user performance. IMPORTANT: At least 5 to 7 of these MCQs MUST test core programming logic, specifically code tracing for `for` loops, `while` loops, and basic arithmetic operations (e.g. "What is the output of this loop?").
    3. Generate 2 algorithmic coding problems related to the detected skills. IMPORTANT: The coding problems MUST strictly be in core languages (Python, C++, C, Java) or general Data Structures/Algorithms (DSA). DO NOT generate coding problems for web frameworks (like React, HTML, Node.js, Django, etc). Even if the CV is frontend-heavy, provide algorithm questions in Python/C++/Java/C.
    4. You must return ONLY valid JSON.
    
    The JSON structure must exactly match this format:
    {{
      "skills": ["Skill 1", "Skill 2", ...],
      "questions": [
        {{
          "id": 1,
          "text": "...",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0,
          "difficulty": "Medium",
          "skill": "Python"
        }}
      ],
      "coding_problems": [
        {{
          "id": 101,
          "problem_title": "Reverse String",
          "description": "Write a function that reverses a string.",
          "input_output_examples": "Input: 'hello'\\nOutput: 'olleh'\\nExplanation: The string is reversed.",
          "difficulty": "Easy",
          "skill": "Python",
          "test_cases": [
             {{"input": "hello", "expected_output": "olleh", "hidden": false}},
             {{"input": "world", "expected_output": "dlrow", "hidden": true}}
          ]
        }}
      ]
    }}
    
    Ensure the questions and coding problems are actually derived from the skills visible in the CV text.
    
    Here is the CV text:
    ---
    {cv_text[:3000]}
    ---
    
    RETURN ONLY THE JSON OBJECT. NO MARKDOWN.
    """

    system_prompt = "You are a specialized JSON API that generates technical assessments. Your output MUST be a single, valid JSON object and NOTHING else."
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        if not content:
            return None
            
        return content
    except Exception as e:
        print(f"==================== Groq API Error ====================")
        import traceback
        traceback.print_exc()
        print(f"Error Details: {str(e)}")
        print(f"========================================================")
        
        # Return fallback questions if API fails
        return '''{
            "skills": ["JavaScript", "Python"],
            "questions": [
                {
                    "id": 1,
                    "text": "Failed to connect to the AI model. What is the output of typeof null in JS?",
                    "options": ["'null'", "'undefined'", "'object'", "'string'"],
                    "correct_index": 2,
                    "difficulty": "Easy",
                    "skill": "JavaScript"
                }
            ],
            "coding_problems": [
                {
                    "id": 101,
                    "problem_title": "Fallback Problem",
                    "description": "Write a function that returns true.",
                    "input_output_examples": "Input: N/A\\nOutput: true",
                    "difficulty": "Easy",
                    "skill": "JavaScript",
                    "test_cases": []
                }
            ],
            "proctoring_rules": [
                {"icon": "🚫", "text": "No Tab Switching: Do not minimize or change tabs."},
                {"icon": "📺", "text": "Full Screen: You must remain in full-screen mode at all times."},
                {"icon": "🔇", "text": "Environment: Maintain absolute silence; noise triggers AI warnings."},
                {"icon": "👤", "text": "Face Visibility: Keep your face visible; removing it results in automated termination."}
            ],
            "structure_instructions": {
                "Section 1": "Multiple Choice Questions (MCQs) - 20 adaptive questions based on your detected skills.",
                "Section 2": "Coding Problems - Built-in IDE to solve skill-specific algorithmic challenges."
            }
        }'''

# High-quality fallback problems for specific languages
FALLBACK_PROBLEMS = [
    # --- PYTHON (10 Questions) ---
    {
        "name": "Python 1: List Comprehension Mastery",
        "rating": 1200, "points": 100, "tags": ["python", "array"], "contestId": 101, "index": "PY1",
        "description": "Problem Statement: Given a list of integers, use Python's list comprehension to return a new list containing only the squares of the even numbers.\nOutput Example: [4, 16, 36]",
        "url": "https://leetcode.com/problems/squares-of-a-sorted-array/"
    },
    {
        "name": "Python 2: Dictionary Frequency",
        "rating": 1300, "points": 100, "tags": ["python", "hash table"], "contestId": 101, "index": "PY2",
        "description": "Problem Statement: Write a Python function using a dictionary to count occurrences in a list and return the most frequent element.\nOutput Example: 'apple'",
        "url": "https://leetcode.com/problems/top-k-frequent-words/"
    },
    {
        "name": "Python 3: Generator Yielding Primes",
        "rating": 1400, "points": 150, "tags": ["python", "math"], "contestId": 101, "index": "PY3",
        "description": "Problem Statement: Write a Python generator function `get_primes(n)` that yields prime numbers up to `n`.\nOutput Example: [2, 3, 5, 7]",
        "url": "https://leetcode.com/problems/count-primes/"
    },
    {
        "name": "Python 4: Lambda and Map",
        "rating": 1200, "points": 100, "tags": ["python", "functional"], "contestId": 101, "index": "PY4",
        "description": "Problem Statement: Use `map` and a `lambda` to convert a list of strings representing integers into actual integers, then filter out non-even values.\nOutput Example: [2, 4, 6]",
        "url": "https://leetcode.com/problems/filter-elements-from-array/"
    },
    {
        "name": "Python 5: Decorator Execution Timer",
        "rating": 1500, "points": 150, "tags": ["python", "decorators"], "contestId": 101, "index": "PY5",
        "description": "Problem Statement: Write a Python decorator `@time_it` that calculates and prints the execution block time of the function it decorates in milliseconds.\nOutput Example: 'Function executed in 1.45ms'",
        "url": "https://leetcode.com/problems/execution-time/"
    },
    {
        "name": "Python 6: File Parsing (CSV to Dict)",
        "rating": 1300, "points": 100, "tags": ["python", "file io"], "contestId": 101, "index": "PY6",
        "description": "Problem Statement: Write a Python script to parse a string representation of a CSV with headers into a list of dictionaries.\nOutput Example: [{'name': 'Alice', 'age': '24'}]",
        "url": "https://leetcode.com/problems/parse-csv/"
    },
    {
        "name": "Python 7: Class Inheritance and Super",
        "rating": 1300, "points": 100, "tags": ["python", "oop"], "contestId": 101, "index": "PY7",
        "description": "Problem Statement: Create a base class `Employee` and a subclass `Manager` that overrides the `get_salary()` method using `super()` to add a bonus.\nOutput Example: 110000",
        "url": "https://leetcode.com/problems/design-an-employee-system/"
    },
    {
        "name": "Python 8: Handling Exceptions",
        "rating": 1200, "points": 100, "tags": ["python", "exceptions"], "contestId": 101, "index": "PY8",
        "description": "Problem Statement: Write a robust division function that catches `ZeroDivisionError` and `TypeError` gracefully, returning a specific dictionary `{error: true, val: None}`.\nOutput Example: {'error': True, 'val': None}",
        "url": "https://leetcode.com/problems/divide-two-integers/"
    },
    {
        "name": "Python 9: Deep vs Shallow Copy",
        "rating": 1400, "points": 150, "tags": ["python", "memory"], "contestId": 101, "index": "PY9",
        "description": "Problem Statement: Given a nested list `matrix`, write an algorithm to clone it entirely using the `copy` module without affecting original nested references.\nOutput Example: [[1, 2], [3, 4]]",
        "url": "https://leetcode.com/problems/clone-graph/"
    },
    {
        "name": "Python 10: Valid Palindrome (Regex)",
        "rating": 1300, "points": 150, "tags": ["python", "regex"], "contestId": 101, "index": "PY10",
        "description": "Problem Statement: Use the `re` module to strip all punctuation and spaces from a string, then check if it reads the same forward and backwards.\nOutput Example: True",
        "url": "https://leetcode.com/problems/valid-palindrome/"
    },

    # --- C++ (10 Questions) ---
    {
        "name": "C++ 1: STL Vector Manipulation",
        "rating": 1200, "points": 100, "tags": ["cpp", "array"], "contestId": 201, "index": "CPP1",
        "description": "Problem Statement: Given an std::vector of integers, sort it and remove consecutive duplicates using std::unique and the vector's erase/remove idiom.\nOutput Example: [1, 2, 4, 5]",
        "url": "https://leetcode.com/problems/remove-duplicates-from-sorted-array/"
    },
    {
        "name": "C++ 2: Pointer Arithmetic",
        "rating": 1300, "points": 100, "tags": ["cpp", "pointers"], "contestId": 201, "index": "CPP2",
        "description": "Problem Statement: Write a C++ function `void swap_pointers(int*& a, int*& b)` that swaps the memory addresses they point to.\nOutput Example: ptrA -> 20, ptrB -> 10",
        "url": "https://leetcode.com/problems/swap-nodes-in-pairs/"
    },
    {
        "name": "C++ 3: Object-Oriented Bank",
        "rating": 1400, "points": 150, "tags": ["cpp", "oop"], "contestId": 201, "index": "CPP3",
        "description": "Problem Statement: Implement a C++ class `BankAccount` with encapsulated balance, and methods `deposit` and `withdraw`.\nOutput Example: 70",
        "url": "https://leetcode.com/problems/design-a-bank-account/"
    },
    {
        "name": "C++ 4: STL Map and Sets",
        "rating": 1400, "points": 150, "tags": ["cpp", "hash table"], "contestId": 201, "index": "CPP4",
        "description": "Problem Statement: Given an array of strings, use `std::unordered_map` or `std::set` to find the first non-repeating character in the string sequence.\nOutput Example: 'b'",
        "url": "https://leetcode.com/problems/first-unique-character-in-a-string/"
    },
    {
        "name": "C++ 5: Memory Leak & Destructors",
        "rating": 1500, "points": 150, "tags": ["cpp", "memory"], "contestId": 201, "index": "CPP5",
        "description": "Problem Statement: Create a C++ Resource class that dynamically allocates an integer array. Implement the Rule of Three (Destructor, Copy Constructor, Copy Assignment Operator) to prevent leaks.\nOutput Example: Object destroyed properly",
        "url": "https://leetcode.com/problems/lru-cache/"
    },
    {
        "name": "C++ 6: Multi-threading Mutex",
        "rating": 1500, "points": 150, "tags": ["cpp", "threading"], "contestId": 201, "index": "CPP6",
        "description": "Problem Statement: Use `std::thread` and `std::mutex` to increment a shared global variable `counter` simultaneously from 3 threads safely.\nOutput Example: counter = 300 (consistent every time)",
        "url": "https://leetcode.com/problems/print-in-order/"
    },
    {
        "name": "C++ 7: Smart Pointers (std::unique_ptr)",
        "rating": 1400, "points": 100, "tags": ["cpp", "pointers"], "contestId": 201, "index": "CPP7",
        "description": "Problem Statement: Rewrite a raw pointer based Singly Linked List insertion method to exclusively use `std::unique_ptr<Node>` for automatic memory cleanup.\nOutput Example: List linked with no raw new/delete",
        "url": "https://leetcode.com/problems/reverse-linked-list/"
    },
    {
        "name": "C++ 8: Binary Search Templates",
        "rating": 1300, "points": 100, "tags": ["cpp", "templates", "binary search"], "contestId": 201, "index": "CPP8",
        "description": "Problem Statement: Write a C++ generic template function `template <typename T> int binarySearch(std::vector<T> arr, T target)`.\nOutput Example: Returns index 2",
        "url": "https://leetcode.com/problems/binary-search/"
    },
    {
        "name": "C++ 9: Bit Manipulation",
        "rating": 1200, "points": 100, "tags": ["cpp", "bitmask"], "contestId": 201, "index": "CPP9",
        "description": "Problem Statement: Use bitwise XOR operators to find the single number in an array where every other element appears exactly twice.\nOutput Example: 4",
        "url": "https://leetcode.com/problems/single-number/"
    },
    {
        "name": "C++ 10: Graph BFS",
        "rating": 1500, "points": 150, "tags": ["cpp", "graph"], "contestId": 201, "index": "CPP10",
        "description": "Problem Statement: Given an adjacency list, output the Shortest Path from node 0 to node N using `std::queue` for Breadth First Search.\nOutput Example: [0, 2, 5, N]",
        "url": "https://leetcode.com/problems/shortest-path-in-binary-matrix/"
    },

    # --- JAVA (10 Questions) ---
    {
        "name": "Java 1: ArrayList and Streams",
        "rating": 1200, "points": 100, "tags": ["java", "streams"], "contestId": 301, "index": "JV1",
        "description": "Problem Statement: Use Java Streams API to filter an ArrayList of words (length > 3), convert to uppercase, and collect to a List.\nOutput Example: ['APPLE', 'BIRD']",
        "url": "https://leetcode.com/problems/filter-restaurants-by-vegan-friendly-price-and-distance/"
    },
    {
        "name": "Java 2: Exception Handling",
        "rating": 1300, "points": 100, "tags": ["java", "exceptions"], "contestId": 301, "index": "JV2",
        "description": "Problem Statement: Write `safeDivide(int a, int b)`. If `b == 0`, catch `ArithmeticException` and return -1.\nOutput Example: -1",
        "url": "https://leetcode.com/problems/divide-two-integers/"
    },
    {
        "name": "Java 3: Interfaces and Polymorphism",
        "rating": 1400, "points": 150, "tags": ["java", "oop"], "contestId": 301, "index": "JV3",
        "description": "Problem Statement: Create an interface Shape and implement Circle and Rectangle. Sum their areas cleanly via polymorphism.\nOutput Example: Total Area = 12.5",
        "url": "https://leetcode.com/problems/design-a-number-container-system/"
    },
    {
        "name": "Java 4: Multi-threading (Runnable)",
        "rating": 1400, "points": 150, "tags": ["java", "threading"], "contestId": 301, "index": "JV4",
        "description": "Problem Statement: Implement the `Runnable` interface to create a thread that prints \"Ping\" every 100ms and another that prints \"Pong\".\nOutput Example: Ping, Pong, Ping, Pong",
        "url": "https://leetcode.com/problems/print-foobar-alternately/"
    },
    {
        "name": "Java 5: HashMap Anagrams",
        "rating": 1300, "points": 100, "tags": ["java", "hash table"], "contestId": 301, "index": "JV5",
        "description": "Problem Statement: Given an array of strings, group anagrams together using a `HashMap<String, List<String>>` in Java.\nOutput Example: [[eat, tea, ate], [tan, nat], [bat]]",
        "url": "https://leetcode.com/problems/group-anagrams/"
    },
    {
        "name": "Java 6: String Immutability (StringBuilder)",
        "rating": 1200, "points": 100, "tags": ["java", "strings"], "contestId": 301, "index": "JV6",
        "description": "Problem Statement: Reverse a given string in-place without generating garbage objects. Use Java `StringBuilder`.\nOutput Example: 'olleh'",
        "url": "https://leetcode.com/problems/reverse-string/"
    },
    {
        "name": "Java 7: Custom Object Sorting (Comparator)",
        "rating": 1400, "points": 150, "tags": ["java", "sorting", "oop"], "contestId": 301, "index": "JV7",
        "description": "Problem Statement: Given a List of `Student` objects, use `Collections.sort` and a custom `Comparator` to sort them by grade descending, then alphabetically.\nOutput Example: List is sorted appropriately",
        "url": "https://leetcode.com/problems/sort-characters-by-frequency/"
    },
    {
        "name": "Java 8: Recursive Backtracking (Subsets)",
        "rating": 1500, "points": 150, "tags": ["java", "recursion"], "contestId": 301, "index": "JV8",
        "description": "Problem Statement: Use a recursive backtrack method in Java to return all possible subsets of an integer array `nums`.\nOutput Example: [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]]",
        "url": "https://leetcode.com/problems/subsets/"
    },
    {
        "name": "Java 9: Binary Tree Traversal",
        "rating": 1300, "points": 100, "tags": ["java", "trees"], "contestId": 301, "index": "JV9",
        "description": "Problem Statement: Given the root of a binary tree in Java (`TreeNode`), return the inorder traversal of its nodes' values using a Stack rather than recursion.\nOutput Example: [1, 3, 2]",
        "url": "https://leetcode.com/problems/binary-tree-inorder-traversal/"
    },
    {
        "name": "Java 10: Optional Handling",
        "rating": 1200, "points": 100, "tags": ["java", "patterns"], "contestId": 301, "index": "JV10",
        "description": "Problem Statement: Refactor a function returning `null` to instead wrap its result in Java `Optional<User>` and safely call `.orElse()`.\nOutput Example: Default User retrieved instead of NullPointerException",
        "url": "https://leetcode.com/problems/design-a-number-container-system/"
    },

    # --- DSA (10 Questions) ---
    {
        "name": "DSA 1: Two Pointer Array Reverse",
        "rating": 1200, "points": 100, "tags": ["dsa", "two pointers", "array"], "contestId": 401, "index": "DSA1",
        "description": "Problem Statement: Write an in-place algorithm to reverse an array of characters using the two-pointer approach.\nOutput Example: ['o','l','l','e','h']",
        "url": "https://leetcode.com/problems/reverse-string/"
    },
    {
        "name": "DSA 2: Valid Parentheses (Stack)",
        "rating": 1300, "points": 100, "tags": ["dsa", "stack"], "contestId": 401, "index": "DSA2",
        "description": "Problem Statement: Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid using a Stack.\nOutput Example: True",
        "url": "https://leetcode.com/problems/valid-parentheses/"
    },
    {
        "name": "DSA 3: Merge Two Sorted Lists",
        "rating": 1300, "points": 100, "tags": ["dsa", "linked list"], "contestId": 401, "index": "DSA3",
        "description": "Problem Statement: Merge two sorted linked lists and return it as a sorted list. The list should be made by splicing together the nodes of the first two lists.\nOutput Example: [1,1,2,3,4,4]",
        "url": "https://leetcode.com/problems/merge-two-sorted-lists/"
    },
]

def fetch_codeforces_problems():
    """Fetches the latest problem set from Codeforces API with robust fallbacks."""
    api_key = os.getenv('CODEFORCES_API_KEY')
    api_secret = os.getenv('CODEFORCES_API_SECRET')
    
    url = "https://codeforces.com/api/problemset.problems"
    
    try:
        response = requests.get(url, timeout=5)
        data = response.json()
        if data.get('status') == 'OK':
            return data
    except Exception as e:
        print(f"Codeforces Fetch Error: {e}")
        return None

def generate_ai_interview_questions(cv_text, api_key, context=""):
    """
    Generate the first set of interview questions based on CV text and optional recruiter context.
    """
    # If a specific Groq key is passed, prefer Groq
    if api_key and api_key.startswith('gsk_'):
        client, provider = Groq(api_key=api_key), "groq"
    else:
        client, provider = get_common_client()
        
    if not client:
        return None

    # Determine focus based on context
    focus_instruction = ""
    if "HR" in context.upper():
        focus_instruction = "FOCUS: This is an HR interview. Prioritize soft skills, behavior, situational questions, and cultural fit."
    elif "TECHNICAL" in context.upper():
        focus_instruction = "FOCUS: This is a TECHNICAL interview. Prioritize programming, architecture, and core computer science concepts."

    # Add variety to the prompt
    prompt = f"""
    You are an expert professional interviewer.
    I will provide you with a Candidate's CV text OR an Interview Context.
    
    FOCUS INSTRUCTION: {focus_instruction}
    RECRUITER CONTEXT: {context}

    YOUR GOAL: Generate THE FIRST interview question for the candidate.
    DIRECTIONS:
    1. If a CV is provided, extract relevant skills.
    2. If NO CV is provided (using generic placeholder), base the first question entirely on the RECRUITER CONTEXT and FOCUS.
    3. The first question MUST be a Foundational/Introductory concept in the chosen focus.
    4. VARIETY: Do NOT start with generic introductions. Be professional and engaging.
    5. The difficulty for this first question MUST be "Easy".
    
    Respond STRICTLY with valid JSON:
    {{
        "skills": ["skill1", "skill2"],
        "first_question": "Your first question here?",
        "topic": "The area you chose (e.g. Behavioral / Conflict / React / Systems)",
        "difficulty": "Easy"
    }}
    Select difficulty as either "Easy", "Medium", or "Hard" based on the complexity of the question.

    INPUT TEXT (CV or Placeholder):
    {cv_text[:4000]}
    """

    try:
        content, provider = safe_chat_completion(
            prompt=prompt, 
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        if not content:
            return None
            
        content = content.strip()
        # The cleaning is already partially handled in safe_chat_completion, 
        # but let's keep it robust here too.
        if '```' in content:
            # Try to extract content between ```json and ``` or just ``` and ```
            import re
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)
        
        return json.loads(content.strip())
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        return None

def evaluate_and_generate_next_question(history, api_key):
    """
    Evaluate the latest answer and generate a follow-up or next question.
    """
    # Format history for the prompt
    history_text = "Interview History:\n"
    for item in history:
        history_text += f"Q: {item.get('question', '')}\nA: {item.get('answer', '')}\n\n"

    prompt = f"""
    You are an expert technical interviewer conducting a multi-round technical interview.
    Review the conversation history and CV context so far.
    
    YOUR TASKS & FLOW:
    1. **Analyze the Last Answer**: Critically evaluate the correctness and depth of the last response.
    2. **Handle Empty Answers**: If the last answer is "[No response detected]" or is extremely short/empty, DO NOT REPEAT THE PREVIOUS QUESTION. Assume the candidate is stuck. PIVOT to a new sub-topic or a different skill entirely.
    3. **Follow-up / Drill-down**: If the previous answer was substantive, YOUR NEXT QUESTION MUST be a specific follow-up probing a detail they mentioned.
    4. **Topic Rotation**: If you have already asked two questions on the same topic (Basic + Follow-up), YOU MUST STOP that topic and switch to a NEW skill from the CV.
    5. **Diversity Constraint**: NEVER ask a question that is semantically identical or a slight variation of a previous question in the history.
    5. **Difficulty Progression**: Naturally scale difficulty: Easy (Basic) -> Medium (Drill-down) -> Hard (Edge cases).
    
    Respond STRICTLY with valid JSON. Format:
    {{
        "evaluation_of_last_answer": "Brief, critical thought on the latest answer",
        "next_question": "The NEW question to ask next?",
        "topic": "Specific area (e.g. Teamwork / Practical Implementation / Foundations)",
        "difficulty": "Medium"
    }}
    Select difficulty as either "Easy", "Medium", or "Hard" based on the complexity of the exact question asked.

    {history_text}
    """
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt, 
            temperature=0.9,
            response_format={"type": "json_object"}
        )
        if not content:
            return None
            
        print(f"Generating next question for session... using {provider}")
        content = content.strip()
        if '```' in content:
            import re
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)

        return json.loads(content.strip())
    except Exception as e:
        print(f"Error parsing AI next question: {e}")
        return None


def extract_profile_from_cv(cv_text):
    prompt = f"""
    You are an expert HR AI assistant. I am going to provide you with the text extracted from a candidate's CV/Resume. 
    
    Your task is to extract the following information:
    1. Full Name (first and last name)
    2. Email address
    3. Phone number
    4. Top technical and professional skills (as an array of strings, max 10. e.g. ["Python", "React", "SQL"])
    5. Educational background (degrees, schools, and years. DO NOT include technical skills here. Summarize into standard entries)
    6. Professional experience (summarize key roles and achievements into a structured text)
    7. Notable projects (summarize key projects into a structured text)
    
    You must return ONLY valid JSON.
    
    The JSON structure must exactly match this format:
    {{
      "first_name": "...",
      "last_name": "...",
      "email": "...",
      "phone_number": "...",
      "skills": ["...", "..."],
      "education": "...",
      "experience": "...",
      "projects": "..."
    }}

    If any information is not found in the CV, leave the string empty or the array empty.
    
    Here is the CV text:
    ---
    {cv_text[:3500]}
    ---
    
    RETURN ONLY THE JSON OBJECT. NO MARKDOWN.
    """

    system_prompt = "You are a specialized JSON API that extracts structured data from CVs. Your output MUST be a valid JSON object and NOTHING else."
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        if not content:
            return None
            
        return json.loads(content.strip())
    except Exception as e:
        print(f"Error extracting profile: {e}")
        return None


def analyze_resume_ats(resume_text):
    prompt = f"""
    You are an elite ATS (Applicant Tracking System) optimization specialist and senior technical recruiter.
    Analyze the following resume text with extreme precision and provide a CRITICAL compatibility report.
    
    SCORING CRITERIA (Total 100%):
    1. Keyword Optimization (30%): Are essential industry keywords and skills present?
    2. Formatting & Structure (15%): Is the resume parsable by ATS? Are sections clear?
    3. Readability & Impact (30%): Does the candidate use strong action verbs and measurable metrics (e.g., increased revenue by 20%, reduced latency by 50ms)?
    4. Section Completeness (15%): Are all critical sections (Summary, Experience, Education, Skills) present?
    5. Role Alignment (10%): How well does the content align with targeted professional roles?

    CRITICAL INSTRUCTIONS:
    - Be REALISTIC and TOUGH. A generic resume should NOT score above 60.
    - Penalize heavily for missing measurable achievements (numbers, percentages, scales).
    - Provide a detailed score breakdown.
    - Suggest 3-4 specific job roles that match this resume.
    - ACTIONABLE FEEDBACK: For every issue identified, provide a clear "How to fix" instruction. 
    - KEYWORDS: Identify the candidate's core industry first. Suggest highly specific technical skills or industry-standard tools that are actually missing. Do NOT use generic terms like "Agile Development" or "Cloud Computing" as "safe bets" unless they are critically missing for a relevant role. 
    - FORMATTING: Explain WHY a format is problematic (e.g., "Tables are often unreadable by older ATS; use standard text blocks instead").

    You must return ONLY valid JSON.
    
    The JSON structure must exactly match this format:
    {{
      "score": 62,
      "total_issues": 6,
      "score_breakdown": {{
        "keywords": 20,
        "formatting": 12,
        "impact": 15,
        "completeness": 10,
        "alignment": 5
      }},
      "detailed_analysis": {{
        "content": {{
          "score": 50,
          "checks": [
            {{ "label": "ATS Parse Rate", "status": "pass", "issue_text": "No issues" }},
            {{ "label": "Quantifying Impact", "status": "pass", "issue_text": "No issues" }},
            {{ "label": "Repetition", "status": "fail", "issue_text": "1 issue" }},
            {{ "label": "Spelling & Grammar", "status": "fail", "issue_text": "4 issues" }}
          ]
        }},
        "sections": {{
          "score": 86,
          "checks": [
            {{ "label": "Contact Information", "status": "pass", "issue_text": "No issues" }},
            {{ "label": "Skills Section", "status": "pass", "issue_text": "No issues" }},
            {{ "label": "Work Experience", "status": "pass", "issue_text": "No issues" }},
            {{ "label": "Education", "status": "pass", "issue_text": "No issues" }}
          ]
        }},
        "ats_essentials": {{
          "score": 83,
          "checks": [
            {{ "label": "File Format", "status": "pass", "issue_text": "No issues" }},
            {{ "label": "Standard Fonts", "status": "pass", "issue_text": "No issues" }},
            {{ "label": "No Graphics/Icons", "status": "fail", "issue_text": "1 issue" }}
          ]
        }},
        "tailoring": {{
          "score": 15,
          "checks": [
            {{ "label": "Job Title Match", "status": "fail", "issue_text": "1 issue" }},
            {{ "label": "Skill Alignment", "status": "pass", "issue_text": "No issues" }}
          ]
        }}
      }},
      "matched_roles": [
        {{
          "role": "Frontend Developer",
          "fit_score": 92,
          "reasoning": "Strong React skills and 3 years of experience in UI optimization."
        }}
      ],
      "keyword_optimization": {{
        "missing_keywords": ["Keyword1", "Keyword2"],
        "suggestions": "Add more terms related to..."
      }},
      "repetition_issues": ["Identified repetitions or overused buzzwords."],
      "formatting_issues": ["Specific issues like inconsistent dates, multi-column layouts, etc."],
      "section_analysis": {{
        "missing_sections": ["Professional Summary", "Projects"],
        "weak_sections": [
          {{ "section": "Experience", "issue": "Lacks measurable metrics like percentages." }}
        ]
      }},
      "overall_suggestions": ["Concrete, actionable steps to improve the score."]
    }}

    Here is the resume text:
    ---
    {resume_text[:4000]}
    ---
    
    RETURN ONLY THE JSON OBJECT. NO MARKDOWN.
    """

    system_prompt = "You are a specialized AI that performs ATS resume analysis. Your output MUST be a valid JSON object and NOTHING else."
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        if not content:
            return None
            
        return json.loads(content.strip())
    except Exception as e:
        print(f"Error analyzing ATS: {e}")
        return None


def analyze_voice_confidence(transcript, duration_seconds):
    """
    Analyzes speaking confidence based on transcript and duration.
    Calculates WPM, identifies filler words, and uses AI for qualitative feedback.
    """
    if not transcript or duration_seconds <= 0:
        return None

    # 1. Base Metrics
    words = transcript.split()
    word_count = len(words)
    wpm = round((word_count / duration_seconds) * 60) if duration_seconds > 0 else 0
    
    # Standard WPM for confident speaking is 120-150.
    # We'll score fluency based on this.
    fluency_score = 100
    if wpm < 80: fluency_score = 60
    elif wpm < 100: fluency_score = 80
    elif wpm > 180: fluency_score = 70 # Too fast can sound nervous
    
    # 2. Hesitation Detection (Filler words)
    fillers = ['uh', 'um', 'umm', 'like', 'uhh', 'ah', 'err', 'well', 'so']
    filler_count = 0
    detected_fillers = []
    
    pattern = r'\b(' + '|'.join(fillers) + r')\b'
    import re
    matches = re.findall(pattern, transcript.lower())
    filler_count = len(matches)
    
    # Calculate filler words per minute
    fpm = (filler_count / duration_seconds) * 60
    hesitation_score = max(0, 100 - (fpm * 10)) # Penalty for fillers

    # 3. AI Qualitative Analysis
    prompt = f"""
    You are an expert public speaking coach. Analyze the following transcript of a user's speech.
    
    Duration: {duration_seconds} seconds
    Transcript: "{transcript}"
    WPM: {wpm}
    Filler words detected: {len(matches)}
    
    Evaluate:
    1. Clarity and Flow
    2. Sentence Structure
    3. Speaking Style (Confident, Nervous, Professional, etc.)
    
    Return ONLY a JSON object with this structure:
    {{
      "overall_confidence_score": 75,
      "communication_style": "Professional",
      "fluency_rating": "Good",
      "clarity_rating": "High",
      "strengths": ["Clear pronunciation", "Good pace"],
      "improvements": ["Reduce use of 'like'", "Add more pause for effect"],
      "ai_feedback": "Your overall flow is good, but you tend to use fillers when thinking about the next point."
    }}
    """

    system_prompt = "You are a speaking coach AI. Return ONLY valid JSON."
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        if not content:
            return None
            
        report = json.loads(content.strip())
        
        # Merge calculated metrics
        report['metrics'] = {
            'wpm': int(wpm),
            'filler_count': filler_count,
            'hesitation_score': int(hesitation_score),
            'fluency_score': int(fluency_score)
        }
        
        # Override overall if metrics are very low
        if hesitation_score < 40:
            report['overall_confidence_score'] = min(report['overall_confidence_score'], 50)
            
        return report
    except Exception as e:
        print(f"Error analyzing voice confidence: {e}")
        return None


def get_ai_mentor_context(user):
    """
    Collects personalized context for the AI Mentor.
    Includes skill gaps, recent test scores, and interview performance.
    """
    from .models import Result, SkillGapAnalysis
    
    context = {
        "user_name": user.first_name or user.username,
        "current_skills": [],
        "skill_gaps": [],
        "recent_scores": [],
        "roadmap": []
    }
    
    # 1. Profile Skills
    if hasattr(user, 'profile'):
        context["current_skills"] = user.profile.skills
        
    # 2. Latest Skill Gap Analysis
    latest_gap = SkillGapAnalysis.objects.filter(user=user).first()
    if latest_gap:
        context["skill_gaps"] = latest_gap.identified_gaps
        context["roadmap"] = latest_gap.roadmap
        context["skill_level"] = latest_gap.skill_level
        
    # 3. Recent Results
    recent_results = Result.objects.filter(user=user).order_by('-completed_at')[:3]
    for res in recent_results:
        # defensive check for assessment and completed_at
        if not res.assessment:
            continue
            
        score_data = {
            "assessment": getattr(res.assessment, 'title', 'Unknown Assessment'),
            "score": res.score,
            "date": res.completed_at.strftime('%Y-%m-%d') if res.completed_at else 'Unknown Date'
        }
        context["recent_scores"].append(score_data)
        
    return context

def get_ai_mentor_response(user, message):
    """
    Generates a personalized response from the AI Mentor.
    """
    try:
        context = get_ai_mentor_context(user)
        
        # Ensure lists are strings for joining
        current_skills = [str(s) for s in context.get('current_skills', []) if s]
        skill_gaps = [str(s) for s in context.get('skill_gaps', []) if s]
        
        prompt = f"""
        You are the "SkillGuard AI Mentor", a friendly and highly knowledgeable career coach.
        User Name: {context.get('user_name', 'Student')}
        
        User Context:
        - Current Skills: {', '.join(current_skills) if current_skills else 'Not specified yet'}
        - Identified Gaps: {', '.join(skill_gaps) if skill_gaps else 'No major gaps identified'}
        - Latest Scores: {context.get('recent_scores', [])}
        - Learning Roadmap: {context.get('roadmap', 'Not generated yet')}
        
        User Question: "{message}"
        
        Your goal:
        1. Be encouraging and proactive.
        2. Use the context to give specific advice.
        3. Suggest next steps or resources.
        4. Keep responses concise and structured for a chat window.
        
        Return a response that feels human and expert.
        """
        
        system_prompt = "You are a personalized career and skill mentor AI."
        
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7
        )
        
        if not content:
            return "I'm having a bit of trouble thinking right now. Could you try again in a moment? Or ask me something else!"
            
        return content
    except Exception as e:
        import traceback
        print(f"CRITICAL Error in AI Mentor service: {e}")
        traceback.print_exc()
        return "I'm sorry, I encountered an error while processing your request. How else can I help you today?"



def generate_interview_report(history, api_key):
    """
    Generate the final report with scores.
    """
    history_text = "Interview History:\n"
    for item in history:
        history_text += f"Q: {item.get('question', '')}\nA: {item.get('answer', '')}\n\n"

    prompt = f"""
    You are an expert technical interviewer evaluating a candidate's comprehensive performance across a 5-question technical interview.
    
    EVALUATION CRITERIA (Strictly Performance-Based):
    1. Technical Knowledge: Depth of understanding. If they gave shallow answers, score low (< 4).
    2. Answer Quality: Correctness and clarity.
    3. Communication Skills: Clarity of speech (transcript quality) and professional tone.
    4. Confidence: Lack of hesitation and directness.
    5. Problem Solving: How they handled logic or edge cases.

    YOUR TASK: Analyze the interview history and provide a realistic, critical score for each category (0-10) and an overall score (0-100). 
    Identify 2-3 specific technical or soft skill weaknesses based on their answers. For each weakness, provide one concrete, actionable recommendation on where or how to practice.
    
    Respond ONLY with a valid JSON object.
    
    JSON SCHEMA:
    {{
        "overall_score": 0-100, 
        "communication_score": 0-10,
        "technical_score": 0-10,
        "confidence_score": 0-10,
        "answer_quality_score": 0-10,
        "problem_solving_score": 0-10,
        "feedback_summary": "Critique their performance here.",
        "strengths": ["Clear explanation of X", "Good use of Y"],
        "improvements": ["Weakness: [Topic]. Suggestion: [Specific practice task]", "Weakness: [Topic]. Suggestion: [Specific resource/study item]"]
    }}

    INTERVIEW HISTORY:
    {history_text}
    """

    try:
        content, provider = safe_chat_completion(
            prompt=prompt, 
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        if not content:
            return None
            
        content = content.strip()
        # Clean potential markdown
        if '```' in content:
            import re
            match = re.search(r'```(?:json)?\s*(.*?)\s*```', content, re.DOTALL)
            if match:
                content = match.group(1)
        
        report = json.loads(content.strip())
        
        # Ensure all required keys exist with fallback to 0
        required_keys = ['overall_score', 'communication_score', 'technical_score', 'confidence_score', 'answer_quality_score', 'problem_solving_score']
        for key in required_keys:
            if key not in report: 
                report[key] = 0
            else:
                try:
                    report[key] = int(report[key])
                except (ValueError, TypeError):
                    report[key] = 0 # Fallback if conversion fails
        if 'feedback_summary' not in report: report['feedback_summary'] = "Good performance overall."
        if 'strengths' not in report: report['strengths'] = []
        if 'improvements' not in report: report['improvements'] = []
        
        return report

    except Exception as e:
        print(f"generate_interview_report error: {e}")
        return None

def generate_skill_gap_analysis(user, source_type, source_id):
    """
    Generates a personalized skill gap analysis and learning roadmap.
    source_type: 'skill_test' or 'ai_interview'
    source_id: ID of Result (for test) or AIInterviewSession (for interview)
    """
    from .models import Result, AIInterviewSession, SkillGapAnalysis
    
    data_for_ai = {}
    source_obj = None
    
    if source_type == 'skill_test':
        try:
            source_obj = Result.objects.get(id=source_id)
            data_for_ai = {
                "type": "Skill Test",
                "title": source_obj.assessment.title if source_obj.assessment else "General Assessment",
                "score": source_obj.score,
                "skill_breakdown": source_obj.skill_breakdown,
                "correct": source_obj.correct_answers,
                "incorrect": source_obj.incorrect_answers,
                "time_taken": source_obj.time_taken,
                "ai_suggestions": source_obj.ai_suggestions,
                "date": source_obj.completed_at.strftime('%Y-%m-%d %H:%M') if source_obj.completed_at else timezone.now().strftime('%Y-%m-%d %H:%M')
            }
        except Result.DoesNotExist:
            return None
    elif source_type == 'ai_interview':
        try:
            source_obj = AIInterviewSession.objects.get(id=source_id)
            data_for_ai = {
                "type": "AI Interview",
                "score": source_obj.overall_score,
                "technical": source_obj.technical_score,
                "communication": source_obj.communication_score,
                "confidence": source_obj.confidence_score,
                "feedback": source_obj.feedback_summary,
                "strengths": source_obj.strengths,
                "improvements": source_obj.improvements,
                "qa_history": source_obj.qa_history[:5],
                "detected_skills": source_obj.detected_skills,
                "date": source_obj.completed_at.strftime('%Y-%m-%d %H:%M') if source_obj.completed_at else source_obj.created_at.strftime('%Y-%m-%d %H:%M'),
                "title": source_obj.assessment.title if source_obj.assessment else f"AI Interview ({source_obj.file_name or 'Resume Based'})"
            }
        except AIInterviewSession.DoesNotExist:
            return None

    prompt = f"""
    You are a career coach and technical mentor. 
    Analyze this user's performance data from a {data_for_ai['type']} and generate a comprehensive skill gap report.
    
    IMPORTANT: For each identified skill gap, you must provide:
    - The skill name.
    - When/How it was detected (e.g., "Detected on {data_for_ai.get('date', 'recent assessment')}").
    - A specific "Correction Plan" (what exactly should they do to fix this).

    Performance Data:
    {json.dumps(data_for_ai, indent=2)}

    Respond ONLY with a valid JSON object in this format:
    {{
        "overall_score": 0-100,
        "skill_level": "Beginner/Intermediate/Advanced",
        "skill_breakdown": {{ "SkillName": 0-100, ... }},
        "identified_gaps": [
            {{
                "skill": "Skill Name",
                "detected_on": "Date or Event description (e.g. Test on 2024-03-15)",
                "correction_plan": "Actionable advice to fix this gap"
            }},
            ...
        ],
        "roadmap": [
            {{ 
                "week": 1, 
                "title": "Topic Area", 
                "topics": [
                    {{ "name": "Specific Subtopic to learn (be precise, e.g. 'React useEffect Hook', 'SQL JOIN types')" }},
                    ...
                ]
            }},
            ...
        ],
        "recommendations": [
            {{ "title": "Resource Name", "type": "Course/Article", "url": "..." }},
            ...
        ],
        "summary": "Full professional text summary..."
    }}
    
    IMPORTANT for roadmap topics: Make each topic name very specific and searchable, like "React useState Hook tutorial", "Python list comprehension", "SQL INNER JOIN explained". DO NOT include youtube_url in the JSON - just the name.
    """

    system_prompt = "You are an AI Career Advisor. Return ONLY JSON."
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        if not content:
            print("Skill Gap Generation: No content received from AI.")
            return None
            
        print(f"Skill Gap Generation: Received AI response for user {user.username}")
        report_data = json.loads(content.strip())
        
        # Post-process: Build accurate YouTube search URLs from topic names
        import urllib.parse
        roadmap = report_data.get('roadmap', [])
        if not isinstance(roadmap, list): roadmap = []
        
        identified_gaps = report_data.get('identified_gaps', [])
        if not isinstance(identified_gaps, list): identified_gaps = []

        for week in roadmap:
            if not isinstance(week, dict): continue
            for topic in week.get('topics', []):
                if not isinstance(topic, dict): continue
                topic_name = topic.get('name', '')
                # Build a precise YouTube search query using the topic + context
                search_query = f"{topic_name} tutorial for beginners"
                encoded_query = urllib.parse.quote(search_query)
                topic['youtube_url'] = f"https://www.youtube.com/results?search_query={encoded_query}"
        
        # Create the analysis record
        analysis = SkillGapAnalysis.objects.create(
            user=user,
            source_type=source_type,
            assessment_result=source_obj if source_type == 'skill_test' else None,
            interview_session=source_obj if source_type == 'ai_interview' else None,
            overall_score=report_data.get('overall_score', data_for_ai['score']),
            skill_level=report_data.get('skill_level', 'Intermediate'),
            skill_breakdown=report_data.get('skill_breakdown', {}),
            identified_gaps=identified_gaps,
            roadmap=roadmap,
            recommendations=report_data.get('recommendations', []),
            summary=report_data.get('summary', '')
        )
        
        return analysis
    except Exception as e:
        print(f"Skill Gap Generation Error: {e}")
        return None

def get_aggregated_user_stats(user):
    """
    Summarizes user performance across Tests and Interviews.
    """
    from .models import Result, AIInterviewSession, CVAnalysis
    
    results = Result.objects.filter(user=user)
    interviews = AIInterviewSession.objects.filter(user=user, status='completed')
    cv_analysis = CVAnalysis.objects.filter(user=user).order_by('-created_at').first()
    
    all_scores = [r.score for r in results] + [i.overall_score for i in interviews]
    avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
    
    # Skills aggregation
    skills_map = {} # { "Python": [80, 90], "React": [70] }
    
    # From Tests
    for r in results:
        if isinstance(r.skill_breakdown, list):
            for item in r.skill_breakdown:
                s = item.get('skill')
                v = item.get('score', 0)
                if s:
                    if s not in skills_map: skills_map[s] = []
                    skills_map[s].append(v)
    
    # From Interviews
    for i in interviews:
        # Interviews might not have a precise breakdown yet, use overall scores for detected skills
        for s in i.detected_skills:
            if s not in skills_map: skills_map[s] = []
            skills_map[s].append(i.technical_score * 10) # Normalize 0-10 to 0-100
            
    # From CV (baseline)
    if cv_analysis:
        for s in cv_analysis.skills:
            if s not in skills_map: skills_map[s] = [50] # Initial guess
            
    # Calculate final averages
    final_skills = {s: sum(vals)/len(vals) for s, vals in skills_map.items()}
    sorted_skills = sorted(final_skills.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "avg_score": round(avg_score, 1),
        "total_tests": results.count(),
        "total_interviews": interviews.count(),
        "top_skill": sorted_skills[0][0] if sorted_skills else "None",
        "weakest_skill": sorted_skills[-1][0] if sorted_skills else "None",
        "skill_matrix": final_skills,
        "cv_skills": cv_analysis.skills if cv_analysis else []
    }

def generate_dashboard_insights(user):
    """
    Generates dynamic AI cards for the dashboard using high-quality career modeling.
    """
    stats = get_aggregated_user_stats(user)
    
    # If truly NO data, return onboarding insights
    if not stats['skill_matrix'] and not stats['cv_skills']:
        return [
            { "icon": "🚀", "title": "Get Started", "desc": "Take your first skill test or AI interview to see strategic insights.", "color": "#6366f1" },
            { "icon": "📄", "title": "Upload Resume", "desc": "Upload your resume to unlock specialized career matching.", "color": "#f59e0b" },
            { "icon": "🏆", "title": "Competitive Edge", "desc": "Compare your skills against industry benchmarks on the leaderboard.", "color": "#10b981" }
        ]

    prompt = f"""
    You are an AI Career Strategist and Mentor. 
    Analyze this user's technical performance and generate 3 HIGHLY SPECIFIC dashboard insights.
    
    USER STATS:
    - Average Score: {stats['avg_score']}%
    - Top Performance: {stats['top_skill']}
    - Identified Growth Area: {stats['weakest_skill']}
    - Skill Matrix (Raw): {json.dumps(stats['skill_matrix'])}
    - Activity Count: {stats['total_tests'] + stats['total_interviews']}
    
    TASK: Return exactly 3 diagnostic insight objects. 
    1. "Skill Gap Detected": Be specific about WHY {stats['weakest_skill']} is important for their profile.
    2. "Recommended Challenge": Suggest a precise DSA or System Design topic.
    3. "Career Prediction": A role match percentage and reasoning.
    
    REQUIRED JSON FORMAT (Array only):
    [
      {{ "icon": "📈", "title": "Skill Gap Detected", "desc": "Analysis text (max 80 chars)", "color": "#6366f1" }},
      {{ "icon": "💡", "title": "Recommended Challenge", "desc": "Advice (max 80 chars)", "color": "#f59e0b" }},
      {{ "icon": "🎯", "title": "Career Prediction", "desc": "Prediction (max 80 chars)", "color": "#10b981" }}
    ]
    Use ONLY Blue (#6366f1), Amber (#f59e0b), and Emerald (#10b981). Be critical but encouraging.
    """
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt="You are a dashboard insights engine. RETURN ONLY VALID JSON ARRAYS.",
            response_format={"type": "json_object"},
            temperature=0.8
        )
        
        if not content:
            raise ValueError("Empty AI response")

        # Robust Parsing
        data = json.loads(content.strip())
        
        # Handle cases where AI wraps list in an object key like "insights" or "data"
        if isinstance(data, dict):
            # Find the first key that contains a list
            for key in ["insights", "data", "cards", "results"]:
                if key in data and isinstance(data[key], list):
                    return data[key][:3]
            # If no list key found, check if values themselves are lists
            for val in data.values():
                if isinstance(val, list):
                    return val[:3]
        
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"Error generating AI insights: {e}")
        # High quality personalized fallback using the same data
        return [
            { 
              "icon": "📈", 
              "title": "Skill Gap Detected", 
              "desc": f"Your {stats['weakest_skill']} score has room for growth. Focusing here will boost your average.", 
              "color": "#6366f1" 
            },
            { 
              "icon": "💡", 
              "title": "Recommended Challenge", 
              "desc": f"Master {stats['top_skill']} edge-cases or try a new {stats['weakest_skill']} assessment.", 
              "color": "#f59e0b" 
            },
            { 
              "icon": "🎯", 
              "title": "Career Readiness", 
              "desc": f"Strong alignment with roles requiring expertise in {stats['top_skill']}.", 
              "color": "#10b981" 
            }
        ]


def generate_hiring_intelligence(user_obj):
    """
    Synthesizes all candidate data into a recruiter-focused intelligence report.
    """
    stats = get_aggregated_user_stats(user_obj)
    
    # Collect recent performance history
    from .models import Result, AIInterviewSession
    recent_results = Result.objects.filter(user=user_obj).order_by('-completed_at')[:5]
    recent_interviews = AIInterviewSession.objects.filter(user=user_obj, status='completed').order_by('-completed_at')[:3]
    
    history_summary = []
    for r in recent_results:
        history_summary.append(f"Test: {r.assessment.title if r.assessment else 'Skill Test'}, Score: {r.score}%")
    for i in recent_interviews:
        # Check if i.overall_score exists, fallback to technical if not (though model says overall_score exists)
        history_summary.append(f"AI Interview, Score: {getattr(i, 'overall_score', 0)}%")

    prompt = f"""
    You are a Senior Technical Recruiter and Talent Analyst. 
    Analyze this candidate's performance data and generate a high-level hiring intelligence report.
    
    Candidate: {user_obj.get_full_name() or user_obj.username}
    Overall Average Score: {stats['avg_score']}%
    Top Skill: {stats['top_skill']}
    Weakest Skill: {stats['weakest_skill']}
    
    Performance History:
    {chr(10).join(history_summary)}
    
    Skill Matrix: {json.dumps(stats['skill_matrix'])}
    
    TASK: Generate a critical analysis for a recruiter.
    1. Hiring Recommendation: One of [Strong Hire, Consider, Reject].
    2. Recommendation Reason: 1 sentence explaining the choice.
    3. AI Insights: 3 bullet points on strengths, weaknesses, and potential.
    4. Hiring Decision Scorecard (Mirroring a learning roadmap but for hiring fit): 
       Provide scores (0-100) and analysis for: Culture Fit, Technical Mastery, Potential for Growth, Immediate Contribution Value.
    5. Confidence Score: 0-100 based on consistency of results.
    
    RETURN ONLY VALID JSON.
    {{
        "recommendation": "Strong Hire",
        "reason": "...",
        "insights": ["...", "...", "..."],
        "scorecard": [
           {{ "area": "Culture Fit", "score": 85, "analysis": "..." }},
           {{ "area": "Technical Mastery", "score": 70, "analysis": "..." }},
           {{ "area": "Potential for Growth", "score": 90, "analysis": "..." }},
           {{ "area": "Immediate Contribution Value", "score": 60, "analysis": "..." }}
        ],
        "confidence": 85,
        "summary": "Full professional paragraph..."
    }}
    """
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt="You are a Recruitment Intelligence Engine. Return ONLY JSON.",
            response_format={"type": "json_object"},
            temperature=0.4
        )
        if not content: return None
        return json.loads(content.strip())
    except Exception as e:
        print(f"Error generating hiring intelligence: {e}")
        # Fallback logic
        recommendation = "Consider"
        if stats['avg_score'] >= 85: recommendation = "Strong Hire"
        elif stats['avg_score'] < 50: recommendation = "Reject"
        
        return {
            "recommendation": recommendation,
            "reason": f"Automated recommendation based on average score of {stats['avg_score']}%",
            "insights": [
                f"Expertise identified in {stats['top_skill']}.",
                f"Needs improvement in {stats['weakest_skill']}.",
                "Consistent performance across multiple assessments."
            ],
            "confidence": 75,
            "summary": "Candidate shows promising technical foundations with specific areas for specialized growth."
        }


def auto_shortlist_candidates(job_requirements):
    """
    Uses AI to rank all candidates against a set of job requirements.
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    candidates = User.objects.filter(role='student', is_active=True)
    candidate_data = []

    for c in candidates:
        stats = get_aggregated_user_stats(c)
        candidate_data.append({
            "id": c.id,
            "username": c.username,
            "name": f"{c.first_name} {c.last_name}",
            "avg_score": stats.get('avg_score', 0)
        })

    prompt = f"""
    Analyze the following candidates for the requirements: "{job_requirements}"
    Candidates: {json.dumps(candidate_data)}
    
    Rank the top candidates (up to 5) and provide:
    1. Match Score (0-100)
    2. Brief reason for the match
    3. Hiring intelligence snippets
    
    Return as JSON:
    {{
      "shortlist": [
        {{ "id": candidate_id, "score": score, "reason": "reason", "insights": ["insight1", "insight2"] }}
      ],
      "analysis": "Overall pipeline assessment"
    }}
    """
    
    try:
        content, _ = safe_chat_completion(prompt=prompt, response_format={"type": "json_object"})
        if not content: return {"shortlist": [], "analysis": "AI returned no content"}
        
        # Clean potential markdown
        import re
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(content.strip())
    except Exception as e:
        print(f"Error in auto shortlisting: {e}")
        return {"shortlist": [], "analysis": f"AI Error: {str(e)}"}

def compare_candidates_intelligence(candidate_ids):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    candidates = User.objects.filter(id__in=candidate_ids, role='student')
    compare_data = []

    for c in candidates:
        stats = get_aggregated_user_stats(c)
        compare_data.append({
            "id": c.id,
            "name": f"{c.first_name} {c.last_name}",
            "stats": stats
        })

    prompt = f"""
    Provide a side-by-side comparison of these candidates:
    {json.dumps(compare_data)}
    
    Highlight:
    1. Who is the strongest in Technical Skills vs Problem Solving.
    2. Who has the best growth potential.
    3. A clear 'Best Fit' recommendation.
    
    Return as JSON:
    {{
      "analysis": "Detailed competitive analysis text",
      "matrix": {{
        "Technical": ["candidate1_comment", "candidate2_comment"],
        "Soft Skills": ["...", "..."],
        "Experience": ["...", "..."]
      }}
    }}
    """
    
    try:
        content, _ = safe_chat_completion(prompt=prompt, response_format={"type": "json_object"})
        if not content: return {"candidates": [], "analysis": "AI returned no content", "comparison_matrix": {}}
        
        # Clean potential markdown
        import re
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            ai_data = json.loads(match.group(0))
        else:
            ai_data = json.loads(content.strip())
            
        return {
            "candidates": compare_data,
            "analysis": ai_data.get('analysis', ''),
            "comparison_matrix": ai_data.get('matrix', {})
        }
    except Exception as e:
        print(f"Comparison AI Error: {e}")
        return {"candidates": compare_data, "analysis": "AI Comparison failed.", "comparison_matrix": {}}

def generate_tailored_questions(candidate, job_role="Software Engineer"):
    stats = get_aggregated_user_stats(candidate)
    weaknesses = stats.get('weakest_skill', 'general concepts')
    
    prompt = f"""
    Generate 5 tailored interview questions for a candidate applying for: {job_role}.
    Candidate's Profile Insights:
    - Average Score: {stats.get('avg_score')}%
    - Top Skill: {stats.get('top_skill')}
    - Weakness: {weaknesses}
    
    The questions should focus on bridging the gap between their top skill and the job role, and specifically probing their area of weakness.
    
    Return as JSON:
    [
      {{ "question": "...", "intent": "What this evaluates", "suggested_answer_points": ["...", "..."] }}
    ]
    """
    
    try:
        content, _ = safe_chat_completion(prompt=prompt)
        if not content: return []
        
        # Clean potential markdown
        import re
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(content.strip())
    except:
        return []

def get_candidate_progress_data(candidate):
    from .models import Result, AIInterviewSession
    results = Result.objects.filter(user=candidate).order_by('completed_at')
    interviews = AIInterviewSession.objects.filter(user=candidate, status='completed').order_by('completed_at')
    
    data = []
    for res in results:
        data.append({
            "date": res.completed_at.strftime('%Y-%m-%d'),
            "score": res.score,
            "type": "Skill Test",
            "title": res.assessment.title
        })
    for inv in interviews:
        data.append({
            "date": inv.completed_at.strftime('%Y-%m-%d'),
            "score": inv.overall_score,
            "type": "AI Interview",
            "title": "Interview Session"
        })
    
    # Sort by date
    data.sort(key=lambda x: x['date'])
    
    # Mirror Student Analytics Structures
    skill_breakdown = []
    if results.exists():
        # Get latest skill breakdown
        latest = results.latest('completed_at')
        skill_breakdown = latest.skill_breakdown # list of {skill, score}
        
    mcq_accuracy = {
        "correct": sum(r.correct_answers for r in results),
        "incorrect": sum(r.incorrect_answers for r in results)
    }
    
    coding_trend = []
    coding_subs = CodingSubmission.objects.filter(user=candidate).order_by('submitted_at')
    for sub in coding_subs:
        coding_trend.append({
            "label": sub.problem_id,
            "value": sub.performance_metrics.get('test_cases_passed_percentage', 0) if sub.performance_metrics else 0
        })

    return {
        "history": data,
        "skill_performance": skill_breakdown,
        "mcq_accuracy": mcq_accuracy,
        "coding_performance": coding_trend
    }

def generate_assessment_by_category(category, difficulty):
    """
    Calls Groq API to generate 30 Multiple Choice Questions (MCQs) 
    based on a specific skill category and difficulty level.
    """
    # Specialized instructions for different categories
    cat_lower = category.lower()
    specialized_instruction = ""
    
    if "aptitude" in cat_lower:
        specialized_instruction = """
    SPECIALIZED INSTRUCTIONS FOR APTITUDE:
    1. STRICTLY NUMERICAL: Every question MUST be a calculation-based word problem. NO THEORIES.
    2. MANDATORY TOPICS: Profit/Loss, Ratio & Proportion, Time/Speed/Distance, SI/CI, Average, Time & Work, Pipes & Cisterns, Number System, DI, Probability.
    3. STYLE: Provide word problems requiring formulas and multi-step math.
    """
    elif "technical" in cat_lower:
         specialized_instruction = """
    SPECIALIZED INSTRUCTIONS FOR TECHNICAL:
    1. TOPICS: Data Structures, Algorithms (Complexity), OS fundamentals, DBMS (SQL/Indexing), OOP principles.
    2. STYLE: Focus on code snippet analysis, logic tracing, and system design trade-offs. NO "What is X?" questions.
    """
    elif "soft skills" in cat_lower:
        specialized_instruction = """
    SPECIALIZED INSTRUCTIONS FOR SOFT SKILLS:
    1. TOPICS: Conflict Resolution, Professional Communication, Adaptability, Emotional Intelligence.
    2. STYLE: 100% SITUATIONAL/SCENARIO-BASED. Every question must start with a workplace scenario.
       Example: "A team member is consistently late with deliverables, slowing down your progress. How do you handle this?"
    """
    elif "leadership" in cat_lower:
        specialized_instruction = """
    SPECIALIZED INSTRUCTIONS FOR LEADERSHIP:
    1. TOPICS: Delegation, Strategic Planning, Mentoring, Performance Management, Crisis Handling.
    2. STYLE: High-level decision-making scenarios. Focus on long-term impact and team growth.
    """
    elif "data science" in cat_lower:
        specialized_instruction = """
    SPECIALIZED INSTRUCTIONS FOR DATA SCIENCE:
    1. TOPICS: Statistics (Hypothesis testing), Machine Learning (Bias/Variance, Overfitting), Data Preprocessing, Evaluation Metrics (F1, AUC-ROC).
    2. STYLE: Practical data analysis problems. Focus on which algorithm or metric to use in specific business cases.
    """
    elif "devops" in cat_lower:
        specialized_instruction = """
    SPECIALIZED INSTRUCTIONS FOR DEVOPS:
    1. TOPICS: Docker/Kubernetes container orchestration, CI/CD pipeline automation, IaC (Terraform), Cloud Architecture (Auto-scaling, Load balancing), Monitoring.
    2. STYLE: Troubleshooting and infrastructure design problems.
    """

    prompt = f"""
    You are an elite technical assessment specialist. 
    Generate exactly 30 Multiple Choice Questions (MCQs) for the category: "{category}" at a "{difficulty}" difficulty level.
    
    {specialized_instruction}
    
    CRITICAL INSTRUCTIONS:
    1. CATEGORY: All questions must be strictly related to {category}.
    2. DIFFICULTY: The difficulty must be {difficulty}. 
       - Beginner: Fundamental concepts and core logic.
       - Intermediate: Practical application, multi-step logic, and scenarios.
       - Advanced: Complex edge cases, architecture, and high-level strategy.
    3. QUESTION VARIETY: Ensure a broad range of sub-topics within the category. Do NOT repeat similar questions.
    4. MCQ STRUCTURE: Each question must have exactly 4 options.
    5. JSON FORMAT: You MUST return a valid JSON object.
    
    The JSON structure must be:
    {{
      "questions": [
        {{
          "id": 1,
          "text": "The question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_index": 0,
          "difficulty": "{difficulty}",
          "skill": "{category}"
        }},
        ... (exactly 30 objects)
      ]
    }}
    
    IMPORTANT: Return ONLY the JSON object. No pre-amble, no markdown, no explanation.
    """

    system_prompt = "You are a specialized JSON API that generates high-quality technical assessment questions."
    
    try:
        content, provider = safe_chat_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            response_format={"type": "json_object"},
            temperature=0.4
        )
        
        if not content:
            return None
            
        # Robust cleaning of AI output
        import re
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(content.strip())
        
    except Exception as e:
        print(f"Error in AI question generation: {e}")
        return None

