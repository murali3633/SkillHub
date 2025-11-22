import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import APIService from '../services/apiService';

const EnrolledCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle course card click to redirect to syllabus details page
  const handleCourseClick = (course, event) => {
    console.log('Card clicked!', course.title, event.target);
    
    // Don't redirect if clicking on buttons or interactive elements
    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
      console.log('Button clicked, not redirecting');
      return;
    }
    
    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Redirecting to syllabus details page for:', course.id);
    
    // Redirect to syllabus details page
    navigate('/syllabus-detail', { state: { course } });
  };

  // Load enrolled courses
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load enrolled courses from API
        const result = await APIService.getEnrolledCourses();
        
        if (result.success) {
          setEnrolledCourses(result.data);
        } else {
          console.error('Error loading enrolled courses:', result.error);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);


  if (isLoading) {
    return <LoadingSpinner size="large" message="Loading your enrolled courses..." overlay={true} />;
  }

  return (
    <div className="student-dashboard">
      <div className="available-courses-section">
        <h2>My Enrolled Courses ({enrolledCourses.length})</h2>
        
        {enrolledCourses.length > 0 ? (
          <div className="courses-grid">
            {enrolledCourses.map(course => (
              <div 
                key={course.id} 
                className="course-card clickable-card"
                onClick={(e) => handleCourseClick(course, e)}
                onMouseEnter={() => console.log('Mouse entered card:', course.title)}
                style={{ 
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <div className="course-header">
                  <div className="course-title-section">
                    <div className="title-code-row">
                      <h3 className="course-title">{course.title}</h3>
                      <span className="course-code">{course.code}</span>
                    </div>
                  </div>
                </div>
                
                <div className="course-meta">
                  <span className="course-category">{course.category}</span>
                  <span className={`course-level level-${course.level?.toLowerCase()}`}>{course.level}</span>
                </div>
                
                <p className="course-description">{course.description}</p>
                
                <div className="course-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-icon">👨‍🏫</span>
                      <span className="detail-text">{course.instructor}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">⏱️</span>
                      <span className="detail-text">{course.duration}</span>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-item">
                      <span className="detail-icon">📅</span>
                      <span className="detail-text">Enrolled</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📚</span>
                      <span className="detail-text">In Progress</span>
                    </div>
                  </div>
                </div>

                {/* Syllabus Section */}
                <div className="syllabus-section">
                  <button 
                    className="syllabus-toggle-btn"
                    onClick={() => navigate('/syllabus-detail', { state: { course } })}
                  >
                    <span className="toggle-text">View Full Module Syllabus</span>
                    <span className="toggle-icon">↗</span>
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        ) : (
          <div className="no-courses">
            <div className="no-courses-icon">📚</div>
            <h3>No Enrolled Courses</h3>
            <p>You haven't enrolled in any courses yet.</p>
            <button 
              className="browse-courses-btn"
              onClick={() => navigate('/available-courses')}
            >
              <span className="btn-icon">🎓</span>
              Browse Available Courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrolledCourses;