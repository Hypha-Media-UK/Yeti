import { StaffMember, StaffMemberWithShift } from '../../shared/types/staff';
import { Shift } from '../../shared/types/shift';
import { BaseRepository } from './base.repository';

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
  is_pool_staff: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type StaffCreateInput = Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>;
type StaffUpdateInput = Partial<StaffMember>;

export class StaffRepository extends BaseRepository<
  StaffMember,
  StaffRow,
  StaffCreateInput,
  StaffUpdateInput
> {
  protected readonly tableName = 'staff';

  protected mapRowToEntity(row: StaffRow): StaffMember {
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
      isPoolStaff: row.is_pool_staff || false,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToInsertRow(input: StaffCreateInput): Partial<StaffRow> {
    return {
      first_name: input.firstName,
      last_name: input.lastName,
      status: input.status,
      shift_id: input.shiftId,
      cycle_type: input.cycleType,
      days_offset: input.daysOffset,
      custom_shift_start: input.customShiftStart,
      custom_shift_end: input.customShiftEnd,
      use_cycle_for_permanent: input.useCycleForPermanent || false,
      reference_shift_id: input.referenceShiftId || null,
      use_contracted_hours_for_shift: input.useContractedHoursForShift || false,
      is_pool_staff: input.isPoolStaff || false,
      is_active: input.isActive,
    };
  }

  protected mapEntityToUpdateRow(input: StaffUpdateInput): Partial<StaffRow> {
    const updateData: Partial<StaffRow> = {};

    if (input.firstName !== undefined) {
      updateData.first_name = input.firstName;
    }
    if (input.lastName !== undefined) {
      updateData.last_name = input.lastName;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.shiftId !== undefined) {
      updateData.shift_id = input.shiftId;
    }
    if (input.cycleType !== undefined) {
      updateData.cycle_type = input.cycleType;
    }
    if (input.daysOffset !== undefined) {
      updateData.days_offset = input.daysOffset;
    }
    if (input.customShiftStart !== undefined) {
      updateData.custom_shift_start = input.customShiftStart;
    }
    if (input.customShiftEnd !== undefined) {
      updateData.custom_shift_end = input.customShiftEnd;
    }
    if (input.useCycleForPermanent !== undefined) {
      updateData.use_cycle_for_permanent = input.useCycleForPermanent;
    }
    if (input.referenceShiftId !== undefined) {
      updateData.reference_shift_id = input.referenceShiftId;
    }
    if (input.useContractedHoursForShift !== undefined) {
      updateData.use_contracted_hours_for_shift = input.useContractedHoursForShift;
    }
    if (input.isPoolStaff !== undefined) {
      updateData.is_pool_staff = input.isPoolStaff;
    }
    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }

    return updateData;
  }

  /**
   * Override applyFilters to support status and isPoolStaff filtering
   */
  protected applyFilters(query: any, filters: Record<string, any>): any {
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.isPoolStaff !== undefined) {
      query = query.eq('is_pool_staff', filters.isPoolStaff);
    }
    return query;
  }

  /**
   * Override findAll to add custom ordering
   */
  async findAll(filters?: { status?: string; includeInactive?: boolean; isPoolStaff?: boolean }): Promise<StaffMember[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    // Apply is_active filter by default
    if (filters?.includeInactive !== true) {
      query = query.eq('is_active', true);
    }

    // Apply custom filters
    if (filters) {
      query = this.applyFilters(query, filters);
    }

    // Add custom ordering
    query = query.order('last_name').order('first_name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as StaffRow));
  }

  /**
   * Custom method: Find all staff with their shift information
   */
  async findAllWithShifts(filters?: { status?: string; includeInactive?: boolean; isPoolStaff?: boolean }): Promise<StaffMemberWithShift[]> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        shifts!shift_id (
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

    if (filters?.isPoolStaff !== undefined) {
      query = query.eq('is_pool_staff', filters.isPoolStaff);
    }

    query = query.order('last_name').order('first_name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find staff with shifts: ${error.message}`);
    }

    return (data || []).map((row: any) => {
      const staff = this.mapRowToEntity(row);
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
   * Custom method: Find staff by shift IDs (for performance optimization)
   */
  async findByShiftIds(shiftIds: number[]): Promise<StaffMemberWithShift[]> {
    if (shiftIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select(`
        *,
        shifts!shift_id (
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
      const staff = this.mapRowToEntity(row);
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

