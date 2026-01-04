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
import { ProactiveSuggestions } from '@/components/ProactiveSuggestions';
import { SwipeableRow } from '@/components/SwipeableRow';
import { wellnessInsightsService } from '@/services/wellnessInsights';
import { t } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showAISheet, setShowAISheet] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<any>(null);
  const [originalText, setOriginalText] = useState('');
  const [createdFrom, setCreatedFrom] = useState<'text' | 'voice' | 'photo'>('text');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'missed' | 'upcoming'>('all');
  const [wellnessInsight, setWellnessInsight] = useState<any>(null);
  const [showProactiveSuggestions, setShowProactiveSuggestions] = useState(true);
  const [wellnessInsight, setWellnessInsight] = useState<any>(null);
  const [showProactiveSuggestions, setShowProactiveSuggestions] = useState(true);
  
  const { 
    getNextCritical, 
    loadResponsibilities, 
    getUpcoming,
    getMissed,
    getSnoozed,
    getNowMode,
    updateResponsibility,
    checkStateTransitions 
  } = useResponsibilitiesStore();
  
  const user = useAuthStore((state) => state.user);
  const nextCritical = getNextCritical();
  const missed = getMissed();
  const snoozed = getSnoozed();
  const upcoming = getUpcoming();
  const nowModeItems = getNowMode().slice(0, 4);
  
  // Filter based on active tab
  const getFilteredItems = () => {
    switch (activeTab) {
      case 'missed':
        return missed;
      case 'upcoming':
        return upcoming;
      default:
        return [...missed, ...upcoming];
    }
  };

  const filteredItems = getFilteredItems();
  const tasksLeft = missed.length + upcoming.length;

  useEffect(() => {
    loadResponsibilities();
    checkStateTransitions();
    
    // Load wellness insight
    wellnessInsightsService.getCriticalInsight().then(setWellnessInsight).catch(() => {});
  }, []);

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    try {
      const parsed = await parseCommandWithAI(text, 'text');
      setParsedCommand(parsed);
      setOriginalText(text);
      setCreatedFrom('text');
      setShowAISheet(true);
      setInputText('');
    } catch (error) {
      console.error('Failed to parse command:', error);
      // Show error to user (could add toast/alert here)
    }
  };

  const handleVoicePress = async () => {
    try {
      setIsListening(true);
      const { stop } = await startVoiceRecognition();
      const result = await stop();
      const text = result.text;
      setInputText(text);
      setIsListening(false);
      
      if (text.trim()) {
        try {
          const parsed = await parseCommandWithAI(text, 'voice');
          setParsedCommand(parsed);
          setOriginalText(text);
          setCreatedFrom('voice');
          setShowAISheet(true);
        } catch (error) {
          console.error('Failed to parse voice command:', error);
        }
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      setIsListening(false);
    }
  };

  const handlePhotoPress = async () => {
    try {
      const uri = await pickImage();
      if (!uri) return;
      const ocrResult = await extractTextFromImage(uri);
      const text = ocrResult.text;
      setInputText(text);
      
      if (text.trim()) {
        try {
          const parsed = await parseCommandWithAI(text, 'photo');
          setParsedCommand(parsed);
          setOriginalText(text);
          setCreatedFrom('photo');
          setShowAISheet(true);
        } catch (error) {
          console.error('Failed to parse photo text:', error);
        }
      }
    } catch (error) {
      console.error('Photo picker error:', error);
    }
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
        {/* Header */}
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

        {/* Compact Input */}
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
                <Icon name="send" size={18} color={colors.text.primary} />
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
              <Icon name="microphone" size={16} color={isListening ? colors.text.primary : colors.text.secondary} />
              <Text style={[styles.actionText, isListening && styles.actionTextActive]}>Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePhotoPress}
              activeOpacity={0.7}
            >
              <Icon name="camera" size={16} color={colors.text.secondary} />
              <Text style={styles.actionText}>Scan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Next Critical */}
        {nextCritical && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push(`/responsibility/${nextCritical.id}`)}
            style={styles.heroCard}
          >
            <View style={styles.heroHeader}>
              <View style={styles.heroLabel}>
                <Icon name="alertCircle" size={12} color={colors.status.error} />
                <Text style={styles.heroLabelText}>Next Critical</Text>
              </View>
              <Badge 
                label={getRelativeTime(nextCritical.schedule.datetime)} 
                variant="accent"
              />
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{nextCritical.title}</Text>
            {nextCritical.description && (
              <Text style={styles.heroDescription} numberOfLines={1}>
                {nextCritical.description}
              </Text>
            )}
            <View style={styles.heroFooter}>
              <Text style={styles.heroTime}>
                {formatDateTime(nextCritical.schedule.datetime).split(' ')[1]}
              </Text>
              <View style={styles.heroArrow}>
                <Icon name="arrowRight" size={18} color={colors.accent.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Wellness Insight */}
        {wellnessInsight && (
          <View style={styles.section}>
            <Card style={[
              styles.wellnessCard,
              wellnessInsight.severity === 'critical' && styles.wellnessCardCritical,
              wellnessInsight.severity === 'warning' && styles.wellnessCardWarning,
            ]}>
              <View style={styles.wellnessHeader}>
                <Icon 
                  name={wellnessInsight.type === 'stress' ? 'alertCircle' : 'star'} 
                  size={20} 
                  color={
                    wellnessInsight.severity === 'critical' 
                      ? colors.status.error 
                      : wellnessInsight.severity === 'warning'
                      ? colors.status.warning
                      : colors.accent.primary
                  } 
                />
                <Text style={styles.wellnessTitle}>{wellnessInsight.title}</Text>
              </View>
              <Text style={styles.wellnessMessage}>{wellnessInsight.message}</Text>
              {wellnessInsight.suggestion && (
                <Text style={styles.wellnessSuggestion}>💡 {wellnessInsight.suggestion}</Text>
              )}
            </Card>
          </View>
        )}

        {/* Proactive Suggestions */}
        {showProactiveSuggestions && (
          <View style={styles.section}>
            <ProactiveSuggestions 
              visible={showProactiveSuggestions}
              onDismiss={() => setShowProactiveSuggestions(false)}
            />
          </View>
        )}

        {/* Quick Actions Grid */}
        {nowModeItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {nowModeItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickCard}
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.quickCardIcon}>
                    <Icon name="check" size={18} color={colors.accent.primary} />
                  </View>
                  <Text style={styles.quickCardTitle} numberOfLines={2}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Tasks Tabs */}
        {(missed.length > 0 || upcoming.length > 0) && (
          <View style={styles.section}>
            <View style={styles.tabsHeader}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                  onPress={() => setActiveTab('all')}
                >
                  <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
                  {(missed.length + upcoming.length) > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{missed.length + upcoming.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {missed.length > 0 && (
                  <TouchableOpacity
                    style={[styles.tab, activeTab === 'missed' && styles.tabActive]}
                    onPress={() => setActiveTab('missed')}
                  >
                    <Text style={[styles.tabText, activeTab === 'missed' && styles.tabTextActive]}>Missed</Text>
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{missed.length}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
                  onPress={() => setActiveTab('upcoming')}
                >
                  <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
                  {upcoming.length > 0 && (
                    <View style={styles.tabBadge}>
                      <Text style={styles.tabBadgeText}>{upcoming.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Tasks List */}
            {filteredItems.length > 0 ? (
              <>
                {filteredItems.slice(0, 8).map((item) => (
                  <SwipeableRow
                    key={item.id}
                    onSwipeRight={async () => await handleComplete(item.id)}
                    onSwipeLeft={() => router.push(`/couldnt-do-it/${item.id}`)}
                  >
                    <TouchableOpacity
                      style={[styles.taskItem, missed.includes(item) && styles.taskItemMissed]}
                      onPress={() => router.push(`/responsibility/${item.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.taskCheckbox}>
                        <View style={styles.checkCircle}>
                          <TouchableOpacity
                            style={styles.checkButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleComplete(item.id);
                            }}
                          >
                            <View style={styles.checkInner} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.taskContent}>
                        <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.taskMeta}>
                          <Text style={styles.taskTime}>
                            {formatDateTime(item.schedule.datetime).split(' ')[1]}
                          </Text>
                          {item.category && (
                            <>
                              <Text style={styles.taskDot}>•</Text>
                              <Text style={styles.taskCategory}>{item.category}</Text>
                            </>
                          )}
                          {missed.includes(item) && (
                            <>
                              <Text style={styles.taskDot}>•</Text>
                              <Text style={styles.taskMissed}>Missed</Text>
                            </>
                          )}
                        </View>
                      </View>
                      {item.reminderStyle === 'critical' && (
                        <View style={styles.criticalIndicator}>
                          <Icon name="alertCircle" size={12} color={colors.status.error} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </SwipeableRow>
                ))}
                {filteredItems.length > 8 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => router.push('/(tabs)/plan')}
                  >
                    <Text style={styles.viewAllText}>View all {filteredItems.length} tasks →</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.emptySection}>
                <Icon name="check" size={32} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No tasks in this category</Text>
              </View>
            )}
          </View>
        )}

        {/* Snoozed */}
        {snoozed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Snoozed</Text>
            {snoozed.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.taskItem}
                onPress={() => router.push(`/responsibility/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.taskCheckbox}>
                  <Icon name="bell" size={16} color={colors.accent.primary} />
                </View>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.taskTime}>
                    Until {item.snoozedUntil ? formatDateTime(item.snoozedUntil).split(' ')[1] : formatDateTime(item.schedule.datetime).split(' ')[1]}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!nextCritical && missed.length === 0 && upcoming.length === 0 && nowModeItems.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="check" size={48} color={colors.text.tertiary} />
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
          originalText={originalText}
          createdFrom={createdFrom}
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
    fontSize: 28,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.sm,
    position: 'relative',
    minHeight: 60,
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
    fontSize: 16,
    minHeight: 60,
    maxHeight: 100,
  },
  sendButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
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
    borderRadius: 10,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    minHeight: 44,
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
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...shadows.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  heroLabelText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.status.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  heroDescription: {
    ...typography.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTime: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  heroArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...shadows.sm,
    minHeight: 100,
  },
  quickCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickCardTitle: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 18,
  },
  tabsHeader: {
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    minHeight: 32,
  },
  tabActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  tabText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.primary,
  },
  tabBadge: {
    backgroundColor: colors.background.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.primary,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
    minHeight: 64,
  },
  taskItemMissed: {
    borderLeftWidth: 3,
    borderLeftColor: colors.status.error,
  },
  taskCheckbox: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  taskTime: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  taskDot: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  taskCategory: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  taskMissed: {
    ...typography.caption,
    fontSize: 12,
    color: colors.status.error,
    fontWeight: '600',
  },
  criticalIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  viewAllText: {
    ...typography.body,
    fontSize: 14,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  wellnessCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.primary,
    borderRadius: 12,
    ...shadows.sm,
  },
  wellnessCardCritical: {
    borderLeftColor: colors.status.error,
    backgroundColor: colors.status.error + '10',
  },
  wellnessCardWarning: {
    borderLeftColor: colors.status.warning,
    backgroundColor: colors.status.warning + '10',
  },
  wellnessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  wellnessTitle: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  wellnessMessage: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  wellnessSuggestion: {
    ...typography.bodySmall,
    fontSize: 13,
    color: colors.accent.primary,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
});
