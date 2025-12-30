import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, Chip, Icon, EmptyState } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { formatDateTime } from '@/utils/date';
import { t } from '@/i18n';

export default function NowModeScreen() {
  const router = useRouter();
  const { getNowMode, checkStateTransitions, updateResponsibility } = useResponsibilitiesStore();
  
  useEffect(() => {
    checkStateTransitions();
  }, []);

  const nowModeItems = getNowMode();

  const handleComplete = async (id: string) => {
    await updateResponsibility(id, { status: 'completed', completedAt: new Date() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Şimdi Ne Yapabilirim?</Text>
          <Text style={styles.subtitle}>
            Bunalmış mısın? Sadece şu anda yapabileceğin küçük şeyler.
          </Text>
        </View>

        {/* Items */}
        {nowModeItems.length > 0 ? (
          <View style={styles.itemsList}>
            {nowModeItems.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                    <View style={styles.itemMeta}>
                      <Chip 
                        label={item.energyRequired === 'low' ? 'Low Energy' : item.energyRequired}
                        variant="default"
                        style={styles.energyChip}
                      />
                      {item.checklist.length > 0 && (
                        <Text style={styles.checklistHint}>
                          {item.checklist.length} quick steps
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <Button
                  title="Başla"
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  size="medium"
                  variant="primary"
                  style={styles.startButton}
                />
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="check"
            title="Şu anda düşük enerji gerektiren bir şey yok."
            subtitle="Mola ver. Dinlenmek de üretkendir."
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
  itemsList: {
    gap: spacing.md,
  },
  itemCard: {
    padding: spacing.md,
    ...shadows.sm,
  },
  itemHeader: {
    marginBottom: spacing.md,
  },
  itemContent: {
    gap: spacing.xs,
  },
  itemTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  itemDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  energyChip: {
    alignSelf: 'flex-start',
  },
  checklistHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  startButton: {
    marginTop: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

