import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      color: 'white',
      fontWeight: '500',
      fontSize: '0.9rem',
      maxWidth: '400px',
      minWidth: '300px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
      opacity: isExiting ? 0 : 1,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
        };
      case 'error':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
        };
      case 'warning':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
          color: '#212529',
        };
      case 'info':
      default:
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div style={getToastStyles()} onClick={handleClose}>
      <span style={{ fontSize: '1.2rem' }}>{getIcon()}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          transition: 'background-color 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = 'transparent';
        }}
      >
        ×
      </button>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'relative',
            marginBottom: '10px',
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Toast Context
const ToastContext = createContext();

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;

