import { supabase } from '../config/database';
import { FixedSchedule } from '../../shared/types/staff';

interface FixedScheduleRow {
  id: number;
  staff_id: number;
  day_of_week: number | null;
  shift_start: string;
  shift_end: string;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

export class ScheduleRepository {
  private mapRowToFixedSchedule(row: FixedScheduleRow): FixedSchedule {
    return {
      id: row.id,
      staffId: row.staff_id,
      dayOfWeek: row.day_of_week,
      shiftStart: row.shift_start,
      shiftEnd: row.shift_end,
      effectiveFrom: row.effective_from ? row.effective_from.split('T')[0] : null,
      effectiveTo: row.effective_to ? row.effective_to.split('T')[0] : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByStaffId(staffId: number): Promise<FixedSchedule[]> {
    const { data, error } = await supabase
      .from('fixed_schedules')
      .select('*')
      .eq('staff_id', staffId)
      .order('day_of_week');

    if (error) {
      throw new Error(`Failed to find fixed schedules: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToFixedSchedule(row));
  }

  async findByStaffIdAndDate(staffId: number, date: string): Promise<FixedSchedule | null> {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay(); // Convert Sunday from 0 to 7

    const { data, error } = await supabase
      .from('fixed_schedules')
      .select('*')
      .eq('staff_id', staffId)
      .or(`day_of_week.is.null,day_of_week.eq.${dayOfWeek}`)
      .or(`effective_from.is.null,effective_from.lte.${date}`)
      .or(`effective_to.is.null,effective_to.gte.${date}`)
      .order('day_of_week', { ascending: false })
      .order('effective_from', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to find fixed schedule by date: ${error.message}`);
    }

    return data && data.length > 0 ? this.mapRowToFixedSchedule(data[0]) : null;
  }

  async create(schedule: Omit<FixedSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<FixedSchedule> {
    const { data, error } = await supabase
      .from('fixed_schedules')
      .insert({
        staff_id: schedule.staffId,
        day_of_week: schedule.dayOfWeek,
        shift_start: schedule.shiftStart,
        shift_end: schedule.shiftEnd,
        effective_from: schedule.effectiveFrom,
        effective_to: schedule.effectiveTo
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create fixed schedule: ${error.message}`);
    }

    return this.mapRowToFixedSchedule(data);
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('fixed_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete fixed schedule: ${error.message}`);
    }

    return true;
  }
}

