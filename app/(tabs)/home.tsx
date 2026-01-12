import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { Icon, useToast } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { parseCommandWithAI } from '@/services/aiParser';
import { startVoiceRecognition } from '@/services/voice';
import { pickImage, extractTextFromImage } from '@/services/ocr';
import { formatTime } from '@/utils/date';
import { hapticFeedback } from '@/utils/haptics';
import { AIUnderstandingSheet } from '@/components/AIUnderstandingSheet';
import { QueryResultsSheet } from '@/components/QueryResultsSheet';
import { ActionButtons } from '@/components/ActionButtons';
import { handleListOnlyCommand, handleQueryCommand, handleDynamicScheduling } from './homeHelpers';
import { processBillImage, createPaymentReminder } from '@/services/billProcessor';
import { useNotesStore } from '@/store/notes';
import { v4 as uuidv4 } from 'uuid';
import { handleError } from '@/services/errorHandler';
import { generateActionResponse, parseLongVoiceInput, analyzePhotoForActions, ActionButton } from '@/services/actionAssistant';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  data?: any;
  actions?: ActionButton[]; // Aksiyon butonları
}

export default function HomeScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showAISheet, setShowAISheet] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<any>(null);
  const [originalText, setOriginalText] = useState('');
  const [createdFrom, setCreatedFrom] = useState<'text' | 'voice' | 'photo'>('text');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [showQueryResults, setShowQueryResults] = useState(false);
  const { showToast } = useToast();
  
  const { loadResponsibilities } = useResponsibilitiesStore();
  const { loadLists } = useListsStore();
  const { addNote, loadNotes } = useNotesStore();

  useEffect(() => {
    loadResponsibilities();
    loadLists();
    loadNotes();
    
    // Welcome message
    setMessages([{
      id: 'welcome',
      type: 'assistant',
      text: 'Merhaba! Size nasıl yardımcı olabilirim? Görev ekleyebilir, liste oluşturabilir, not alabilir veya sorular sorabilirsiniz.',
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    if (!showAISheet && parsedCommand) {
      // Sheet closed, check if task was added
      loadResponsibilities();
      if (parsedCommand.title) {
        addMessage('assistant', `"${parsedCommand.title}" görevi eklendi! ✅`);
      }
      setParsedCommand(null);
    }
  }, [showAISheet]);

  useEffect(() => {
    // Scroll to bottom when new message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const addMessage = (type: 'user' | 'assistant' | 'system', text: string, data?: any, actions?: ActionButton[]) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date(),
      data,
      actions,
    }]);
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim() || isProcessingCommand) return;

    const text = inputText.trim();
    setInputText('');
    setIsProcessingCommand(true);
    hapticFeedback.selection();
    
    // Add user message
    addMessage('user', text);

    try {
      showToast('İşleniyor...', 'info');
      
      // Yeni aksiyon odaklı yaklaşım
      const actionResponse = await generateActionResponse(text);
      
      // Eğer otomatik yapılacak aksiyonlar varsa, onları işle
      if (actionResponse.parsedActions) {
        const parsed = await parseCommandWithAI(text, 'text');
        
        // Auto-execute logic
        if (parsed.autoExecute) {
          if (parsed.isQuery || parsed.actionType === 'query') {
            await handleQueryCommand(parsed, text, setQueryResults, setShowQueryResults, addMessage);
            setIsProcessingCommand(false);
            return;
          }
          if (parsed.actionType === 'list' || (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === ''))) {
            await handleListOnlyCommand(parsed, addMessage, showToast);
            // Aksiyon odaklı cevap ekle
            addMessage('assistant', actionResponse.message, null, actionResponse.actions);
            setIsProcessingCommand(false);
            return;
          }
        }
      }
      
      // Normal flow - aksiyon odaklı cevap göster
      addMessage('assistant', actionResponse.message, null, actionResponse.actions);
      
      // Eğer hala eski sistemi kullanmak istiyorsak, parseCommandWithAI'yi de çalıştır
      const parsed = await parseCommandWithAI(text, 'text');

      // Auto-execute logic
      if (parsed.autoExecute) {
        if (parsed.isQuery || parsed.actionType === 'query') {
          await handleQueryCommand(parsed, text, setQueryResults, setShowQueryResults, addMessage);
          setIsProcessingCommand(false);
          return;
        }
        if (parsed.actionType === 'list' || (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === ''))) {
          await handleListOnlyCommand(parsed, addMessage, showToast);
          setIsProcessingCommand(false);
          return;
        }
      }

      // Check if this is a query command
      if (parsed.isQuery) {
        await handleQueryCommand(parsed, text, setQueryResults, setShowQueryResults, addMessage);
        setIsProcessingCommand(false);
        return;
      }

      // Check if this is a simple list action
      if (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === '')) {
        await handleListOnlyCommand(parsed, addMessage, showToast);
        setIsProcessingCommand(false);
        return;
      }

      // Check if this is a note command
      if (parsed.actionType === 'note' || text.toLowerCase().match(/^(not|note|not al|not:)/i)) {
        const noteContent = parsed.description || parsed.title || text.replace(/^(not|note|not al|not:)\s*/i, '').trim();
        if (noteContent) {
          const note = {
            id: uuidv4(),
            content: noteContent,
            tags: parsed.category ? [parsed.category] : undefined,
            category: parsed.category,
            createdAt: new Date(),
            updatedAt: new Date(),
            archived: false,
          };
          await addNote(note);
          addMessage('assistant', '✅ Not kaydedildi!');
          showToast('Not kaydedildi', 'success');
          setIsProcessingCommand(false);
          return;
        }
      }

      // Check if this is a dynamic scheduling command (e.g., "haftada 3 gün spor")
      if (parsed.schedule?.type === 'recurring' || text.toLowerCase().match(/(haftada|her gün|günlük)/i)) {
        const handled = await handleDynamicScheduling(parsed, text, addMessage, showToast);
        if (handled) {
          setIsProcessingCommand(false);
          return;
        }
      }

      // Normal command - needs confirmation
      setParsedCommand(parsed);
      setOriginalText(text);
      setCreatedFrom('text');
      setShowAISheet(true);
      setIsProcessingCommand(false);
    } catch (error) {
      console.error('Failed to parse command:', error);
      hapticFeedback.error();
      const appError = handleError(error);
      addMessage('assistant', `❌ ${appError.userMessage}`);
      showToast(appError.userMessage, 'error');
      setIsProcessingCommand(false);
    }
  };

  const handleVoicePress = async () => {
    if (isProcessingCommand) return;
    
    try {
      setIsListening(true);
      setIsProcessingCommand(true);
      hapticFeedback.selection();
      
      const { stop } = await startVoiceRecognition();
      const result = await stop();
      const text = result.text;
      setIsListening(false);
      
      if (text.trim()) {
        addMessage('user', text);
        showToast('İşleniyor...', 'info');
        
        // Uzun konuşmaları parçalara ayır
        const parsedVoice = await parseLongVoiceInput(text);
        
        // Her parçayı işle
        const actions: any[] = [];
        for (const part of parsedVoice.parts) {
          if (part.parsed) {
            if (part.type === 'shopping' && part.parsed.listActions) {
              await handleListOnlyCommand(part.parsed, addMessage, showToast);
            } else if (part.type === 'schedule' && part.parsed.title) {
              // Schedule işle
              const parsed = await parseCommandWithAI(part.content, 'voice');
              if (parsed.schedule?.type === 'recurring' || part.content.toLowerCase().match(/(haftada|her gün|günlük)/i)) {
                await handleDynamicScheduling(parsed, part.content, addMessage, showToast);
              } else {
                setParsedCommand(parsed);
                setOriginalText(part.content);
                setCreatedFrom('voice');
                setShowAISheet(true);
              }
            } else if (part.type === 'task' && part.parsed.title) {
              const parsed = await parseCommandWithAI(part.content, 'voice');
              setParsedCommand(parsed);
              setOriginalText(part.content);
              setCreatedFrom('voice');
              setShowAISheet(true);
            }
          }
        }
        
        // Tek cevap ver
        const summary = parsedVoice.summary || `Tamam. ${parsedVoice.parts.length} işlem yapıldı.`;
        addMessage('assistant', summary);
        
        setIsProcessingCommand(false);
        return;
        
        // Eski sistem (fallback)
        const parsed = await parseCommandWithAI(text, 'voice');
        
        if (parsed.autoExecute) {
          if (parsed.isQuery || parsed.actionType === 'query') {
            await handleQueryCommand(parsed, text, setQueryResults, setShowQueryResults, addMessage);
            setIsProcessingCommand(false);
            return;
          }
          if (parsed.actionType === 'list' || (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === ''))) {
            await handleListOnlyCommand(parsed, addMessage, showToast);
            setIsProcessingCommand(false);
            return;
          }
        }
        
        if (parsed.isQuery) {
          await handleQueryCommand(parsed, text, setQueryResults, setShowQueryResults, addMessage);
          setIsProcessingCommand(false);
          return;
        }
        
        if (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === '')) {
          await handleListOnlyCommand(parsed, addMessage, showToast);
          setIsProcessingCommand(false);
          return;
        }
        
        // Check if this is a dynamic scheduling command
        if (parsed.schedule?.type === 'recurring' || text.toLowerCase().match(/(haftada|her gün|günlük)/i)) {
          const handled = await handleDynamicScheduling(parsed, text, addMessage, showToast);
          if (handled) {
            setIsProcessingCommand(false);
            return;
          }
        }
        
        setParsedCommand(parsed);
        setOriginalText(text);
        setCreatedFrom('voice');
        setShowAISheet(true);
        setIsProcessingCommand(false);
      } else {
        setIsProcessingCommand(false);
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      hapticFeedback.error();
      const appError = handleError(error);
      addMessage('assistant', `❌ ${appError.userMessage}`);
      showToast(appError.userMessage, 'error');
      setIsListening(false);
      setIsProcessingCommand(false);
    }
  };

  const handlePhotoPress = async () => {
    if (isProcessingCommand) return;
    
    try {
      setIsProcessingCommand(true);
      hapticFeedback.medium();
      
      const uri = await pickImage();
      if (!uri) {
        setIsProcessingCommand(false);
        return;
      }
      
      showToast('Fotoğraf işleniyor...', 'info');
      
      // First, try to process as bill
      const billData = await processBillImage(uri);
      
      if (billData) {
        // It's a bill - create payment reminder
        addMessage('user', `📷 Fatura görüntüsü gönderildi`);
        showToast('Fatura işleniyor...', 'info');
        
        const responsibilityId = await createPaymentReminder(billData);
        await loadResponsibilities();
        
        addMessage('assistant', `✅ ${billData.vendor} faturası için ödeme hatırlatıcısı oluşturuldu!\nTutar: ${billData.amount.toFixed(2)} TL\nSon Ödeme: ${new Date(billData.dueDate).toLocaleDateString('tr-TR')}`);
        showToast('Fatura hatırlatıcısı oluşturuldu!', 'success');
        setIsProcessingCommand(false);
        return;
      }
      
      // Not a bill - try OCR text extraction
      const ocrResult = await extractTextFromImage(uri);
      const text = ocrResult.text;
      
      if (text.trim()) {
        addMessage('user', `📷 Fotoğraf gönderildi`);
        showToast('İşleniyor...', 'info');
        
        // Yeni fotoğraf analizi
        const photoAnalysis = await analyzePhotoForActions(uri, text);
        
        // Fotoğraf tipine göre işle
        if (photoAnalysis.detectedType === 'bill' && photoAnalysis.extractedData) {
          // Fatura işleme
          const billData = await processBillImage(uri);
          if (billData) {
            await createPaymentReminder(billData);
            await loadResponsibilities();
            addMessage('assistant', photoAnalysis.message, null, photoAnalysis.actions);
            showToast('Fatura hatırlatıcısı oluşturuldu!', 'success');
            setIsProcessingCommand(false);
            return;
          }
        } else if (photoAnalysis.detectedType === 'refrigerator' && photoAnalysis.extractedData?.items) {
          // Buzdolabı - eksik ürünleri listeye ekle
          const parsed = {
            listActions: [{
              listName: 'Shopping List',
              items: photoAnalysis.extractedData.items,
            }],
            autoExecute: true,
            actionType: 'list' as const,
          };
          await handleListOnlyCommand(parsed, addMessage, showToast);
          addMessage('assistant', photoAnalysis.message, null, photoAnalysis.actions);
          setIsProcessingCommand(false);
          return;
        } else if (photoAnalysis.detectedType === 'note' && photoAnalysis.extractedData?.content) {
          // Not olarak kaydet
          const note = {
            id: uuidv4(),
            content: photoAnalysis.extractedData.content,
            tags: photoAnalysis.extractedData.tags,
            category: photoAnalysis.extractedData.category,
            createdAt: new Date(),
            updatedAt: new Date(),
            archived: false,
          };
          await addNote(note);
          addMessage('assistant', photoAnalysis.message, null, photoAnalysis.actions);
          showToast('Not kaydedildi', 'success');
          setIsProcessingCommand(false);
          return;
        } else if (photoAnalysis.detectedType === 'screenshot') {
          // Ekran görüntüsü - plan revize et
          addMessage('assistant', photoAnalysis.message, null, photoAnalysis.actions);
          setIsProcessingCommand(false);
          return;
        }
        
        // Genel OCR metni ile devam et
        const parsed = await parseCommandWithAI(text, 'photo');
        
        if (parsed.autoExecute) {
          if (parsed.isQuery || parsed.actionType === 'query') {
            await handleQueryCommand(parsed, text, setQueryResults, setShowQueryResults, addMessage);
            setIsProcessingCommand(false);
            return;
          }
          if (parsed.actionType === 'list' || (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === ''))) {
            await handleListOnlyCommand(parsed, addMessage, showToast);
            setIsProcessingCommand(false);
            return;
          }
        }
        
        if (parsed.isQuery) {
          await handleQueryCommand(parsed, text, setQueryResults, setShowQueryResults, addMessage);
          setIsProcessingCommand(false);
          return;
        }
        
        if (parsed.listActions && parsed.listActions.length > 0 && (!parsed.title || parsed.title?.trim() === '')) {
          await handleListOnlyCommand(parsed, addMessage, showToast);
          setIsProcessingCommand(false);
          return;
        }
        
        // Check if this is a dynamic scheduling command
        if (parsed.schedule?.type === 'recurring' || text.toLowerCase().match(/(haftada|her gün|günlük)/i)) {
          const handled = await handleDynamicScheduling(parsed, text, addMessage, showToast);
          if (handled) {
            setIsProcessingCommand(false);
            return;
          }
        }
        
        setParsedCommand(parsed);
        setOriginalText(text);
        setCreatedFrom('photo');
        setShowAISheet(true);
        setIsProcessingCommand(false);
      } else {
        addMessage('assistant', 'Fotoğraftan metin çıkarılamadı. Lütfen daha net bir görüntü gönderin.');
        setIsProcessingCommand(false);
      }
    } catch (error) {
      console.error('Photo processing error:', error);
      hapticFeedback.error();
      const appError = handleError(error);
      addMessage('assistant', `❌ ${appError.userMessage}`);
      showToast(appError.userMessage, 'error');
      setIsProcessingCommand(false);
    }
  };

  const { responsibilities } = useResponsibilitiesStore();
  const { lists } = useListsStore();
  const todayTasks = responsibilities.filter(r => {
    if (!r.schedule?.datetime) return false;
    const taskDate = new Date(r.schedule.datetime);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString() && r.status === 'active';
  });
  const upcomingTasks = responsibilities.filter(r => {
    if (!r.schedule?.datetime) return false;
    const taskDate = new Date(r.schedule.datetime);
    const now = new Date();
    return taskDate > now && r.status === 'active';
  }).slice(0, 3);
  const activeLists = lists.filter(l => l.items.filter(i => !i.checked).length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Quick Stats Bar */}
        {(todayTasks.length > 0 || activeLists.length > 0) && (
          <View style={styles.quickStats}>
            {todayTasks.length > 0 && (
              <TouchableOpacity
                style={styles.quickStatItem}
                onPress={() => router.push('/(tabs)/inbox')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickStatNumber}>{todayTasks.length}</Text>
                <Text style={styles.quickStatLabel}>Bugün</Text>
              </TouchableOpacity>
            )}
            {activeLists.length > 0 && (
              <TouchableOpacity
                style={styles.quickStatItem}
                onPress={() => router.push('/(tabs)/lists')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickStatNumber}>{activeLists.length}</Text>
                <Text style={styles.quickStatLabel}>Liste</Text>
              </TouchableOpacity>
            )}
            {upcomingTasks.length > 0 && (
              <TouchableOpacity
                style={styles.quickStatItem}
                onPress={() => router.push('/(tabs)/plan')}
                activeOpacity={0.7}
              >
                <Text style={styles.quickStatNumber}>{upcomingTasks.length}</Text>
                <Text style={styles.quickStatLabel}>Yaklaşan</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.type === 'user' && styles.messageContainerUser,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.type === 'user' && styles.messageBubbleUser,
                  message.type === 'assistant' && styles.messageBubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === 'user' && styles.messageTextUser,
                  ]}
                >
                  {message.text}
                </Text>
                {message.actions && message.actions.length > 0 && (
                  <ActionButtons
                    actions={message.actions}
                    onActionPress={async (action) => {
                      // Aksiyon butonuna tıklandığında
                      try {
                        await action.action();
                        // Mesajı güncelle
                        setMessages(prev => prev.map(msg => 
                          msg.id === message.id 
                            ? { ...msg, actions: undefined } // Butonları kaldır
                            : msg
                        ));
                      } catch (error) {
                        console.error('Action error:', error);
                        showToast('Aksiyon gerçekleştirilemedi', 'error');
                      }
                    }}
                  />
                )}
                <Text style={styles.messageTime}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}
          {isProcessingCommand && (
            <View style={styles.messageContainer}>
              <View style={styles.messageBubbleAssistant}>
                <Text style={styles.messageText}>İşleniyor...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ne yapmak istersiniz?"
              placeholderTextColor={colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleTextSubmit}
              editable={!isProcessingCommand}
              multiline
              maxLength={500}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[styles.actionButton, isListening && styles.actionButtonActive]}
                onPress={handleVoicePress}
                disabled={isProcessingCommand}
              >
                <Text style={styles.actionButtonText}>{isListening ? '🎤' : '🎙️'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePhotoPress}
                disabled={isProcessingCommand}
              >
                <Text style={styles.actionButtonText}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleTextSubmit}
                disabled={!inputText.trim() || isProcessingCommand}
              >
                <Text style={styles.sendButtonText}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* AI Understanding Sheet */}
      {parsedCommand && (
        <AIUnderstandingSheet
          visible={showAISheet}
          onClose={() => {
            setShowAISheet(false);
            hapticFeedback.warning();
          }}
          parsedCommand={parsedCommand}
          originalText={originalText}
          createdFrom={createdFrom}
        />
      )}

      {/* Query Results Sheet */}
      {queryResults && (
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
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageContainer: {
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  messageContainerUser: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 16,
  },
  messageBubbleUser: {
    backgroundColor: colors.accent.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleAssistant: {
    backgroundColor: colors.background.secondary,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...typography.body,
    color: colors.text.primary,
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextUser: {
    color: colors.background.primary,
  },
  messageTime: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    backgroundColor: colors.background.primary,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background.secondary,
    borderRadius: 24,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    fontSize: 15,
    maxHeight: 100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: colors.accent.primary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 18,
  },
  sendButtonText: {
    fontSize: 18,
    color: colors.background.primary,
    fontWeight: 'bold',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  quickStatNumber: {
    ...typography.h2,
    color: colors.accent.primary,
    fontWeight: '700',
    fontSize: 24,
    marginBottom: spacing.xs / 2,
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
