/**
 * Error Boundary Component
 * Catches React errors and displays a user-friendly error screen
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/theme';
import { Card } from '@/components/ui';
import { Icon } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error tracking service (Sentry, etc.)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send to error tracking service
    try {
      const { errorTrackingService } = require('@/services/errorTracking');
      errorTrackingService.captureException(error, { 
        metadata: { 
          componentStack: errorInfo.componentStack,
        } 
      });
    } catch (trackingError) {
      console.error('Failed to send error to tracking service:', trackingError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Card style={styles.errorCard}>
            <Icon name="alertCircle" size={48} color={colors.accent.primary} />
            <Text style={styles.title}>Bir şeyler ters gitti</Text>
            <Text style={styles.message}>
              Üzgünüz, beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatın.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
                <Text style={styles.errorStack}>{this.state.error.stack}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    color: colors.background.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

