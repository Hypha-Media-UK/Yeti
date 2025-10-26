import { pool } from '../config/database';
import { FixedScheduleRow, InsertResult } from '../types/database.types';
import { FixedSchedule } from '@shared/types/staff';

export class ScheduleRepository {
  private mapRowToFixedSchedule(row: FixedScheduleRow): FixedSchedule {
    return {
      id: row.id,
      staffId: row.staff_id,
      dayOfWeek: row.day_of_week,
      shiftStart: row.shift_start,
      shiftEnd: row.shift_end,
      effectiveFrom: row.effective_from ? row.effective_from.toISOString().split('T')[0] : null,
      effectiveTo: row.effective_to ? row.effective_to.toISOString().split('T')[0] : null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async findByStaffId(staffId: number): Promise<FixedSchedule[]> {
    const [rows] = await pool.query<FixedScheduleRow[]>(
      'SELECT * FROM fixed_schedules WHERE staff_id = ? ORDER BY day_of_week',
      [staffId]
    );
    return rows.map(row => this.mapRowToFixedSchedule(row));
  }

  async findByStaffIdAndDate(staffId: number, date: string): Promise<FixedSchedule | null> {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay(); // Convert Sunday from 0 to 7

    const [rows] = await pool.query<FixedScheduleRow[]>(
      `SELECT * FROM fixed_schedules 
       WHERE staff_id = ? 
       AND (day_of_week IS NULL OR day_of_week = ?)
       AND (effective_from IS NULL OR effective_from <= ?)
       AND (effective_to IS NULL OR effective_to >= ?)
       ORDER BY day_of_week DESC, effective_from DESC
       LIMIT 1`,
      [staffId, dayOfWeek, date, date]
    );

    return rows.length > 0 ? this.mapRowToFixedSchedule(rows[0]) : null;
  }

  async create(schedule: Omit<FixedSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<FixedSchedule> {
    const [result] = await pool.query<InsertResult>(
      `INSERT INTO fixed_schedules (staff_id, day_of_week, shift_start, shift_end, effective_from, effective_to)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        schedule.staffId,
        schedule.dayOfWeek,
        schedule.shiftStart,
        schedule.shiftEnd,
        schedule.effectiveFrom,
        schedule.effectiveTo,
      ]
    );

    const [rows] = await pool.query<FixedScheduleRow[]>(
      'SELECT * FROM fixed_schedules WHERE id = ?',
      [result.insertId]
    );

    return this.mapRowToFixedSchedule(rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'DELETE FROM fixed_schedules WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

