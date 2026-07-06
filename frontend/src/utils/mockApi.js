// Mock API Interceptor for SkillGuard AI
// This file overrides window.fetch to simulate a local Django backend
// when the actual backend is not running or unreachable.

import { API_URL } from './api';

const isBackendOffline = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${API_URL}/auth/login/`, { method: 'OPTIONS', signal: controller.signal });
    clearTimeout(timeoutId);
    return false;
  } catch (err) {
    return true;
  }
};

const setupMockApi = () => {
  const originalFetch = window.fetch;

  // Initial mock state in localStorage
  if (!localStorage.getItem('mock_db_initialized')) {
    localStorage.setItem('mock_db_initialized', 'true');
    localStorage.setItem('mock_users', JSON.stringify({
      'candidate': {
        username: 'candidate',
        email: 'candidate@skillguard.ai',
        role: 'candidate',
        profile: { role: 'candidate', skills: ['React', 'JavaScript', 'Node.js', 'Python'], cv_score: 82, cv_parsed: true }
      },
      'recruiter': {
        username: 'recruiter',
        email: 'recruiter@skillguard.ai',
        role: 'recruiter',
        profile: { role: 'recruiter', company: 'SkillGuard Corp', cv_score: 100, cv_parsed: false }
      }
    }));

    // Mock Assessments
    localStorage.setItem('mock_assessments', JSON.stringify([
      {
        id: 1,
        title: 'React & Frontend Engineering',
        role: 'Frontend Developer',
        difficulty: 'Intermediate',
        time_limit: 45,
        test_type: 'ai_skill',
        question_count: 5,
        description: 'Assess components, state management, performance, and hooks in React.'
      },
      {
        id: 2,
        title: 'Python Core & Algorithms',
        role: 'Software Engineer',
        difficulty: 'Advanced',
        time_limit: 60,
        test_type: 'coding',
        question_count: 3,
        description: 'Test your algorithmic capabilities and data structure proficiency using Python.'
      },
      {
        id: 3,
        title: 'Soft Skills & Behavioral Interview',
        role: 'Product Manager',
        difficulty: 'Easy',
        time_limit: 30,
        test_type: 'confidence',
        question_count: 4,
        description: 'Simulated communication check to test vocabulary coherence and speech metrics.'
      }
    ]));

    // Mock Invitations
    localStorage.setItem('mock_invitations', JSON.stringify([
      { id: 1, email: 'john.doe@example.com', role: 'Frontend Engineer', test_type: 'ai_skill', status: 'pending', sent_at: new Date().toISOString() },
      { id: 2, email: 'sarah.smith@example.com', role: 'Data Scientist', test_type: 'coding', status: 'completed', score: 88, sent_at: new Date().toISOString() }
    ]));
  }

  // Intercept fetch
  window.fetch = async function (input, init) {
    const urlString = typeof input === 'string' ? input : input.url;
    
    // Only intercept requests directed to our API_URL
    if (urlString.startsWith(API_URL)) {
      const path = urlString.replace(API_URL, '').split('?')[0];
      const method = (init && init.method) || 'GET';
      const body = init && init.body ? JSON.parse(init.body) : {};

      console.warn(`[Mock API Interceptor] Intercepted: ${method} ${path}`, body);

      // 1. Auth: Login
      if (path === '/auth/login/' && method === 'POST') {
        const username = body.username || 'candidate';
        const role = username.toLowerCase().includes('recruiter') ? 'recruiter' : 'candidate';
        
        // Mock token generation
        const responseData = {
          access: `mock_jwt_access_token_${role}`,
          refresh: `mock_jwt_refresh_token_${role}`
        };

        // Cache logged in user info
        localStorage.setItem('logged_in_username', username);
        localStorage.setItem('logged_in_role', role);
        localStorage.setItem('access_token', responseData.access);
        localStorage.setItem('refresh_token', responseData.refresh);

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 2. Auth: Register
      if (path === '/auth/register/' && method === 'POST') {
        const username = body.username || 'new_user';
        const email = body.email || 'user@example.com';
        const role = body.role || 'candidate';

        const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '{}');
        mockUsers[username] = {
          username,
          email,
          role,
          profile: { role, skills: [], cv_score: 0, cv_parsed: false }
        };
        localStorage.setItem('mock_users', JSON.stringify(mockUsers));

        return new Response(JSON.stringify({ message: "Registration successful" }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 3. User Profile
      if (path === '/users/profile/' && method === 'GET') {
        const role = localStorage.getItem('logged_in_role') || 'candidate';
        const username = localStorage.getItem('logged_in_username') || 'candidate';

        const responseData = {
          user: {
            id: role === 'recruiter' ? 2 : 1,
            username: username,
            email: `${username}@skillguard.ai`,
            first_name: username.charAt(0).toUpperCase() + username.slice(1),
            last_name: 'User'
          },
          profile: {
            role: role,
            company: role === 'recruiter' ? 'SkillGuard Corp' : undefined,
            skills: role === 'candidate' ? ['React', 'JavaScript', 'Node.js', 'Python'] : [],
            experience: '2 years',
            cv_score: role === 'candidate' ? 82 : 0,
            cv_parsed: role === 'candidate'
          }
        };

        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/users/profile/' && method === 'PUT') {
        return new Response(JSON.stringify({ message: "Profile updated successfully" }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 4. Extract Resume CV
      if (path === '/users/profile/extract-cv/' && method === 'POST') {
        return new Response(JSON.stringify({
          message: "CV Extracted successfully (Mock Mode)",
          skills: ['React', 'CSS', 'JavaScript', 'Next.js'],
          experience: '2 years'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 5. ATS Score Check
      if (path === '/users/profile/ats-check/' && method === 'POST') {
        return new Response(JSON.stringify({
          score: 87,
          feedback: "Great resume formatting and strong matching keywords for Frontend Development.",
          skills_detected: ['React', 'Vite', 'HTML', 'CSS', 'TailwindCSS'],
          missing_skills: ['TypeScript', 'GraphQL'],
          recommendations: "Add detailed descriptions of your frontend state management experience."
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 6. Assessments List
      if (path === '/assessments/' && method === 'GET') {
        const list = JSON.parse(localStorage.getItem('mock_assessments') || '[]');
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 7. Assessments Metadata
      if (path === '/assessments/metadata/' && method === 'GET') {
        return new Response(JSON.stringify({
          roles: ['Frontend Developer', 'Software Engineer', 'Product Manager', 'Data Analyst'],
          difficulties: ['Easy', 'Intermediate', 'Advanced']
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 8. Dashboard Statistics
      if (path === '/dashboard/stats/' && method === 'GET') {
        return new Response(JSON.stringify({
          tests_completed: 12,
          average_score: 78.4,
          rank: 5,
          next_scheduled: 'Tomorrow at 10:00 AM'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 9. Dashboard Leaderboard
      if (path === '/dashboard/leaderboard/' && method === 'GET') {
        return new Response(JSON.stringify([
          { id: 1, user: { username: 'Alice' }, rank: 1, average_score: 95.2 },
          { id: 2, user: { username: 'Bob' }, rank: 2, average_score: 91.0 },
          { id: 3, user: { username: 'Charlie' }, rank: 3, average_score: 87.5 },
          { id: 4, user: { username: 'you' }, rank: 4, average_score: 82.0 }
        ]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 10. Latest Analysis
      if (path === '/dashboard/latest-analysis/' && method === 'GET') {
        return new Response(JSON.stringify({
          score: 82,
          date: new Date().toLocaleDateString(),
          feedback: "Solid frontend grasp, but look into optimizations like bundle size configuration."
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 11. Skill Gap Roadmaps
      if (urlString.includes('/skill-gap-analysis/')) {
        return new Response(JSON.stringify({
          id: 1,
          role: "Frontend Developer",
          current_score: 75,
          roadmap: {
            beginner: ["Learn React Basics", "Understand State Hooks"],
            intermediate: ["Master React Router", "Integrate Global Redux Store"],
            advanced: ["Web Performance Audits", "Custom Hooks & Architecture"]
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 12. Recruiter Invites
      if (path === '/recruiter/invitations/' && method === 'GET') {
        const invites = JSON.parse(localStorage.getItem('mock_invitations') || '[]');
        return new Response(JSON.stringify(invites), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (path === '/recruiter/invitations/' && method === 'POST') {
        const invites = JSON.parse(localStorage.getItem('mock_invitations') || '[]');
        const newInvite = {
          id: invites.length + 1,
          email: body.email,
          role: body.role,
          test_type: body.test_type,
          status: 'pending',
          sent_at: new Date().toISOString()
        };
        invites.push(newInvite);
        localStorage.setItem('mock_invitations', JSON.stringify(invites));
        return new Response(JSON.stringify(newInvite), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 13. Recruiter Dashboard Analytics
      if (path === '/recruiter/dashboard-analytics/' && method === 'GET') {
        return new Response(JSON.stringify({
          total_candidates: 36,
          pending_assessments: 12,
          shortlisted_count: 5,
          overall_average_score: 74.8
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 14. Recruiter Candidate List
      if (path === '/recruiter/candidates/' && method === 'GET') {
        return new Response(JSON.stringify([
          { id: 101, user: { username: 'John Doe', email: 'john@example.com' }, score: 85, status: 'completed', flags: 0 },
          { id: 102, user: { username: 'Sarah Smith', email: 'sarah@example.com' }, score: 92, status: 'completed', flags: 1 },
          { id: 103, user: { username: 'Mike Johnson', email: 'mike@example.com' }, score: 64, status: 'completed', flags: 4 }
        ]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Default fallback JSON response
      return new Response(JSON.stringify({ success: true, message: "Mock API response" }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return originalFetch.apply(this, arguments);
  };
};

// Check if we should activate the mock API:
// 1. Explicitly requested via query param / localStorage setting
// 2. Or the local backend is offline/unreachable
const initMockApi = async () => {
  const forceMock = localStorage.getItem('force_mock') === 'true' || 
                    window.location.search.includes('mock=true') ||
                    import.meta.env.VITE_USE_MOCK_API === 'true';

  if (forceMock) {
    console.log("%c[Mock API] Force enabled via settings/URL query.", "color: #10b981; font-weight: bold;");
    setupMockApi();
    return;
  }

  // Auto-detect offline backend
  const offline = await isBackendOffline();
  if (offline) {
    console.warn("[Mock API] Local Django server offline. Switching to client-side mock backend mode.");
    setupMockApi();
  }
};

initMockApi();
