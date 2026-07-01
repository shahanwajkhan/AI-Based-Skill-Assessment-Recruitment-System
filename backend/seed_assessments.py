import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Assessment

def seed():
    # Clear existing assessments to avoid duplicates during development
    Assessment.objects.all().delete()
    
    tasks = [
        {
            "title": "React Performance Tuning",
            "category": "Web Development",
            "difficulty": "Advanced",
            "description": "Master memoization, lazy loading, and rendering optimizations in complex React applications.",
            "estimated_time": 45,
            "enrolled_count": 1420,
            "questions": [
                {
                    "id": 1,
                    "text": "Which hook is specifically designed to memoize the results of a synchronous expensive calculation?",
                    "options": ["useEffect", "useCallback", "useMemo", "useRef"],
                    "correct_index": 2
                },
                {
                    "id": 2,
                    "text": "When using React.lazy(), which component must wrap the lazy-loaded component to provide a fallback UI?",
                    "options": ["ErrorBoundary", "Suspense", "Fragment", "Provider"],
                    "correct_index": 1
                },
                {
                    "id": 3,
                    "text": "What does 'Prop Drilling' refer to in React development?",
                    "options": [
                        "Optimizing props for performance",
                        "Passing data through multiple levels of components that don't need it",
                        "Using the Context API to share state",
                        "Validating props using PropTypes"
                    ],
                    "correct_index": 1
                }
            ]
        },
        {
            "title": "Modern JavaScript (ES6+)",
            "category": "Programming",
            "difficulty": "Intermediate",
            "description": "Test your knowledge on let/const, arrow functions, destructuring, promises, and modules.",
            "estimated_time": 30,
            "enrolled_count": 8900,
            "questions": [
                {
                    "id": 1,
                    "text": "Which of the following describes the behavior of 'const' in JavaScript?",
                    "options": [
                        "It creates a variable that can be reassigned freely.",
                        "It creates a block-scoped variable that cannot be reassigned.",
                        "It creates a globally-scoped variable.",
                        "It is exactly the same as 'var'."
                    ],
                    "correct_index": 1
                },
                {
                    "id": 2,
                    "text": "What is the purpose of the 'Spread Operator' (...) when used with an array?",
                    "options": [
                        "To combine multiple arrays into one",
                        "To expand an array into individual elements",
                        "To reverse the elements of an array",
                        "To filter out specific elements from an array"
                    ],
                    "correct_index": 1
                }
            ]
        },
        {
            "title": "Data Structures 101",
            "category": "Data Structures",
            "description": "Fundamental concepts covering Arrays, Linked Lists, Stacks, and Queues.",
            "difficulty": "Beginner",
            "estimated_time": 60,
            "enrolled_count": 12450,
            "questions": [
                {
                    "id": 1,
                    "text": "Which data structure follows the LIFO (Last-In, First-Out) principle?",
                    "options": ["Queue", "Stack", "Linked List", "Binary Tree"],
                    "correct_index": 1
                }
            ]
        },
        {
            "title": "Neural Networks Basics",
            "category": "Artificial Intelligence",
            "description": "Understand perceptrons, backpropagation, and activation functions in deep learning.",
            "difficulty": "Intermediate",
            "estimated_time": 45,
            "enrolled_count": 3400,
            "questions": [
                 {
                    "id": 1,
                    "text": "What is the primary function of an activation function in a neural network?",
                    "options": [
                        "To weight the input connections",
                        "To introduce non-linearity into the network output",
                        "To calculate the error during training",
                        "To reduce the number of neurons in a layer"
                    ],
                    "correct_index": 1
                }
            ]
        },
        {
            "title": "Python for Data Science",
            "category": "Programming",
            "description": "Evaluate your proficiency in Pandas, NumPy, and data manipulation techniques.",
            "difficulty": "Intermediate",
            "estimated_time": 60,
            "enrolled_count": 5600,
            "questions": [
                {
                    "id": 1,
                    "text": "In Pandas, which function is used to read a CSV file into a DataFrame?",
                    "options": ["pd.load_csv()", "pd.import_csv()", "pd.read_csv()", "pd.from_csv()"],
                    "correct_index": 2
                }
            ]
        },
        {
            "title": "Web Application Security",
            "category": "Cybersecurity",
            "description": "Identify and mitigate OWASP Top 10 vulnerabilities like XSS, CSRF, and SQL Injection.",
            "difficulty": "Advanced",
            "estimated_time": 90,
            "enrolled_count": 2100,
            "questions": [
                {
                    "id": 1,
                    "text": "What does XSS stand for in the context of web security?",
                    "options": [
                        "Extensible Security System",
                        "Cross-Site Scripting",
                        "XML Security Standard",
                        "Cross-Site Security Server"
                    ],
                    "correct_index": 1
                }
            ]
        },
        {
            "title": "Logical Reasoning & Puzzles",
            "category": "Aptitude",
            "description": "Sharpen your problem-solving skills with numerical and verbal reasoning challenges.",
            "difficulty": "Beginner",
            "estimated_time": 30,
            "enrolled_count": 15200,
            "questions": [
                {
                    "id": 1,
                    "text": "If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are definitely Lazzies.",
                    "options": ["True", "False", "Cannot be determined", "Only on Tuesdays"],
                    "correct_index": 0
                }
            ]
        },
        {
            "title": "System Design Interview",
            "category": "Software Engineering",
            "description": "Architecting scalable, distributed systems for millions of users.",
            "difficulty": "Advanced",
            "estimated_time": 120,
            "enrolled_count": 4300,
            "questions": [
                {
                    "id": 1,
                    "text": "What is 'Vertical Scaling' in system design?",
                    "options": [
                        "Adding more servers to a load balancer",
                        "Increasing the power (CPU, RAM) of an existing server",
                        "Distributing data across multiple databases",
                        "Splitting the application into microservices"
                    ],
                    "correct_index": 1
                }
            ]
        }
    ]

    proctoring_rules = [
        {"icon": "🚫", "text": "No Tab Switching"},
        {"icon": "📺", "text": "Full Screen Mode"},
        {"icon": "🔇", "text": "Environment Silence"},
        {"icon": "👤", "text": "Face Visibility"}
    ]
    
    structure_instructions = {
        "mcq": {
            "title": "MCQ Assessment",
            "items": [
                "20 Adaptive Multiple Choice Questions",
                "Questions based on detected resume skills",
                "Difficulty adjusts dynamically",
                "AI monitors answering pattern"
            ]
        },
        "coding": {
            "title": "Coding Assessment",
            "items": [
                "Skill-based coding problems",
                "Built-in IDE with syntax highlighting",
                "Automatic evaluation with test cases",
                "Performance metrics (time & memory)"
            ]
        }
    }

    for t in tasks:
        Assessment.objects.create(
            title=t['title'],
            category=t['category'],
            difficulty=t['difficulty'],
            description=t['description'],
            estimated_time=t['estimated_time'],
            enrolled_count=t['enrolled_count'],
            questions=t['questions'],
            proctoring_rules=proctoring_rules,
            structure_instructions=structure_instructions
        )
    
    print(f"Successfully seeded {len(tasks)} assessments.")

if __name__ == "__main__":
    seed()
