import { Shift, CreateShiftDto, UpdateShiftDto } from '../../shared/types/shift';
import { BaseRepository } from './base.repository';

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

export class ShiftRepository extends BaseRepository<
  Shift,
  ShiftRow,
  CreateShiftDto,
  UpdateShiftDto
> {
  protected readonly tableName = 'shifts';

  protected mapRowToEntity(row: ShiftRow): Shift {
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

  protected mapEntityToInsertRow(input: CreateShiftDto): Partial<ShiftRow> {
    return {
      name: input.name,
      type: input.type,
      color: input.color || '#3B82F6',
      description: input.description || null,
      cycle_type: input.cycleType || null,
      cycle_length: input.cycleLength || null,
      days_offset: input.daysOffset || 0,
      is_active: true,
    };
  }

  protected mapEntityToUpdateRow(input: UpdateShiftDto): Partial<ShiftRow> {
    const updateData: Partial<ShiftRow> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.color !== undefined) {
      updateData.color = input.color;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.cycleType !== undefined) {
      updateData.cycle_type = input.cycleType;
    }
    if (input.cycleLength !== undefined) {
      updateData.cycle_length = input.cycleLength;
    }
    if (input.daysOffset !== undefined) {
      updateData.days_offset = input.daysOffset;
    }
    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }

    return updateData;
  }

  /**
   * Override findAll to add custom ordering
   */
  async findAll(filters?: { includeInactive?: boolean }): Promise<Shift[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    // Apply is_active filter by default
    if (filters?.includeInactive !== true) {
      query = query.eq('is_active', true);
    }

    // Add custom ordering
    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as ShiftRow));
  }

  /**
   * Custom method: Find shifts by type
   */
  async findByType(type: 'day' | 'night'): Promise<Shift[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to find shifts by type: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as ShiftRow));
  }

  /**
   * Custom method: Find shifts by IDs
   */
  async findByIds(ids: number[]): Promise<Shift[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .in('id', ids)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to find shifts by IDs: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as ShiftRow));
  }

  /**
   * Custom method: Check if a shift name already exists (case-insensitive)
   */
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    let query = this.client
      .from(this.tableName)
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
   * Custom method: Get count of staff members assigned to this shift
   */
  async getStaffCount(shiftId: number): Promise<number> {
    const { count, error } = await this.client
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('shift_id', shiftId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get staff count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Custom method: Unassign all staff from a shift (set shift_id to NULL)
   * Used when deleting a shift to set staff to "No Shift"
   */
  async unassignStaffFromShift(shiftId: number): Promise<void> {
    const { error } = await this.client
      .from('staff')
      .update({ shift_id: null })
      .eq('shift_id', shiftId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to unassign staff from shift: ${error.message}`);
    }
  }
}

