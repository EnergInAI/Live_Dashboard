import React from 'react';
import './Dashboard.css';

interface AccessDeniedProps {
  message?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = 'Your trial has expired. Please contact EnergInAI for next steps.',
}) => {
  return (
    <div className="error-card">
      <h2>Access Denied</h2>
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
