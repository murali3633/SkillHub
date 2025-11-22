import React, { useState, useEffect } from 'react';
import APIService from '../services/apiService';
import './CourseProgressTracker.css';

const CourseProgressTracker = ({ courseId, onProgressUpdate, onCourseComplete }) => {
  const [courseProgress, setCourseProgress] = useState({
    totalModules: 0,
    completedModules: 0,
    totalVideos: 0,
    completedVideos: 0,
    overallProgress: 0,
    isCompleted: false,
    certificateGenerated: false
  });

  const [moduleProgress, setModuleProgress] = useState({});

  useEffect(() => {
    loadCourseProgress();
  }, [courseId]);

  const loadCourseProgress = async () => {
    try {
      // Load course progress from API
      const result = await APIService.getCourseProgress(courseId);
      if (result.success) {
        setCourseProgress(result.data.courseProgress);
        setModuleProgress(result.data.moduleProgress);
      }
    } catch (error) {
      console.error('Error loading course progress:', error);
    }
  };

  const updateVideoProgress = async (progressData) => {
    try {
      // Update video progress in backend
      const result = await APIService.updateVideoProgress({
        courseId: progressData.courseId,
        moduleId: progressData.moduleId,
        videoId: progressData.videoId,
        watchedPercentage: progressData.watchedPercentage,
        completed: progressData.completed
      });

      if (result.success) {
        // Reload progress to get updated stats
        await loadCourseProgress();
        
        // Check if course is now complete (only generate certificate when 100% complete)
        const updatedProgress = result.data.courseProgress;
        if (updatedProgress.overallProgress === 100 && !updatedProgress.certificateGenerated) {
          await generateCertificate();
        }

        if (onProgressUpdate) {
          onProgressUpdate(updatedProgress);
        }
      }
    } catch (error) {
      console.error('Error updating video progress:', error);
    }
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

        if (onCourseComplete) {
          onCourseComplete({
            courseId,
            certificateUrl: result.data.certificateUrl,
            completionDate: result.data.completionDate
          });
        }

        // Show success message
        alert('🎉 Congratulations! You have completed the course. Your certificate has been generated!');
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

  return (
    <div className="course-progress-tracker">
      <div className="progress-header">
        <h3>Course Progress</h3>
        <div className="progress-percentage">
          {Math.round(courseProgress.overallProgress)}%
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${courseProgress.overallProgress}%` }}
          ></div>
        </div>
      </div>

      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">Modules:</span>
          <span className="stat-value">
            {courseProgress.completedModules}/{courseProgress.totalModules}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Videos:</span>
          <span className="stat-value">
            {courseProgress.completedVideos}/{courseProgress.totalVideos}
          </span>
        </div>
      </div>

      {/* Certificate Section - Always Visible */}
      <div className="certificate-section">
        <div className="certificate-header">
          <h4>🏆 Course Certificate</h4>
          <div className="certificate-status">
            {courseProgress.overallProgress === 100 ? (
              courseProgress.certificateGenerated ? (
                <span className="status-badge available">✅ Available</span>
              ) : (
                <span className="status-badge ready">🎓 Ready to Generate</span>
              )
            ) : (
              <span className="status-badge locked">🔒 Locked</span>
            )}
          </div>
        </div>

        <div className="certificate-progress-info">
          <p>
            {courseProgress.overallProgress === 100 
              ? "Congratulations! You've completed all course requirements."
              : `Complete ${Math.round(100 - courseProgress.overallProgress)}% more to unlock your certificate.`
            }
          </p>
        </div>

        <div className="certificate-actions">
          {courseProgress.overallProgress === 100 ? (
            courseProgress.certificateGenerated ? (
              <button 
                className="certificate-btn download enabled"
                onClick={downloadCertificate}
              >
                📜 Download Certificate
              </button>
            ) : (
              <button 
                className="certificate-btn generate enabled"
                onClick={generateCertificate}
              >
                🏆 Generate Certificate
              </button>
            )
          ) : (
            <button 
              className="certificate-btn locked"
              disabled
              title={`Complete ${Math.round(100 - courseProgress.overallProgress)}% more to unlock`}
            >
              🔒 Certificate Locked
            </button>
          )}
        </div>
      </div>

      {courseProgress.overallProgress === 100 && (
        <div className="completion-celebration">
          <div className="celebration-badge">
            🎉 Course Completed!
          </div>
        </div>
      )}

      {courseProgress.overallProgress < 100 && (
        <div className="progress-message">
          <p>Complete all videos to earn your certificate!</p>
          <div className="remaining-progress">
            {Math.round(100 - courseProgress.overallProgress)}% remaining
          </div>
          <div className="certificate-note">
            <small>📋 Certificate will be generated automatically upon 100% completion</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseProgressTracker;
