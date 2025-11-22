import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Check if we're on a course learning or syllabus page
  const isOnCoursePage = location.pathname.includes('/course-learning/') || 
                         location.pathname.includes('/syllabus-detail');
  
  const handleBackToDashboard = () => {
    if (user?.role === 'student') {
      navigate('/student-dashboard');
    } else if (user?.role === 'faculty') {
      navigate('/faculty-dashboard');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to={isAuthenticated() && user?.role === 'student' ? '/available-courses' : '/'} className="navbar-brand">
            <span className="brand-icon">🎓</span>
            SkillHub
          </Link>
          
        </div>
        
        <div className="navbar-menu">
          <Link to={isAuthenticated() && user?.role === 'student' ? '/available-courses' : '/'} className="navbar-link">
            {isAuthenticated() && user?.role === 'faculty' ? 'Home' : 'Home'}
          </Link>
          
          {isAuthenticated() ? (
            <>
              <Link 
                to={user?.role === 'student' ? '/student-dashboard' : '/faculty-dashboard'}
                className="navbar-link dashboard-link"
              >
                Dashboard
              </Link>
              
              <button type="button" onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register" className="navbar-link register-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;