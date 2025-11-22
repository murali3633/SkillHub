import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import APIService from '../services/apiService';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(12);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSyllabus, setExpandedSyllabus] = useState({}); // Track which syllabus are expanded

  // Toggle syllabus visibility
  const toggleSyllabus = (courseId) => {
    setExpandedSyllabus(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load courses from API
        const [coursesResult, enrolledResult] = await Promise.all([
          APIService.getCourses(),
          APIService.getEnrolledCourses()
        ]);
        
        if (coursesResult.success) {
          // Transform courses to match expected structure and ensure consistent ID format
          const transformedCourses = coursesResult.data.map(course => ({
            ...course,
            id: course._id || course.id, // Use _id if available, otherwise use id
            maxStudents: course.maxStudents,
            enrolled: course.enrolled,
            startDate: course.startDate,
            endDate: course.endDate
          }));
          
          setCourses(transformedCourses);
        } else {
          console.error('Error loading courses:', coursesResult.error);
        }
        
        if (enrolledResult.success) {
          // Ensure consistent ID format for enrolled courses
          const transformedEnrolledCourses = enrolledResult.data.map(course => ({
            ...course,
            id: course._id || course.id // Use _id if available, otherwise use id
          }));
          setEnrolledCourses(transformedEnrolledCourses);
        } else {
          console.error('Error loading enrolled courses:', enrolledResult.error);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Get unique categories for filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(courses.map(course => course.category))];
    return uniqueCategories;
  }, [courses]);

  // Filter and search courses - SHOW ALL COURSES (no filtering)
  const filteredCourses = useMemo(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort courses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
          return new Date(a.startDate) - new Date(b.startDate);
        case 'level':
          const levelOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
          return levelOrder[a.level] - levelOrder[b.level];
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchTerm, selectedCategory, sortBy]);

  // Pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  // Check if student is enrolled in a course
  const isEnrolled = (courseId) => {
    // Check using both id and _id since different APIs may return different field names
    return enrolledCourses.some(course => 
      course.id === courseId || course._id === courseId
    );
  };


  // Handle course card click to redirect to syllabus details page
  const handleCourseClick = (course, event) => {
    console.log('Card clicked!', course.title, event.target);
    
    // Don't redirect if clicking on buttons or interactive elements
    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
      console.log('Button clicked, not redirecting');
      return;
    }
    
    // Only allow navigation for enrolled courses
    if (!isEnrolled(course.id)) {
      console.log('Course not enrolled, not redirecting');
      return;
    }
    
    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Redirecting to syllabus details page for:', course.id);
    
    // Redirect to syllabus details page for enrolled courses only
    navigate('/syllabus-detail', { state: { course } });
  };

  // Register for a course
  const registerForCourse = async (course) => {
    // Check if already enrolled - if so, do nothing (button will be disabled)
    if (isEnrolled(course.id)) {
      return; // Already enrolled, no action needed
    }
    
    // Enroll via API
    const result = await APIService.enrollInCourse(course.id);
    
    if (result.success) {
      // Refresh enrolled courses
      const enrolledResult = await APIService.getEnrolledCourses();
      if (enrolledResult.success) {
        setEnrolledCourses(enrolledResult.data);
      }
      
      // Refresh course data to get updated enrollment count
      const courseResult = await APIService.getCourses();
      if (courseResult.success) {
        const transformedCourses = courseResult.data.map(c => ({
          ...c,
          id: c._id,
          maxStudents: c.maxStudents,
          enrolled: c.enrolled,
          startDate: c.startDate,
          endDate: c.endDate
        }));
        setCourses(transformedCourses);
      }
      
      alert(`Successfully enrolled in ${course.title}!`);
    } else {
      alert(`Enrollment failed: ${result.error}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="large" message="Loading available courses..." overlay={true} />;
  }

  return (
    <div className="student-dashboard">
      {/* Student Welcome Section */}
      <div className="student-welcome">
        <h2 className="welcome-title">Welcome back, {user?.name?.split(' ')[0] || user?.name}! 🎓</h2>
        <p className="welcome-subtitle">Ready to continue your learning journey and master new skills?</p>
      </div>

      {/* Available Courses Section */}
      <div className="available-courses-section">
        <h2>Available Skill Courses</h2>
        
        {/* Search and Filter Controls */}
        <div className="course-controls">
          <div className="search-filter-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-controls">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="title">Sort by Title</option>
                <option value="date">Sort by Start Date</option>
                <option value="level">Sort by Level</option>
              </select>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="courses-grid">
          {currentCourses.map(course => (
            <div 
              key={course.id} 
              className={`course-card ${isEnrolled(course.id) ? 'clickable-card enrolled-course' : 'non-clickable-card'}`}
              onClick={(e) => handleCourseClick(course, e)}
              style={{ 
                cursor: isEnrolled(course.id) ? 'pointer' : 'default',
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
                <span className={`course-level level-${course.level.toLowerCase()}`}>{course.level}</span>
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
                    <span className="detail-text">{new Date(course.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">👥</span>
                    <span className="detail-text">{course.enrolled}/{course.maxStudents}</span>
                  </div>
                </div>
              </div>

              
              <div className="course-actions">
                <button
                  type="button"
                  onClick={() => registerForCourse(course)}
                  disabled={isEnrolled(course.id) || (course.enrolled >= course.maxStudents && !isEnrolled(course.id))}
                  className={`register-btn ${
                    course.enrolled >= course.maxStudents && !isEnrolled(course.id) ? 'full' : ''
                  } ${isEnrolled(course.id) ? 'registered' : ''}`}
                >
                  <span className="btn-icon">
                    {isEnrolled(course.id) ? '✅' : course.enrolled >= course.maxStudents ? '🔒' : '📝'}
                  </span>
                  {isEnrolled(course.id) ? 'Registered' : course.enrolled >= course.maxStudents ? 'Full' : 'Register Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}

        {/* Results Summary */}
        <div className="results-summary">
          Showing {indexOfFirstCourse + 1}-{Math.min(indexOfLastCourse, filteredCourses.length)} of {filteredCourses.length} courses
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;