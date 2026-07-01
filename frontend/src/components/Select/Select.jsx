import './Select.css';

const Select = ({ label, id, options, value, onChange, error, placeholder, ...props }) => {
  return (
    <div className={`select-wrapper ${error ? 'has-error' : ''}`}>
      {label && (
        <label htmlFor={id} className="select-label">
          {label}
        </label>
      )}
      <div className="select-container">
        <select
          id={id}
          className={`select-field ${!value ? 'placeholder-selected' : ''}`}
          value={value}
          onChange={onChange}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="select-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      {error && <span className="select-error-msg">{error}</span>}
    </div>
  );
};

export default Select;
