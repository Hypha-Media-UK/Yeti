import { supabase } from '../config/database';
import { AreaOperationalHours, AreaType } from '../../shared/types/operational-hours';

interface AreaOperationalHoursRow {
  id: number;
  area_type: 'department' | 'service';
  area_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export class AreaOperationalHoursRepository {
  private mapRowToOperationalHours(row: AreaOperationalHoursRow): AreaOperationalHours {
    return {
      id: row.id,
      areaType: row.area_type,
      areaId: row.area_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByArea(areaType: AreaType, areaId: number): Promise<AreaOperationalHours[]> {
    const { data, error } = await supabase
      .from('area_operational_hours')
      .select('*')
      .eq('area_type', areaType)
      .eq('area_id', areaId)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find operational hours: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToOperationalHours(row));
  }

  async findByDay(dayOfWeek: number): Promise<AreaOperationalHours[]> {
    const { data, error } = await supabase
      .from('area_operational_hours')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .order('area_type')
      .order('area_id')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to find operational hours by day: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToOperationalHours(row));
  }

  async findById(id: number): Promise<AreaOperationalHours | null> {
    const { data, error } = await supabase
      .from('area_operational_hours')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find operational hours by ID: ${error.message}`);
    }

    return data ? this.mapRowToOperationalHours(data) : null;
  }

  async create(data: Omit<AreaOperationalHours, 'id' | 'createdAt' | 'updatedAt'>): Promise<AreaOperationalHours> {
    const { data: result, error } = await supabase
      .from('area_operational_hours')
      .insert({
        area_type: data.areaType,
        area_id: data.areaId,
        day_of_week: data.dayOfWeek,
        start_time: data.startTime,
        end_time: data.endTime
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create operational hours: ${error.message}`);
    }

    return this.mapRowToOperationalHours(result);
  }

  async update(id: number, updates: Partial<Omit<AreaOperationalHours, 'id' | 'areaType' | 'areaId' | 'createdAt' | 'updatedAt'>>): Promise<AreaOperationalHours | null> {
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
      .from('area_operational_hours')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update operational hours: ${error.message}`);
    }

    return data ? this.mapRowToOperationalHours(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('area_operational_hours')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete operational hours: ${error.message}`);
    }

    return true;
  }

  async deleteByArea(areaType: AreaType, areaId: number): Promise<number> {
    const { data, error } = await supabase
      .from('area_operational_hours')
      .delete()
      .eq('area_type', areaType)
      .eq('area_id', areaId)
      .select();

    if (error) {
      throw new Error(`Failed to delete operational hours by area: ${error.message}`);
    }

    return (data || []).length;
  }

  // Bulk set operational hours for an area (replaces all existing)
  async setOperationalHoursForArea(
    areaType: AreaType,
    areaId: number,
    hours: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  ): Promise<AreaOperationalHours[]> {
    // Delete existing hours
    await this.deleteByArea(areaType, areaId);

    // Insert new hours
    if (hours.length === 0) {
      return [];
    }

    const inserts = hours.map(h => ({
      area_type: areaType,
      area_id: areaId,
      day_of_week: h.dayOfWeek,
      start_time: h.startTime,
      end_time: h.endTime
    }));

    const { error } = await supabase
      .from('area_operational_hours')
      .insert(inserts);

    if (error) {
      throw new Error(`Failed to set operational hours: ${error.message}`);
    }

    return this.findByArea(areaType, areaId);
  }

  // Copy operational hours from one area to another
  async copyOperationalHours(
    fromAreaType: AreaType,
    fromAreaId: number,
    toAreaType: AreaType,
    toAreaId: number
  ): Promise<AreaOperationalHours[]> {
    const sourceHours = await this.findByArea(fromAreaType, fromAreaId);

    if (sourceHours.length === 0) {
      return [];
    }

    const hours = sourceHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    return this.setOperationalHoursForArea(toAreaType, toAreaId, hours);
  }
}

