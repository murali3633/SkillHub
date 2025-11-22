import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...', overlay = false }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'spinner-small';
      case 'large':
        return 'spinner-large';
      case 'medium':
      default:
        return 'spinner-medium';
    }
  };

  const getMessageSizeClass = () => {
    switch (size) {
      case 'small':
        return 'message-small';
      case 'large':
        return 'message-large';
      case 'medium':
      default:
        return 'message-medium';
    }
  };

  return (
    <div 
      className={`skillhub-loading-container ${overlay ? 'skillhub-overlay' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        gap: '1rem',
        padding: overlay ? '2rem' : '1rem'
      }}
    >
      <div className={`modern-spinner ${getSizeClass()}`}>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      {message && (
        <div 
          className={`skillhub-loading-message ${getMessageSizeClass()}`}
          style={{
            textAlign: 'center',
            width: '100%',
            margin: '0 auto',
            display: 'block'
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;



