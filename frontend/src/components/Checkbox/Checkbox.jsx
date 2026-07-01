import './Checkbox.css';

const Checkbox = ({ id, label, checked, onChange }) => {
  return (
    <div className="checkbox-container">
      <input
        type="checkbox"
        id={id}
        className="custom-checkbox"
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id} className="checkbox-label">
        <span className="checkbox-box">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M5 13L9 17L19 7" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        </span>
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
