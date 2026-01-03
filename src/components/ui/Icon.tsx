import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors } from '@/theme';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: TextStyle;
}

// Icon mapping - görsellere göre
const iconMap: Record<string, string> = {
  // Navigation
  home: '🏠',
  inbox: '📥',
  calendar: '📅',
  library: '📚',
  settings: '⚙️',
  
  // Actions
  add: '+',
  close: '✕',
  check: '✓',
  arrowRight: '→',
  arrowLeft: '←',
  play: '▶',
  send: '→',
  
  // Status
  star: '⭐',
  lock: '🔒',
  bell: '🔔',
  microphone: '🎤',
  camera: '📷',
  calendarIcon: '📅',
  
  // Energy
  energy: '⚡',
  battery: '🔋',
  
  // Time
  clock: '⏰',
  
  // Other
  search: '🔍',
  edit: '✏️',
  delete: '🗑️',
  share: '📤',
  alertCircle: '⚠️',
};

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = colors.text.primary,
  style 
}) => {
  const icon = iconMap[name] || '•';
  
  return (
    <Text style={[styles.icon, { fontSize: size, color }, style]}>
      {icon}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});

