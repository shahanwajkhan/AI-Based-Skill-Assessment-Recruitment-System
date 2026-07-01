import './ProgressBar.css';

const ProgressBar = ({ steps, currentStep }) => {
  const stepCount = steps.length;
  const stepPercentage = 100 / stepCount;
  const lineLeft = stepPercentage / 2;
  const lineWidth = 100 - stepPercentage;
  const filledRatio = (currentStep - 1) / (steps.length - 1);

  return (
    <div className="progress-container">
      <div 
        className="progress-bar-bg"
        style={{ left: `${lineLeft}%`, width: `${lineWidth}%` }}
      >
        <div 
          className="progress-bar-fill"
          style={{ width: `${filledRatio * 100}%` }}
        ></div>
      </div>
      <div className="progress-steps">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div 
              key={index} 
              className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="step-circle">
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              <span className="step-label">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
