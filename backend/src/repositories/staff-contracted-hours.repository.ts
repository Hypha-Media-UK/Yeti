import { StaffContractedHours } from '../../shared/types/operational-hours';
import { BaseRepository } from './base.repository';

interface StaffContractedHoursRow {
  id: number;
  staff_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

type StaffContractedHoursCreateInput = Omit<StaffContractedHours, 'id' | 'createdAt' | 'updatedAt'>;
type StaffContractedHoursUpdateInput = Partial<Omit<StaffContractedHours, 'id' | 'staffId' | 'createdAt' | 'updatedAt'>>;

export class StaffContractedHoursRepository extends BaseRepository<
  StaffContractedHours,
  StaffContractedHoursRow,
  StaffContractedHoursCreateInput,
  StaffContractedHoursUpdateInput
> {
  protected readonly tableName = 'staff_contracted_hours';

  protected mapRowToEntity(row: StaffContractedHoursRow): StaffContractedHours {
    return {
      id: row.id,
      staffId: row.staff_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToInsertRow(input: StaffContractedHoursCreateInput): Partial<StaffContractedHoursRow> {
    return {
      staff_id: input.staffId,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
    };
  }

  protected mapEntityToUpdateRow(input: StaffContractedHoursUpdateInput): Partial<StaffContractedHoursRow> {
    const updateData: Partial<StaffContractedHoursRow> = {};

    if (input.dayOfWeek !== undefined) {
      updateData.day_of_week = input.dayOfWeek;
    }
    if (input.startTime !== undefined) {
      updateData.start_time = input.startTime;
    }
    if (input.endTime !== undefined) {
      updateData.end_time = input.endTime;
    }

    return updateData;
  }

  /**
   * Override findAll to add custom ordering (no is_active filter - this table doesn't have soft deletes)
   */
  async findAll(): Promise<StaffContractedHours[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .order('staff_id')
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find all ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as StaffContractedHoursRow));
  }

  /**
   * Override delete to use hard delete (this table doesn't have soft deletes)
   */
  async delete(id: number): Promise<boolean> {
    return this.hardDelete(id);
  }

  /**
   * Custom method: Find contracted hours by staff ID
   */
  async findByStaff(staffId: number): Promise<StaffContractedHours[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('staff_id', staffId)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find contracted hours: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as StaffContractedHoursRow));
  }

  /**
   * Custom method: Find contracted hours by multiple staff IDs
   */
  async findByStaffIds(staffIds: number[]): Promise<StaffContractedHours[]> {
    if (staffIds.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .in('staff_id', staffIds)
      .order('staff_id')
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find contracted hours by staff IDs: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as StaffContractedHoursRow));
  }

  /**
   * Custom method: Find contracted hours by day of week
   */
  async findByDay(dayOfWeek: number): Promise<StaffContractedHours[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .order('staff_id')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find contracted hours by day: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as StaffContractedHoursRow));
  }

  /**
   * Custom method: Delete all contracted hours for a staff member
   */
  async deleteByStaff(staffId: number): Promise<number> {
    const { data, error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('staff_id', staffId)
      .select();

    if (error) {
      throw new Error(`Failed to delete contracted hours by staff: ${error.message}`);
    }

    return (data || []).length;
  }

  /**
   * Custom method: Bulk set contracted hours for a staff member (replaces all existing)
   */
  async setContractedHoursForStaff(
    staffId: number,
    hours: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  ): Promise<StaffContractedHours[]> {
    // Delete existing hours
    await this.deleteByStaff(staffId);

    // Insert new hours
    if (hours.length === 0) {
      return [];
    }

    const inserts = hours.map(h => ({
      staff_id: staffId,
      day_of_week: h.dayOfWeek,
      start_time: h.startTime,
      end_time: h.endTime
    }));

    const { error } = await this.client
      .from(this.tableName)
      .insert(inserts);

    if (error) {
      throw new Error(`Failed to set contracted hours: ${error.message}`);
    }

    return this.findByStaff(staffId);
  }

  /**
   * Custom method: Copy contracted hours from one staff member to another
   */
  async copyContractedHours(fromStaffId: number, toStaffId: number): Promise<StaffContractedHours[]> {
    const sourceHours = await this.findByStaff(fromStaffId);

    if (sourceHours.length === 0) {
      return [];
    }

    const hours = sourceHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    return this.setContractedHoursForStaff(toStaffId, hours);
  }
}

