// src/components/AccessDenied.tsx
import React from 'react';
import './Dashboard.css';

const AccessDenied: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="dashboard-container">
      <div className="card error-card">
        <h2>🔒 Access Denied</h2>
        <p>
          {message || (
            <>
              Your trial has expired. Please contact <strong>EnergInAI</strong> for next steps. <br />
              Visit{' '}
              <a
                href="https://energinai.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                EnergInAI.com
              </a>{' '}
              for more details about us.
            </>
          )}

        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
