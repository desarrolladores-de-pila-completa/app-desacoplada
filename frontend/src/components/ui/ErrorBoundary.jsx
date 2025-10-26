import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log del error
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Aquí podrías enviar el error a un servicio de logging
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 600,
          margin: '40px auto',
          padding: 32,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 4px 24px #0002',
          textAlign: 'center'
        }}>
          <h2>¡Ups! Algo salió mal</h2>
          <p>Ha ocurrido un error inesperado. Por favor, intenta recargar la página.</p>

          <div style={{ marginTop: 24 }}>
            <button
              onClick={this.handleReset}
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                marginRight: 12
              }}
            >
              Intentar de nuevo
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Recargar página
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: 24, textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                Detalles del error (desarrollo)
              </summary>
              <pre style={{
                background: '#f5f5f5',
                padding: 16,
                borderRadius: 4,
                fontSize: '12px',
                overflow: 'auto',
                marginTop: 8
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
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