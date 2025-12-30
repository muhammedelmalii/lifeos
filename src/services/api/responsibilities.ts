import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Responsibility, ResponsibilityStatus } from '@/types';

import { Schedule, EscalationRule, ChecklistItem } from '@/types';

export interface CreateResponsibilityInput {
  title: string;
  description?: string;
  category?: string;
  energyRequired: 'low' | 'medium' | 'high';
  schedule: Schedule;
  reminderStyle: 'gentle' | 'persistent' | 'critical';
  escalationRules?: EscalationRule[];
  checklist?: ChecklistItem[];
  createdFrom?: 'text' | 'voice' | 'photo';
}

export interface UpdateResponsibilityInput extends Partial<CreateResponsibilityInput> {
  status?: ResponsibilityStatus;
  completedAt?: Date;
  snoozedUntil?: Date;
  reminderStyle?: 'gentle' | 'persistent' | 'critical';
}

class ResponsibilitiesAPI {
  async getAll(userId: string): Promise<Responsibility[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!
      .from('responsibilities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return this.mapToResponsibilities(data || []);
  }

  async getById(id: string, userId: string): Promise<Responsibility | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!
      .from('responsibilities')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data ? this.mapToResponsibility(data) : null;
  }

  async create(input: CreateResponsibilityInput, userId: string): Promise<Responsibility> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!
      .from('responsibilities')
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        category: input.category,
        energy_required: input.energyRequired,
        schedule_type: input.schedule.type,
        schedule_datetime: input.schedule.datetime.toISOString(),
        schedule_rrule: input.schedule.rrule,
        schedule_timezone: input.schedule.timezone,
        reminder_intensity: input.reminderStyle,
        escalation_rules: input.escalationRules,
        checklist: input.checklist,
        created_from: input.createdFrom || 'text',
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToResponsibility(data);
  }

  async update(
    id: string,
    input: UpdateResponsibilityInput,
    userId: string
  ): Promise<Responsibility> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.energyRequired !== undefined) updateData.energy_required = input.energyRequired;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.reminderStyle !== undefined) updateData.reminder_intensity = input.reminderStyle;
    if (input.checklist !== undefined) updateData.checklist = input.checklist;
    if (input.completedAt !== undefined) updateData.completed_at = input.completedAt.toISOString();
    if (input.snoozedUntil !== undefined) updateData.snoozed_until = input.snoozedUntil.toISOString();
    if (input.schedule) {
      updateData.schedule_type = input.schedule.type;
      updateData.schedule_datetime = input.schedule.datetime.toISOString();
      if (input.schedule.rrule !== undefined) updateData.schedule_rrule = input.schedule.rrule;
      if (input.schedule.timezone !== undefined) updateData.schedule_timezone = input.schedule.timezone;
    }

    const { data, error } = await supabase!
      .from('responsibilities')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return this.mapToResponsibility(data);
  }

  async delete(id: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase!
      .from('responsibilities')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  private mapToResponsibilities(rows: any[]): Responsibility[] {
    return rows.map((row) => this.mapToResponsibility(row));
  }

  private mapToResponsibility(row: any): Responsibility {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      energyRequired: row.energy_required,
      schedule: {
        type: row.schedule_type,
        datetime: new Date(row.schedule_datetime),
        timezone: row.schedule_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        rrule: row.schedule_rrule,
      },
      reminderStyle: row.reminder_intensity,
      escalationRules: row.escalation_rules || [],
      checklist: row.checklist || [],
      status: row.status,
      createdFrom: row.created_from || 'text',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      snoozedUntil: row.snoozed_until ? new Date(row.snoozed_until) : undefined,
    };
  }
}

export const responsibilitiesAPI = new ResponsibilitiesAPI();

