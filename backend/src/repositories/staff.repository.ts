import { supabase } from '../config/database';
import { StaffMember, StaffMemberWithShift } from '../../shared/types/staff';
import { Shift } from '../../shared/types/shift';

interface StaffRow {
  id: number;
  first_name: string;
  last_name: string;
  status: 'Regular' | 'Relief' | 'Supervisor';
  shift_id: number | null;
  cycle_type: string | null;
  days_offset: number;
  custom_shift_start: string | null;
  custom_shift_end: string | null;
  use_cycle_for_permanent: boolean;
  reference_shift_id: number | null;
  use_contracted_hours_for_shift: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class StaffRepository {
  private mapRowToStaffMember(row: StaffRow): StaffMember {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      status: row.status,
      shiftId: row.shift_id,
      cycleType: row.cycle_type as any,
      daysOffset: row.days_offset,
      customShiftStart: row.custom_shift_start || null,
      customShiftEnd: row.custom_shift_end || null,
      useCycleForPermanent: row.use_cycle_for_permanent || false,
      referenceShiftId: row.reference_shift_id || null,
      useContractedHoursForShift: row.use_contracted_hours_for_shift || false,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(filters?: { status?: string; includeInactive?: boolean }): Promise<StaffMember[]> {
    let query = supabase
      .from('staff')
      .select('*');

    if (!filters?.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('last_name').order('first_name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find staff: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToStaffMember(row));
  }

  async findById(id: number): Promise<StaffMember | null> {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find staff member: ${error.message}`);
    }

    return data ? this.mapRowToStaffMember(data) : null;
  }

  async create(staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffMember> {
    const { data, error } = await supabase
      .from('staff')
      .insert({
        first_name: staff.firstName,
        last_name: staff.lastName,
        status: staff.status,
        shift_id: staff.shiftId,
        cycle_type: staff.cycleType,
        days_offset: staff.daysOffset,
        custom_shift_start: staff.customShiftStart,
        custom_shift_end: staff.customShiftEnd,
        use_cycle_for_permanent: staff.useCycleForPermanent || false,
        reference_shift_id: staff.referenceShiftId || null,
        use_contracted_hours_for_shift: staff.useContractedHoursForShift || false,
        is_active: staff.isActive
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create staff member: ${error.message}`);
    }

    return this.mapRowToStaffMember(data);
  }

  async update(id: number, updates: Partial<StaffMember>): Promise<StaffMember | null> {
    const updateData: any = {};

    if (updates.firstName !== undefined) {
      updateData.first_name = updates.firstName;
    }
    if (updates.lastName !== undefined) {
      updateData.last_name = updates.lastName;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.shiftId !== undefined) {
      updateData.shift_id = updates.shiftId;
    }
    if (updates.cycleType !== undefined) {
      updateData.cycle_type = updates.cycleType;
    }
    if (updates.daysOffset !== undefined) {
      updateData.days_offset = updates.daysOffset;
    }
    if (updates.customShiftStart !== undefined) {
      updateData.custom_shift_start = updates.customShiftStart;
    }
    if (updates.customShiftEnd !== undefined) {
      updateData.custom_shift_end = updates.customShiftEnd;
    }
    if (updates.useCycleForPermanent !== undefined) {
      updateData.use_cycle_for_permanent = updates.useCycleForPermanent;
    }
    if (updates.referenceShiftId !== undefined) {
      updateData.reference_shift_id = updates.referenceShiftId;
    }
    if (updates.useContractedHoursForShift !== undefined) {
      updateData.use_contracted_hours_for_shift = updates.useContractedHoursForShift;
    }
    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const { data, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update staff member: ${error.message}`);
    }

    return data ? this.mapRowToStaffMember(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete staff member: ${error.message}`);
    }

    return true;
  }

  async hardDelete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to hard delete staff member: ${error.message}`);
    }

    return true;
  }

  /**
   * Find all staff with their shift information
   */
  async findAllWithShifts(filters?: { status?: string; includeInactive?: boolean }): Promise<StaffMemberWithShift[]> {
    let query = supabase
      .from('staff')
      .select(`
        *,
        shifts (
          id,
          name,
          type,
          color,
          description,
          cycle_type,
          cycle_length,
          days_offset,
          is_active,
          created_at,
          updated_at
        )
      `);

    if (!filters?.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('last_name').order('first_name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find staff with shifts: ${error.message}`);
    }

    return (data || []).map((row: any) => {
      const staff = this.mapRowToStaffMember(row);
      const shiftData = row.shifts;
      const shift: Shift | null = shiftData ? {
        id: shiftData.id,
        name: shiftData.name,
        type: shiftData.type,
        color: shiftData.color,
        description: shiftData.description,
        cycleType: shiftData.cycle_type,
        cycleLength: shiftData.cycle_length,
        daysOffset: shiftData.days_offset,
        isActive: shiftData.is_active,
        createdAt: shiftData.created_at,
        updatedAt: shiftData.updated_at,
      } : null;

      return {
        ...staff,
        shift,
      };
    });
  }

  /**
   * Find staff by shift IDs (for performance optimization)
   */
  async findByShiftIds(shiftIds: number[]): Promise<StaffMemberWithShift[]> {
    if (shiftIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        shifts (
          id,
          name,
          type,
          color,
          description,
          cycle_type,
          cycle_length,
          days_offset,
          is_active,
          created_at,
          updated_at
        )
      `)
      .in('shift_id', shiftIds)
      .eq('is_active', true)
      .order('last_name')
      .order('first_name');

    if (error) {
      throw new Error(`Failed to find staff by shift IDs: ${error.message}`);
    }

    return (data || []).map((row: any) => {
      const staff = this.mapRowToStaffMember(row);
      const shiftData = row.shifts;
      const shift: Shift | null = shiftData ? {
        id: shiftData.id,
        name: shiftData.name,
        type: shiftData.type,
        color: shiftData.color,
        description: shiftData.description,
        cycleType: shiftData.cycle_type,
        cycleLength: shiftData.cycle_length,
        daysOffset: shiftData.days_offset,
        isActive: shiftData.is_active,
        createdAt: shiftData.created_at,
        updatedAt: shiftData.updated_at,
      } : null;

      return {
        ...staff,
        shift,
      };
    });
  }
}

