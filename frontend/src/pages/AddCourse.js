import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import APIService from '../services/apiService';
import './AddCourse.css';

const AddCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const [addingYoutubeLink, setAddingYoutubeLink] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    category: '',
    description: '',
    capacity: '',
    duration: '',
    level: 'Beginner',
    startDate: '',
    endDate: '',
    syllabus: [{ module: 'Module 1', topic: '', youtubeLinks: [''], fileUploads: [] }]
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle syllabus changes
  const handleSyllabusChange = (index, field, value, subIndex = null, subField = null) => {
    setFormData(prev => {
      const newSyllabus = [...prev.syllabus];
      
      if (subField) {
        // Handle nested array changes (tutorials or youtubeLinks)
        newSyllabus[index][subField][subIndex] = value;
      } else if (subIndex !== null) {
        // Handle array changes (tutorials)
        newSyllabus[index][field][subIndex] = value;
      } else {
        // Handle direct field changes
        newSyllabus[index][field] = value;
      }
      
      return {
        ...prev,
        syllabus: newSyllabus
      };
    });
  };

  // Add a new module to syllabus
  const addModule = () => {
    setFormData(prev => ({
      ...prev,
      syllabus: [
        ...prev.syllabus,
        { module: `Module ${prev.syllabus.length + 1}`, topic: '', youtubeLinks: [''], fileUploads: [] }
      ]
    }));
  };

  // Remove a module from syllabus
  const removeModule = (index) => {
    if (formData.syllabus.length > 1) {
      setFormData(prev => ({
        ...prev,
        syllabus: prev.syllabus.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle file upload and convert to link
  const handleFileUpload = useCallback(async (moduleIndex, file) => {
    if (!file) return;
    
    // Create unique file identifier
    const fileId = `${moduleIndex}-${file.name}-${file.size}`;
    
    // Check if file is currently being uploaded (prevent double execution)
    if (uploadingFiles.has(fileId)) {
      console.log('File upload already in progress:', file.name);
      return;
    }
    
    // Add to uploading set
    setUploadingFiles(prev => new Set([...prev, fileId]));
    
    try {
      // Get file info
      const fileName = file.name;
      const fileType = file.name.split('.').pop().toLowerCase();
      const fileSize = formatFileSize(file.size);

      // Check if file already exists to prevent duplicates
      const existingFiles = formData.syllabus[moduleIndex].fileUploads || [];
      const fileExists = existingFiles.some(existingFile => 
        existingFile.fileName === file.name && 
        existingFile.fileSize === fileSize
      );
      
      if (fileExists) {
        alert('This file has already been uploaded to this module.');
        return;
      }
      
      // For now, we'll simulate file upload by creating a URL
      // In production, you would upload to a cloud service like AWS S3, Cloudinary, etc.
      const fileUrl = URL.createObjectURL(file);
      
      // Add file info to the module
      setFormData(prev => {
        const newSyllabus = [...prev.syllabus];
        if (!newSyllabus[moduleIndex].fileUploads) {
          newSyllabus[moduleIndex].fileUploads = [];
        }
        
        // Double-check for duplicates in current state
        const currentExists = newSyllabus[moduleIndex].fileUploads.some(existingFile => 
          existingFile.fileName === fileName && existingFile.fileSize === fileSize
        );
        
        if (!currentExists) {
          newSyllabus[moduleIndex].fileUploads.push({
            fileName,
            fileUrl,
            fileType,
            fileSize,
            uploadedAt: new Date()
          });
        }
        
        return {
          ...prev,
          syllabus: newSyllabus
        };
      });
      
      alert(`File "${fileName}" uploaded successfully!`);
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      // Remove from uploading set after a delay
      setTimeout(() => {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }, 1000);
    }
  }, [formData.syllabus, uploadingFiles]);

  // Handle drag and drop with visual feedback
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = '#e3f2fd';
    e.currentTarget.style.borderColor = '#1976d2';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = '#e3f2fd';
    e.currentTarget.style.borderColor = '#1976d2';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.backgroundColor = '#f8f9ff';
    e.currentTarget.style.borderColor = '#007bff';
  };

  const handleDrop = (e, moduleIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset visual feedback
    e.currentTarget.style.backgroundColor = '#f8f9ff';
    e.currentTarget.style.borderColor = '#007bff';
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(moduleIndex, files[0]);
    }
  };

  // Remove a file from a module
  const removeFile = (moduleIndex, fileIndex) => {
    setFormData(prev => {
      const newSyllabus = [...prev.syllabus];
      newSyllabus[moduleIndex].fileUploads.splice(fileIndex, 1);
      return {
        ...prev,
        syllabus: newSyllabus
      };
    });
  };

  // Add a YouTube link to a module
  const addYoutubeLink = (moduleIndex) => {
    if (addingYoutubeLink) return; // Prevent double-clicks
    
    setAddingYoutubeLink(true);
    setTimeout(() => setAddingYoutubeLink(false), 500); // Reset after 500ms
    
    setFormData(prev => {
      const newSyllabus = [...prev.syllabus];
      const currentLinks = newSyllabus[moduleIndex].youtubeLinks;
      
      // Only add if the last YouTube link is not empty or if there are no links
      if (currentLinks.length === 0 || (currentLinks[currentLinks.length - 1]?.trim() !== '')) {
        newSyllabus[moduleIndex].youtubeLinks.push('');
      }
      
      return {
        ...prev,
        syllabus: newSyllabus
      };
    });
  };

  // Remove a YouTube link from a module
  const removeYoutubeLink = (moduleIndex, linkIndex) => {
    setFormData(prev => {
      const newSyllabus = [...prev.syllabus];
      if (newSyllabus[moduleIndex].youtubeLinks.length > 1) {
        newSyllabus[moduleIndex].youtubeLinks.splice(linkIndex, 1);
      } else {
        // If only one YouTube link, clear its value instead of removing
        newSyllabus[moduleIndex].youtubeLinks[0] = '';
      }
      return {
        ...prev,
        syllabus: newSyllabus
      };
    });
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Course title is required';
    if (!formData.code.trim()) errors.code = 'Course code is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.capacity.trim()) errors.capacity = 'Capacity is required';
    if (!formData.duration.trim()) errors.duration = 'Duration is required';
    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.endDate) errors.endDate = 'End date is required';
    
    // Validate dates
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Filter out empty youtube links and ensure fileUploads exist
    const cleanedSyllabus = formData.syllabus.map(module => ({
      ...module,
      youtubeLinks: module.youtubeLinks.filter(link => link.trim() !== ''),
      fileUploads: module.fileUploads || []
    })).filter(module => module.topic.trim() !== '');

    const courseData = {
      title: formData.title,
      code: formData.code,
      category: formData.category,
      description: formData.description,
      instructor: user?.name || 'Dr. Smith',
      duration: formData.duration,
      level: formData.level,
      maxStudents: parseInt(formData.capacity),
      startDate: formData.startDate,
      endDate: formData.endDate,
      syllabus: cleanedSyllabus
    };

    try {
      const result = await APIService.createCourse(courseData);
      
      if (result.success) {
        alert('Course created successfully!');
        navigate('/faculty-dashboard');
      } else {
        alert(`Course creation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('An error occurred while creating the course');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/faculty-dashboard');
    }
  };

  return (
    <div className="add-course-page">
      <div className="add-course-header">
        <button onClick={handleCancel} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>Create New Course</h1>
        <p>Fill in the details below to create a new course</p>
      </div>

      <form onSubmit={handleSubmit} className="add-course-form">
        {/* Basic Course Information */}
        <div className="form-section">
          <h2>Course Information</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Course Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter course title"
                className={formErrors.title ? 'error' : ''}
              />
              {formErrors.title && <span className="error-message">{formErrors.title}</span>}
            </div>
            
            <div className="form-group">
              <label>Course Code *</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., CS101"
                className={formErrors.code ? 'error' : ''}
              />
              {formErrors.code && <span className="error-message">{formErrors.code}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., Computer Science"
                className={formErrors.category ? 'error' : ''}
              />
              {formErrors.category && <span className="error-message">{formErrors.category}</span>}
            </div>
            
            <div className="form-group">
              <label>Level *</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter course description"
              rows="4"
              className={formErrors.description ? 'error' : ''}
            />
            {formErrors.description && <span className="error-message">{formErrors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Capacity *</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="Maximum students"
                min="1"
                className={formErrors.capacity ? 'error' : ''}
              />
              {formErrors.capacity && <span className="error-message">{formErrors.capacity}</span>}
            </div>
            
            <div className="form-group">
              <label>Duration *</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="e.g., 12 weeks"
                className={formErrors.duration ? 'error' : ''}
              />
              {formErrors.duration && <span className="error-message">{formErrors.duration}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={formErrors.startDate ? 'error' : ''}
              />
              {formErrors.startDate && <span className="error-message">{formErrors.startDate}</span>}
            </div>
            
            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className={formErrors.endDate ? 'error' : ''}
              />
              {formErrors.endDate && <span className="error-message">{formErrors.endDate}</span>}
            </div>
          </div>
        </div>

        {/* Syllabus Section */}
        <div className="form-section">
          <div className="section-header">
            <h2>Course Syllabus</h2>
          </div>

          {formData.syllabus.map((module, moduleIndex) => (
            <div key={moduleIndex} className="module-card">
              <div className="module-header">
                <h3>{module.module}</h3>
                {formData.syllabus.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModule(moduleIndex)}
                    className="remove-module-btn"
                  >
                    Remove Module
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Module Name</label>
                  <input
                    type="text"
                    value={module.module}
                    onChange={(e) => handleSyllabusChange(moduleIndex, 'module', e.target.value)}
                    placeholder="Module name"
                  />
                </div>
                <div className="form-group">
                  <label>Topic *</label>
                  <input
                    type="text"
                    value={module.topic}
                    onChange={(e) => handleSyllabusChange(moduleIndex, 'topic', e.target.value)}
                    placeholder="Module topic"
                  />
                </div>
              </div>
              
              {/* File Uploads Section */}
              <div className="form-group">
                <label>File Uploads</label>
                
                {/* Display uploaded files */}
                {module.fileUploads && module.fileUploads.map((file, fileIndex) => (
                  <div key={fileIndex} className="file-display-row">
                    <div className="file-info">
                      <span className="file-name">📄 {file.fileName}</span>
                      <span className="file-size">({file.fileSize})</span>
                      <a 
                        href={file.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        Open File
                      </a>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(moduleIndex, fileIndex)}
                      className="remove-file-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {/* Drag and Drop Upload Area */}
                <div 
                  className="file-upload-dropzone"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, moduleIndex)}
                  onClick={() => document.getElementById(`file-upload-${moduleIndex}`).click()}
                >
                  <div className="upload-icon">
                    {uploadingFiles.size > 0 ? '⏳' : '📁'}
                  </div>
                  <div className="upload-text">
                    {uploadingFiles.size > 0 ? 'Uploading...' : 'Drag & Drop Files Here'}
                  </div>
                  <div className="upload-subtext">
                    {uploadingFiles.size > 0 ? 'Please wait...' : 'or click to browse files'}
                  </div>
                  <div className="upload-formats">
                    Supported: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP, RAR
                  </div>
                  
                  <input
                    type="file"
                    id={`file-upload-${moduleIndex}`}
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        handleFileUpload(moduleIndex, e.target.files[0]);
                        e.target.value = ''; // Clear input to allow same file upload
                      }
                    }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              
              {/* YouTube Links Section */}
              <div className="form-group">
                <label>YouTube Tutorial Links</label>
                {module.youtubeLinks.map((link, linkIndex) => (
                  <div key={linkIndex} className="link-input-row">
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => handleSyllabusChange(moduleIndex, 'youtubeLinks', e.target.value, linkIndex)}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <button 
                      type="button" 
                      onClick={() => removeYoutubeLink(moduleIndex, linkIndex)}
                      className="remove-link-btn"
                      disabled={module.youtubeLinks.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={() => addYoutubeLink(moduleIndex)}
                  className="add-link-btn"
                  disabled={addingYoutubeLink}
                >
                  {addingYoutubeLink ? 'Adding...' : '+ Add YouTube Link'}
                </button>
              </div>
            </div>
          ))}
          
          <button type="button" onClick={addModule} className="add-module-btn">
            + Add Module
          </button>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="cancel-btn"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Course...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourse;
