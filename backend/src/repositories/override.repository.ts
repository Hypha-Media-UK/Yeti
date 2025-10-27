import { pool } from '../config/database';
import { ManualAssignmentRow, InsertResult } from '../types/database.types';
import { ManualAssignment } from '../../shared/types/shift';

export class OverrideRepository {
  private mapRowToManualAssignment(row: ManualAssignmentRow): ManualAssignment {
    // Convert old ShiftGroup values ('Day', 'Night') to new ShiftType values ('day', 'night')
    const shiftType = row.shift_type === 'Day' ? 'day' : row.shift_type === 'Night' ? 'night' : row.shift_type as any;

    return {
      id: row.id,
      staffId: row.staff_id,
      assignmentDate: row.assignment_date.toISOString().split('T')[0],
      shiftType,
      areaType: row.area_type,
      areaId: row.area_id,
      shiftStart: row.shift_start,
      shiftEnd: row.shift_end,
      startTime: row.start_time,
      endTime: row.end_time,
      endDate: row.end_date ? row.end_date.toISOString().split('T')[0] : null,
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async findByDateRange(startDate: string, endDate: string): Promise<ManualAssignment[]> {
    const [rows] = await pool.query<ManualAssignmentRow[]>(
      'SELECT * FROM manual_assignments WHERE assignment_date BETWEEN ? AND ? ORDER BY assignment_date, staff_id',
      [startDate, endDate]
    );
    return rows.map(row => this.mapRowToManualAssignment(row));
  }

  async findByDate(date: string): Promise<ManualAssignment[]> {
    const [rows] = await pool.query<ManualAssignmentRow[]>(
      'SELECT * FROM manual_assignments WHERE assignment_date = ?',
      [date]
    );
    return rows.map(row => this.mapRowToManualAssignment(row));
  }

  async findByStaffAndDate(staffId: number, date: string): Promise<ManualAssignment[]> {
    const [rows] = await pool.query<ManualAssignmentRow[]>(
      'SELECT * FROM manual_assignments WHERE staff_id = ? AND assignment_date = ?',
      [staffId, date]
    );
    return rows.map(row => this.mapRowToManualAssignment(row));
  }

  async create(assignment: Omit<ManualAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<ManualAssignment> {
    const [result] = await pool.query<InsertResult>(
      `INSERT INTO manual_assignments (
        staff_id, assignment_date, shift_type, area_type, area_id,
        shift_start, shift_end, start_time, end_time, end_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignment.staffId,
        assignment.assignmentDate,
        assignment.shiftType,
        assignment.areaType,
        assignment.areaId,
        assignment.shiftStart,
        assignment.shiftEnd,
        assignment.startTime,
        assignment.endTime,
        assignment.endDate,
        assignment.notes,
      ]
    );

    const [rows] = await pool.query<ManualAssignmentRow[]>(
      'SELECT * FROM manual_assignments WHERE id = ?',
      [result.insertId]
    );

    return this.mapRowToManualAssignment(rows[0]);
  }

  async findByAreaAndDateRange(
    areaType: 'department' | 'service',
    areaId: number,
    startDate: string,
    endDate: string
  ): Promise<ManualAssignment[]> {
    const [rows] = await pool.query<ManualAssignmentRow[]>(
      `SELECT * FROM manual_assignments
       WHERE area_type = ? AND area_id = ?
       AND (
         (assignment_date BETWEEN ? AND ?) OR
         (end_date IS NOT NULL AND end_date >= ? AND assignment_date <= ?)
       )
       ORDER BY assignment_date, staff_id`,
      [areaType, areaId, startDate, endDate, startDate, endDate]
    );
    return rows.map(row => this.mapRowToManualAssignment(row));
  }

  /**
   * Find temporary area assignments for a specific staff member
   * Only returns assignments that have areaType and areaId set
   */
  async findTemporaryAssignmentsByStaff(staffId: number, date: string): Promise<ManualAssignment[]> {
    const [rows] = await pool.query<ManualAssignmentRow[]>(
      `SELECT * FROM manual_assignments
       WHERE staff_id = ?
       AND area_type IS NOT NULL
       AND area_id IS NOT NULL
       AND (
         (assignment_date = ?) OR
         (end_date IS NOT NULL AND assignment_date <= ? AND end_date >= ?)
       )
       ORDER BY assignment_date`,
      [staffId, date, date, date]
    );
    return rows.map(row => this.mapRowToManualAssignment(row));
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'DELETE FROM manual_assignments WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

