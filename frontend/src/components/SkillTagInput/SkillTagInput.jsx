import { useState, useRef, useEffect, useCallback } from 'react';
import './SkillTagInput.css';

const defaultSuggestions = [
  "JavaScript", "Python", "Java", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin", "Go", "Rust", "TypeScript",
  "HTML", "CSS", "React.js", "Angular", "Vue.js", "Node.js", "Express.js", "Django", "Flask", "Spring Boot",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra",
  "Docker", "Kubernetes", "AWS", "Google Cloud", "Microsoft Azure", "Terraform", "Ansible",
  "Git", "GitHub", "GitLab", "CI/CD", "Jenkins", "Machine Learning", "Data Science",
  "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "Blockchain", "Cybersecurity",
  "Data Visualization", "Tableau", "Power BI", "Agile Methodologies", "Scrum",
  "GraphQL", "REST APIs", "Microservices", "System Design", "Linux", "Bash Scripting",
  "C", "Objective-C", "Flutter", "React Native", "Android Development", "iOS Development",
  "Unity", "Unreal Engine", "Game Development", "Data Engineering", "Apache Spark", "Hadoop", "Kafka"
];

const SkillTagInput = ({ 
  label, 
  id, 
  tags, 
  setTags, 
  error, 
  placeholder = "Add...", 
  maxTags = 15, 
  availableSuggestions = defaultSuggestions, 
  helperText = "Press Enter or comma to add. Select from suggestions using arrows.",
  ...props 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions when input changes
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableSuggestions.filter(
        suggestion => suggestion.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, tags, availableSuggestions]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0 && activeSuggestionIndex >= 0) {
        addTag(filteredSuggestions[activeSuggestionIndex]);
      } else {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions) {
        setActiveSuggestionIndex((prev) => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = (valueToAdd) => {
    const newTag = typeof valueToAdd === 'string' ? valueToAdd.trim() : inputValue.trim();
    if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
      setTags([...tags, newTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div className={`tag-input-wrapper ${error ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={id} className="tag-input-label">
          {label} {maxTags && <span className="tag-count">({tags.length}/{maxTags})</span>}
        </label>
      )}
      
      <div 
        className={`tag-input-container ${tags.length >= maxTags ? 'is-full' : ''}`}
        onClick={focusInput}
      >
        <div className="tags-list">
          {tags.map((tag, index) => (
            <span key={index} className="skill-tag">
              {tag}
              <button 
                type="button" 
                className="tag-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                aria-label={`Remove ${tag}`}
              >
                &times;
              </button>
            </span>
          ))}
          
          {tags.length < maxTags && (
            <input
              ref={inputRef}
              id={id}
              type="text"
              className="tag-input-field"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (inputValue.trim() && filteredSuggestions.length > 0) setShowSuggestions(true); }}
              placeholder={tags.length === 0 ? placeholder : ""}
              autoComplete="off"
              {...props}
            />
          )}
        </div>
        
        {/* Dropdown Suggestions */}
        {showSuggestions && (
          <ul className="suggestions-dropdown" ref={dropdownRef}>
            {filteredSuggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                onClick={() => addTag(suggestion)}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {error && <span className="tag-error-msg">{error}</span>}
      {!error && <span className="tag-helper-text">{helperText}</span>}
    </div>
  );
};

export default SkillTagInput;
