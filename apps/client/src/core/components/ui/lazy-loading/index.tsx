import React, { lazy, Suspense, ComponentType } from "react";
import { ErrorBoundary } from "../error-boundary";
import { InlineLoader } from "../loading";

/**
 * Higher-order component for lazy loading with error boundaries and loading states
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ComponentType,
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) {
  const LazyComponent = lazy(importFn);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const LoadingFallback = fallback || (() => <InlineLoader text="Loading component..." />);

    const ErrorFallback =
      errorFallback ||
      (({ error, resetErrorBoundary }) => (
        <div className="border-destructive/20 bg-destructive/5 rounded-lg border p-4 text-center">
          <h3 className="text-destructive mb-2 font-medium">Component failed to load</h3>
          <p className="text-muted-foreground mb-3 text-sm">{error.message || "An error occurred while loading this component"}</p>
          <button onClick={resetErrorBoundary} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-sm transition-colors">
            Try again
          </button>
        </div>
      ));

    return (
      <ErrorBoundary fallback={ErrorFallback}>
        <Suspense fallback={<LoadingFallback />}>
          <LazyComponent {...props} ref={ref} />
        </Suspense>
      </ErrorBoundary>
    );
  });

  WrappedComponent.displayName = `LazyLoaded(Component)`;

  return WrappedComponent;
}

/**
 * Generic lazy loading wrapper for any component
 */
export const createLazyComponent = <P extends object>(importFn: () => Promise<{ default: ComponentType<P> }>, loadingFallback?: React.ComponentType) => {
  return withLazyLoading(importFn, loadingFallback);
};

/**
 * Intersection Observer based lazy loading for components
 */
interface IntersectionLazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export function IntersectionLazyLoad({ children, fallback, rootMargin = "50px", threshold = 0.1, className }: IntersectionLazyLoadProps) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {isIntersecting
        ? children
        : fallback || (
            <div className="bg-muted flex h-32 animate-pulse items-center justify-center rounded-md">
              <InlineLoader text="Loading..." />
            </div>
          )}
    </div>
  );
}

/**
 * Code splitting utilities for route-level chunks
 */
export const createLazyRoute = <T extends Record<string, unknown>>(importFn: () => Promise<{ default: ComponentType<T> }>) => {
  return lazy(importFn);
};

/**
 * Preload a lazy component
 */
export const preloadComponent = <P extends object>(importFn: () => Promise<{ default: ComponentType<P> }>) => {
  return importFn();
};

/**
 * Create a lazy component with preloading on hover
 */
export function createHoverPreloadComponent<P extends object>(importFn: () => Promise<{ default: ComponentType<P> }>, fallback?: React.ComponentType) {
  let preloadPromise: Promise<{ default: ComponentType<P> }> | null = null;

  const LazyComponent = withLazyLoading(importFn, fallback);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PreloadableComponent = React.forwardRef<any, P & { onMouseEnter?: () => void }>((props, ref) => {
    const { onMouseEnter, ...restProps } = props;

    const handleMouseEnter = React.useCallback(() => {
      if (!preloadPromise) {
        preloadPromise = importFn();
      }
      onMouseEnter?.();
    }, [onMouseEnter]);

    return (
      <div onMouseEnter={handleMouseEnter}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LazyComponent {...(restProps as any)} ref={ref} />
      </div>
    );
  });

  PreloadableComponent.displayName = `HoverPreloadable(LazyComponent)`;

  return PreloadableComponent;
}
