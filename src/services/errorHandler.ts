/**
 * Centralized Error Handling Service
 * Provides consistent error handling and user-friendly error messages
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
}

export class LifeOSError extends Error {
  code: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'LifeOSError';
    this.code = code;
    this.userMessage = userMessage;
    this.severity = severity;
    this.recoverable = recoverable;
  }
}

/**
 * Handle errors consistently across the app
 */
export const handleError = (error: unknown): AppError => {
  // If it's already a LifeOSError, return it
  if (error instanceof LifeOSError) {
    return {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      severity: error.severity,
      recoverable: error.recoverable,
    };
  }

  // If it's a standard Error, convert it
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.',
        severity: 'medium',
        recoverable: true,
      };
    }

    // API errors
    if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
      return {
        code: 'API_ERROR',
        message: error.message,
        userMessage: 'Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.',
        severity: 'high',
        recoverable: true,
      };
    }

    // Permission errors
    if (error.message.includes('permission') || error.message.includes('Permission')) {
      return {
        code: 'PERMISSION_ERROR',
        message: error.message,
        userMessage: 'Bu özellik için izin gerekiyor. Lütfen ayarlardan izin verin.',
        severity: 'medium',
        recoverable: true,
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      severity: 'medium',
      recoverable: true,
    };
  }

  // Unknown error type
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
    userMessage: 'Beklenmeyen bir hata oluştu.',
    severity: 'high',
    recoverable: false,
  };
};

/**
 * Log error for debugging (in production, send to error tracking service)
 */
export const logError = (error: AppError, context?: Record<string, any>) => {
  console.error(`[${error.code}] ${error.message}`, {
    severity: error.severity,
    recoverable: error.recoverable,
    context,
  });

  // In production, send to error tracking service (e.g., Sentry)
  // if (__DEV__ === false) {
  //   errorTrackingService.captureException(error, context);
  // }
};

/**
 * Common error codes
 */
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

