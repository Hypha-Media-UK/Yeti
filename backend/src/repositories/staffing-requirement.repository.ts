import { supabase } from '../config/database';
import { StaffingRequirement } from '../../shared/types/staffing-requirement';

interface StaffingRequirementRow {
  id: number;
  area_type: 'department' | 'service';
  area_id: number;
  day_of_week: number;
  time_start: string;
  time_end: string;
  required_staff: number;
  created_at: string;
  updated_at: string;
}

export class StaffingRequirementRepository {
  private mapRowToStaffingRequirement(row: StaffingRequirementRow): StaffingRequirement {
    return {
      id: row.id,
      areaType: row.area_type,
      areaId: row.area_id,
      dayOfWeek: row.day_of_week,
      timeStart: row.time_start,
      timeEnd: row.time_end,
      requiredStaff: row.required_staff,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByArea(areaType: 'department' | 'service', areaId: number): Promise<StaffingRequirement[]> {
    const { data, error } = await supabase
      .from('area_staffing_requirements')
      .select('*')
      .eq('area_type', areaType)
      .eq('area_id', areaId)
      .order('day_of_week')
      .order('time_start');

    if (error) {
      throw new Error(`Failed to find staffing requirements: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToStaffingRequirement(row));
  }

  async findByAreaAndDay(areaType: 'department' | 'service', areaId: number, dayOfWeek: number): Promise<StaffingRequirement[]> {
    const { data, error } = await supabase
      .from('area_staffing_requirements')
      .select('*')
      .eq('area_type', areaType)
      .eq('area_id', areaId)
      .eq('day_of_week', dayOfWeek)
      .order('time_start');

    if (error) {
      throw new Error(`Failed to find staffing requirements by day: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToStaffingRequirement(row));
  }

  async findById(id: number): Promise<StaffingRequirement | null> {
    const { data, error } = await supabase
      .from('area_staffing_requirements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find staffing requirement by ID: ${error.message}`);
    }

    return data ? this.mapRowToStaffingRequirement(data) : null;
  }

  async create(data: Omit<StaffingRequirement, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffingRequirement> {
    const { data: result, error } = await supabase
      .from('area_staffing_requirements')
      .insert({
        area_type: data.areaType,
        area_id: data.areaId,
        day_of_week: data.dayOfWeek,
        time_start: data.timeStart,
        time_end: data.timeEnd,
        required_staff: data.requiredStaff
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create staffing requirement: ${error.message}`);
    }

    return this.mapRowToStaffingRequirement(result);
  }

  async update(id: number, updates: Partial<Omit<StaffingRequirement, 'id' | 'areaType' | 'areaId' | 'createdAt' | 'updatedAt'>>): Promise<StaffingRequirement | null> {
    const updateData: any = {};

    if (updates.dayOfWeek !== undefined) {
      updateData.day_of_week = updates.dayOfWeek;
    }
    if (updates.timeStart !== undefined) {
      updateData.time_start = updates.timeStart;
    }
    if (updates.timeEnd !== undefined) {
      updateData.time_end = updates.timeEnd;
    }
    if (updates.requiredStaff !== undefined) {
      updateData.required_staff = updates.requiredStaff;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const { data, error } = await supabase
      .from('area_staffing_requirements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update staffing requirement: ${error.message}`);
    }

    return data ? this.mapRowToStaffingRequirement(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('area_staffing_requirements')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete staffing requirement: ${error.message}`);
    }

    return true;
  }

  async deleteByArea(areaType: 'department' | 'service', areaId: number): Promise<number> {
    const { data, error } = await supabase
      .from('area_staffing_requirements')
      .delete()
      .eq('area_type', areaType)
      .eq('area_id', areaId)
      .select();

    if (error) {
      throw new Error(`Failed to delete staffing requirements by area: ${error.message}`);
    }

    return (data || []).length;
  }

  /**
   * Bulk set staffing requirements for an area (replaces all existing)
   */
  async setStaffingRequirementsForArea(
    areaType: 'department' | 'service',
    areaId: number,
    requirements: Array<{ dayOfWeek: number; timeStart: string; timeEnd: string; requiredStaff: number }>
  ): Promise<StaffingRequirement[]> {
    // Delete existing requirements
    await this.deleteByArea(areaType, areaId);

    // Insert new requirements
    if (requirements.length === 0) {
      return [];
    }

    const inserts = requirements.map(r => ({
      area_type: areaType,
      area_id: areaId,
      day_of_week: r.dayOfWeek,
      time_start: r.timeStart,
      time_end: r.timeEnd,
      required_staff: r.requiredStaff
    }));

    const { error } = await supabase
      .from('area_staffing_requirements')
      .insert(inserts);

    if (error) {
      throw new Error(`Failed to set staffing requirements: ${error.message}`);
    }

    return this.findByArea(areaType, areaId);
  }
}

