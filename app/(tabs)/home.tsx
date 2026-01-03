import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Card, Icon, Badge } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useAuthStore } from '@/store';
import { parseCommandWithAI } from '@/services/aiParser';
import { startVoiceRecognition } from '@/services/voice';
import { pickImage, extractTextFromImage } from '@/services/ocr';
import { formatDateTime, getRelativeTime } from '@/utils/date';
import { AIUnderstandingSheet } from '@/components/AIUnderstandingSheet';
import { SwipeableRow } from '@/components/SwipeableRow';
import { t } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showAISheet, setShowAISheet] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<any>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const { 
    getNextCritical, 
    loadResponsibilities, 
    getUpcoming, 
    getNowMode,
    updateResponsibility,
    checkStateTransitions 
  } = useResponsibilitiesStore();
  
  const user = useAuthStore((state) => state.user);
  const nextCritical = getNextCritical();
  const upcoming = getUpcoming().slice(0, 5);
  const nowModeItems = getNowMode().slice(0, 3);
  
  // Stats
  const todayUpcoming = getUpcoming();
  const tasksLeft = todayUpcoming.length;

  useEffect(() => {
    loadResponsibilities();
    checkStateTransitions();
  }, []);

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;
    const parsed = await parseCommandWithAI(inputText, 'text');
    setParsedCommand(parsed);
    setShowAISheet(true);
  };

  const handleVoicePress = async () => {
    try {
      setIsListening(true);
      const { stop } = await startVoiceRecognition();
      const result = await stop();
      setInputText(result.text);
      setIsListening(false);
      
      const parsed = await parseCommandWithAI(result.text, 'voice');
      setParsedCommand(parsed);
      setShowAISheet(true);
    } catch (error) {
      console.error('Voice recognition error:', error);
      setIsListening(false);
    }
  };

  const handlePhotoPress = async () => {
    const uri = await pickImage();
    if (!uri) return;
    const ocrResult = await extractTextFromImage(uri);
    setInputText(ocrResult.text);
    
    const parsed = await parseCommandWithAI(ocrResult.text, 'photo');
    setParsedCommand(parsed);
    setShowAISheet(true);
  };

  const handleComplete = async (id: string) => {
    await updateResponsibility(id, { status: 'completed', completedAt: new Date() });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {new Date().getHours() < 12 
                ? 'Good morning' 
                : new Date().getHours() < 18 
                ? 'Good afternoon' 
                : 'Good evening'}
              {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </Text>
            <Text style={styles.subtitle}>
              {tasksLeft > 0 
                ? `${tasksLeft} ${tasksLeft === 1 ? 'task' : 'tasks'} today`
                : 'All clear today'}
            </Text>
          </View>
        </View>

        {/* Compact Input Section */}
        <View style={styles.inputSection}>
          <View style={[
            styles.inputContainer,
            isInputFocused && styles.inputContainerFocused,
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Add a task or note..."
              placeholderTextColor={colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              multiline
              onSubmitEditing={handleTextSubmit}
              returnKeyType="done"
              textAlignVertical="top"
            />
            {inputText.trim().length > 0 && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleTextSubmit}
                activeOpacity={0.7}
              >
                <Icon name="send" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, isListening && styles.actionButtonActive]}
              onPress={handleVoicePress}
              activeOpacity={0.7}
            >
              <Icon name="microphone" size={18} color={isListening ? colors.text.primary : colors.text.secondary} />
              <Text style={[styles.actionText, isListening && styles.actionTextActive]}>Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePhotoPress}
              activeOpacity={0.7}
            >
              <Icon name="camera" size={18} color={colors.text.secondary} />
              <Text style={styles.actionText}>Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Critical - Hero Card */}
        {nextCritical && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/responsibility/${nextCritical.id}`)}
            style={styles.heroCard}
          >
            <View style={styles.heroHeader}>
              <View style={styles.heroLabel}>
                <Icon name="alertCircle" size={14} color={colors.status.error} />
                <Text style={styles.heroLabelText}>Next Critical</Text>
              </View>
              <Badge 
                label={getRelativeTime(nextCritical.schedule.datetime)} 
                variant="accent"
              />
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{nextCritical.title}</Text>
            {nextCritical.description && (
              <Text style={styles.heroDescription} numberOfLines={2}>
                {nextCritical.description}
              </Text>
            )}
            <View style={styles.heroFooter}>
              <Text style={styles.heroTime}>
                {formatDateTime(nextCritical.schedule.datetime).split(' ')[1]}
              </Text>
              <View style={styles.heroArrow}>
                <Icon name="arrowRight" size={20} color={colors.accent.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Now Mode - Quick Actions */}
        {nowModeItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {nowModeItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickCard}
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.quickCardIcon}>
                    <Icon name="check" size={20} color={colors.accent.primary} />
                  </View>
                  <Text style={styles.quickCardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.quickCardSubtitle}>Low energy</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Today's Schedule */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/plan')}>
                <Text style={styles.sectionLink}>View all</Text>
              </TouchableOpacity>
            </View>
            {upcoming.map((item) => (
              <SwipeableRow
                key={item.id}
                onSwipeRight={async () => await handleComplete(item.id)}
                onSwipeLeft={() => router.push(`/couldnt-do-it/${item.id}`)}
              >
                <TouchableOpacity
                  style={styles.scheduleItem}
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.scheduleTime}>
                    <Text style={styles.scheduleTimeText}>
                      {formatDateTime(item.schedule.datetime).split(' ')[1] || '09:00'}
                    </Text>
                  </View>
                  <View style={styles.scheduleContent}>
                    <Text style={styles.scheduleTitle} numberOfLines={1}>{item.title}</Text>
                    {item.category && (
                      <Text style={styles.scheduleCategory}>{item.category}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.scheduleCheck}
                    onPress={() => handleComplete(item.id)}
                  >
                    <View style={styles.checkCircle} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!nextCritical && upcoming.length === 0 && nowModeItems.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="check" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptyText}>
              You have no tasks scheduled today. Enjoy your free time!
            </Text>
          </View>
        )}
      </ScrollView>

      {showAISheet && parsedCommand && (
        <AIUnderstandingSheet
          visible={showAISheet}
          onClose={() => setShowAISheet(false)}
          parsedCommand={parsedCommand}
          originalText={inputText}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.h1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.text.secondary,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  inputContainerFocused: {
    borderColor: colors.accent.primary,
    borderWidth: 2,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    padding: spacing.md,
    paddingRight: 50,
    minHeight: 80,
    fontSize: 16,
  },
  sendButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  actionButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  actionText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  actionTextActive: {
    color: colors.text.primary,
  },
  heroCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...shadows.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroLabelText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.status.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  heroDescription: {
    ...typography.body,
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTime: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  heroArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLink: {
    ...typography.body,
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  quickCard: {
    width: 160,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...shadows.sm,
  },
  quickCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickCardTitle: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  quickCardSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  scheduleTime: {
    width: 60,
    marginRight: spacing.md,
  },
  scheduleTimeText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  scheduleCategory: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  scheduleCheck: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
