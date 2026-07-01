const fs = require('fs');
const file = 'c:/Users/shaha/OneDrive/Desktop/AI-Skill-Assessment-Platform/frontend/src/pages/Dashboard/RecruiterDashboard.jsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/`\\\/recruiter\//g, '`${API_URL}/recruiter/');
fs.writeFileSync(file, content);
console.log('Fixed URLs');
