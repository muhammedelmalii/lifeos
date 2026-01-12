import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Icon } from '@/components/ui';
import { Responsibility, EnergyLevel, ReminderStyle } from '@/types';
import { formatDateTime } from '@/utils/date';
import { Platform } from 'react-native';

interface EditResponsibilityModalProps {
  visible: boolean;
  responsibility: Responsibility | null;
  onClose: () => void;
  onSave: (updates: Partial<Responsibility>) => Promise<void>;
}

export const EditResponsibilityModal: React.FC<EditResponsibilityModalProps> = ({
  visible,
  responsibility,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [energyRequired, setEnergyRequired] = useState<EnergyLevel>('medium');
  const [reminderStyle, setReminderStyle] = useState<ReminderStyle>('gentle');
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (responsibility) {
      setTitle(responsibility.title);
      setDescription(responsibility.description || '');
      setCategory(responsibility.category || '');
      setEnergyRequired(responsibility.energyRequired);
      setReminderStyle(responsibility.reminderStyle);
      setScheduleDate(responsibility.schedule?.datetime || new Date());
    }
  }, [responsibility]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Başlık boş olamaz');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        energyRequired,
        reminderStyle,
        schedule: {
          ...responsibility?.schedule,
          datetime: scheduleDate,
        },
      });
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'Güncelleme başarısız oldu');
    } finally {
      setIsSaving(false);
    }
  };

  if (!responsibility) return null;

  const categories = [
    'work', 'shopping', 'health', 'finance', 'home', 'social', 
    'learning', 'personal', 'market', 'grocery', 'errands', 
    'appointments', 'meetings', 'exercise', 'meals', 'bills', 
    'maintenance', 'travel', 'family', 'hobbies'
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Düzenle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Başlık *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Görev başlığı"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detaylı açıklama (opsiyonel)"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Energy Level */}
            <View style={styles.field}>
              <Text style={styles.label}>Enerji Seviyesi</Text>
              <View style={styles.optionRow}>
                {(['low', 'medium', 'high'] as EnergyLevel[]).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionButton,
                      energyRequired === level && styles.optionButtonActive,
                    ]}
                    onPress={() => setEnergyRequired(level)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        energyRequired === level && styles.optionButtonTextActive,
                      ]}
                    >
                      {level === 'low' ? 'Düşük' : level === 'medium' ? 'Orta' : 'Yüksek'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reminder Style */}
            <View style={styles.field}>
              <Text style={styles.label}>Hatırlatma Stili</Text>
              <View style={styles.optionRow}>
                {(['gentle', 'persistent', 'critical'] as ReminderStyle[]).map((style) => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.optionButton,
                      reminderStyle === style && styles.optionButtonActive,
                    ]}
                    onPress={() => setReminderStyle(style)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        reminderStyle === style && styles.optionButtonTextActive,
                      ]}
                    >
                      {style === 'gentle' ? 'Yumuşak' : style === 'persistent' ? 'Israrlı' : 'Kritik'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Schedule */}
            <View style={styles.field}>
              <Text style={styles.label}>Tarih ve Saat</Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={scheduleDate.toLocaleDateString('tr-TR')}
                  placeholder="GG/AA/YYYY"
                  placeholderTextColor={colors.text.tertiary}
                  editable={false}
                />
                <TextInput
                  style={[styles.input, styles.timeInput]}
                  value={scheduleDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  placeholder="SS:DD"
                  placeholderTextColor={colors.text.tertiary}
                  editable={false}
                />
              </View>
              <Text style={styles.dateHint}>
                Tarih ve saat düzenlemesi yakında eklenecek
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="İptal"
              onPress={onClose}
              variant="secondary"
              style={styles.footerButton}
            />
            <Button
              title="Kaydet"
              onPress={handleSave}
              variant="primary"
              style={styles.footerButton}
              loading={isSaving}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
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
    maxHeight: 500,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginTop: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontSize: 13,
  },
  categoryChipTextActive: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  optionButtonText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: colors.background.primary,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  dateHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  footerButton: {
    flex: 1,
  },
});
