import re

file_path = r'c:\Users\shaha\OneDrive\Desktop\AI-Skill-Assessment-Platform\frontend\src\pages\AIInterview\AIInterview.css'
with open(file_path, 'r', encoding='utf-8') as f:
    css = f.read()

replacements = [
    (r'var\(--text-primary\)', 'var(--text-main)'),
    (r'var\(--background\)', 'var(--surface)'),
    (r'var\(--surface-hover\)', 'var(--bg-main)'),
    (r'var\(--danger\)', 'var(--error)')
]

for pattern, repl in replacements:
    css = re.sub(pattern, repl, css, flags=re.IGNORECASE)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(css)
print("Undefined vars fixed.")
