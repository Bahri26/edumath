import React from 'react';
import Button from './ui/Button.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // Optionally: send to logging service
    // console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, info: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Beklenmeyen bir hata oluştu</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Sayfayı yenilemeyi deneyebilirsiniz. Sorun devam ederse bize bildirin.</p>
            </div>
            <div className="p-6 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 truncate">
                {this.state.error?.message}
              </div>
              <Button variant="primary" onClick={this.handleReload}>Sayfayı Yenile</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
