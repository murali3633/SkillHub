import React, { useState, useMemo, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import APIService from '../services/apiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = ({ courses }) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedChart, setSelectedChart] = useState('enrollments');
  const [enrollmentData, setEnrollmentData] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch real enrollment data for each course
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      setLoading(true);
      try {
        const enrollmentPromises = courses.map(async (course) => {
          const result = await APIService.getEnrolledStudents(course._id);
          return {
            courseId: course._id,
            enrollments: result.success ? result.data : []
          };
        });

        const enrollmentResults = await Promise.all(enrollmentPromises);
        
        const enrollmentMap = {};
        enrollmentResults.forEach(({ courseId, enrollments }) => {
          enrollmentMap[courseId] = enrollments;
        });
        
        setEnrollmentData(enrollmentMap);
      } catch (error) {
        console.error('Error fetching enrollment data:', error);
        setEnrollmentData({});
      } finally {
        setLoading(false);
      }
    };

    if (courses.length > 0) {
      fetchEnrollmentData();
    }
  }, [courses]);

  // Filter enrollments based on time period
  const filteredEnrollments = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (timeFilter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'semester':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const filtered = {};
    Object.keys(enrollmentData).forEach(courseId => {
      filtered[courseId] = enrollmentData[courseId].filter(enrollment => 
        new Date(enrollment.enrolledDate) >= startDate
      );
    });

    return filtered;
  }, [timeFilter, enrollmentData]);

  // Calculate enrollment statistics
  const enrollmentStats = useMemo(() => {
    return courses.map(course => {
      const enrollments = filteredEnrollments[course._id] || [];
      return {
        id: course._id,
        title: course.title,
        code: course.code,
        category: course.category,
        totalEnrollments: enrollments.length,
        capacity: course.maxStudents || 0,
        enrollmentRate: course.maxStudents > 0 ? (enrollments.length / course.maxStudents) * 100 : 0
      };
    });
  }, [courses, filteredEnrollments]);

  // Prepare data for charts
  const enrollmentChartData = {
    labels: enrollmentStats.map(stat => stat.code),
    datasets: [
      {
        label: 'Enrollments',
        data: enrollmentStats.map(stat => stat.totalEnrollments),
        barThickness: 20,
        maxBarThickness: 22,
        categoryPercentage: 0.5,
        barPercentage: 0.6,
        borderRadius: 6,
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(40, 167, 69, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(220, 53, 69, 0.8)',
          'rgba(23, 162, 184, 0.8)',
          'rgba(111, 66, 193, 0.8)',
          'rgba(253, 126, 20, 0.8)',
          'rgba(32, 201, 151, 0.8)',
        ],
        borderColor: [
          'rgba(102, 126, 234, 1)',
          'rgba(40, 167, 69, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(220, 53, 69, 1)',
          'rgba(23, 162, 184, 1)',
          'rgba(111, 66, 193, 1)',
          'rgba(253, 126, 20, 1)',
          'rgba(32, 201, 151, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const popularCoursesData = {
    labels: enrollmentStats
      .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
      .slice(0, 5)
      .map(stat => stat.title),
    datasets: [
      {
        data: enrollmentStats
          .sort((a, b) => b.totalEnrollments - a.totalEnrollments)
          .slice(0, 5)
          .map(stat => stat.totalEnrollments),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(40, 167, 69, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(220, 53, 69, 0.8)',
          'rgba(23, 162, 184, 0.8)',
        ],
        borderColor: [
          'rgba(102, 126, 234, 1)',
          'rgba(40, 167, 69, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(220, 53, 69, 1)',
          'rgba(23, 162, 184, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#111827',
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: true,
        text: 'Course Enrollment Analytics',
        color: '#111827',
        font: {
          size: 16,
          weight: '600'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(10, Math.max(...enrollmentStats.map(stat => stat.totalEnrollments)) + 2),
        ticks: {
          stepSize: 1,
          color: '#111827',
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      x: {
        ticks: {
          color: '#111827',
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        },
        border: {
          display: false
        }
      }
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#111827'
        }
      },
      title: {
        display: true,
        text: 'Most Popular Courses',
        color: '#111827'
      },
    },
  };

  // Export to CSV function
  const exportToCSV = () => {
    const csvData = [];
    
    // Add header
    csvData.push(['Course Code', 'Course Title', 'Category', 'Enrollments', 'Capacity', 'Enrollment Rate (%)']);
    
    // Add data rows
    enrollmentStats.forEach(stat => {
      csvData.push([
        stat.code,
        stat.title,
        stat.category,
        stat.totalEnrollments,
        stat.capacity,
        stat.enrollmentRate.toFixed(1)
      ]);
    });

    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `course_analytics_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const totalEnrollments = enrollmentStats.reduce((sum, stat) => sum + stat.totalEnrollments, 0);
  const averageEnrollmentRate = enrollmentStats.length > 0 
    ? enrollmentStats.reduce((sum, stat) => sum + stat.enrollmentRate, 0) / enrollmentStats.length 
    : 0;

  if (loading) {
    return (
      <div className="analytics-container" style={{
        background: '#ffffff',
        color: '#111827',
        margin: '0',
        padding: '24px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>📊</div>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading analytics data...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="analytics-container"
      style={{
        background: '#ffffff',
        color: '#111827',
        margin: '0',
        padding: '24px',
        width: '100%'
      }}
    >
      <div className="analytics-header" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>Course Analytics</h2>
        <p style={{ marginTop: 6, color: 'rgba(17,24,39,0.7)' }}>Track enrollment trends and course performance</p>
      </div>

      {/* Controls */}
      <div className="analytics-controls" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="filter-controls">
          <label htmlFor="timeFilter" style={{ marginRight: 8 }}>Time Period:</label>
          <select
            id="timeFilter"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="filter-select"
            style={{
              background: '#ffffff',
              color: '#111827',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 8,
              padding: '8px 10px'
            }}
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="semester">Last Semester</option>
          </select>
        </div>

        <div className="chart-controls">
          <label htmlFor="chartType" style={{ marginRight: 8 }}>Chart Type:</label>
          <select
            id="chartType"
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value)}
            className="filter-select"
            style={{
              background: '#ffffff',
              color: '#111827',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 8,
              padding: '8px 10px'
            }}
          >
            <option value="enrollments">Enrollments per Course</option>
            <option value="popular">Most Popular Courses</option>
          </select>
        </div>

        <button
          onClick={exportToCSV}
          className="export-btn"
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 14px',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(124,58,237,0.25)'
          }}
        >
          📊 Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards" style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 16 }}>
        <div style={{
          background: 'linear-gradient(135deg, #93c5fd 0%, #c084fc 50%, #fda4af 100%)',
          padding: 2,
          borderRadius: 18
        }}>
          <div className="summary-card" style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.06)'
          }}>
            <h3 style={{ margin: 0, color: '#0f172a', opacity: 0.9 }}>Total Enrollments</h3>
            <p className="summary-number" style={{ fontSize: 36, fontWeight: 800, margin: '10px 0 6px', color: '#0b1220' }}>{totalEnrollments}</p>
            <p className="summary-label" style={{ color: '#6b7280', margin: 0 }}>across all courses</p>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #a7f3d0 0%, #93c5fd 50%, #c4b5fd 100%)',
          padding: 2,
          borderRadius: 18
        }}>
          <div className="summary-card" style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.06)'
          }}>
            <h3 style={{ margin: 0, color: '#0f172a', opacity: 0.9 }}>Active Courses</h3>
            <p className="summary-number" style={{ fontSize: 36, fontWeight: 800, margin: '10px 0 6px', color: '#0b1220' }}>{courses.length}</p>
            <p className="summary-label" style={{ color: '#6b7280', margin: 0 }}>courses available</p>
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #fde68a 0%, #fca5a5 50%, #c4b5fd 100%)',
          padding: 2,
          borderRadius: 18
        }}>
          <div className="summary-card" style={{
            background: '#ffffff',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 12px 24px rgba(15, 23, 42, 0.06)'
          }}>
            <h3 style={{ margin: 0, color: '#0f172a', opacity: 0.9 }}>Avg. Enrollment Rate</h3>
            <p className="summary-number" style={{ fontSize: 36, fontWeight: 800, margin: '10px 0 6px', color: '#0b1220' }}>{averageEnrollmentRate.toFixed(1)}%</p>
            <p className="summary-label" style={{ color: '#6b7280', margin: 0 }}>capacity utilization</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-container" style={{ marginTop: 16 }}>
        <div className="chart-wrapper" style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 16,
          padding: 20,
          height: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          {selectedChart === 'enrollments' ? (
            <Bar data={enrollmentChartData} options={chartOptions} />
          ) : (
            <Doughnut data={popularCoursesData} options={doughnutOptions} />
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="analytics-table-section" style={{ marginTop: 32 }}>
        <h3 style={{ 
          margin: '0 0 20px', 
          color: '#0f172a', 
          fontSize: '1.5rem',
          fontWeight: '600',
          textAlign: 'center'
        }}>Detailed Course Statistics</h3>
        <div className="table-container" style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div className="table-scroll" style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch'
          }}>
          <table className="analytics-table" style={{ 
            width: '100%', 
            minWidth: '800px',
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ 
                background: '#f9fafb',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '16px 12px', 
                  color: '#374151', 
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em'
                }}>Course Code</th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '16px 12px', 
                  color: '#374151', 
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em'
                }}>Course Title</th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '16px 12px', 
                  color: '#374151', 
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em'
                }}>Category</th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '16px 12px', 
                  color: '#374151', 
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em'
                }}>Enrollments</th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '16px 12px', 
                  color: '#374151', 
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em'
                }}>Capacity</th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '16px 12px', 
                  color: '#374151', 
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em'
                }}>Enrollment Rate</th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '16px 12px', 
                  color: '#374151', 
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  letterSpacing: '0.025em'
                }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {enrollmentStats.map((stat, rowIndex) => (
                <tr key={stat.id} style={{ 
                  borderBottom: rowIndex === enrollmentStats.length - 1 ? 'none' : '1px solid #f3f4f6',
                  transition: 'background-color 0.15s ease'
                }}>
                  <td style={{ 
                    padding: '20px 12px', 
                    textAlign: 'center',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        background: '#6366f1',
                        color: '#ffffff',
                        fontWeight: '600',
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                      }}>{stat.code}</span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '20px 12px',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ 
                        color: '#111827', 
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        lineHeight: '1.25'
                      }}>{stat.title}</div>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '20px 12px', 
                    textAlign: 'center',
                    verticalAlign: 'middle'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      fontWeight: '500',
                      fontSize: '0.75rem',
                      letterSpacing: '0.025em',
                      textTransform: 'uppercase'
                    }}>{stat.category}</span>
                  </td>
                  <td style={{ 
                    padding: '20px 12px', 
                    textAlign: 'center',
                    fontWeight: '600', 
                    color: '#111827',
                    fontSize: '0.875rem',
                    verticalAlign: 'middle'
                  }}>{stat.totalEnrollments}</td>
                  <td style={{ 
                    padding: '20px 12px', 
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    verticalAlign: 'middle'
                  }}>{stat.capacity}</td>
                  <td style={{ 
                    padding: '20px 12px', 
                    textAlign: 'center',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '6px',
                        background: '#f3f4f6',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${Math.min(stat.enrollmentRate, 100)}%`,
                          height: '100%',
                          background: stat.enrollmentRate >= 80 
                            ? '#10b981' 
                            : stat.enrollmentRate >= 50 
                            ? '#f59e0b' 
                            : '#ef4444',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        color: '#374151', 
                        fontWeight: '600'
                      }}>
                        {stat.enrollmentRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '20px 12px', 
                    textAlign: 'center',
                    verticalAlign: 'middle'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      background: stat.enrollmentRate >= 80
                        ? '#dcfce7'
                        : stat.enrollmentRate >= 50
                        ? '#fef3c7'
                        : '#fee2e2',
                      color: stat.enrollmentRate >= 80
                        ? '#166534'
                        : stat.enrollmentRate >= 50
                        ? '#92400e'
                        : '#991b1b',
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      letterSpacing: '0.025em',
                      textTransform: 'uppercase'
                    }}>
                      {stat.enrollmentRate >= 80 ? 'High' : 
                       stat.enrollmentRate >= 50 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

