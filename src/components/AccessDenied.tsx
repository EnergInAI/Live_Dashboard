import React from 'react';
import '../styles/AccessDenied.css';

interface AccessDeniedProps {
  message?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = "Contact us for the Next Steps and We'll get you Saving.",
}) => {
  return (
    <div className="error-card">
      <h2>Your Trial has Expired</h2>
      <p>
        {message}
        <br />
        Visit{' '}
        <a
          href="https://energinai.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          EnergInAI.com
        </a>{' '}
        for more details about us.
      </p>
    </div>
  );
};

export default AccessDenied;
