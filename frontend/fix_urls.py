import os
import re

file_path = 'c:/Users/shaha/OneDrive/Desktop/AI-Skill-Assessment-Platform/frontend/src/pages/Dashboard/RecruiterDashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any variant of `\/recruiter/ or `/recruiter/
content = re.sub(r"`\\?/recruiter/", r"`${API_URL}/recruiter/", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done resetting URLs!")
