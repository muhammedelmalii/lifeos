import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Card, Icon, Badge, Toast, useToast, Skeleton, SkeletonCard, AnimatedCard } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { useAuthStore } from '@/store';
import { parseCommandWithAI } from '@/services/aiParser';
import { startVoiceRecognition } from '@/services/voice';
import { pickImage, extractTextFromImage } from '@/services/ocr';
import { formatDateTime, getRelativeTime } from '@/utils/date';
import { hapticFeedback } from '@/utils/haptics';
import { AIUnderstandingSheet } from '@/components/AIUnderstandingSheet';
import { QueryResultsSheet } from '@/components/QueryResultsSheet';
import { ProactiveSuggestions } from '@/components/ProactiveSuggestions';
import { SwipeableRow } from '@/components/SwipeableRow';
import { wellnessInsightsService } from '@/services/wellnessInsights';
import { dynamicAssistantService } from '@/services/dynamicAssistant';
import { t } from '@/i18n';
import { v4 as uuidv4 } from 'uuid';
import { List } from '@/types/domain';

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
  const [queryResults, setQueryResults] = useState<any>(null);
  const [showQueryResults, setShowQueryResults] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  
  const { 
    getNextCritical, 
    loadResponsibilities, 
    getUpcoming,
    getMissed,
    getSnoozed,
    getNowMode,
    getByCategory,
    getTodayByCategory,
    getCategories,
    updateResponsibility,
    checkStateTransitions,
    isLoading
  } = useResponsibilitiesStore();
  const { lists, loadLists, getList } = useListsStore();
  
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
    
    // Start dynamic assistant monitoring
    dynamicAssistantService.startMonitoring();
    
    // Refresh proactive suggestions periodically
    const suggestionsInterval = setInterval(() => {
      // Force refresh by toggling visibility
      setShowProactiveSuggestions(false);
      setTimeout(() => setShowProactiveSuggestions(true), 100);
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Check for updates every 2 minutes
    const updateInterval = setInterval(async () => {
      const updates = await dynamicAssistantService.getDynamicUpdates();
      if (updates.length > 0) {
        // Show most important update
        const importantUpdate = updates.find(u => u.priority === 'high') || updates[0];
        if (importantUpdate && !importantUpdate.autoExecute) {
          showToast(importantUpdate.message, importantUpdate.priority === 'high' ? 'warning' : 'info');
        }
      }
    }, 2 * 60 * 1000);

    return () => {
      dynamicAssistantService.stopMonitoring();
      clearInterval(updateInterval);
      clearInterval(suggestionsInterval);
    };
  }, []);

  const handleTextSubmit = async () => {
    if (!inputText.trim()) return;
    if (isProcessingCommand) return; // Prevent double submission
    
    hapticFeedback.selection();
    const text = inputText.trim();
    setIsProcessingCommand(true);
    showToast('Komut işleniyor...', 'info');
    
    try {
      console.log('🔍 Parsing command:', text);
      const parsed = await parseCommandWithAI(text, 'text');
      console.log('✅ Parsed result:', JSON.stringify(parsed, null, 2));
      
      // GPT decided this should auto-execute - act as personal assistant
      if (parsed.autoExecute) {
        console.log('⚡ Auto-execute enabled');
        // Query commands
        if (parsed.isQuery || parsed.actionType === 'query') {
          console.log('📋 Executing query command');
          await handleQueryCommand(parsed, text);
          setInputText('');
          setIsProcessingCommand(false);
          return;
        }
        
        // List actions (shopping, etc.)
        if (parsed.actionType === 'list' || (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === ''))) {
          console.log('🛒 Executing list command');
          await handleListOnlyCommand(parsed);
          setInputText('');
          setIsProcessingCommand(false);
          return;
        }
      }
      
      // Check if this is a query command (fallback)
      if (parsed.isQuery) {
        console.log('📋 Fallback: Executing query command');
        await handleQueryCommand(parsed, text);
        setInputText('');
        setIsProcessingCommand(false);
        return;
      }
      
      // Check if this is a simple list action (fallback)
      if (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === '')) {
        console.log('🛒 Fallback: Executing list command');
        await handleListOnlyCommand(parsed);
        setInputText('');
        setIsProcessingCommand(false);
        return;
      }
      
      // Normal command - needs confirmation
      console.log('📝 Showing confirmation sheet');
      setParsedCommand(parsed);
      setOriginalText(text);
      setCreatedFrom('text');
      setShowAISheet(true);
      setInputText('');
      setIsProcessingCommand(false);
    } catch (error) {
      console.error('❌ Failed to parse command:', error);
      hapticFeedback.error();
      showToast(`Komut işlenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error');
      setIsProcessingCommand(false);
    }
  };

  const handleListOnlyCommand = async (parsed: any) => {
    try {
      console.log('🛒 handleListOnlyCommand called with:', JSON.stringify(parsed, null, 2));
      
      if (!parsed.listActions || parsed.listActions.length === 0) {
        console.warn('⚠️ No listActions found');
        showToast('Liste işlemi bulunamadı', 'warning');
        return;
      }

      const { loadLists } = useListsStore.getState();
      await loadLists();
      console.log('📋 Lists loaded');
      
      let itemsAdded = 0;
      let listsCreated = 0;
      
      for (const listAction of parsed.listActions) {
        console.log(`📝 Processing list: ${listAction.listName} with items:`, listAction.items);
        
        const existingList = useListsStore.getState().lists.find(
          l => l.name.toLowerCase() === listAction.listName.toLowerCase()
        );

        if (existingList) {
          console.log(`✅ Found existing list: ${existingList.name}`);
          const { updateList } = useListsStore.getState();
          const newItems = listAction.items.map((item: string) => ({
            id: uuidv4(),
            label: item,
            category: '',
            checked: false,
            createdAt: new Date(),
          }));
          const updatedItems = [...existingList.items, ...newItems];
          await updateList(existingList.id, { items: updatedItems });
          itemsAdded += newItems.length;
          console.log(`✅ Added ${newItems.length} items to existing list`);
        } else {
          console.log(`🆕 Creating new list: ${listAction.listName}`);
          const { addList } = useListsStore.getState();
          const newList: List = {
            id: uuidv4(),
            name: listAction.listName,
            type: 'market',
            items: listAction.items.map((item: string) => ({
              id: uuidv4(),
              label: item,
              category: '',
              checked: false,
              createdAt: new Date(),
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await addList(newList);
          listsCreated++;
          itemsAdded += newList.items.length;
          console.log(`✅ Created new list with ${newList.items.length} items`);
        }
      }
      
      // Show success message
      if (itemsAdded > 0) {
        const message = listsCreated > 0 
          ? `${itemsAdded} öğe ${listsCreated} listeye eklendi`
          : `${itemsAdded} öğe listeye eklendi`;
        console.log(`✅ Success: ${message}`);
        hapticFeedback.success();
        showToast(message, 'success');
      }
    } catch (error) {
      console.error('❌ Error in handleListOnlyCommand:', error);
      hapticFeedback.error();
      showToast(`Liste işlemi sırasında hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error');
    }
  };

  const handleQueryCommand = async (parsed: any, originalText: string) => {
    try {
      console.log('📋 handleQueryCommand called with:', JSON.stringify(parsed, null, 2));
      
      await loadLists();
      
      if (parsed.queryType === 'list' && parsed.queryListName) {
        console.log(`🔍 Looking for list: ${parsed.queryListName}`);
        // Show specific list
        const list = useListsStore.getState().lists.find(
          l => l.name.toLowerCase() === parsed.queryListName.toLowerCase()
        );
        if (list) {
          console.log(`✅ Found list with ${list.items.length} items`);
          setQueryResults({
            type: 'list',
            listName: parsed.queryListName,
            list: list,
            items: list.items,
          });
          setShowQueryResults(true);
        } else {
          console.warn(`⚠️ List not found: ${parsed.queryListName}`);
          showToast(`Liste bulunamadı: ${parsed.queryListName}`, 'warning');
        }
      } else if (parsed.queryCategory) {
        console.log(`🔍 Filtering by category: ${parsed.queryCategory}`);
        // Show by category
        const items = parsed.queryType === 'show' && originalText.toLowerCase().includes('today')
          ? getTodayByCategory(parsed.queryCategory)
          : getByCategory(parsed.queryCategory);
        console.log(`✅ Found ${items.length} items`);
        setQueryResults({
          type: 'category',
          category: parsed.queryCategory,
          items: items,
        });
        setShowQueryResults(true);
      } else if (parsed.queryType === 'show') {
        console.log('🔍 Showing today\'s items');
        // General show command - show today's items
        const today = getTodayByCategory('');
        console.log(`✅ Found ${today.length} items for today`);
        setQueryResults({
          type: 'today',
          items: today,
        });
        setShowQueryResults(true);
      } else {
        console.warn('⚠️ Unknown query type:', parsed.queryType);
        showToast('Sorgu tipi tanınmadı', 'warning');
      }
    } catch (error) {
      console.error('❌ Error in handleQueryCommand:', error);
      showToast(`Sorgu işlemi sırasında hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 'error');
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
          
          // Check if this is a query command
          if (parsed.isQuery) {
            await handleQueryCommand(parsed, text);
            return;
          }
          
          // Check if this is a simple list action (no title = just add to list)
          if (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title.trim() === '')) {
            await handleListOnlyCommand(parsed);
            return;
          }
          
          // Normal command - create responsibility
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
      hapticFeedback.medium();
      const uri = await pickImage();
      if (!uri) return;
      const ocrResult = await extractTextFromImage(uri);
      const text = ocrResult.text;
      setInputText(text);
      
      if (text.trim()) {
        try {
          const parsed = await parseCommandWithAI(text, 'photo');
          
          // GPT decided this should auto-execute
          if (parsed.autoExecute) {
            if (parsed.isQuery || parsed.actionType === 'query') {
              await handleQueryCommand(parsed, text);
              return;
            }
            if (parsed.actionType === 'list' || (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title.trim() === ''))) {
              await handleListOnlyCommand(parsed);
              return;
            }
          }
          
          // Check if this is a query command (fallback)
          if (parsed.isQuery) {
            await handleQueryCommand(parsed, text);
            return;
          }
          
          // Check if this is a simple list action (fallback)
          if (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title.trim() === '')) {
            await handleListOnlyCommand(parsed);
            return;
          }
          
          // Normal command - needs confirmation
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
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
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
              placeholder={isProcessingCommand ? "İşleniyor..." : "Add a task or note..."}
              placeholderTextColor={colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              multiline
              onSubmitEditing={handleTextSubmit}
              returnKeyType="done"
              textAlignVertical="top"
              editable={!isProcessingCommand}
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
            ] as any}>
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
                  onPress={() => {
                    hapticFeedback.selection();
                    setActiveTab('upcoming');
                  }}
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
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : filteredItems.length > 0 ? (
              <>
                {filteredItems.slice(0, 8).map((item, index) => (
                  <AnimatedCard
                    key={item.id}
                    delay={index * 50}
                    onPress={() => router.push(`/responsibility/${item.id}`)}
                  >
                    <SwipeableRow
                      onSwipeRight={async () => {
                        hapticFeedback.success();
                        await handleComplete(item.id);
                      }}
                      onSwipeLeft={() => {
                        hapticFeedback.medium();
                        router.push(`/couldnt-do-it/${item.id}`);
                      }}
                    >
                    <View style={[styles.taskItem, missed.includes(item) && styles.taskItemMissed]}>
                      <View style={styles.taskCheckbox}>
                        <View style={styles.checkCircle}>
                          <TouchableOpacity
                            style={styles.checkButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              hapticFeedback.success();
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
                    </View>
                  </SwipeableRow>
                </AnimatedCard>
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

      {showQueryResults && queryResults && (
        <QueryResultsSheet
          visible={showQueryResults}
          onClose={() => {
            setShowQueryResults(false);
            setQueryResults(null);
          }}
          results={queryResults}
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
  loadingContainer: {
    gap: spacing.md,
  },
});
