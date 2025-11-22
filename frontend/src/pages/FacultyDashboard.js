import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Analytics from '../components/Analytics';
import APIService from '../services/apiService';
const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEnrollments, setShowEnrollments] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const [addingYoutubeLink, setAddingYoutubeLink] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
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

  // Load faculty courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        // Fetch courses specific to the current faculty member
        const result = await APIService.getMyFacultyCourses();
        
        if (result.success) {
          setCourses(result.data);
        } else {
          console.error('Error loading faculty courses:', result.error);
        }
      } catch (error) {
        console.error('Error loading faculty courses:', error);
      }
    };

    if (user?.id) {
      loadCourses();
    }
  }, [user?.id]);

  // Load enrolled students for a specific course
  const loadEnrolledStudents = async (courseId) => {
    setLoadingStudents(true);
    try {
      console.log('Loading enrolled students for course:', courseId);
      const result = await APIService.getEnrolledStudents(courseId);
      console.log('API result:', result);
      
      if (result.success) {
        console.log('Enrolled students data:', result.data);
        setEnrolledStudents(result.data);
      } else {
        console.error('Error loading enrolled students:', result.error);
        setEnrolledStudents([]);
      }
    } catch (error) {
      console.error('Error loading enrolled students:', error);
      setEnrolledStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle view students button click
  const handleViewStudents = (courseId) => {
    setShowEnrollments(courseId);
    loadEnrolledStudents(courseId);
  };

  // Unenroll a student from the course
  const unenrollStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to unenroll ${studentName} from this course?`)) {
      return;
    }

    try {
      // Call API to unenroll student
      const result = await APIService.facultyUnenrollStudent(showEnrollments, studentId);
      
      if (result.success) {
        // Remove student from local state
        setEnrolledStudents(prev => prev.filter(student => student.id !== studentId));
        alert(`${studentName} has been successfully unenrolled from the course.`);
      } else {
        alert(`Failed to unenroll ${studentName}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      alert(`Error unenrolling ${studentName}. Please try again.`);
    }
  };

  // Export enrolled students to CSV
  const exportToCSV = () => {
    if (enrolledStudents.length === 0) {
      alert('No students to export');
      return;
    }

    // Get course name for filename
    const course = courses.find(c => c.id === showEnrollments);
    const courseName = course ? course.title.replace(/[^a-zA-Z0-9]/g, '_') : 'Course';
    
    // CSV headers
    const headers = ['Student Name', 'Registration Number', 'Enrolled Date'];
    
    // Convert data to CSV format
    const csvData = enrolledStudents.map(student => [
      student.name,
      student.registrationNumber,
      new Date(student.enrolledDate).toLocaleDateString()
    ]);
    
    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${courseName}_Enrolled_Students_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const categories = ['Programming', 'Marketing', 'Data Science', 'Management', 'Design', 'Business', 'Language', 'Other'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert course code to uppercase
    const processedValue = name === 'code' ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
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
      
      // Debug logging
      console.log('Current YouTube links:', currentLinks);
      console.log('Last link:', currentLinks[currentLinks.length - 1]);
      console.log('Last link trimmed:', currentLinks[currentLinks.length - 1]?.trim());
      
      // Only add if the last YouTube link is not empty or if there are no links
      if (currentLinks.length === 0 || (currentLinks[currentLinks.length - 1]?.trim() !== '')) {
        newSyllabus[moduleIndex].youtubeLinks.push('');
        console.log('Added new YouTube link. New count:', newSyllabus[moduleIndex].youtubeLinks.length);
      } else {
        console.log('Did not add YouTube link - last one is empty');
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

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    } else if (formData.code.trim().length < 3) {
      errors.code = 'Course code must be at least 3 characters';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }

    if (!formData.duration.trim()) {
      errors.duration = 'Duration is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        errors.endDate = 'End date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
      let result;
      
      if (editingCourse) {
        // Update existing course
        result = await APIService.updateCourse(editingCourse._id, courseData);
        if (result.success) {
          // Update local state
          setCourses(prev => prev.map(course => 
            course._id === editingCourse._id ? { ...result.data, id: result.data._id } : course
          ));
          alert('Course updated successfully!');
        }
      } else {
        // Create new course
        result = await APIService.createCourse(courseData);
        if (result.success) {
          // Add to local state
          setCourses(prev => [...prev, { ...result.data, id: result.data._id }]);
          alert('Course created successfully!');
        }
      }

      if (!result.success) {
        alert(`Operation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('An error occurred while saving the course');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
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
    setFormErrors({});
    setShowAddForm(false);
    setEditingCourse(null);
  };

  const handleEdit = (course) => {
    navigate('/edit-course', { state: { course } });
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        const result = await APIService.deleteCourse(courseId);
        
        if (result.success) {
          setCourses(prev => prev.map(course => course._id === courseId ? { ...course, isActive: false } : course));
          alert('Course deleted successfully!');
        } else {
          alert(`Delete failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('An error occurred while deleting the course');
      }
    }
  };

  const handleRestore = async (courseId) => {
    try {
      const result = await APIService.restoreCourse(courseId);
      
      if (result.success) {
        setCourses(prev => prev.map(course => course._id === courseId ? { ...course, isActive: true } : course));
        alert('Course restored successfully!');
      } else {
        alert(`Restore failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error restoring course:', error);
      alert('An error occurred while restoring the course');
    }
  };

  const handlePermanentDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) {
      try {
        const result = await APIService.permanentDeleteCourse(courseId);
        
        if (result.success) {
          setCourses(prev => prev.filter(course => course._id !== courseId));
          alert('Course permanently deleted successfully!');
        } else {
          alert(`Permanent delete failed: ${result.error}`);
        }
      } catch (error) {
        console.error('Error permanently deleting course:', error);
        alert('An error occurred while permanently deleting the course');
      }
    }
  };

  const activeCourses = courses.filter(course => course.isActive !== false);
  const deletedCourses = courses.filter(course => course.isActive === false);

  return (
    <div className="faculty-dashboard dashboard-container">
      <div className="dashboard-header">
        <h1>Faculty Dashboard</h1>
        <p>Welcome back, {user?.name}! Manage your courses and students.</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'courses' && (
        <>
          {/* Add/Edit Course Form */}
          {showAddForm && (
        <div className="course-form-section">
          <div className="form-container">
            <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
            <form onSubmit={handleSubmit} className="course-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Course Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={formErrors.title ? 'error' : ''}
                    placeholder="Enter course title"
                  />
                  {formErrors.title && <span className="error-message">{formErrors.title}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="code">Course Code *</label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className={formErrors.code ? 'error' : ''}
                    placeholder="e.g., WEB101, CUTM1021, CS101"
                  />
                  {formErrors.code && <span className="error-message">{formErrors.code}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={formErrors.category ? 'error' : ''}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {formErrors.category && <span className="error-message">{formErrors.category}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="level">Level</label>
                  <select
                    id="level"
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="capacity">Capacity *</label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className={formErrors.capacity ? 'error' : ''}
                    placeholder="Maximum students"
                    min="1"
                  />
                  {formErrors.capacity && <span className="error-message">{formErrors.capacity}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="duration">Duration *</label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className={formErrors.duration ? 'error' : ''}
                    placeholder="e.g., 8 weeks"
                  />
                  {formErrors.duration && <span className="error-message">{formErrors.duration}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={formErrors.startDate ? 'error' : ''}
                  />
                  {formErrors.startDate && <span className="error-message">{formErrors.startDate}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date *</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={formErrors.endDate ? 'error' : ''}
                  />
                  {formErrors.endDate && <span className="error-message">{formErrors.endDate}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={formErrors.description ? 'error' : ''}
                  placeholder="Enter course description"
                  rows="4"
                />
                {formErrors.description && <span className="error-message">{formErrors.description}</span>}
              </div>

              {/* Syllabus Section */}
              <div className="form-group">
                <label>Syllabus</label>
                <div className="syllabus-builder">
                  {formData.syllabus.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="module-builder">
                      <div className="module-header">
                        <h4>{module.module}</h4>
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
                          <label>Topic *</label>
                          <input
                            type="text"
                            value={module.topic}
                            onChange={(e) => handleSyllabusChange(moduleIndex, 'topic', e.target.value)}
                            placeholder="Module topic"
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>File Uploads</label>
                        
                        {/* Display uploaded files */}
                        {module.fileUploads && module.fileUploads.map((file, fileIndex) => (
                          <div key={fileIndex} className="file-display-row" style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            backgroundColor: '#f9f9f9'
                          }}>
                            <div className="file-info" style={{ flex: 1 }}>
                              <span className="file-name" style={{ fontWeight: 'bold' }}>
                                📄 {file.fileName}
                              </span>
                              <span className="file-size" style={{ color: '#666', marginLeft: '8px' }}>
                                ({file.fileSize})
                              </span>
                              <a 
                                href={file.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="file-link"
                                style={{ 
                                  marginLeft: '12px', 
                                  color: '#007bff', 
                                  textDecoration: 'none',
                                  fontSize: '14px'
                                }}
                              >
                                Open File
                              </a>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeFile(moduleIndex, fileIndex)}
                              className="remove-file-btn"
                              style={{
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
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
                          style={{
                            border: '2px dashed #007bff',
                            borderRadius: '8px',
                            padding: '20px',
                            textAlign: 'center',
                            backgroundColor: '#f8f9ff',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            marginTop: '10px'
                          }}
                          onClick={() => document.getElementById(`file-upload-${moduleIndex}`).click()}
                        >
                          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                            {uploadingFiles.size > 0 ? '⏳' : '📁'}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>
                            {uploadingFiles.size > 0 ? 'Uploading...' : 'Drag & Drop Files Here'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                            {uploadingFiles.size > 0 ? 'Please wait...' : 'or click to browse files'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
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
                              style={{
                                opacity: module.youtubeLinks.length === 1 ? 0.5 : 1,
                                cursor: module.youtubeLinks.length === 1 ? 'not-allowed' : 'pointer'
                              }}
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
                    + Add Another Module
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Courses Section */}
      <div className="courses-section">
        <div className="section-header">
          <h2>Your Courses ({activeCourses.length})</h2>
          <button 
            onClick={() => navigate('/add-course')}
            className="add-course-btn"
          >
            + Add New Course
          </button>
        </div>

        {activeCourses.length > 0 ? (
          <div className="courses-grid">
            {activeCourses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-content">
                  <div className="course-header">
                    <h3>{course.title}</h3>
                    <span className="course-code">{course.code}</span>
                  </div>
                  
                  <div className="course-category">{course.category}</div>
                  <p className="course-description">{course.description}</p>
                  
                  <div className="course-stats">
                    <div className="stat-item">
                      <span className="label">Enrolled:</span>
                      <span className="value">{course.enrolled}/{course.maxStudents}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Duration:</span>
                      <span className="value">{course.duration}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Level:</span>
                      <span className={`value level-${course.level.toLowerCase()}`}>{course.level}</span>
                    </div>
                  </div>
                </div>

                <div className="course-actions">
                  <button 
                    onClick={() => handleViewStudents(course._id)}
                    className="view-students-btn"
                  >
                    View Students 
                  </button>
                  <button 
                    onClick={() => handleEdit(course)}
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(course._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-courses">No courses created yet. Click "Add New Course" to get started!</p>
        )}
      </div>

      {/* Deleted Courses Section */}
      {deletedCourses.length > 0 && (
        <div className="deleted-courses-section">
          <h2>Deleted Courses ({deletedCourses.length})</h2>
          <div className="deleted-courses-list">
            {deletedCourses.map(course => (
              <div key={course._id} className="deleted-course-item">
                <div className="course-info">
                  <h4>{course.title} ({course.code})</h4>
                  <p>Deleted on {new Date(course.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="deleted-course-actions">
                  <button 
                    onClick={() => handleRestore(course._id)}
                    className="restore-btn"
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(course._id)}
                    className="permanent-delete-btn"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student Enrollments Modal */}
      {showEnrollments && (
        <div className="enrollments-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Enrolled Students</h3>
              <div className="modal-header-actions">
                <button 
                  onClick={exportToCSV}
                  className="export-csv-btn"
                  disabled={enrolledStudents.length === 0}
                >
                  📊 Export to CSV
                </button>
                <button 
                  onClick={() => setShowEnrollments(null)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="enrollments-table-container">
              <table className="enrollments-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Registration Number</th>
                    <th>Enrolled Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr>
                      <td colSpan="4" className="loading-students">Loading enrolled students...</td>
                    </tr>
                  ) : enrolledStudents.length > 0 ? (
                    enrolledStudents.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.registrationNumber}</td>
                        <td>{new Date(student.enrolledDate).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => unenrollStudent(student.id, student.name)}
                            className="unenroll-student-btn"
                            title={`Unenroll ${student.name}`}
                          >
                            🚫 Unenroll
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-enrollments">No students enrolled in this course yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <Analytics courses={activeCourses} />
      )}
    </div>
  );
};

export default FacultyDashboard;