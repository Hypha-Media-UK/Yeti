import { pool } from '../config/database';
import { ManualAssignmentRow, InsertResult } from '../types/database.types';
import { ManualAssignment } from '../../shared/types/shift';

export class OverrideRepository {
  private mapRowToManualAssignment(row: ManualAssignmentRow): ManualAssignment {
    return {
      id: row.id,
      staffId: row.staff_id,
      assignmentDate: row.assignment_date.toISOString().split('T')[0],
      shiftType: row.shift_type,
      shiftStart: row.shift_start,
      shiftEnd: row.shift_end,
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
      `INSERT INTO manual_assignments (staff_id, assignment_date, shift_type, shift_start, shift_end, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        assignment.staffId,
        assignment.assignmentDate,
        assignment.shiftType,
        assignment.shiftStart,
        assignment.shiftEnd,
        assignment.notes,
      ]
    );

    const [rows] = await pool.query<ManualAssignmentRow[]>(
      'SELECT * FROM manual_assignments WHERE id = ?',
      [result.insertId]
    );

    return this.mapRowToManualAssignment(rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'DELETE FROM manual_assignments WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

