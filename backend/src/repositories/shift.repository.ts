import { supabase } from '../config/database';
import { Shift, CreateShiftDto, UpdateShiftDto } from '../../shared/types/shift';

interface ShiftRow {
  id: number;
  name: string;
  type: 'day' | 'night';
  color: string;
  description: string | null;
  cycle_type: string | null;
  cycle_length: number | null;
  days_offset: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class ShiftRepository {
  private mapRowToShift(row: ShiftRow): Shift {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      color: row.color,
      description: row.description,
      cycleType: row.cycle_type as any,
      cycleLength: row.cycle_length,
      daysOffset: row.days_offset,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(includeInactive = false): Promise<Shift[]> {
    let query = supabase
      .from('shifts')
      .select('*');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find shifts: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToShift(row));
  }

  async findById(id: number): Promise<Shift | null> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find shift: ${error.message}`);
    }

    return data ? this.mapRowToShift(data) : null;
  }

  async findByType(type: 'day' | 'night'): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to find shifts by type: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToShift(row));
  }

  async findByIds(ids: number[]): Promise<Shift[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .in('id', ids)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to find shifts by IDs: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToShift(row));
  }

  async create(data: CreateShiftDto): Promise<Shift> {
    const { data: result, error } = await supabase
      .from('shifts')
      .insert({
        name: data.name,
        type: data.type,
        color: data.color || '#3B82F6',
        description: data.description || null,
        cycle_type: data.cycleType || null,
        cycle_length: data.cycleLength || null,
        days_offset: data.daysOffset || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create shift: ${error.message}`);
    }

    return this.mapRowToShift(result);
  }

  async update(id: number, updates: UpdateShiftDto): Promise<Shift | null> {
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.type !== undefined) {
      updateData.type = updates.type;
    }
    if (updates.color !== undefined) {
      updateData.color = updates.color;
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    if (updates.cycleType !== undefined) {
      updateData.cycle_type = updates.cycleType;
    }
    if (updates.cycleLength !== undefined) {
      updateData.cycle_length = updates.cycleLength;
    }
    if (updates.daysOffset !== undefined) {
      updateData.days_offset = updates.daysOffset;
    }
    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const { data, error } = await supabase
      .from('shifts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update shift: ${error.message}`);
    }

    return data ? this.mapRowToShift(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('shifts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete shift: ${error.message}`);
    }

    return true;
  }

  /**
   * Check if a shift name already exists (case-insensitive)
   */
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('shifts')
      .select('id', { count: 'exact', head: true })
      .ilike('name', name)
      .eq('is_active', true);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to check shift name: ${error.message}`);
    }

    return (count || 0) > 0;
  }

  /**
   * Get count of staff members assigned to this shift
   */
  async getStaffCount(shiftId: number): Promise<number> {
    const { count, error } = await supabase
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('shift_id', shiftId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get staff count: ${error.message}`);
    }

    return count || 0;
  }
}

