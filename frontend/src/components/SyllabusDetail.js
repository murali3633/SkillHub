import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import './SyllabusDetail.css';
import APIService from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const SyllabusDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { course } = location.state || {};
  
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showMobileVideo, setShowMobileVideo] = useState(false);
  const [courseProgress, setCourseProgress] = useState({
    overallProgress: 0,
    certificateGenerated: false,
    isCompleted: false
  });
  const [moduleProgress, setModuleProgress] = useState({});
  const [unlockedModules, setUnlockedModules] = useState(new Set([0])); // First module is always unlocked

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Set first module and video as default when course loads
  useEffect(() => {
    if (course && course.syllabus && course.syllabus.length > 0) {
      const firstModule = course.syllabus[0];
      setSelectedModule(firstModule);
      
      // Set first video if available
      if (firstModule.youtubeLinks && firstModule.youtubeLinks.length > 0) {
        setSelectedVideo({
          url: firstModule.youtubeLinks[0],
          title: `${getModuleLabel(firstModule, 0)} - Tutorial Video 1`,
          moduleIndex: 0,
          videoIndex: 0
        });
      }
    }
  }, [course]);

  // Check if certificate exists and load progress on component mount
  useEffect(() => {
    if (course?.id) {
      // Certificate validation will be done in separate useEffect after progress loads
      
      // Load module progress from localStorage
      const progressKey = `module_progress_${course.id}`;
      const savedProgress = localStorage.getItem(progressKey);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        
        // Convert completedVideos arrays back to Sets
        const convertedProgress = {};
        Object.keys(progress).forEach(key => {
          convertedProgress[key] = {
            ...progress[key],
            completedVideos: new Set(progress[key].completedVideos || [])
          };
        });
        
        setModuleProgress(convertedProgress);
        
        // Determine unlocked modules based on completed ones
        const completedModules = Object.keys(convertedProgress).filter(moduleIndex => 
          convertedProgress[moduleIndex].completed
        ).map(Number);
        
        const unlocked = new Set([0]); // First module always unlocked
        completedModules.forEach(moduleIndex => {
          unlocked.add(moduleIndex + 1); // Unlock next module
        });
        setUnlockedModules(unlocked);
      }
    }
  }, [course?.id]);

  // Validate certificate status after progress is loaded
  useEffect(() => {
    if (course?.id && Object.keys(moduleProgress).length > 0) {
      const certificateKey = `certificate_${course.id}`;
      const certificateData = localStorage.getItem(certificateKey);
      
      if (certificateData) {
        // Verify that all modules are actually unlocked and completed
        const totalModules = course.syllabus.length;
        const allModulesCompleted = course.syllabus.every((_, index) => 
          moduleProgress[index]?.completed
        );
        const allModulesUnlocked = unlockedModules.size >= totalModules;
        
        if (allModulesUnlocked && allModulesCompleted) {
          setCourseProgress(prev => ({
            ...prev,
            certificateGenerated: true,
            isCompleted: true
          }));
        } else {
          // Remove invalid certificate from localStorage
          localStorage.removeItem(certificateKey);
          setCourseProgress(prev => ({
            ...prev,
            certificateGenerated: false,
            isCompleted: false
          }));
        }
      }
    }
  }, [course?.id, course.syllabus, moduleProgress, unlockedModules]);

  // Generate certificate
  const generateCertificate = async () => {
    // Validate requirements before generating
    const totalModules = course.syllabus.length;
    const allModulesCompleted = course.syllabus.every((_, index) => 
      moduleProgress[index]?.completed
    );
    const allModulesUnlocked = unlockedModules.size >= totalModules;
    
    if (!allModulesUnlocked || !allModulesCompleted) {
      alert('❌ Cannot generate certificate. Please unlock and complete all modules first.');
      return;
    }
    
    try {
      const result = await APIService.generateCertificate(course.id);
      if (result.success) {
        setCourseProgress(prev => ({
          ...prev,
          certificateGenerated: true,
          isCompleted: true
        }));
        alert('🎉 Congratulations! Your certificate has been generated!');
      } else {
        alert('Error generating certificate: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate. Please try again.');
    }
  };

  // Download certificate
  const downloadCertificate = async () => {
    try {
      console.log('Starting certificate download for course:', course.id);
      const userName = user?.name || 'Student';
      const courseName = course?.title || 'Course';
      const result = await APIService.downloadCertificate(course.id, userName, courseName);
      console.log('Download result:', result);
      
      if (result.success && (result.data.certificateUrl || result.data.certificateHTML)) {
        const fileName = `SkillHub-Certificate-${course.id}-${new Date().toISOString().split('T')[0]}.html`;
        
        // Use a more reliable download method
        if (result.data.certificateHTML) {
          try {
            // Method 1: Direct blob download (most reliable)
            const blob = new Blob([result.data.certificateHTML], { 
              type: 'text/html;charset=utf-8' 
            });
            
            // Check if browser supports the download API
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
              // For Internet Explorer/Edge
              window.navigator.msSaveOrOpenBlob(blob, fileName);
              alert('✅ Certificate downloaded successfully! Check your Downloads folder.');
            } else {
              // For modern browsers
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              
              // Set download attributes
              link.href = url;
              link.download = fileName;
              link.style.display = 'none';
              link.setAttribute('download', fileName);
              
              // Trigger download
              document.body.appendChild(link);
              
              // Use setTimeout to ensure the link is in DOM
              setTimeout(() => {
                link.click();
                
                // Clean up immediately after click
                setTimeout(() => {
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                }, 100);
                
                alert('✅ Certificate downloaded successfully! Check your Downloads folder.');
              }, 10);
            }
          } catch (blobError) {
            console.error('Blob download error:', blobError);
            
            // Fallback: Open in new window with save instructions
            try {
              const newWindow = window.open('', '_blank', 'width=900,height=700');
              if (newWindow) {
                newWindow.document.write(`
                  <html>
                    <head>
                      <title>Certificate Download</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                        .download-btn { 
                          background: #10b981; 
                          color: white; 
                          border: none; 
                          padding: 15px 30px; 
                          border-radius: 8px; 
                          font-size: 16px; 
                          cursor: pointer; 
                          margin: 20px;
                        }
                        .instructions { 
                          background: #f0f9ff; 
                          padding: 20px; 
                          border-radius: 8px; 
                          margin: 20px 0;
                        }
                      </style>
                    </head>
                    <body>
                      <h2>📄 Certificate Ready for Download</h2>
                      <div class="instructions">
                        <p><strong>Instructions:</strong></p>
                        <p>1. Click the "Download Certificate" button below</p>
                        <p>2. Or use <kbd>Ctrl+S</kbd> (Windows) / <kbd>Cmd+S</kbd> (Mac) to save</p>
                        <p>3. Choose location and save as HTML file</p>
                      </div>
                      <button class="download-btn" onclick="downloadCert()">💾 Download Certificate</button>
                      <button class="download-btn" onclick="window.print()">🖨️ Print Certificate</button>
                      <hr style="margin: 30px 0;">
                      <div style="border: 2px solid #ccc; padding: 20px; margin: 20px;">
                        ${result.data.certificateHTML}
                      </div>
                      <script>
                        function downloadCert() {
                          const blob = new Blob([\`${result.data.certificateHTML.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`], { type: 'text/html' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = '${fileName}';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        }
                      </script>
                    </body>
                  </html>
                `);
                newWindow.document.close();
                alert('📄 Certificate opened in new window. Use the download button or Ctrl+S to save.');
              }
            } catch (windowError) {
              console.error('Window fallback error:', windowError);
              
              // Final fallback: Copy to clipboard
              try {
                navigator.clipboard.writeText(result.data.certificateHTML).then(() => {
                  alert('📋 Certificate HTML copied to clipboard! You can paste it into a text editor and save as .html file.');
                });
              } catch (clipboardError) {
                alert('❌ Download failed. Please try again or contact support.');
              }
            }
          }
        } else {
          alert('❌ Certificate data not available. Please generate certificate first.');
        }
      } else {
        console.error('Download failed:', result.error);
        alert('Error downloading certificate: ' + (result.error || 'Certificate not found. Please generate certificate first.'));
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Error downloading certificate. Please try again.');
    }
  };

  // View certificate in browser
  const viewCertificate = async () => {
    try {
      const userName = user?.name || 'Student';
      const courseName = course?.title || 'Course';
      const result = await APIService.downloadCertificate(course.id, userName, courseName);
      if (result.success) {
        const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        if (newWindow) {
          // Write certificate HTML directly to avoid network issues
          const certificateHTML = result.data.certificateHTML || '';
          const wrappedHTML = `
            <html>
              <head>
                <title>Certificate - Course ${course.id}</title>
                <style>
                  .controls { 
                    position: fixed; 
                    top: 10px; 
                    right: 10px; 
                    z-index: 1000;
                    background: white;
                    padding: 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  .controls button {
                    margin: 0 5px;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                  }
                  .print-btn { background: #3b82f6; color: white; }
                  .close-btn { background: #ef4444; color: white; }
                  .download-btn { background: #10b981; color: white; }
                </style>
              </head>
              <body>
                <div class="controls">
                  <button class="print-btn" onclick="window.print()">🖨️ Print</button>
                  <button class="download-btn" onclick="saveAsFile()">💾 Save</button>
                  <button class="close-btn" onclick="window.close()">✕ Close</button>
                </div>
                <div style="margin-top: 60px;">
                  ${certificateHTML}
                </div>
                <script>
                  function saveAsFile() {
                    const blob = new Blob([\`${certificateHTML.replace(/`/g, '\\`')}\`], { type: 'text/html' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'SkillHub-Certificate-${course.id}-${new Date().toISOString().split('T')[0]}.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }
                </script>
              </body>
            </html>
          `;
          
          newWindow.document.write(wrappedHTML);
          newWindow.document.close();
        }
      } else {
        alert('Error viewing certificate: ' + (result.error || 'Certificate not found'));
      }
    } catch (error) {
      console.error('Error viewing certificate:', error);
      alert('Error viewing certificate. Please try again.');
    }
  };

  if (!course) {
    return (
      <div className="syllabus-detail-page">
        <div>
          <h2>Course not found</h2>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Function to determine the display label for each module/week
  const getModuleLabel = (moduleData, index) => {
    // If it's a module-based structure (from StudentDashboard)
    if (moduleData.module) {
      return moduleData.module;
    }
    // If it's a week-based structure (from FacultyDashboard)
    else if (moduleData.week) {
      return `Week ${moduleData.week}`;
    }
    // Default fallback
    else {
      return `Module ${index + 1}`;
    }
  };

  // Function to select a video
  const selectVideo = (moduleData, moduleIndex, videoUrl, videoIndex) => {
    // Check if module is unlocked
    if (!unlockedModules.has(moduleIndex)) {
      alert(`🔒 This module is locked. Complete the previous module to unlock it.`);
      return;
    }
    
    // Check if it's a mobile device (768px or smaller)
    const isMobile = window.innerWidth <= 768;
    
    setSelectedModule(moduleData);
    setSelectedVideo({
      url: videoUrl,
      title: `${getModuleLabel(moduleData, moduleIndex)} - Tutorial Video ${videoIndex + 1}`,
      moduleIndex,
      videoIndex
    });
    
    if (isMobile) {
      // Show mobile video overlay
      console.log('Mobile video overlay triggered', { videoUrl, moduleData, course });
      setShowMobileVideo(true);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Desktop behavior - scroll to video section
      setTimeout(() => {
        const videoSection = document.querySelector('.video-section');
        if (videoSection) {
          videoSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  };

  // Function to close mobile video overlay
  const closeMobileVideo = () => {
    setShowMobileVideo(false);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  };

  // Function to handle module checkbox change
  const handleModuleCheckboxChange = (moduleIndex) => {
    const updatedModuleProgress = { ...moduleProgress };
    
    // Initialize module progress if it doesn't exist
    if (!updatedModuleProgress[moduleIndex]) {
      updatedModuleProgress[moduleIndex] = {
        completedVideos: new Set(),
        totalVideos: course.syllabus[moduleIndex]?.youtubeLinks?.length || 0,
        completed: false
      };
    }
    
    // Toggle completion status
    const isCurrentlyCompleted = updatedModuleProgress[moduleIndex].completed;
    updatedModuleProgress[moduleIndex].completed = !isCurrentlyCompleted;
    
    if (!isCurrentlyCompleted) {
      // Mark as completed - unlock next module
      const nextModuleIndex = moduleIndex + 1;
      if (nextModuleIndex < course.syllabus.length) {
        setUnlockedModules(prev => new Set([...prev, nextModuleIndex]));
        alert(`🎉 Module ${moduleIndex + 1} marked as complete! Module ${nextModuleIndex + 1} is now unlocked.`);
      }
    } else {
      // Mark as incomplete - lock subsequent modules
      const modulesToLock = [];
      for (let i = moduleIndex + 1; i < course.syllabus.length; i++) {
        // Only lock if the previous modules are not completed
        let shouldLock = true;
        for (let j = 0; j < i; j++) {
          if (updatedModuleProgress[j]?.completed) {
            shouldLock = false;
            break;
          }
        }
        if (shouldLock) {
          modulesToLock.push(i);
        }
      }
      
      if (modulesToLock.length > 0) {
        setUnlockedModules(prev => {
          const newUnlocked = new Set(prev);
          modulesToLock.forEach(index => newUnlocked.delete(index));
          return newUnlocked;
        });
      }
    }
    
    setModuleProgress(updatedModuleProgress);
    
    // Save progress to localStorage
    const progressKey = `module_progress_${course.id}`;
    const progressToSave = {};
    Object.keys(updatedModuleProgress).forEach(key => {
      progressToSave[key] = {
        ...updatedModuleProgress[key],
        completedVideos: Array.from(updatedModuleProgress[key].completedVideos)
      };
    });
    localStorage.setItem(progressKey, JSON.stringify(progressToSave));
    
    // Check if all modules are unlocked AND completed for certificate generation
    const allModulesCompleted = course.syllabus.every((_, index) => 
      updatedModuleProgress[index]?.completed
    );
    const allModulesUnlocked = unlockedModules.size >= course.syllabus.length;
    const canGenerateCertificate = allModulesCompleted && allModulesUnlocked;
    
    if (canGenerateCertificate) {
      setCourseProgress(prev => ({
        ...prev,
        overallProgress: 100,
        isCompleted: true
      }));
      alert('🏆 Congratulations! You have unlocked and completed all modules. You can now generate your certificate!');
    } else {
      // Calculate overall progress
      const completedModulesCount = Object.values(updatedModuleProgress).filter(m => m.completed).length;
      const overallProgress = (completedModulesCount / course.syllabus.length) * 100;
      setCourseProgress(prev => ({
        ...prev,
        overallProgress: Math.round(overallProgress),
        isCompleted: false
      }));
    }
  };

  // Function to handle video completion
  const handleVideoComplete = (progressData) => {
    console.log('Video completed:', progressData);
    
    const { moduleIndex, videoIndex, completed } = progressData;
    
    if (completed) {
      // Update module progress
      const updatedModuleProgress = { ...moduleProgress };
      
      if (!updatedModuleProgress[moduleIndex]) {
        updatedModuleProgress[moduleIndex] = {
          completedVideos: new Set(),
          totalVideos: course.syllabus[moduleIndex]?.youtubeLinks?.length || 0,
          completed: false
        };
      }
      
      // Mark video as completed
      updatedModuleProgress[moduleIndex].completedVideos.add(videoIndex);
      
      // Check if all videos in this module are completed
      const completedVideosCount = updatedModuleProgress[moduleIndex].completedVideos.size;
      const totalVideos = updatedModuleProgress[moduleIndex].totalVideos;
      
      if (completedVideosCount >= totalVideos) {
        updatedModuleProgress[moduleIndex].completed = true;
        
        // Unlock next module
        const nextModuleIndex = moduleIndex + 1;
        if (nextModuleIndex < course.syllabus.length) {
          setUnlockedModules(prev => new Set([...prev, nextModuleIndex]));
          alert(`🎉 Module ${moduleIndex + 1} completed! Module ${nextModuleIndex + 1} is now unlocked.`);
        }
      }
      
      setModuleProgress(updatedModuleProgress);
      
      // Save progress to localStorage
      const progressKey = `module_progress_${course.id}`;
      const progressToSave = {};
      Object.keys(updatedModuleProgress).forEach(key => {
        progressToSave[key] = {
          ...updatedModuleProgress[key],
          completedVideos: Array.from(updatedModuleProgress[key].completedVideos)
        };
      });
      localStorage.setItem(progressKey, JSON.stringify(progressToSave));
      
      // Check if all modules are unlocked AND completed for certificate generation
      const allModulesCompleted = course.syllabus.every((_, index) => 
        updatedModuleProgress[index]?.completed
      );
      const allModulesUnlocked = unlockedModules.size >= course.syllabus.length;
      const canGenerateCertificate = allModulesCompleted && allModulesUnlocked;
      
      if (canGenerateCertificate) {
        setCourseProgress(prev => ({
          ...prev,
          overallProgress: 100,
          isCompleted: true
        }));
        alert('🏆 Congratulations! You have unlocked and completed all modules. You can now generate your certificate!');
      } else {
        // Calculate overall progress
        const completedModulesCount = Object.values(updatedModuleProgress).filter(m => m.completed).length;
        const overallProgress = (completedModulesCount / course.syllabus.length) * 100;
        setCourseProgress(prev => ({
          ...prev,
          overallProgress: Math.round(overallProgress),
          isCompleted: false
        }));
      }
    }
  };

  return (
    <div className="syllabus-detail-page">

      <div className="syllabus-layout">
        {/* Left Sidebar - Modules */}
        <div className="modules-sidebar">
          <h3>Course Modules</h3>
          <div className="modules-list">
            {course.syllabus && course.syllabus.length > 0 ? (
              course.syllabus.map((moduleData, moduleIndex) => {
                const isUnlocked = unlockedModules.has(moduleIndex);
                const isCompleted = moduleProgress[moduleIndex]?.completed || false;
                const completedVideos = moduleProgress[moduleIndex]?.completedVideos?.size || 0;
                const totalVideos = moduleData.youtubeLinks?.length || 0;
                
                return (
                  <div key={moduleIndex} className={`module-item ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}>
                    <div className="module-header">
                      <div className="module-status">
                        <span className="module-number">{getModuleLabel(moduleData, moduleIndex)}</span>
                        <div className="module-indicators">
                          {isCompleted && <span className="completion-badge">✅</span>}
                          {!isUnlocked && <span className="lock-badge">🔒</span>}
                          {isUnlocked && !isCompleted && <span className="progress-badge">📚</span>}
                        </div>
                      </div>
                      <h4 className="module-title">{moduleData.topic}</h4>
                      {isUnlocked && (
                        <div className="module-progress">
                          <span className="progress-text">{completedVideos}/{totalVideos} videos completed</span>
                          <div className="progress-bar-small">
                            <div 
                              className="progress-fill-small" 
                              style={{ width: `${totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  
                    {/* Videos in this module */}
                    {isUnlocked && moduleData.youtubeLinks && moduleData.youtubeLinks.length > 0 && (
                      <div className="module-videos">
                        {moduleData.youtubeLinks.map((videoUrl, videoIndex) => {
                          const isVideoCompleted = moduleProgress[moduleIndex]?.completedVideos?.has?.(videoIndex) || 
                                                  (Array.isArray(moduleProgress[moduleIndex]?.completedVideos) && 
                                                   moduleProgress[moduleIndex].completedVideos.includes(videoIndex));
                          
                          return (
                            <div
                              key={videoIndex}
                              className={`video-item ${
                                selectedVideo?.moduleIndex === moduleIndex && 
                                selectedVideo?.videoIndex === videoIndex ? 'active' : ''
                              } ${isVideoCompleted ? 'completed' : ''}`}
                            >
                              <div className="video-info" onClick={() => selectVideo(moduleData, moduleIndex, videoUrl, videoIndex)}>
                                <span className="video-number">{videoIndex + 1}</span>
                                <span className="video-title">Tutorial Video {videoIndex + 1}</span>
                                {isVideoCompleted && <span className="video-completed">✓</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Locked module message */}
                    {!isUnlocked && (
                      <div className="locked-message">
                        <p>🔒 Complete the previous module to unlock</p>
                      </div>
                    )}

                    {/* Files in this module */}
                    {isUnlocked && moduleData.fileUploads && moduleData.fileUploads.length > 0 && (
                      <div className="module-files">
                        <h5>📄 Course Materials:</h5>
                        {moduleData.fileUploads.map((file, fileIndex) => (
                          <div key={fileIndex} className="file-item">
                            <span className="file-icon">📄</span>
                            <span className="file-name">{file.fileName}</span>
                            <a 
                              href={file.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="download-link"
                              download={file.fileName}
                            >
                              Download
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Module completion checkbox at the end */}
                    {isUnlocked && (
                      <div className="module-completion-section">
                        <div className="module-checkbox-container">
                          <input
                            type="checkbox"
                            id={`module-${moduleIndex}`}
                            className="module-checkbox"
                            checked={isCompleted}
                            onChange={() => handleModuleCheckboxChange(moduleIndex)}
                            disabled={!isUnlocked}
                          />
                          <label htmlFor={`module-${moduleIndex}`} className="checkbox-label">
                            Mark Module as Complete
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="no-modules">No modules available for this course.</p>
            )}
          </div>

          {/* Certificate Section */}
          <div className="certificate-section">
            <div className="certificate-header">
              <h4>🏆 Course Certificate</h4>
              <p>Complete your learning journey</p>
            </div>
            
            <div className="certificate-actions">
              {courseProgress.certificateGenerated ? (
                <div className="certificate-ready">
                  <p className="certificate-status">✅ Certificate Ready!</p>
                  <div className="certificate-buttons">
                    <button 
                      className="certificate-btn view"
                      onClick={viewCertificate}
                    >
                      👁️ View Certificate
                    </button>
                    <button 
                      className="certificate-btn download"
                      onClick={downloadCertificate}
                    >
                      📥 Download Certificate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="certificate-generate">
                  {(() => {
                    // Check if all modules are unlocked AND completed
                    const totalModules = course.syllabus.length;
                    const allModulesUnlocked = unlockedModules.size >= totalModules;
                    const allModulesCompleted = course.syllabus.every((_, index) => 
                      moduleProgress[index]?.completed
                    );
                    const canGenerateCertificate = allModulesUnlocked && allModulesCompleted;
                    
                    if (canGenerateCertificate) {
                      return (
                        <>
                          <p className="certificate-info">🎉 All modules unlocked and completed! Generate your certificate</p>
                          <button 
                            className="certificate-btn generate"
                            onClick={generateCertificate}
                          >
                            🏆 Generate Certificate
                          </button>
                        </>
                      );
                    } else {
                      const unlockedCount = unlockedModules.size;
                      const completedCount = Object.values(moduleProgress).filter(m => m.completed).length;
                      
                      return (
                        <>
                          <p className="certificate-info">
                            {!allModulesUnlocked 
                              ? `Unlock all modules to generate certificate (${unlockedCount}/${totalModules} unlocked)`
                              : `Complete all modules to generate certificate (${completedCount}/${totalModules} completed)`
                            }
                          </p>
                          <div className="progress-info">
                            <p>Unlocked: {unlockedCount}/{totalModules} modules</p>
                            <p>Completed: {completedCount}/{totalModules} modules</p>
                            <div className="overall-progress-bar">
                              <div 
                                className="overall-progress-fill" 
                                style={{ width: `${canGenerateCertificate ? 100 : (Math.min(unlockedCount, completedCount) / totalModules) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <button 
                            className="certificate-btn generate disabled"
                            disabled
                            title={!allModulesUnlocked ? "Unlock all modules first" : "Complete all modules to unlock certificate"}
                          >
                            🔒 Certificate Locked
                          </button>
                        </>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side - Video Player */}
        <div className="video-section">
          {selectedVideo ? (
            <div className="current-video" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h2>{selectedVideo.title}</h2>
              <div style={{ flex: 1, minHeight: 0 }}>
                <VideoPlayer
                  videoUrl={selectedVideo.url}
                  courseId={course.id}
                  moduleId={selectedVideo.moduleIndex}
                  videoId={selectedVideo.videoIndex}
                  onVideoComplete={handleVideoComplete}
                />
              </div>
              {selectedModule && (
                <div className="video-description">
                  <div className="module-info-header">
                    <h3>About this module</h3>
                    <div className="video-progress-info">
                      <span className="progress-label">Progress: 0%</span>
                    </div>
                  </div>
                  <p>{selectedModule.topic}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-video-selected">
              <div className="placeholder">
                <h2>Select a video to start learning</h2>
                <p>Choose a video from the modules on the left to begin watching.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Video Overlay */}
      {showMobileVideo && (
        <div className="mobile-video-overlay">
          <div className="mobile-video-header">
            <button onClick={closeMobileVideo} className="close-button">
              <span className="close-icon">×</span>
            </button>
            <div className="video-info-header">
              <h1 className="course-title">{course?.title || 'Course'}</h1>
              <p className="video-title-header">{selectedVideo?.title || 'Video'}</p>
            </div>
          </div>
          
          <div className="mobile-video-container">
            {selectedVideo?.url ? (
              <VideoPlayer 
                videoUrl={selectedVideo.url}
                title={selectedVideo.title}
                courseId={course?.id}
                moduleId={selectedVideo.moduleIndex}
                videoId={selectedVideo.videoIndex}
                onVideoComplete={handleVideoComplete}
              />
            ) : (
              <div className="video-loading">
                <p>Loading video...</p>
              </div>
            )}
          </div>
          
          <div className="mobile-video-description">
            <div className="video-meta">
              <h2>{selectedVideo?.title || 'Video Title'}</h2>
              {selectedModule && (
                <div className="module-description">
                  <h3>About this Module</h3>
                  <p>{selectedModule.topic || selectedModule.description || 'Module description'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusDetail;