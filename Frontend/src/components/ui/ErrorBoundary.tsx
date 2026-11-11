import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-950 text-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-navy-900 border border-navy-800 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Se produjo un error visual</h2>
            <p className="text-sm text-slate-400 mb-6">
              Recarga la página para restablecer la vista de la Mesa de Competitividad.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-6 py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-sm"
            >
              Recargar Sitio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
