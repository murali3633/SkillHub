const express = require('express');
const { 
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
} = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getCourses);

// Student routes (put specific routes before parameterized routes)
router.get('/enrolled', authMiddleware, roleMiddleware(['student']), getEnrolledCourses);

// Faculty routes (specific routes)
router.get('/my-courses', authMiddleware, roleMiddleware(['faculty']), getMyFacultyCourses);

// Public parameterized route (must come after specific routes)
router.get('/:id', getCourseById);
router.post('/:id/enroll', authMiddleware, roleMiddleware(['student']), enrollInCourse);
router.delete('/:id/unenroll', authMiddleware, roleMiddleware(['student']), unenrollFromCourse);

// Faculty routes
router.post('/', authMiddleware, roleMiddleware(['faculty']), createCourse);
router.put('/:id', authMiddleware, roleMiddleware(['faculty']), updateCourse);
router.delete('/:id', authMiddleware, roleMiddleware(['faculty']), deleteCourse);
router.put('/:id/restore', authMiddleware, roleMiddleware(['faculty']), restoreCourse);
router.delete('/:id/permanent', authMiddleware, roleMiddleware(['faculty']), permanentDeleteCourse);
router.get('/faculty/:facultyId', authMiddleware, roleMiddleware(['faculty']), getCoursesByFaculty);
router.get('/:id/students', authMiddleware, roleMiddleware(['faculty']), getEnrolledStudents);
router.delete('/:courseId/students/:studentId', authMiddleware, roleMiddleware(['faculty']), facultyUnenrollStudent);

module.exports = router;