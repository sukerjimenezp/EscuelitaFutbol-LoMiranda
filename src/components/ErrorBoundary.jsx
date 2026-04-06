import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#060f1e',
          color: '#fff', gap: '1rem', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Algo salió mal</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', maxWidth: 400 }}>
            {this.state.error?.message || 'Error inesperado en la aplicación.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            style={{
              padding: '0.65rem 1.5rem',
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              border: 'none', borderRadius: '0.6rem',
              color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            🔄 Volver al inicio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
