/**
 * List Detail Screen - View and manage a specific list
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, Icon, EmptyState, AnimatedCard, useToast } from '@/components/ui';
import { useListsStore } from '@/store/lists';
import { List } from '@/types';
import { hapticFeedback } from '@/utils/haptics';
import { v4 as uuidv4 } from 'uuid';

export default function ListDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lists, loadLists, updateList, deleteList } = useListsStore();
  const { showToast } = useToast();
  const [list, setList] = useState<List | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    const foundList = lists.find((l) => l.id === id);
    setList(foundList || null);
  }, [id, lists]);

  if (!list) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Icon name="alertCircle" size={48} color={colors.text.tertiary} />
          <Text style={styles.errorText}>Liste bulunamadı</Text>
          <Button
            title="Geri Dön"
            onPress={() => router.back()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleItem = async (itemId: string) => {
    hapticFeedback.light();
    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    await updateList(list.id, { items: updatedItems });
    await loadLists();
  };

  const handleDeleteItem = async (itemId: string) => {
    hapticFeedback.medium();
    const updatedItems = list.items.filter((item) => item.id !== itemId);
    await updateList(list.id, { items: updatedItems });
    await loadLists();
    showToast('Öğe silindi', 'success');
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;

    hapticFeedback.medium();
    const newItem = {
      id: uuidv4(),
      label: newItemText.trim(),
      category: '',
      checked: false,
      createdAt: new Date(),
    };

    await updateList(list.id, { items: [...list.items, newItem] });
    setNewItemText('');
    setIsAddingItem(false);
    await loadLists();
    showToast('Öğe eklendi', 'success');
  };

  const handleDeleteList = async () => {
    hapticFeedback.medium();
    await deleteList(list.id);
    showToast('Liste silindi', 'success');
    router.back();
  };

  const checkedCount = list.items.filter((item) => item.checked).length;
  const totalCount = list.items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const uncheckedItems = list.items.filter((item) => !item.checked);
  const checkedItems = list.items.filter((item) => item.checked);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrowLeft" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{list.name}</Text>
            <Text style={styles.headerSubtitle}>
              {totalCount} öğe • {checkedCount} tamamlandı
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDeleteList}
            style={styles.deleteButton}
          >
            <Icon name="trash" size={20} color={colors.status.error} />
          </TouchableOpacity>
        </View>

        {/* Progress */}
        {totalCount > 0 && (
          <AnimatedCard delay={0} variant="elevated" style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>İlerleme</Text>
              <Text style={styles.progressValue}>%{Math.round(progress)}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </AnimatedCard>
        )}

        {/* Add Item */}
        {isAddingItem ? (
          <AnimatedCard delay={0} variant="elevated" style={styles.addCard}>
            <TextInput
              style={styles.addInput}
              placeholder="Yeni öğe ekle..."
              placeholderTextColor={colors.text.tertiary}
              value={newItemText}
              onChangeText={setNewItemText}
              autoFocus
              onSubmitEditing={handleAddItem}
            />
            <View style={styles.addActions}>
              <Button
                title="İptal"
                onPress={() => {
                  setIsAddingItem(false);
                  setNewItemText('');
                }}
                variant="secondary"
                size="medium"
                style={styles.addButton}
              />
              <Button
                title="Ekle"
                onPress={handleAddItem}
                variant="primary"
                size="medium"
                style={styles.addButton}
              />
            </View>
          </AnimatedCard>
        ) : (
          <Button
            title="Öğe Ekle"
            onPress={() => {
              hapticFeedback.medium();
              setIsAddingItem(true);
            }}
            variant="primary"
            icon={<Icon name="plus" size={18} color={colors.text.primary} />}
            style={styles.addButtonLarge}
          />
        )}

        {/* Unchecked Items */}
        {uncheckedItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yapılacaklar ({uncheckedItems.length})</Text>
            {uncheckedItems.map((item, index) => (
              <AnimatedCard
                key={item.id}
                delay={index * 50}
                variant="elevated"
                style={styles.itemCard}
              >
                <View style={styles.itemRow}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => handleToggleItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxInner} />
                  </TouchableOpacity>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id)}
                    style={styles.itemDelete}
                  >
                    <Icon name="x" size={16} color={colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              </AnimatedCard>
            ))}
          </View>
        )}

        {/* Checked Items */}
        {checkedItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tamamlanan ({checkedItems.length})</Text>
            {checkedItems.map((item, index) => (
              <AnimatedCard
                key={item.id}
                delay={index * 50}
                variant="elevated"
                style={[styles.itemCard, styles.itemCardChecked]}
              >
                <View style={styles.itemRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, styles.checkboxChecked]}
                    onPress={() => handleToggleItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Icon name="check" size={14} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.itemLabel, styles.itemLabelChecked]}>
                    {item.label}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(item.id)}
                    style={styles.itemDelete}
                  >
                    <Icon name="x" size={16} color={colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              </AnimatedCard>
            ))}
          </View>
        )}

        {/* Empty State */}
        {totalCount === 0 && (
          <EmptyState
            icon="list"
            title="Liste boş"
            subtitle="Yeni öğeler ekleyerek başlayın"
            actionLabel="İlk Öğeyi Ekle"
            onAction={() => setIsAddingItem(true)}
          />
        )}
      </ScrollView>
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
    paddingBottom: spacing.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h3,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h1,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: spacing.xs,
  },
  progressCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  progressValue: {
    ...typography.h3,
    color: colors.accent.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 4,
  },
  addCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  addInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  addActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addButton: {
    flex: 1,
  },
  addButtonLarge: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  itemCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemCardChecked: {
    opacity: 0.6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  itemLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  itemLabelChecked: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  itemDelete: {
    padding: spacing.xs,
  },
});

