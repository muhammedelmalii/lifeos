/**
 * Lists Screen - Manage all lists (shopping, etc.)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, Icon, EmptyState, AnimatedCard, useToast } from '@/components/ui';
import { useListsStore } from '@/store/lists';
import { List } from '@/types';
import { hapticFeedback } from '@/utils/haptics';
import { v4 as uuidv4 } from 'uuid';

export default function ListsScreen() {
  const router = useRouter();
  const { lists, loadLists, addList, updateList, deleteList } = useListsStore();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    hapticFeedback.medium();
    const newList: List = {
      id: uuidv4(),
      name: newListName.trim(),
      type: 'custom',
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await addList(newList);
    setNewListName('');
    setIsCreating(false);
    showToast('Liste oluşturuldu', 'success');
  };

  const handleDeleteList = async (listId: string) => {
    hapticFeedback.medium();
    await deleteList(listId);
    showToast('Liste silindi', 'success');
  };

  const handleToggleItem = async (listId: string, itemId: string) => {
    hapticFeedback.light();
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    await updateList(listId, { items: updatedItems });
  };

  const handleAddItem = async (listId: string, itemText: string) => {
    if (!itemText.trim()) return;
    
    hapticFeedback.light();
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const newItem = {
      id: uuidv4(),
      label: itemText.trim(),
      category: '',
      checked: false,
      createdAt: new Date(),
    };

    await updateList(listId, { items: [...list.items, newItem] });
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
          <Text style={styles.title}>Listelerim</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              hapticFeedback.medium();
              setIsCreating(true);
            }}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={20} color={colors.accent.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color={colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Liste ara..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Create New List */}
        {isCreating && (
          <AnimatedCard delay={0} variant="elevated" style={styles.createCard}>
            <Text style={styles.createTitle}>Yeni Liste</Text>
            <TextInput
              style={styles.createInput}
              placeholder="Liste adı"
              placeholderTextColor={colors.text.tertiary}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />
            <View style={styles.createActions}>
              <Button
                title="İptal"
                onPress={() => {
                  setIsCreating(false);
                  setNewListName('');
                }}
                variant="secondary"
                size="medium"
                style={styles.createButton}
              />
              <Button
                title="Oluştur"
                onPress={handleCreateList}
                variant="primary"
                size="medium"
                style={styles.createButton}
              />
            </View>
          </AnimatedCard>
        )}

        {/* Lists */}
        {filteredLists.length > 0 ? (
          <View style={styles.listsContainer}>
            {filteredLists.map((list, index) => {
              const checkedCount = list.items.filter((item) => item.checked).length;
              const totalCount = list.items.length;
              const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

              return (
                <AnimatedCard
                  key={list.id}
                  delay={index * 50}
                  variant="elevated"
                  style={styles.listCard}
                  onPress={() => {
                    hapticFeedback.medium();
                    router.push(`/list/${list.id}`);
                  }}
                >
                  <View style={styles.listHeader}>
                    <View style={styles.listHeaderLeft}>
                      <Icon
                        name={list.type === 'market' ? 'shopping' : 'list'}
                        size={24}
                        color={colors.accent.primary}
                      />
                      <View style={styles.listInfo}>
                        <Text style={styles.listName}>{list.name}</Text>
                        <Text style={styles.listMeta}>
                          {totalCount} öğe • {checkedCount} tamamlandı
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        hapticFeedback.medium();
                        handleDeleteList(list.id);
                      }}
                      style={styles.deleteButton}
                    >
                      <Icon name="trash" size={18} color={colors.status.error} />
                    </TouchableOpacity>
                  </View>

                  {totalCount > 0 && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>%{Math.round(progress)}</Text>
                    </View>
                  )}

                  {/* Quick Items Preview */}
                  {list.items.slice(0, 3).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.quickItem}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleToggleItem(list.id, item.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.quickCheckbox,
                          item.checked && styles.quickCheckboxChecked,
                        ]}
                      >
                        {item.checked && (
                          <Icon name="check" size={12} color={colors.text.primary} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.quickItemText,
                          item.checked && styles.quickItemTextChecked,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {list.items.length > 3 && (
                    <Text style={styles.moreItems}>
                      +{list.items.length - 3} daha...
                    </Text>
                  )}
                </AnimatedCard>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="list"
            title={searchQuery ? 'Liste bulunamadı' : 'Henüz liste yok'}
            subtitle={
              searchQuery
                ? 'Arama kriterlerinize uygun liste bulunamadı'
                : 'Yeni bir liste oluşturarak başlayın'
            }
            actionLabel={!searchQuery ? 'İlk Listemi Oluştur' : undefined}
            onAction={!searchQuery ? () => setIsCreating(true) : undefined}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text.primary,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  createCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  createTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  createInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  createActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  createButton: {
    flex: 1,
  },
  listsContainer: {
    gap: spacing.md,
  },
  listCard: {
    padding: spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  listMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 3,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 35,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border.primary,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCheckboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  quickItemText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontSize: 13,
  },
  quickItemTextChecked: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  moreItems: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});

