import re

file_path = r'c:\Users\shaha\OneDrive\Desktop\AI-Skill-Assessment-Platform\frontend\src\pages\AIInterview\AIInterview.css'

with open(file_path, 'r', encoding='utf-8') as f:
    css = f.read()

replacements = {
    r'#0f172a': 'var(--bg-main)',
    r'#1e293b': 'var(--surface)',
    r'#11111b': 'var(--surface)',
    r'#1e1e2e': 'var(--surface)',
    r'#f1f5f9': 'var(--text-main)',
    r'#f8fafc': 'var(--text-main)',
    r'#e2e8f0': 'var(--text-main)',
    r'#cdd6f4': 'var(--text-main)',
    r'#eff1f5': 'var(--text-main)',
    r'#cbd5e1': 'var(--text-main)',
    r'#94a3b8': 'var(--text-muted)',
    r'#64748b': 'var(--text-light)',
    r'rgba\(\s*30\s*,\s*41\s*,\s*59\s*,\s*([0-9.]+)\s*\)': r'rgba(255, 255, 255, \1)',
    r'rgba\(\s*15\s*,\s*23\s*,\s*42\s*,\s*([0-9.]+)\s*\)': r'var(--bg-main)',
    r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.0[58]\s*\)': 'var(--border-color)',
    r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.1[0-9]*\s*\)': 'var(--border-color)',
    r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.2\s*\)': 'var(--border-color)'
}

for pattern, repl in replacements.items():
    css = re.sub(pattern, repl, css, flags=re.IGNORECASE)

# Replace 'color: white' where appropriate, avoiding buttons that typically use gradients
def replace_white_text(match):
    return 'color: var(--text-main)'

# A simple approach is to find all 'color: white;' and change them
# EXCEPT if it's accompanied by background-color or background: *gradient
# Let's just manually replace color: white globally, then run a check for '.user .entry-bubble-v3' 
# or specific buttons to revert them to white.

css = re.sub(r'color:\s*(?:white|#fff|#ffffff)\s*;', 'color: var(--text-main);', css, flags=re.IGNORECASE)

# Revert specific classes that represent filled buttons or badges that need white text
reverts = [
    (r'(\.sc-proceed-btn\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.btn-start-interview-glow\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.btn-stop-submit-v3\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.is-btn-listen\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.is-btn-submit\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.proctor-live-badge\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.l-step\.active\s*\.l-step-num\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.l-step\.done\s*\.l-step-num\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.user\s*\.entry-bubble-v3\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1white'),
    (r'(\.sc-card-status\s*\{[^}]*color:\s*)var\(--text-main\)', r'\1var(--text-main)'),
]

for pattern, repl in reverts:
    css = re.sub(pattern, repl, css, flags=re.IGNORECASE|re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("Theme updated successfully.")
