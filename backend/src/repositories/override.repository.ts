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
    // Convert lowercase shift type to capitalized for database enum
    const dbShiftType = assignment.shiftType === 'day' ? 'Day' : 'Night';

    const { data, error } = await supabase
      .from('manual_assignments')
      .insert({
        staff_id: assignment.staffId,
        assignment_date: assignment.assignmentDate,
        shift_type: dbShiftType,
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
      // Throw the original error to preserve error codes (e.g., 23505 for unique constraint violations)
      throw error;
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
   * Includes assignments that:
   * - Start on the given date, OR
   * - Span across the given date (start before, end after)
   */
  async findTemporaryAssignmentsByStaff(staffId: number, date: string): Promise<ManualAssignment[]> {
    // Fetch all temporary assignments for this staff member
    const { data, error } = await supabase
      .from('manual_assignments')
      .select('*')
      .eq('staff_id', staffId)
      .not('area_type', 'is', null)
      .not('area_id', 'is', null)
      .order('assignment_date');

    if (error) {
      throw new Error(`Failed to find temporary assignments: ${error.message}`);
    }

    // Filter in JavaScript to handle complex date logic
    // Include assignments where:
    // 1. assignment_date equals the given date, OR
    // 2. assignment_date is before the date AND (end_date is null OR end_date is after or equal to the date)
    return (data || [])
      .filter(row => {
        const assignmentDate = row.assignment_date.split('T')[0];
        const endDate = row.end_date ? row.end_date.split('T')[0] : null;

        // Single-day assignment on the given date
        if (assignmentDate === date) {
          return true;
        }

        // Multi-day assignment that spans the given date
        if (assignmentDate < date && (!endDate || endDate >= date)) {
          return true;
        }

        return false;
      })
      .map(row => this.mapRowToManualAssignment(row));
  }

  async update(id: number, updates: Partial<Omit<ManualAssignment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ManualAssignment> {
    // Convert lowercase shift type to capitalized for database enum if provided
    const dbShiftType = updates.shiftType
      ? (updates.shiftType === 'day' ? 'Day' : 'Night')
      : undefined;

    const updateData: any = {};

    if (updates.staffId !== undefined) updateData.staff_id = updates.staffId;
    if (updates.assignmentDate !== undefined) updateData.assignment_date = updates.assignmentDate;
    if (dbShiftType !== undefined) updateData.shift_type = dbShiftType;
    if (updates.areaType !== undefined) updateData.area_type = updates.areaType;
    if (updates.areaId !== undefined) updateData.area_id = updates.areaId;
    if (updates.shiftStart !== undefined) updateData.shift_start = updates.shiftStart;
    if (updates.shiftEnd !== undefined) updateData.shift_end = updates.shiftEnd;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('manual_assignments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update manual assignment: ${error.message}`);
    }

    if (!data) {
      throw new Error('Manual assignment not found');
    }

    return this.mapRowToManualAssignment(data);
  }

  async findByStaffDateAndShift(staffId: number, date: string, shiftType: 'day' | 'night'): Promise<ManualAssignment | null> {
    // Convert lowercase shift type to capitalized for database enum
    const dbShiftType = shiftType === 'day' ? 'Day' : 'Night';

    const { data, error } = await supabase
      .from('manual_assignments')
      .select('*')
      .eq('staff_id', staffId)
      .eq('assignment_date', date)
      .eq('shift_type', dbShiftType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find manual assignment: ${error.message}`);
    }

    return data ? this.mapRowToManualAssignment(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    // First check if the assignment exists
    const { data: existing } = await supabase
      .from('manual_assignments')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return false;
    }

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

