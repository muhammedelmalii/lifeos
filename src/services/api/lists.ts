import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { List, ListItem } from '@/types';

export interface CreateListInput {
  name: string;
  type: 'market' | 'home' | 'work' | 'custom';
  items?: ListItem[];
}

export interface UpdateListInput {
  name?: string;
  type?: 'market' | 'home' | 'work' | 'custom';
  items?: ListItem[];
}

class ListsAPI {
  async getAll(userId: string): Promise<List[]> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!
      .from('lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return this.mapToLists(data || []);
  }

  async getById(id: string, userId: string): Promise<List | null> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase!
      .from('lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? this.mapToList(data) : null;
  }

  async create(input: CreateListInput, userId: string): Promise<List> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const items = input.items || [];

    const { data, error } = await supabase!
      .from('lists')
      .insert({
        user_id: userId,
        name: input.name,
        type: input.type,
        items: items,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapToList(data);
  }

  async update(id: string, input: UpdateListInput, userId: string): Promise<List> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.items !== undefined) updateData.items = input.items;

    const { data, error } = await supabase!
      .from('lists')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return this.mapToList(data);
  }

  async delete(id: string, userId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase!
      .from('lists')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  private mapToLists(rows: any[]): List[] {
    return rows.map((row) => this.mapToList(row));
  }

  private mapToList(row: any): List {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      items: row.items || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const listsAPI = new ListsAPI();

