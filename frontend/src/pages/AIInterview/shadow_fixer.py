import re

file_path = r'c:\Users\shaha\OneDrive\Desktop\AI-Skill-Assessment-Platform\frontend\src\pages\AIInterview\AIInterview.css'

with open(file_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Replace harsh dark shadows with light soft shadows
replacements = [
    (r'rgba\(0,\s*0,\s*0,\s*0\.5\)', r'rgba(0, 0, 0, 0.08)'),
    (r'rgba\(0,\s*0,\s*0,\s*0\.4\)', r'rgba(0, 0, 0, 0.06)'),
    (r'rgba\(0,\s*0,\s*0,\s*0\.3\)', r'rgba(0, 0, 0, 0.05)'),
    (r'rgba\(0,\s*0,\s*0,\s*0\.2\)', r'rgba(0, 0, 0, 0.04)'),
    (r'rgba\(0,\s*0,\s*0,\s*0\.1\)', r'rgba(0, 0, 0, 0.03)'),
]

for pattern, repl in replacements:
    css = re.sub(pattern, repl, css, flags=re.IGNORECASE)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Shadows softened.")
