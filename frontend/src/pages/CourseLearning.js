import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoPlayer from '../components/VideoPlayer';
import CourseProgressTracker from '../components/CourseProgressTracker';
import LoadingSpinner from '../components/LoadingSpinner';
import APIService from '../services/apiService';
import './CourseLearning.css';

const CourseLearning = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState({});
  const [courseProgress, setCourseProgress] = useState({
    overallProgress: 0,
    certificateGenerated: false,
    isCompleted: false
  });

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    setIsLoading(true);
    try {
      // Load course details, modules, and progress
      const [courseResult, modulesResult, progressResult] = await Promise.all([
        APIService.getCourseById(courseId),
        APIService.getCourseModules(courseId),
        APIService.getCourseProgress(courseId)
      ]);

      if (courseResult.success) {
        setCourse(courseResult.data);
      }

      if (modulesResult.success) {
        setModules(modulesResult.data);
      }

      if (progressResult.success) {
        setCourseProgress(progressResult.data.courseProgress);
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = (updatedProgress) => {
    setCourseProgress(updatedProgress);
  };

  const openVideoInYouTube = (videoUrl) => {
    if (videoUrl) {
      window.open(videoUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Video URL not available');
    }
  };

  const handleCourseComplete = (completionData) => {
    // Show completion modal or redirect
    alert(`🎉 Congratulations! You've completed ${course.title}!\nYour certificate is ready for download.`);
  };

  const generateCertificate = async () => {
    try {
      const result = await APIService.generateCertificate(courseId);
      if (result.success) {
        setCourseProgress(prev => ({
          ...prev,
          certificateGenerated: true,
          isCompleted: true
        }));
        alert('🎉 Congratulations! Your certificate has been generated!');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate. Please try again.');
    }
  };

  const downloadCertificate = async () => {
    try {
      const result = await APIService.downloadCertificate(courseId);
      if (result.success) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.data.certificateUrl;
        link.download = `certificate-${courseId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error downloading certificate. Please try again.');
    }
  };



  if (isLoading) {
    return <LoadingSpinner size="large" message="Loading course..." overlay={true} />;
  }

  if (!course) {
    return (
      <div className="course-not-found">
        <h2>Course not found</h2>
        <button onClick={() => navigate('/student-dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="course-learning-page">


      <CourseProgressTracker 
        courseId={courseId}
        onCourseComplete={handleCourseComplete}
        onProgressUpdate={handleProgressUpdate}
      />

      <div className="learning-content">
        <div className="course-details-section">
          <div className="course-info-card">
            <h2>Course Information</h2>
            <div className="course-details">
              <div className="detail-item">
                <strong>Course Title:</strong>
                <span>{course.title}</span>
              </div>
              <div className="detail-item">
                <strong>Instructor:</strong>
                <span>{course.instructor}</span>
              </div>
              <div className="detail-item">
                <strong>Duration:</strong>
                <span>{course.duration}</span>
              </div>
              <div className="detail-item">
                <strong>Level:</strong>
                <span>{course.level}</span>
              </div>
              <div className="detail-item">
                <strong>Category:</strong>
                <span>{course.category}</span>
              </div>
              <div className="detail-item">
                <strong>Start Date:</strong>
                <span>{new Date(course.startDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <strong>End Date:</strong>
                <span>{new Date(course.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="course-description-card">
            <h3>Course Description</h3>
            <p>{course.description}</p>
          </div>

          <div className="learning-instructions">
            <h3>How to Learn</h3>
            <div className="instruction-steps">
              <div className="step">
                <span className="step-number">1</span>
                <p>Click on any video from the course modules to watch on YouTube</p>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <p>After watching, come back and check the completion box</p>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <p>Complete all videos to unlock your certificate</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modules-sidebar">
          <h3>Course Modules</h3>
          <div className="modules-list">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="module-item">
                <div className="module-header">
                  <h4>Module {moduleIndex + 1}: {module.title}</h4>
                  <span className="module-duration">{module.duration}</span>
                </div>
                
                {module.videos && module.videos.length > 0 && (
                  <div className="videos-list">
                    {module.videos.map((video, videoIndex) => (
                      <div
                        key={video.id}
                        className="video-item"
                      >
                        <div className="video-info" onClick={() => openVideoInYouTube(video.videoUrl)}>
                          <span className="video-number">{videoIndex + 1}</span>
                          <span className="video-title">{video.title}</span>
                          <span className="youtube-icon">🎥</span>
                          <span className="video-duration">{video.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseLearning;
