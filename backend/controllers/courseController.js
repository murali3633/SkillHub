const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true });
    
    // Calculate actual enrollment count for each course
    const coursesWithActualEnrollment = await Promise.all(
      courses.map(async (course) => {
        const actualEnrollmentCount = await Enrollment.countDocuments({ course: course._id });
        
        // Update the course object with actual enrollment count
        const courseObj = course.toObject();
        courseObj.enrolled = actualEnrollmentCount;
        
        return courseObj;
      })
    );
    
    res.json(coursesWithActualEnrollment);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private/Faculty
const createCourse = async (req, res) => {
  try {
    console.log('Creating new course with data:', req.body);
    const { title, code, category, description, instructor, duration, level, maxStudents, startDate, endDate, syllabus } = req.body;
    
    // Check if course with this code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      console.log('Course with code already exists:', code);
      return res.status(400).json({ message: 'Course with this code already exists' });
    }
    
    // Create course
    const course = new Course({
      title,
      code,
      category,
      description,
      instructor,
      duration,
      level,
      maxStudents,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      syllabus
    });
    
    console.log('Saving course to MongoDB...');
    const savedCourse = await course.save();
    console.log('Course saved successfully:', savedCourse._id);
    res.status(201).json(savedCourse);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Faculty
const updateCourse = async (req, res) => {
  try {
    const { title, code, category, description, instructor, duration, level, maxStudents, startDate, endDate, syllabus, isActive } = req.body;
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if another course already has this code
    if (code && code !== course.code) {
      const existingCourse = await Course.findOne({ code });
      if (existingCourse) {
        return res.status(400).json({ message: 'Course with this code already exists' });
      }
    }
    
    // Update course fields
    course.title = title || course.title;
    course.code = code || course.code;
    course.category = category || course.category;
    course.description = description || course.description;
    course.instructor = instructor || course.instructor;
    course.duration = duration || course.duration;
    course.level = level || course.level;
    course.maxStudents = maxStudents || course.maxStudents;
    course.startDate = startDate ? new Date(startDate) : course.startDate;
    course.endDate = endDate ? new Date(endDate) : course.endDate;
    course.syllabus = syllabus || course.syllabus;
    course.isActive = isActive !== undefined ? isActive : course.isActive;
    course.updatedAt = Date.now();
    
    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a course (soft delete)
// @route   DELETE /api/courses/:id
// @access  Private/Faculty
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Soft delete by setting isActive to false
    course.isActive = false;
    course.updatedAt = Date.now();
    
    const updatedCourse = await course.save();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Restore a course (undo soft delete)
// @route   PUT /api/courses/:id/restore
// @access  Private/Faculty
const restoreCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Restore by setting isActive to true
    course.isActive = true;
    course.updatedAt = Date.now();
    
    const updatedCourse = await course.save();
    res.json({ 
      message: 'Course restored successfully',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Restore course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Permanently delete a course
// @route   DELETE /api/courses/:id/permanent
// @access  Private/Faculty
const permanentDeleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Permanently delete the course from database
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course permanently deleted successfully' });
  } catch (error) {
    console.error('Permanent delete course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get courses by faculty
// @route   GET /api/courses/faculty/:facultyId
// @access  Private/Faculty
const getCoursesByFaculty = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.params.facultyId });
    res.json(courses);
  } catch (error) {
    console.error('Get faculty courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get courses for current faculty member
// @route   GET /api/courses/my-courses
// @access  Private/Faculty
const getMyFacultyCourses = async (req, res) => {
  try {
    const facultyName = req.user.name;
    
    if (!facultyName) {
      return res.status(400).json({ message: 'Faculty name not found in token' });
    }
    
    // Find courses by exact match first, then try partial match
    let courses = await Course.find({ instructor: facultyName });
    
    if (courses.length === 0) {
      // Try case-insensitive search
      courses = await Course.find({ 
        instructor: { $regex: new RegExp(facultyName, 'i') }
      });
    }
    
    if (courses.length === 0) {
      // Try partial match (in case of "Dr. Smith" vs "Smith")
      const lastName = facultyName.split(' ').pop();
      courses = await Course.find({ 
        instructor: { $regex: new RegExp(lastName, 'i') }
      });
    }
    
    // Calculate actual enrollment count for each course
    const coursesWithActualEnrollment = await Promise.all(
      courses.map(async (course) => {
        const actualEnrollmentCount = await Enrollment.countDocuments({ course: course._id });
        
        // Update the course object with actual enrollment count
        const courseObj = course.toObject();
        courseObj.enrolled = actualEnrollmentCount;
        
        return courseObj;
      })
    );
    
    res.json(coursesWithActualEnrollment);
  } catch (error) {
    console.error('Get my faculty courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private/Student
const enrollInCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;
    
    // Get course and student
    const course = await Course.findById(courseId);
    const student = await User.findById(studentId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this course' });
    }
    
    // Check if course is full
    if (course.enrolled >= course.maxStudents) {
      return res.status(400).json({ message: 'This course is full' });
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
      studentName: student.name,
      registrationNumber: student.registrationNumber,
      courseTitle: course.title,
      courseCode: course.code
    });
    
    await enrollment.save();
    
    // Update course enrollment count
    course.enrolled += 1;
    await course.save();
    
    res.status(201).json({ message: `Successfully enrolled in ${course.title}` });
  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get enrolled courses for a student
// @route   GET /api/courses/enrolled
// @access  Private/Student
const getEnrolledCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get all enrollments for this student
    const enrollments = await Enrollment.find({ student: studentId })
      .populate('course')
      .sort({ enrollmentDate: -1 });
    
    // Format response to match frontend structure
    const enrolledCourses = enrollments
      .filter(enrollment => enrollment.course) // Filter out any enrollments without a course
      .map(enrollment => ({
        id: enrollment.course._id,
        title: enrollment.course.title,
        code: enrollment.course.code,
        category: enrollment.course.category,
        description: enrollment.course.description,
        instructor: enrollment.course.instructor,
        duration: enrollment.course.duration,
        level: enrollment.course.level,
        maxStudents: enrollment.course.maxStudents,
        enrolled: enrollment.course.enrolled,
        startDate: enrollment.course.startDate,
        endDate: enrollment.course.endDate,
        syllabus: enrollment.course.syllabus,
        enrolledAt: enrollment.enrollmentDate
      }));
    
    res.json(enrolledCourses);
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unenroll from a course
// @route   DELETE /api/courses/:id/unenroll
// @access  Private/Student
const unenrollFromCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user.id;
    
    // Find enrollment
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Delete enrollment
    await enrollment.deleteOne();
    
    // Update course enrollment count
    const course = await Course.findById(courseId);
    if (course) {
      course.enrolled = Math.max(0, course.enrolled - 1);
      await course.save();
    }
    
    res.json({ message: `Successfully unenrolled from ${course.title}` });
  } catch (error) {
    console.error('Unenroll from course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get enrolled students for a specific course
// @route   GET /api/courses/:id/students
// @access  Private/Faculty
const getEnrolledStudents = async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Get all enrollments for this course
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email registrationNumber department')
      .sort({ enrollmentDate: -1 });
    
    console.log(`Found ${enrollments.length} enrollments for course ${courseId}`);
    
    // Format response - handle cases where student population might fail
    const enrolledStudents = enrollments.map(enrollment => {
      // If student is populated successfully, use that data
      if (enrollment.student && enrollment.student._id) {
        return {
          id: enrollment.student._id,
          name: enrollment.student.name,
          email: enrollment.student.email,
          registrationNumber: enrollment.student.registrationNumber,
          department: enrollment.student.department,
          enrolledDate: enrollment.enrollmentDate
        };
      } else {
        // Fall back to stored data in enrollment record
        return {
          id: enrollment._id, // Use enrollment ID as fallback
          name: enrollment.studentName,
          email: 'N/A', // Not available in enrollment record
          registrationNumber: enrollment.registrationNumber,
          department: 'N/A', // Not available in enrollment record
          enrolledDate: enrollment.enrollmentDate
        };
      }
    });
    
    res.json(enrolledStudents);
  } catch (error) {
    console.error('Get enrolled students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Faculty unenroll a student from course
// @route   DELETE /api/courses/:courseId/students/:studentId
// @access  Private/Faculty
const facultyUnenrollStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    
    // Find enrollment
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Get course and student info for response
    const course = await Course.findById(courseId);
    const student = await User.findById(studentId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Delete enrollment
    await enrollment.deleteOne();
    
    // Update course enrollment count
    course.enrolled = Math.max(0, course.enrolled - 1);
    await course.save();
    
    res.json({ 
      message: `Successfully removed ${student.name} from ${course.title}`,
      studentName: student.name,
      courseTitle: course.title
    });
  } catch (error) {
    console.error('Faculty unenroll student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  restoreCourse,
  permanentDeleteCourse,
  getCoursesByFaculty,
  getMyFacultyCourses,
  enrollInCourse,
  getEnrolledCourses,
  unenrollFromCourse,
  getEnrolledStudents,
  facultyUnenrollStudent
};