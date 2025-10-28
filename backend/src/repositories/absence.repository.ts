import { supabase } from '../config/database';
import type { Absence, CreateAbsenceRequest, UpdateAbsenceRequest } from '../../shared/types/absence';

interface AbsenceRow {
  id: number;
  staff_id: number;
  absence_type: string;
  start_datetime: string;
  end_datetime: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export class AbsenceRepository {
  /**
   * Convert database row to Absence object
   */
  private rowToAbsence(row: AbsenceRow): Absence {
    return {
      id: row.id,
      staffId: row.staff_id,
      absenceType: row.absence_type as Absence['absenceType'],
      startDatetime: row.start_datetime,
      endDatetime: row.end_datetime,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Find all absences for a specific staff member
   */
  async findByStaffId(staffId: number): Promise<Absence[]> {
    const { data, error } = await supabase
      .from('staff_absences')
      .select('*')
      .eq('staff_id', staffId)
      .order('start_datetime', { ascending: false });

    if (error) {
      throw new Error(`Failed to find absences: ${error.message}`);
    }

    return (data || []).map(row => this.rowToAbsence(row));
  }

  /**
   * Find absences for a staff member within a date range
   */
  async findByStaffIdAndDateRange(
    staffId: number,
    startDate: string,
    endDate: string
  ): Promise<Absence[]> {
    const { data, error } = await supabase
      .from('staff_absences')
      .select('*')
      .eq('staff_id', staffId)
      .or(`and(start_datetime.lte.${endDate},end_datetime.gte.${startDate}),and(start_datetime.gte.${startDate},start_datetime.lte.${endDate})`)
      .order('start_datetime', { ascending: true });

    if (error) {
      throw new Error(`Failed to find absences by date range: ${error.message}`);
    }

    return (data || []).map(row => this.rowToAbsence(row));
  }

  /**
   * Find active absence for a staff member at a specific datetime
   */
  async findActiveAbsence(staffId: number, datetime: string): Promise<Absence | null> {
    const { data, error } = await supabase
      .from('staff_absences')
      .select('*')
      .eq('staff_id', staffId)
      .lte('start_datetime', datetime)
      .gte('end_datetime', datetime)
      .order('start_datetime', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find active absence: ${error.message}`);
    }

    return data ? this.rowToAbsence(data) : null;
  }

  /**
   * Find any absence for a staff member on a specific date (regardless of time)
   * Returns the first absence that overlaps with the given date
   */
  async findAbsenceForDate(staffId: number, date: string): Promise<Absence | null> {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data, error } = await supabase
      .from('staff_absences')
      .select('*')
      .eq('staff_id', staffId)
      .or(`and(start_datetime.lte.${endOfDay},end_datetime.gte.${startOfDay}),and(start_datetime.gte.${startOfDay},start_datetime.lte.${endOfDay})`)
      .order('start_datetime', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find absence for date: ${error.message}`);
    }

    return data ? this.rowToAbsence(data) : null;
  }

  /**
   * Find absences for multiple staff members on a specific date (batch operation)
   * Returns a map of staffId -> Absence (or null if no absence)
   */
  async findAbsencesForDate(staffIds: number[], date: string): Promise<Map<number, Absence | null>> {
    if (staffIds.length === 0) {
      return new Map();
    }

    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data, error} = await supabase
      .from('staff_absences')
      .select('*')
      .in('staff_id', staffIds)
      .or(`and(start_datetime.lte.${endOfDay},end_datetime.gte.${startOfDay}),and(start_datetime.gte.${startOfDay},start_datetime.lte.${endOfDay})`)
      .order('staff_id')
      .order('start_datetime', { ascending: true });

    if (error) {
      throw new Error(`Failed to find absences for date: ${error.message}`);
    }

    const absenceMap = new Map<number, Absence | null>();

    // Initialize all staff IDs with null
    staffIds.forEach(id => absenceMap.set(id, null));

    // Set first absence for each staff member
    const seenStaffIds = new Set<number>();
    (data || []).forEach(row => {
      if (!seenStaffIds.has(row.staff_id)) {
        absenceMap.set(row.staff_id, this.rowToAbsence(row));
        seenStaffIds.add(row.staff_id);
      }
    });

    return absenceMap;
  }

  /**
   * Find absence by ID
   */
  async findById(id: number): Promise<Absence | null> {
    const { data, error } = await supabase
      .from('staff_absences')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find absence: ${error.message}`);
    }

    return data ? this.rowToAbsence(data) : null;
  }

  /**
   * Create a new absence record
   */
  async create(data: CreateAbsenceRequest): Promise<Absence> {
    const { data: result, error } = await supabase
      .from('staff_absences')
      .insert({
        staff_id: data.staffId,
        absence_type: data.absenceType,
        start_datetime: data.startDatetime,
        end_datetime: data.endDatetime,
        notes: data.notes || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create absence: ${error.message}`);
    }

    return this.rowToAbsence(result);
  }

  /**
   * Update an absence record
   */
  async update(id: number, data: UpdateAbsenceRequest): Promise<Absence | null> {
    const updateData: any = {};

    if (data.absenceType !== undefined) {
      updateData.absence_type = data.absenceType;
    }
    if (data.startDatetime !== undefined) {
      updateData.start_datetime = data.startDatetime;
    }
    if (data.endDatetime !== undefined) {
      updateData.end_datetime = data.endDatetime;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes || null;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const { data: result, error } = await supabase
      .from('staff_absences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update absence: ${error.message}`);
    }

    return result ? this.rowToAbsence(result) : null;
  }

  /**
   * Delete an absence record
   */
  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('staff_absences')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete absence: ${error.message}`);
    }

    return true;
  }

  /**
   * Get all absences for multiple staff members (for rota display)
   */
  async findByStaffIds(staffIds: number[]): Promise<Map<number, Absence[]>> {
    if (staffIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('staff_absences')
      .select('*')
      .in('staff_id', staffIds)
      .order('staff_id')
      .order('start_datetime', { ascending: false });

    if (error) {
      throw new Error(`Failed to find absences by staff IDs: ${error.message}`);
    }

    const absencesByStaff = new Map<number, Absence[]>();
    for (const row of (data || [])) {
      const absence = this.rowToAbsence(row);
      if (!absencesByStaff.has(absence.staffId)) {
        absencesByStaff.set(absence.staffId, []);
      }
      absencesByStaff.get(absence.staffId)!.push(absence);
    }

    return absencesByStaff;
  }
}

