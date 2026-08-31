import React from "react";
import { logger } from "@/utils/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("React Error Boundary caught error", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-loft-plum-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-display text-loft-plum-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-loft-plum-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => {
                logger.downloadLogs();
                window.location.reload();
              }}
              className="btn-primary"
            >
              Download Logs & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
