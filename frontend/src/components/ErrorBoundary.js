import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          margin: '2rem',
        }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
          }}>
            ⚠️
          </div>
          <h2 style={{
            color: '#dc3545',
            marginBottom: '1rem',
            fontSize: '1.5rem',
          }}>
            Something went wrong
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '2rem',
            maxWidth: '500px',
          }}>
            We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'transform 0.2s ease',
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Refresh Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'transform 0.2s ease',
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Try Again
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              textAlign: 'left',
              maxWidth: '600px',
              width: '100%',
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: '600',
                color: '#333',
                marginBottom: '0.5rem',
              }}>
                Error Details (Development)
              </summary>
              <pre style={{
                fontSize: '0.8rem',
                color: '#dc3545',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;



