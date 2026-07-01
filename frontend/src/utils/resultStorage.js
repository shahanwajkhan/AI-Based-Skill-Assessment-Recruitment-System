/**
 * resultStorage.js
 * Centralized offline storage manager to catch and unify all AI assessment results.
 * Saves directly to localStorage to ensure instantaneous rendering for the Dashboard.
 */

// Format today's date dynamically to (DD/MM/YYYY)
const getFormattedDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-GB'); 
};
  
// Format current time dynamically to (HH:MM)
const getFormattedTime = () => {
    const today = new Date();
    return today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * calculateStatus computes the threshold text based on score percentage.
 */
const calculateStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
};

/**
 * saveLocalResult stores a newly completed test result uniformly.
 * @param {Object} data Needs to include basic fields like testType, score.
 */
export const saveLocalResult = (data) => {
    const existing = JSON.parse(localStorage.getItem('skillguard_all_results') || '[]');
    
    // Construct robust uniform object mapped exactly to the user requirements
    const newResult = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        date: getFormattedDate(),
        time: getFormattedTime(),
        status: calculateStatus(data.score || 0),
        
        testType: data.testType || 'Unknown Test',
        score: data.score || 0,
        duration: data.duration || 'N/A',
        
        aiFeedback: data.aiFeedback || 'Overall performance was evaluated.',
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        recommendations: data.recommendations || ['Continue practicing core skills.'],
        skillBreakdown: data.skillBreakdown || []
    };

    existing.push(newResult);
    // Sort descending by timestamp (latest first)
    existing.sort((a, b) => b.timestamp - a.timestamp);

    localStorage.setItem('skillguard_all_results', JSON.stringify(existing));
    return newResult;
};

/**
 * getLocalResults retrieves all unified test results.
 */
export const getLocalResults = () => {
    return JSON.parse(localStorage.getItem('skillguard_all_results') || '[]');
};

/**
 * clearLocalResults easily flushes everything for debugging.
 */
export const clearLocalResults = () => {
    localStorage.removeItem('skillguard_all_results');
};
