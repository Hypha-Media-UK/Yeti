import { supabase } from '../config/database';
import { StaffContractedHours } from '../../shared/types/operational-hours';

interface StaffContractedHoursRow {
  id: number;
  staff_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export class StaffContractedHoursRepository {
  private mapRowToContractedHours(row: StaffContractedHoursRow): StaffContractedHours {
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

  async findAll(): Promise<StaffContractedHours[]> {
    const { data, error } = await supabase
      .from('staff_contracted_hours')
      .select('*')
      .order('staff_id')
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find all contracted hours: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToContractedHours(row));
  }

  async findByStaff(staffId: number): Promise<StaffContractedHours[]> {
    const { data, error } = await supabase
      .from('staff_contracted_hours')
      .select('*')
      .eq('staff_id', staffId)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find contracted hours: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToContractedHours(row));
  }

  async findByDay(dayOfWeek: number): Promise<StaffContractedHours[]> {
    const { data, error } = await supabase
      .from('staff_contracted_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .order('staff_id')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find contracted hours by day: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToContractedHours(row));
  }

  async findById(id: number): Promise<StaffContractedHours | null> {
    const { data, error } = await supabase
      .from('staff_contracted_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find contracted hours by ID: ${error.message}`);
    }

    return data ? this.mapRowToContractedHours(data) : null;
  }

  async create(data: Omit<StaffContractedHours, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffContractedHours> {
    const { data: result, error } = await supabase
      .from('staff_contracted_hours')
      .insert({
        staff_id: data.staffId,
        day_of_week: data.dayOfWeek,
        start_time: data.startTime,
        end_time: data.endTime
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contracted hours: ${error.message}`);
    }

    return this.mapRowToContractedHours(result);
  }

  async update(id: number, updates: Partial<Omit<StaffContractedHours, 'id' | 'staffId' | 'createdAt' | 'updatedAt'>>): Promise<StaffContractedHours | null> {
    const updateData: any = {};

    if (updates.dayOfWeek !== undefined) {
      updateData.day_of_week = updates.dayOfWeek;
    }
    if (updates.startTime !== undefined) {
      updateData.start_time = updates.startTime;
    }
    if (updates.endTime !== undefined) {
      updateData.end_time = updates.endTime;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const { data, error } = await supabase
      .from('staff_contracted_hours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contracted hours: ${error.message}`);
    }

    return data ? this.mapRowToContractedHours(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('staff_contracted_hours')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete contracted hours: ${error.message}`);
    }

    return true;
  }

  async deleteByStaff(staffId: number): Promise<number> {
    const { data, error } = await supabase
      .from('staff_contracted_hours')
      .delete()
      .eq('staff_id', staffId)
      .select();

    if (error) {
      throw new Error(`Failed to delete contracted hours by staff: ${error.message}`);
    }

    return (data || []).length;
  }

  // Bulk set contracted hours for a staff member (replaces all existing)
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

    const { error } = await supabase
      .from('staff_contracted_hours')
      .insert(inserts);

    if (error) {
      throw new Error(`Failed to set contracted hours: ${error.message}`);
    }

    return this.findByStaff(staffId);
  }

  // Copy contracted hours from one staff member to another
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

