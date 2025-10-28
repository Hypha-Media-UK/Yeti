import { supabase } from '../config/database';
import { ManualAssignment } from '../../shared/types/shift';

interface ManualAssignmentRow {
  id: number;
  staff_id: number;
  assignment_date: string;
  shift_type: 'Day' | 'Night' | 'day' | 'night';
  area_type: 'department' | 'service' | null;
  area_id: number | null;
  shift_start: string | null;
  shift_end: string | null;
  start_time: string | null;
  end_time: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export class OverrideRepository {
  private mapRowToManualAssignment(row: ManualAssignmentRow): ManualAssignment {
    // Convert old ShiftGroup values ('Day', 'Night') to new ShiftType values ('day', 'night')
    const shiftType = row.shift_type === 'Day' ? 'day' : row.shift_type === 'Night' ? 'night' : row.shift_type as any;

    return {
      id: row.id,
      staffId: row.staff_id,
      assignmentDate: row.assignment_date.split('T')[0],
      shiftType,
      areaType: row.area_type,
      areaId: row.area_id,
      shiftStart: row.shift_start,
      shiftEnd: row.shift_end,
      startTime: row.start_time,
      endTime: row.end_time,
      endDate: row.end_date ? row.end_date.split('T')[0] : null,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByDateRange(startDate: string, endDate: string): Promise<ManualAssignment[]> {
    const { data, error } = await supabase
      .from('manual_assignments')
      .select('*')
      .gte('assignment_date', startDate)
      .lte('assignment_date', endDate)
      .order('assignment_date')
      .order('staff_id');

    if (error) {
      throw new Error(`Failed to find manual assignments by date range: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToManualAssignment(row));
  }

  async findByDate(date: string): Promise<ManualAssignment[]> {
    const { data, error } = await supabase
      .from('manual_assignments')
      .select('*')
      .eq('assignment_date', date);

    if (error) {
      throw new Error(`Failed to find manual assignments by date: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToManualAssignment(row));
  }

  async findByStaffAndDate(staffId: number, date: string): Promise<ManualAssignment[]> {
    const { data, error } = await supabase
      .from('manual_assignments')
      .select('*')
      .eq('staff_id', staffId)
      .eq('assignment_date', date);

    if (error) {
      throw new Error(`Failed to find manual assignments by staff and date: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToManualAssignment(row));
  }

  async create(assignment: Omit<ManualAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ManualAssignment> {
    const { data, error } = await supabase
      .from('manual_assignments')
      .insert({
        staff_id: assignment.staffId,
        assignment_date: assignment.assignmentDate,
        shift_type: assignment.shiftType,
        area_type: assignment.areaType,
        area_id: assignment.areaId,
        shift_start: assignment.shiftStart,
        shift_end: assignment.shiftEnd,
        start_time: assignment.startTime,
        end_time: assignment.endTime,
        end_date: assignment.endDate,
        notes: assignment.notes
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create manual assignment: ${error.message}`);
    }

    return this.mapRowToManualAssignment(data);
  }

  async findByAreaAndDateRange(
    areaType: 'department' | 'service',
    areaId: number,
    startDate: string,
    endDate: string
  ): Promise<ManualAssignment[]> {
    const { data, error } = await supabase
      .from('manual_assignments')
      .select('*')
      .eq('area_type', areaType)
      .eq('area_id', areaId)
      .or(`and(assignment_date.gte.${startDate},assignment_date.lte.${endDate}),and(end_date.gte.${startDate},assignment_date.lte.${endDate})`)
      .order('assignment_date')
      .order('staff_id');

    if (error) {
      throw new Error(`Failed to find manual assignments by area and date range: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToManualAssignment(row));
  }

  /**
   * Find temporary area assignments for a specific staff member
   * Only returns assignments that have areaType and areaId set
   */
  async findTemporaryAssignmentsByStaff(staffId: number, date: string): Promise<ManualAssignment[]> {
    const { data, error } = await supabase
      .from('manual_assignments')
      .select('*')
      .eq('staff_id', staffId)
      .not('area_type', 'is', null)
      .not('area_id', 'is', null)
      .or(`assignment_date.eq.${date},and(assignment_date.lte.${date},end_date.gte.${date})`)
      .order('assignment_date');

    if (error) {
      throw new Error(`Failed to find temporary assignments: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToManualAssignment(row));
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('manual_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete manual assignment: ${error.message}`);
    }

    return true;
  }
}

