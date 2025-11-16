'use client';

import React from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // 에러 로깅 서비스로 전송 (예: Sentry)
    // if (typeof window !== 'undefined') {
    //   logErrorToService(error, errorInfo);
    // }
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공되었으면 사용
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error || new Error('Unknown error')}
            reset={this.reset}
          />
        );
      }

      // 기본 fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle className="text-lg font-semibold">
              오류가 발생했습니다
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p className="text-sm">
                {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={this.reset}
                  variant="outline"
                  size="sm"
                >
                  다시 시도
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = '/dashboard';
                  }}
                  size="sm"
                >
                  대시보드로 돌아가기
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

// 함수형 컴포넌트로 사용할 수 있는 래퍼
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
