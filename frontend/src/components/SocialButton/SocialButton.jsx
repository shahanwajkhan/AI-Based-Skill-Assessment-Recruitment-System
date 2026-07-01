import './SocialButton.css';

const SocialButton = ({ provider, icon, onClick }) => {
  return (
    <button type="button" className={`social-btn social-${provider}`} onClick={onClick}>
      <span className="social-icon">
        {icon}
      </span>
      <span className="social-text">Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
    </button>
  );
};

export default SocialButton;
