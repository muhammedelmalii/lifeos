import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';
import { Icon } from './Icon';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkCircle';
      case 'error':
        return 'alertCircle';
      case 'warning':
        return 'alertTriangle';
      default:
        return 'info';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return colors.status.success;
      case 'error':
        return colors.status.error;
      case 'warning':
        return colors.status.warning;
      default:
        return colors.accent.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: getBackgroundColor() }]}>
        <Icon name={getIconName()} size={20} color={colors.background.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    ...shadows.lg,
    gap: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.background.primary,
    flex: 1,
    fontWeight: '500',
  },
});

// Toast Manager Hook
let toastQueue: Array<{ message: string; type: ToastType; duration?: number }> = [];
let isShowing = false;

export const useToast = () => {
  const [toast, setToast] = React.useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    duration?: number;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = React.useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      if (isShowing) {
        toastQueue.push({ message, type, duration });
        return;
      }

      isShowing = true;
      setToast({ visible: true, message, type, duration });
    },
    []
  );

  const hideToast = React.useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
    isShowing = false;

    // Show next toast in queue
    if (toastQueue.length > 0) {
      const next = toastQueue.shift()!;
      setTimeout(() => {
        isShowing = true;
        setToast({ visible: true, ...next });
      }, 300);
    }
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};

