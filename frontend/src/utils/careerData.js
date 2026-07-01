/**
 * Career Recommendation Data & Logic
 * Maps skills from standardized tests to industry job roles.
 */

export const JOB_ROLES = [
  {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    requiredSkills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript', 'System Design'],
    salaryRange: { min: 6, max: 18, currency: 'LPA' },
    category: 'Engineering'
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    requiredSkills: ['Python', 'Node.js', 'SQL', 'System Design', 'Docker', 'AWS'],
    salaryRange: { min: 8, max: 22, currency: 'LPA' },
    category: 'Engineering'
  },
  {
    id: 'fullstack-developer',
    title: 'Fullstack Developer',
    requiredSkills: ['React', 'Node.js', 'SQL', 'JavaScript', 'System Design'],
    salaryRange: { min: 10, max: 25, currency: 'LPA' },
    category: 'Engineering'
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy'],
    salaryRange: { min: 8, max: 30, currency: 'LPA' },
    category: 'Data Science'
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    requiredSkills: ['SQL', 'Python', 'Excel', 'Power BI', 'Statistics'],
    salaryRange: { min: 5, max: 12, currency: 'LPA' },
    category: 'Data Science'
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    requiredSkills: ['Figma', 'UI Design', 'User Research', 'Prototyping'],
    salaryRange: { min: 4, max: 15, currency: 'LPA' },
    category: 'Design'
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    requiredSkills: ['Docker', 'AWS', 'Kubernetes', 'Linux', 'Terraform'],
    salaryRange: { min: 12, max: 28, currency: 'LPA' },
    category: 'Infrastructure'
  }
];

/**
 * Maps common industry skills to broad categories for domain detection.
 */
const CATEGORY_KEYWORDS = {
  'Engineering': ['react', 'javascript', 'html', 'css', 'typescript', 'node.js', 'backend', 'frontend', 'system design', 'rest api', 'java', 'c++', 'go'],
  'Data Science': ['python', 'statistics', 'pandas', 'sql', 'machine learning', 'data analysis', 'deep learning', 'pytorch', 'tensorflow', 'scikit-learn', 'r', 'excel', 'tableau', 'power bi'],
  'Design': ['figma', 'sketch', 'adobe xd', 'ui design', 'ux design', 'user research', 'prototyping', 'interaction design', 'typography', 'visual design'],
  'Infrastructure': ['aws', 'azure', 'docker', 'kubernetes', 'linux', 'devops', 'cicd', 'terraform', 'jenkins', 'cloud computing', 'cybersecurity']
};

/**
 * Detects the user's primary industry category based on a list of skill strings.
 * @param {Array} skills - Array of skill names (strings)
 * @returns {string|null} - The detected category name
 */
export const detectIndustryFromSkills = (skills = []) => {
  if (!skills || skills.length === 0) return null;
  
  const scores = { 'Engineering': 0, 'Data Science': 0, 'Design': 0, 'Infrastructure': 0 };
  const normalizedSkills = skills.map(s => s.toLowerCase());

  Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (normalizedSkills.some(s => s.includes(keyword))) {
        scores[category] += 1;
      }
    });
  });

  // Get category with highest score
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : null;
};

/**
 * Calculates readiness percentage and missing skills for a given role.
 */
export const calculateRoleReadiness = (assessmentSkills = [], profileSkills = [], role) => {
  const allSkillsMap = {};
  
  // High weight for assessment results (proven skills)
  assessmentSkills.forEach(s => {
    allSkillsMap[s.skill.toLowerCase()] = s.score;
  });

  // Base weight for profile skills (implied skills from CV)
  // If not tested yet, assume a base "familiarity" score of 50
  profileSkills.forEach(s => {
    const skillName = (typeof s === 'string' ? s : s.skill).toLowerCase();
    if (allSkillsMap[skillName] === undefined) {
      allSkillsMap[skillName] = 50; 
    }
  });

  let totalScore = 0;
  const missingSkills = [];
  const requiredCount = role.requiredSkills.length;

  role.requiredSkills.forEach(req => {
    const score = allSkillsMap[req.toLowerCase()];
    if (score !== undefined) {
      totalScore += score;
      if (score < 60) {
        missingSkills.push(req);
      }
    } else {
      missingSkills.push(req);
    }
  });

  const readiness = Math.round(totalScore / requiredCount);
  const readinessFactor = readiness / 100;
  const predictedMin = role.salaryRange.min + (role.salaryRange.max - role.salaryRange.min) * (readinessFactor * 0.4);
  const predictedMax = role.salaryRange.min + (role.salaryRange.max - role.salaryRange.min) * (readinessFactor * 0.9);

  return {
    readiness: Math.max(0, Math.min(100, readiness)),
    missingSkills,
    estimatedSalary: `₹${predictedMin.toFixed(1)}–${predictedMax.toFixed(1)} ${role.salaryRange.currency}`
  };
};

/**
 * Finds the top matching job roles for the user, prioritizing their industry category.
 */
export const getBestMatchingRoles = (assessmentSkills = [], profileSkills = []) => {
  const detectedCategory = detectIndustryFromSkills(profileSkills);
  
  const matches = JOB_ROLES.map(role => {
    const results = calculateRoleReadiness(assessmentSkills, profileSkills, role);
    
    // Weight roles matching user's primary category from CV/Profile
    let prioritizationBonus = 0;
    if (detectedCategory && role.category === detectedCategory) {
      prioritizationBonus = 1000; // Large bonus to push it to the top
    }
    
    return {
      ...role,
      ...results,
      priorityScore: results.readiness + prioritizationBonus,
      isBackgroundMatch: detectedCategory && role.category === detectedCategory
    };
  });

  return matches.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3);
};
