import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="clay-card-elevated max-w-md w-full p-8 flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-rose-50 text-rose-500">
              <AlertCircle size={48} />
            </div>
            <h1 className="text-2xl font-display font-extrabold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground text-sm">
              We encountered an unexpected error. Our team has been notified.
            </p>
            {this.state.error && (
              <div className="w-full mt-4 p-4 bg-slate-50 rounded-xl text-left overflow-hidden">
                <p className="text-xs font-mono text-slate-500 truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="clay-btn-primary w-full mt-4"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
