import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/database';
import type { Absence, CreateAbsenceRequest, UpdateAbsenceRequest } from '../../shared/types/absence';

interface AbsenceRow extends RowDataPacket {
  id: number;
  staff_id: number;
  absence_type: string;
  start_datetime: Date;
  end_datetime: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
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
      startDatetime: row.start_datetime.toISOString(),
      endDatetime: row.end_datetime.toISOString(),
      notes: row.notes || undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  /**
   * Find all absences for a specific staff member
   */
  async findByStaffId(staffId: number): Promise<Absence[]> {
    const [rows] = await pool.query<AbsenceRow[]>(
      `SELECT * FROM staff_absences 
       WHERE staff_id = ? 
       ORDER BY start_datetime DESC`,
      [staffId]
    );
    return rows.map(row => this.rowToAbsence(row));
  }

  /**
   * Find absences for a staff member within a date range
   */
  async findByStaffIdAndDateRange(
    staffId: number,
    startDate: string,
    endDate: string
  ): Promise<Absence[]> {
    const [rows] = await pool.query<AbsenceRow[]>(
      `SELECT * FROM staff_absences 
       WHERE staff_id = ? 
       AND (
         (start_datetime <= ? AND end_datetime >= ?) OR
         (start_datetime >= ? AND start_datetime <= ?)
       )
       ORDER BY start_datetime ASC`,
      [staffId, endDate, startDate, startDate, endDate]
    );
    return rows.map(row => this.rowToAbsence(row));
  }

  /**
   * Find active absence for a staff member at a specific datetime
   */
  async findActiveAbsence(staffId: number, datetime: string): Promise<Absence | null> {
    const [rows] = await pool.query<AbsenceRow[]>(
      `SELECT * FROM staff_absences 
       WHERE staff_id = ? 
       AND start_datetime <= ? 
       AND end_datetime >= ?
       ORDER BY start_datetime DESC
       LIMIT 1`,
      [staffId, datetime, datetime]
    );
    return rows.length > 0 ? this.rowToAbsence(rows[0]) : null;
  }

  /**
   * Find absence by ID
   */
  async findById(id: number): Promise<Absence | null> {
    const [rows] = await pool.query<AbsenceRow[]>(
      'SELECT * FROM staff_absences WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.rowToAbsence(rows[0]) : null;
  }

  /**
   * Create a new absence record
   */
  async create(data: CreateAbsenceRequest): Promise<Absence> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO staff_absences (staff_id, absence_type, start_datetime, end_datetime, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [data.staffId, data.absenceType, data.startDatetime, data.endDatetime, data.notes || null]
    );

    const absence = await this.findById(result.insertId);
    if (!absence) {
      throw new Error('Failed to create absence');
    }
    return absence;
  }

  /**
   * Update an absence record
   */
  async update(id: number, data: UpdateAbsenceRequest): Promise<Absence | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.absenceType !== undefined) {
      updates.push('absence_type = ?');
      values.push(data.absenceType);
    }
    if (data.startDatetime !== undefined) {
      updates.push('start_datetime = ?');
      values.push(data.startDatetime);
    }
    if (data.endDatetime !== undefined) {
      updates.push('end_datetime = ?');
      values.push(data.endDatetime);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes || null);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query(
      `UPDATE staff_absences SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  /**
   * Delete an absence record
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM staff_absences WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get all absences for multiple staff members (for rota display)
   */
  async findByStaffIds(staffIds: number[]): Promise<Map<number, Absence[]>> {
    if (staffIds.length === 0) {
      return new Map();
    }

    const placeholders = staffIds.map(() => '?').join(',');
    const [rows] = await pool.query<AbsenceRow[]>(
      `SELECT * FROM staff_absences 
       WHERE staff_id IN (${placeholders})
       ORDER BY staff_id, start_datetime DESC`,
      staffIds
    );

    const absencesByStaff = new Map<number, Absence[]>();
    for (const row of rows) {
      const absence = this.rowToAbsence(row);
      if (!absencesByStaff.has(absence.staffId)) {
        absencesByStaff.set(absence.staffId, []);
      }
      absencesByStaff.get(absence.staffId)!.push(absence);
    }

    return absencesByStaff;
  }
}

