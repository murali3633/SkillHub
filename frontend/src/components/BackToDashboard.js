import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import APIService from '../services/apiService';
import './BackToDashboard.css';

const BackToDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();
  const [courseName, setCourseName] = useState('');

  // Check if we're on a course learning or syllabus page
  const isOnCoursePage = location.pathname.includes('/course-learning/') || 
                         location.pathname.includes('/syllabus-detail');

  // Get course name from location state or API
  useEffect(() => {
    if (isOnCoursePage) {
      // Try to get course name from location state first (syllabus page)
      if (location.state?.course?.title) {
        setCourseName(location.state.course.title);
      }
      // If courseId is available, fetch from API (course learning page)
      else if (courseId) {
        const fetchCourseName = async () => {
          try {
            const result = await APIService.getCourseById(courseId);
            if (result.success) {
              setCourseName(result.data.title);
            }
          } catch (error) {
            console.error('Error fetching course name:', error);
          }
        };
        fetchCourseName();
      }
    }
  }, [isOnCoursePage, courseId, location.state]);

  const handleBackToDashboard = () => {
    if (user?.role === 'student') {
      navigate('/student-dashboard');
    } else if (user?.role === 'faculty') {
      navigate('/faculty-dashboard');
    }
  };

  // Only show on course pages and when authenticated
  if (!isOnCoursePage || !isAuthenticated()) {
    return null;
  }

  return (
    <div className="back-to-dashboard-container">
      <button 
        onClick={handleBackToDashboard}
        className="back-to-dashboard-btn"
      >
        ← Back to Dashboard
      </button>
      
      {courseName && (
        <div className="course-name-display">
          <span className="course-name">{courseName}</span>
        </div>
      )}
    </div>
  );
};

export default BackToDashboard;
