import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Icon } from '@/components/ui';
import { useRouter } from 'expo-router';
import { formatDateTime } from '@/utils/date';
import { Responsibility } from '@/types';
import { List } from '@/types';

interface QueryResultsSheetProps {
  visible: boolean;
  onClose: () => void;
  results: {
    type: 'list' | 'category' | 'today';
    listName?: string;
    category?: string;
    list?: List;
    items: Responsibility[] | any[];
  } | null;
}

export const QueryResultsSheet: React.FC<QueryResultsSheetProps> = ({
  visible,
  onClose,
  results,
}) => {
  const router = useRouter();

  if (!results) {
    return null;
  }

  const getTitle = () => {
    if (results.type === 'list') {
      return results.listName || 'List';
    } else if (results.type === 'category') {
      return `${results.category} Items`;
    } else {
      return "Today's Items";
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="list" size={20} color={colors.accent.primary} />
              <Text style={styles.headerTitle}>{getTitle()}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {results.type === 'list' && results.list ? (
              <>
                <Text style={styles.sectionTitle}>List Items</Text>
                {results.items.length > 0 ? (
                  results.items.map((item: any, index: number) => (
                    <Card key={item.id || index} style={styles.itemCard}>
                      <View style={styles.itemRow}>
                        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                          {item.checked && <Icon name="check" size={12} color={colors.text.primary} />}
                        </View>
                        <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>
                          {item.label || item}
                        </Text>
                      </View>
                    </Card>
                  ))
                ) : (
                  <Text style={styles.emptyText}>List is empty</Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  {results.items.length} {results.items.length === 1 ? 'item' : 'items'}
                </Text>
                {results.items.length > 0 ? (
                  results.items.map((item: Responsibility) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        router.push(`/responsibility/${item.id}`);
                        onClose();
                      }}
                    >
                      <Card style={styles.itemCard}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        {item.description && (
                          <Text style={styles.itemDescription}>{item.description}</Text>
                        )}
                        {(item.schedule?.datetime || item.category) && (
                          <View style={styles.itemMeta}>
                            {item.schedule?.datetime && (
                              <Text style={styles.itemTime}>
                                {formatDateTime(item.schedule.datetime)}
                              </Text>
                            )}
                            {item.category && (
                              <Text style={styles.itemCategory}>• {item.category}</Text>
                            )}
                          </View>
                        )}
                      </Card>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No items found</Text>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const getWindowHeight = () => {
  try {
    return Dimensions.get('window').height;
  } catch {
    return 800;
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: getWindowHeight() * 0.9,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  itemCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.secondary,
    ...shadows.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  itemText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  itemTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  itemDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  itemTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  itemCategory: {
    ...typography.caption,
    color: colors.accent.primary,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

