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
   * Convert ISO datetime string to MySQL datetime format
   */
  private toMySQLDatetime(isoString: string): string {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

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
      [
        staffId,
        this.toMySQLDatetime(endDate),
        this.toMySQLDatetime(startDate),
        this.toMySQLDatetime(startDate),
        this.toMySQLDatetime(endDate)
      ]
    );
    return rows.map(row => this.rowToAbsence(row));
  }

  /**
   * Find active absence for a staff member at a specific datetime
   */
  async findActiveAbsence(staffId: number, datetime: string): Promise<Absence | null> {
    const mysqlDatetime = this.toMySQLDatetime(datetime);
    const [rows] = await pool.query<AbsenceRow[]>(
      `SELECT * FROM staff_absences
       WHERE staff_id = ?
       AND start_datetime <= ?
       AND end_datetime >= ?
       ORDER BY start_datetime DESC
       LIMIT 1`,
      [staffId, mysqlDatetime, mysqlDatetime]
    );
    return rows.length > 0 ? this.rowToAbsence(rows[0]) : null;
  }

  /**
   * Find any absence for a staff member on a specific date (regardless of time)
   * Returns the first absence that overlaps with the given date
   */
  async findAbsenceForDate(staffId: number, date: string): Promise<Absence | null> {
    // Check for any absence that overlaps with this date (00:00:00 to 23:59:59)
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const [rows] = await pool.query<AbsenceRow[]>(
      `SELECT * FROM staff_absences
       WHERE staff_id = ?
       AND (
         (start_datetime <= ? AND end_datetime >= ?) OR
         (start_datetime >= ? AND start_datetime <= ?)
       )
       ORDER BY start_datetime ASC
       LIMIT 1`,
      [
        staffId,
        this.toMySQLDatetime(endOfDay),
        this.toMySQLDatetime(startOfDay),
        this.toMySQLDatetime(startOfDay),
        this.toMySQLDatetime(endOfDay)
      ]
    );
    return rows.length > 0 ? this.rowToAbsence(rows[0]) : null;
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

    // Use a subquery to get only the first absence per staff member
    const [rows] = await pool.query<AbsenceRow[]>(
      `SELECT sa1.* FROM staff_absences sa1
       INNER JOIN (
         SELECT staff_id, MIN(start_datetime) as min_start
         FROM staff_absences
         WHERE staff_id IN (?)
         AND (
           (start_datetime <= ? AND end_datetime >= ?) OR
           (start_datetime >= ? AND start_datetime <= ?)
         )
         GROUP BY staff_id
       ) sa2 ON sa1.staff_id = sa2.staff_id AND sa1.start_datetime = sa2.min_start`,
      [
        staffIds,
        this.toMySQLDatetime(endOfDay),
        this.toMySQLDatetime(startOfDay),
        this.toMySQLDatetime(startOfDay),
        this.toMySQLDatetime(endOfDay)
      ]
    );

    const absenceMap = new Map<number, Absence | null>();

    // Initialize all staff IDs with null
    staffIds.forEach(id => absenceMap.set(id, null));

    // Set absences for staff that have them
    rows.forEach(row => {
      absenceMap.set(row.staff_id, this.rowToAbsence(row));
    });

    return absenceMap;
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
      [
        data.staffId,
        data.absenceType,
        this.toMySQLDatetime(data.startDatetime),
        this.toMySQLDatetime(data.endDatetime),
        data.notes || null
      ]
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
      values.push(this.toMySQLDatetime(data.startDatetime));
    }
    if (data.endDatetime !== undefined) {
      updates.push('end_datetime = ?');
      values.push(this.toMySQLDatetime(data.endDatetime));
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

