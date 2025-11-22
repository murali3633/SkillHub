import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setupFullWidthListener } from '../utils/fullWidthHelper';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Developer",
      content: "SkillHub transformed my career. The hands-on approach and expert guidance helped me land my dream job in just 6 months!",
      avatar: "👩‍💻"
    },
    {
      name: "Michael Chen",
      role: "UX Designer",
      content: "The design courses here are incredible. I learned industry-standard tools and techniques that I use every day at work.",
      avatar: "👨‍🎨"
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Manager",
      content: "The marketing courses gave me the confidence to lead my team and implement strategies that actually work.",
      avatar: "👩‍💼"
    }
  ];

  useEffect(() => {
    // Redirect authenticated students to available courses
    if (isAuthenticated() && user?.role === 'student') {
      navigate('/available-courses');
    }
    
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    // Setup full-width enforcement
    const cleanup = setupFullWidthListener();
    
    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, [isAuthenticated, user, navigate, testimonials.length]);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background" aria-hidden="true">
          <div className="hero-shapes" aria-hidden="true">
            <div className="shape shape-1" aria-hidden="true"></div>
            <div className="shape shape-2" aria-hidden="true"></div>
            <div className="shape shape-3" aria-hidden="true"></div>
          </div>
        </div>
        <div className="hero-content">
          {/* Personalized Welcome for Faculty */}
          {isAuthenticated() && user?.role === 'faculty' && (
            <div className="faculty-welcome">
              <h2 className="welcome-title">Welcome back, {user?.name?.split(' ')[0] || user?.name}! 👋</h2>
              <p className="welcome-subtitle">Ready to inspire and educate your students today?</p>
            </div>
          )}
          
          <h1 className="hero-title">
            {isAuthenticated() && user?.role === 'faculty' ? (
              <>Manage Your Courses with <span className="gradient-text">SkillHub</span></>
            ) : (
              <>Master New Skills with <span className="gradient-text"> SkillHub</span></>
            )}
          </h1>
          <p className="hero-description">
            {isAuthenticated() && user?.role === 'faculty' ? (
              'Create engaging courses, track student progress, and build the next generation of skilled professionals.'
            ) : (
              'Join thousands of learners in our comprehensive skill development platform. From programming to design, marketing to management - unlock your potential today.'
            )}
          </p>
          <div className="hero-buttons" role="group" aria-label="Primary actions">
            {!isAuthenticated() ? (
              <>
                <Link to="/register" className="btn btn-primary btn-large" aria-label="Get started for free by creating an account">
                  <span className="btn-icon">🚀</span>
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large" aria-label="Sign in to your account">
                  <span className="btn-icon">🔑</span>
                  Sign In
                </Link>
              </>
            ) : (
              <Link to={user?.role === 'student' ? '/available-courses' : '/faculty-dashboard'} className="btn btn-primary btn-large" aria-label="Go to your dashboard">
                <span className="btn-icon">📊</span>
                Go to Dashboard
              </Link>
            )}
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="hero-stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Courses</div>
            </div>
            <div className="hero-stat">
              <div className="stat-number">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
        <div className="hero-image" aria-hidden="true">
          <div className="floating-cards">
            <div className="card card-1">
              <div className="card-icon">📚</div>
              <div className="card-text">Learn</div>
            </div>
            <div className="card card-2">
              <div className="card-icon">💻</div>
              <div className="card-text">Code</div>
            </div>
            <div className="card card-3">
              <div className="card-icon">🎨</div>
              <div className="card-text">Design</div>
            </div>
            <div className="card card-4">
              <div className="card-icon">📊</div>
              <div className="card-text">Analyze</div>
            </div>
            <div className="card card-5">
              <div className="card-icon">🚀</div>
              <div className="card-text">Launch</div>
            </div>
          </div>
        </div>
      </section>

     

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose SkillHub?</h2>
          <p className="section-subtitle">Everything you need to succeed in your learning journey</p>
        </div>
        <div className="features-container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🎯</div>
              </div>
              <h3>Expert-Led Courses</h3>
              <p>Learn from industry professionals with years of real-world experience and proven track records.</p>
              <div className="feature-highlight">Industry Experts</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">📱</div>
              </div>
              <h3>Flexible Learning</h3>
              <p>Study at your own pace with mobile-friendly, on-demand content that fits your schedule.</p>
              <div className="feature-highlight">Self-Paced</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🏆</div>
              </div>
              <h3>Certification</h3>
              <p>Earn recognized certificates upon course completion that boost your professional profile.</p>
              <div className="feature-highlight">Verified Certificates</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">👥</div>
              </div>
              <h3>Community</h3>
              <p>Connect with fellow learners and industry experts in our vibrant learning community.</p>
              <div className="feature-highlight">Active Community</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">💡</div>
              </div>
              <h3>Hands-On Projects</h3>
              <p>Apply your knowledge through real-world projects and build an impressive portfolio.</p>
              <div className="feature-highlight">Project-Based</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🔄</div>
              </div>
              <h3>Lifetime Access</h3>
              <p>Keep access to your courses forever and stay updated with the latest content.</p>
              <div className="feature-highlight">Forever Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <h2 className="section-title">What Our Students Say</h2>
          <p className="section-subtitle">Real stories from real learners</p>
        </div>
        <div className="testimonials-container">
          <div className="testimonial-card active">
            <div className="testimonial-content">
              <div className="testimonial-avatar">{testimonials[currentTestimonial].avatar}</div>
              <blockquote className="testimonial-quote">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              <div className="testimonial-author">
                <div className="author-name">{testimonials[currentTestimonial].name}</div>
                <div className="author-role">{testimonials[currentTestimonial].role}</div>
              </div>
            </div>
          </div>
          <div className="testimonial-indicators">
            {testimonials.map((_, index) => (
              <button
                type="button"
                key={index}
                className={`indicator ${index === currentTestimonial ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(index)}
                aria-label={`Show testimonial ${index + 1}`}
                aria-pressed={index === currentTestimonial}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-section" aria-label="How SkillHub works">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three simple steps to start learning</p>
        </div>
        <div className="how-container">
          <div className="how-grid">
            <div className="how-card">
              <div className="how-icon">📝</div>
              <h3>Create Your Account</h3>
              <p>Sign up in seconds and personalize your learning goals.</p>
            </div>
            <div className="how-card">
              <div className="how-icon">🧭</div>
              <h3>Choose a Path</h3>
              <p>Pick curated tracks or individual courses that fit your needs.</p>
            </div>
            <div className="how-card">
              <div className="how-icon">🌟</div>
              <h3>Learn by Doing</h3>
              <p>Build real projects and showcase certificates on your profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Expert Instructors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1,200+</div>
              <div className="stat-label">Courses Available</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Ready to Start Your Learning Journey?</h2>
            <p>Join our community of learners and start building the skills you need for tomorrow.</p>
            {!isAuthenticated() && (
              <Link to="/register" className="btn btn-primary btn-large" aria-label="Create your free SkillHub account">
                Start Learning Today
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;