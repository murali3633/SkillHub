import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user, logout } = useAuth();

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>🚫 Unauthorized Access</h1>
        <p>Sorry, you don't have permission to access this page.</p>
        
        {user && (
          <div className="user-info">
            <p>You are logged in as: <strong>{user.name}</strong> ({user.role})</p>
          </div>
        )}

        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
          
          {user && (
            <>
              <Link 
                to={user.role === 'student' ? '/student-dashboard' : '/faculty-dashboard'} 
                className="btn btn-secondary"
              >
                Go to My Dashboard
              </Link>
              
              <button type="button" onClick={logout} className="btn btn-danger">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

