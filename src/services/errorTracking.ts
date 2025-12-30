/**
 * Error Tracking Service
 * Centralized error tracking and logging
 * 
 * Sentry integration for production error tracking
 */

// Conditional import - only load Sentry if DSN is configured
let Sentry: any = null;
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  try {
    Sentry = require('@sentry/react-native');
  } catch (error) {
    console.warn('Sentry not available:', error);
  }
}

interface ErrorContext {
  userId?: string;
  screen?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorTrackingService {
  private isInitialized = false;

  /**
   * Initialize error tracking service
   */
  async initialize() {
    if (this.isInitialized) return;

    // Only initialize if Sentry is available and DSN is configured
    if (!Sentry || !process.env.EXPO_PUBLIC_SENTRY_DSN) {
      console.log('Error tracking not configured (Sentry DSN missing)');
      return;
    }

    try {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        environment: process.env.EXPO_PUBLIC_ENV || 'development',
        enableInExpoDevelopment: false, // Disable in development for performance
        debug: __DEV__, // Only debug in development
        tracesSampleRate: 1.0, // 100% of transactions for now (adjust in production)
      });

      this.isInitialized = true;
      console.log('Error tracking initialized');
    } catch (error) {
      console.error('Failed to initialize error tracking:', error);
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext) {
    console.error('Error captured:', error, context);

    if (this.isInitialized && Sentry) {
      Sentry.captureException(error, {
        tags: {
          screen: context?.screen,
          action: context?.action,
        },
        extra: context?.metadata,
        user: context?.userId ? { id: context.userId } : undefined,
      });
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);

    if (this.isInitialized && Sentry) {
      Sentry.captureMessage(message, {
        level: level as any, // Sentry severity level
        tags: {
          screen: context?.screen,
          action: context?.action,
        },
        extra: context?.metadata,
      });
    }
  }

  /**
   * Set user context
   */
  setUser(userId: string, email?: string, username?: string) {
    if (this.isInitialized && Sentry) {
      Sentry.setUser({
        id: userId,
        email,
        username,
      });
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    if (this.isInitialized && Sentry) {
      Sentry.setUser(null);
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category?: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
    if (this.isInitialized && Sentry) {
      Sentry.addBreadcrumb({
        message,
        category,
        level: level as any, // Sentry severity level
        data,
      });
    }
  }
}

export const errorTrackingService = new ErrorTrackingService();

