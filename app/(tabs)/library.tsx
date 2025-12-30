import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, SectionHeader, EmptyState } from '@/components/ui';
import { useListsStore } from '@/store/lists';
import { t } from '@/i18n';

export default function LibraryScreen() {
  const router = useRouter();
  const { lists, loadLists, updateList } = useListsStore();

  useEffect(() => {
    loadLists();
  }, []);

  const handleToggleItem = async (listId: string, itemId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );

    await updateList(listId, { items: updatedItems });
  };

  const marketLists = lists.filter((l) => l.type === 'market');
  const otherLists = lists.filter((l) => l.type !== 'market');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>Your lists and resources</Text>
        </View>

        {/* Market Lists */}
        {marketLists.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Market Lists" />
            {marketLists.map((list) => (
              <Card key={list.id} style={styles.listCard}>
                <Text style={styles.listTitle}>{list.name}</Text>
                <View style={styles.itemsList}>
                  {list.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.listItem}
                      onPress={() => handleToggleItem(list.id, item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                        {item.checked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text
                        style={[
                          styles.itemLabel,
                          item.checked && styles.itemLabelChecked,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Other Lists */}
        {otherLists.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Other Lists" />
            {otherLists.map((list) => (
              <Card key={list.id} style={styles.listCard}>
                <Text style={styles.listTitle}>{list.name}</Text>
                <View style={styles.itemsList}>
                  {list.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.listItem}
                      onPress={() => handleToggleItem(list.id, item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                        {item.checked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text
                        style={[
                          styles.itemLabel,
                          item.checked && styles.itemLabelChecked,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        )}

        {lists.length === 0 && (
          <EmptyState
            icon="list"
            title="No lists yet."
            subtitle="Create lists from the Home screen or add them manually."
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
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  listCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  listTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  itemsList: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: 48, // One-hand friendly
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  checkmark: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  itemLabelChecked: {
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

