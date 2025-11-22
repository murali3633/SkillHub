// API service for connecting to backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

class APIService {
  // Set token in header for authenticated requests
  static setAuthToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get authentication token
  static getToken() {
    const token = localStorage.getItem('token');
    console.log('Getting token:', token ? 'Token exists' : 'No token found');
    return token;
  }

  // Check if token is valid
  static isTokenValid() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Basic token validation (you can enhance this)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      console.log('Token validation:', { isExpired, exp: new Date(payload.exp * 1000) });
      return !isExpired;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Clear invalid tokens
  static clearInvalidToken() {
    if (!this.isTokenValid()) {
      console.log('Clearing invalid token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return true;
    }
    return false;
  }

  // Login user
  static async login(email, password) {
    try {
      console.log('Attempting login for:', email);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Full login URL:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', response.status);

      if (response.status === 401) {
        return { success: false, error: 'Invalid email or password' };
      }

      const data = await response.json();
      console.log('Login response data:', data);

      if (response.ok) {
        this.setAuthToken(data.token);
        return { success: true, user: data.user, token: data.token };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login API error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'Cannot connect to server. Please check if the backend is running.' };
      }
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Register user
  static async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token to localStorage
        this.setAuthToken(data.token);
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Register API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get user profile
  static async getProfile() {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        // If token is invalid, remove it
        if (response.status === 401) {
          this.setAuthToken(null);
        }
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Get profile API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Logout user
  static logout() {
    this.setAuthToken(null);
  }

  // Get all courses
  static async getCourses() {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Get courses API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get course by ID
  static async getCourseById(courseId) {
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Get course by ID API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Create a new course (faculty only)
  static async createCourse(courseData) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      console.log('Sending course data to API:', courseData);
      console.log('API URL:', `${API_BASE_URL}/courses`);

      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();
      console.log('API Response status:', response.status);
      console.log('API Response data:', data);

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Create course API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Update a course (faculty only)
  static async updateCourse(courseId, courseData) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Update course API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Delete a course (faculty only)
  static async deleteCourse(courseId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Delete course API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Restore a course (faculty only)
  static async restoreCourse(courseId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/restore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Restore course API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Permanently delete a course (faculty only)
  static async permanentDeleteCourse(courseId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Permanent delete course API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Enroll in a course
  static async enrollInCourse(courseId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Enroll in course API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get enrolled courses
  static async getEnrolledCourses() {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/enrolled`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Get enrolled courses API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Unenroll from a course
  static async unenrollFromCourse(courseId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/unenroll`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Unenroll from course API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get enrolled students for a specific course (faculty only)
  static async getEnrolledStudents(courseId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      console.log('Making API call to:', `${API_BASE_URL}/courses/${courseId}/students`);
      
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/students`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('API response status:', response.status);
      console.log('API response data:', data);

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Get enrolled students API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get courses for current faculty member
  static async getMyFacultyCourses() {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/my-courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Get my faculty courses API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Faculty unenroll a student from course
  static async facultyUnenrollStudent(courseId, studentId) {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Unenroll student API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get course modules with videos
  static async getCourseModules(courseId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/modules`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data: data.modules };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Get course modules API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Get course progress
  static async getCourseProgress(courseId) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/progress/${courseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Get course progress API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Update video progress
  static async updateVideoProgress(progressData) {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/progress/video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Video progress API error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  // Generate certificate (Mock implementation)
  static async generateCertificate(courseId) {
    try {
      // Mock certificate generation - simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Store certificate generation status in localStorage
      const certificateKey = `certificate_${courseId}`;
      const certificateData = {
        courseId: courseId,
        generatedAt: new Date().toISOString(),
        certificateId: `CERT_${courseId}_${Date.now()}`,
        status: 'generated'
      };
      
      localStorage.setItem(certificateKey, JSON.stringify(certificateData));
      
      return { 
        success: true, 
        data: {
          message: 'Certificate generated successfully',
          certificateId: certificateData.certificateId
        }
      };
    } catch (error) {
      console.error('Generate certificate API error:', error);
      return { success: false, error: 'Failed to generate certificate. Please try again.' };
    }
  }

  // Download certificate (Mock implementation with HTML certificate)
  static async downloadCertificate(courseId, userName = 'Student', courseName = 'Course') {
    try {
      // Check if certificate exists in localStorage
      const certificateKey = `certificate_${courseId}`;
      const certificateData = localStorage.getItem(certificateKey);
      
      if (!certificateData) {
        return { success: false, error: 'Certificate not found. Please generate certificate first.' };
      }
      
      const certInfo = JSON.parse(certificateData);
      
      // Generate HTML certificate with user and course info
      const certificateHTML = this.generateMockCertificateHTML(courseId, certInfo, userName, courseName);
      
      // Create a data URL instead of blob URL to avoid network issues
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(certificateHTML);
      
      console.log('Certificate data URL created, length:', dataUrl.length);
      
      return { 
        success: true, 
        data: { 
          certificateUrl: dataUrl,
          certificateHTML: certificateHTML,
          certificateId: certInfo.certificateId,
          isHTML: true
        }
      };
    } catch (error) {
      console.error('Download certificate API error:', error);
      return { success: false, error: 'Failed to download certificate. Please try again.' };
    }
  }

  // Generate mock certificate HTML content
  static generateMockCertificateHTML(courseId, certInfo, userName = 'Student', courseName = 'Course') {
    const certificateHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Certificate of Completion</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .certificate {
            max-width: 800px;
            background: white;
            padding: 60px;
            border: 8px solid #0369a1;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
        }
        .header {
            color: #0369a1;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .subheader {
            color: #0284c7;
            font-size: 24px;
            margin-bottom: 40px;
            font-style: italic;
        }
        .content {
            font-size: 18px;
            line-height: 1.8;
            color: #374151;
            margin-bottom: 40px;
        }
        .student-name {
            font-size: 32px;
            color: #0369a1;
            font-weight: bold;
            margin: 20px 0;
            text-decoration: underline;
        }
        .course-info {
            font-size: 20px;
            color: #0284c7;
            font-weight: bold;
            margin: 20px 0;
        }
        .details {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            font-size: 14px;
            color: #6b7280;
        }
        .signature {
            margin-top: 40px;
            font-size: 16px;
            color: #374151;
        }
        .logo {
            font-size: 36px;
            color: #0369a1;
            margin-bottom: 10px;
        }
        @media print {
            body { background: white; padding: 0; }
            .certificate { box-shadow: none; border: 2px solid #0369a1; }
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="logo">🎓</div>
        <div class="header">Certificate of Completion</div>
        <div class="subheader">SkillHub Learning Platform</div>
        
        <div class="content">
            This is to certify that
            <div class="student-name">${userName}</div>
            has successfully completed the course
            <div class="course-info">${courseName}</div>
            and has demonstrated proficiency in all required competencies.
        </div>
        
        <div class="signature">
            <strong>🎉 Congratulations on your achievement! 🎉</strong>
        </div>
        
        <div class="details">
            <div>Certificate ID: ${certInfo.certificateId}</div>
            <div>Date: ${new Date(certInfo.generatedAt).toLocaleDateString()}</div>
        </div>
    </div>
</body>
</html>`;
    
    return certificateHTML;
  }

}

export default APIService;