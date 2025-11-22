import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import BackToDashboard from './components/BackToDashboard';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import GeminiChat from './components/GeminiChat';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import EnrolledCourses from './pages/EnrolledCourses';
import FacultyDashboard from './pages/FacultyDashboard';
import AddCourse from './pages/AddCourse';
import EditCourse from './pages/EditCourse';
import SyllabusDetail from './components/SyllabusDetail';
import CourseLearning from './pages/CourseLearning';
import Unauthorized from './pages/Unauthorized';
import './App.css';
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <div className="App">
              <Navbar />
              <BackToDashboard />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  {/* Protected Routes */}
                  <Route 
                    path="/student-dashboard" 
                    element={
                      <PrivateRoute requiredRole="student">
                        <EnrolledCourses />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/available-courses" 
                    element={
                      <PrivateRoute requiredRole="student">
                        <StudentDashboard />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/enrolled-courses" 
                    element={
                      <PrivateRoute requiredRole="student">
                        <EnrolledCourses />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/faculty-dashboard" 
                    element={
                      <PrivateRoute requiredRole="faculty">
                        <FacultyDashboard />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/add-course" 
                    element={
                      <PrivateRoute requiredRole="faculty">
                        <AddCourse />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/edit-course" 
                    element={
                      <PrivateRoute requiredRole="faculty">
                        <EditCourse />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/syllabus-detail" 
                    element={
                      <PrivateRoute requiredRole="student">
                        <SyllabusDetail />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/course-learning/:courseId" 
                    element={
                      <PrivateRoute requiredRole="student">
                        <CourseLearning />
                      </PrivateRoute>
                    } 
                  />
                </Routes>
              </main>
              <GeminiChat />
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;