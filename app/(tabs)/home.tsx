import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Card, Chip, Icon, Badge } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useAuthStore } from '@/store';
import { useSettingsStore } from '@/store/settings';
import { parseCommand, parseCommandWithAI } from '@/services/aiParser';
import { startVoiceRecognition } from '@/services/voice';
import { pickImage, extractTextFromImage } from '@/services/ocr';
import { formatDateTime, getRelativeTime } from '@/utils/date';
import { AIUnderstandingSheet } from '@/components/AIUnderstandingSheet';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ProactiveSuggestions } from '@/components/ProactiveSuggestions';
import { t } from '@/i18n';

export default function HomeScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showAISheet, setShowAISheet] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<any>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { getNextCritical, loadResponsibilities, getUpcoming, updateResponsibility } = useResponsibilitiesStore();
  const user = useAuthStore((state) => state.user);
  const nextCritical = getNextCritical();
  const upcoming = getUpcoming();
  
  // Calculate energy and tasks
  const energyPercent = 85;
  const tasksLeft = upcoming.length;

  useEffect(() => {
    loadResponsibilities();
  }, []);

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;

    // Use AI parsing if available, fallback to rule-based
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {t('home.goodMorning', { name: user?.name || 'Alex' })}
          </Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>{t('home.active')}</Text>
            <Chip
              label={t('home.energy', { percent: energyPercent })}
              variant="energy_medium"
              style={styles.chip}
            />
            <Chip
              label={t('home.tasksLeft', { count: tasksLeft })}
              variant="default"
              style={styles.chip}
            />
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={[
            styles.inputContainer,
            isInputFocused && styles.inputContainerFocused,
            inputText.trim().length > 0 && styles.inputContainerHasText
          ]}>
            <TextInput
              style={styles.input}
              placeholder={t('home.inputPlaceholder')}
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
                <Icon name="send" size={20} color={colors.accent.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Send Button - Prominent when text exists */}
          {inputText.trim().length > 0 && (
            <TouchableOpacity
              style={styles.sendButtonLarge}
              onPress={handleTextSubmit}
              activeOpacity={0.8}
            >
              <View style={styles.sendButtonLargeContent}>
                <Text style={styles.sendButtonLargeText}>{t('home.send')}</Text>
                <Icon name="send" size={20} color={colors.text.primary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Input Mode Buttons */}
          <View style={styles.inputButtons}>
            <TouchableOpacity 
              style={[
                styles.inputButton,
                isInputFocused && styles.inputButtonFocused,
                inputText.trim().length === 0 && styles.inputButtonInactive
              ]}
              onPress={() => {
                if (inputText.trim().length > 0) {
                  handleTextSubmit();
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.inputButtonText,
                inputText.trim().length > 0 && styles.inputButtonTextActive
              ]}>
                {t('home.type')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.inputButton,
                isListening && styles.inputButtonActive,
                !isInputFocused && inputText.trim().length === 0 && styles.inputButtonInactive
              ]}
              onPress={handleVoicePress}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.inputButtonText,
                isListening && styles.inputButtonTextActive
              ]}>
                {t('home.voice')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.inputButton,
                !isInputFocused && inputText.trim().length === 0 && styles.inputButtonInactive
              ]}
              onPress={handlePhotoPress}
              activeOpacity={0.7}
            >
              <Text style={styles.inputButtonText}>{t('home.scan')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Critical Responsibility */}
        {nextCritical && (
          <View style={styles.nextSection}>
            <Text style={styles.sectionTitle}>{t('home.nextCritical')}</Text>
            <Card style={styles.responsibilityCard}>
              {nextCritical.schedule.datetime <= new Date() && (
                <View style={styles.responsibilityImageContainer}>
                  <View style={styles.responsibilityImage} />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageOverlayText}>
                      Now until {formatDateTime(
                        new Date(nextCritical.schedule.datetime.getTime() + 2.5 * 60 * 60 * 1000)
                      ).split(' ')[1] || '11:30 AM'}
                    </Text>
                  </View>
                </View>
              )}
              {nextCritical.schedule.datetime > new Date() && (
                <View style={styles.timeBadge}>
                  <Badge 
                    label={getRelativeTime(nextCritical.schedule.datetime)} 
                    variant="accent"
                  />
                </View>
              )}
              <Text style={styles.responsibilityTitle}>{nextCritical.title}</Text>
              {nextCritical.description && (
                <Text style={styles.responsibilityDescription}>{nextCritical.description}</Text>
              )}
              <View style={styles.responsibilityFooter}>
                <View style={styles.responsibilityAvatar}>
                  <Text style={styles.avatarText}>
                    {(user?.name || 'A')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
                <Button
                  title={t('home.startFocus')}
                  onPress={() => router.push(`/responsibility/${nextCritical.id}`)}
                  size="medium"
                  style={styles.startButton}
                  variant="primary"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Today at a Glance */}
        <View style={styles.glanceSection}>
          <Text style={styles.sectionTitle}>{t('home.todayGlance')}</Text>
          {upcoming.slice(0, 5).map((item, index) => (
            <SwipeableRow
              key={item.id}
              onSwipeRight={async () => {
                await updateResponsibility(item.id, { status: 'completed', completedAt: new Date() });
              }}
              onSwipeLeft={() => {
                router.push(`/couldnt-do-it/${item.id}`);
              }}
            >
              <TouchableOpacity
                style={styles.glanceItem}
                onPress={() => router.push(`/responsibility/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.glanceTimeContainer}>
                  <View style={[styles.glanceDot, index === 0 && styles.glanceDotActive]} />
                  <Text style={styles.glanceTime}>
                    {formatDateTime(item.schedule.datetime).split(' ')[1] || '09:00'}
                  </Text>
                </View>
                <View style={styles.glanceContent}>
                  <Text style={styles.glanceTitle}>{item.title}</Text>
                  <Text style={styles.glanceSubtitle}>
                    {item.description || item.category || 'Scheduled'}
                  </Text>
                </View>
              </TouchableOpacity>
            </SwipeableRow>
          ))}
          {upcoming.length === 0 && (
            <View style={styles.emptyGlance}>
              <Text style={styles.emptyGlanceText}>Yaklaşan sorumluluk yok. Rahat bir gün.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {showAISheet && parsedCommand && (
        <AIUnderstandingSheet
          visible={showAISheet}
          onClose={() => setShowAISheet(false)}
          parsedCommand={parsedCommand}
          originalText={inputText}
        />
      )}

      {/* Proactive Suggestions */}
      <ProactiveSuggestions />
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
    paddingBottom: spacing.xxl * 2, // Extra space at bottom for tab bar
  },
  header: {
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusText: {
    ...typography.label,
    color: colors.accent.primary,
    marginRight: spacing.sm,
  },
  chip: {
    marginRight: spacing.xs,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
  },
  inputContainerFocused: {
    borderColor: colors.accent.primary,
    borderWidth: 2,
    backgroundColor: colors.background.tertiary,
  },
  inputContainerHasText: {
    borderColor: colors.accent.primary,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: spacing.md,
    paddingRight: 50, // Space for send button
    minHeight: 100,
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
    ...shadows.accent,
  },
  sendButtonLarge: {
    marginBottom: spacing.md,
    width: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.accentLg,
  },
  sendButtonLargeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  sendButtonLargeText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  inputButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputButton: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    opacity: 1,
  },
  inputButtonInactive: {
    opacity: 0.5,
  },
  inputButtonFocused: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  inputButtonActive: {
    backgroundColor: colors.accent.primary,
  },
  inputButtonText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  inputButtonTextActive: {
    color: colors.text.primary,
  },
  nextSection: {
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  responsibilityCard: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 16,
    ...shadows.md,
  },
  responsibilityImageContainer: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  responsibilityImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.tertiary,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.sm,
  },
  imageOverlayText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  timeBadge: {
    marginBottom: spacing.md,
  },
  responsibilityDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  responsibilityTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  responsibilityTime: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  responsibilityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  responsibilityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  startButton: {
    flex: 1,
    marginLeft: spacing.md,
  },
  glanceSection: {
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
  },
  glanceItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  glanceTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  glanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background.tertiary,
    marginRight: spacing.sm,
  },
  glanceDotActive: {
    backgroundColor: colors.accent.primary,
  },
  glanceTime: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  glanceContent: {
    flex: 1,
  },
  glanceTitle: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  glanceSubtitle: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  emptyGlance: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyGlanceText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
});

