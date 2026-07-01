import './Chart.css';

const Chart = ({ data, type = 'bar', title, subtitle, height = 250 }) => {
  // Simple CSS-based bar chart for Skill Performance
  
  if (!data || data.length === 0) return <div className="chart-empty">No data available</div>;

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        {title && <h3 className="chart-title">{title}</h3>}
        {subtitle && <p className="chart-subtitle">{subtitle}</p>}
      </div>
      
      <div className="chart-body" style={{ height: `${height}px` }}>
        {type === 'bar' && (
          <div className="bar-chart">
            {data.map((item, index) => {
              const heightPercent = `${(item.value / maxValue) * 100}%`;
              return (
                <div key={index} className="bar-group">
                  <div className="bar-track">
                    <div 
                      className={`bar-fill ${item.colorClass || ''}`} 
                      style={{ height: heightPercent }}
                    >
                      <span className="bar-tooltip">{item.value}%</span>
                    </div>
                  </div>
                  <div className="bar-label-container">
                    <span className="bar-label" title={item.label}>{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* We can build a simple SVG line chart here if needed, but bars usually suffice for standard performance metrics unless strictly time-series */}
        {type === 'line' && (
          <div className="line-chart-placeholder">
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox={`0 0 ${data.length * 100} 100`}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Dynamically drawing a rudimentary SVG line */}
                {(() => {
                  const points = data.map((d, i) => `${i * 100 + 50},${100 - (d.value / maxValue) * 80}`).join(' ');
                  return (
                    <>
                      <polygon points={`50,100 ${points} ${(data.length-1) * 100 + 50},100`} fill="url(#lineGrad)" />
                      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {data.map((d, i) => (
                        <circle key={i} cx={i * 100 + 50} cy={100 - (d.value / maxValue) * 80} r="5" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
                      ))}
                    </>
                  );
                })()}
            </svg>
            <div className="x-axis">
              {data.map((item, index) => (
                <span key={index} className="axis-label">{item.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;
