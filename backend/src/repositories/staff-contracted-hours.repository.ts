import { pool } from '../config/database';
import { StaffContractedHoursRow, InsertResult } from '../types/database.types';
import { StaffContractedHours } from '../../shared/types/operational-hours';

export class StaffContractedHoursRepository {
  private mapRowToContractedHours(row: StaffContractedHoursRow): StaffContractedHours {
    return {
      id: row.id,
      staffId: row.staff_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async findByStaff(staffId: number): Promise<StaffContractedHours[]> {
    const [rows] = await pool.query<StaffContractedHoursRow[]>(
      'SELECT * FROM staff_contracted_hours WHERE staff_id = ? ORDER BY day_of_week, start_time',
      [staffId]
    );
    return rows.map(row => this.mapRowToContractedHours(row));
  }

  async findByDay(dayOfWeek: number): Promise<StaffContractedHours[]> {
    const [rows] = await pool.query<StaffContractedHoursRow[]>(
      'SELECT * FROM staff_contracted_hours WHERE day_of_week = ? ORDER BY staff_id, start_time',
      [dayOfWeek]
    );
    return rows.map(row => this.mapRowToContractedHours(row));
  }

  async findById(id: number): Promise<StaffContractedHours | null> {
    const [rows] = await pool.query<StaffContractedHoursRow[]>(
      'SELECT * FROM staff_contracted_hours WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapRowToContractedHours(rows[0]) : null;
  }

  async create(data: Omit<StaffContractedHours, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffContractedHours> {
    const [result] = await pool.query<InsertResult>(
      'INSERT INTO staff_contracted_hours (staff_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
      [data.staffId, data.dayOfWeek, data.startTime, data.endTime]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to create contracted hours');
    }
    return created;
  }

  async update(id: number, updates: Partial<Omit<StaffContractedHours, 'id' | 'staffId' | 'createdAt' | 'updatedAt'>>): Promise<StaffContractedHours | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.dayOfWeek !== undefined) {
      fields.push('day_of_week = ?');
      values.push(updates.dayOfWeek);
    }
    if (updates.startTime !== undefined) {
      fields.push('start_time = ?');
      values.push(updates.startTime);
    }
    if (updates.endTime !== undefined) {
      fields.push('end_time = ?');
      values.push(updates.endTime);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query<InsertResult>(
      `UPDATE staff_contracted_hours SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'DELETE FROM staff_contracted_hours WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async deleteByStaff(staffId: number): Promise<number> {
    const [result] = await pool.query<InsertResult>(
      'DELETE FROM staff_contracted_hours WHERE staff_id = ?',
      [staffId]
    );
    return result.affectedRows;
  }

  // Bulk set contracted hours for a staff member (replaces all existing)
  async setContractedHoursForStaff(
    staffId: number,
    hours: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  ): Promise<StaffContractedHours[]> {
    // Delete existing hours
    await this.deleteByStaff(staffId);

    // Insert new hours
    if (hours.length === 0) {
      return [];
    }

    const values = hours.map(h => [staffId, h.dayOfWeek, h.startTime, h.endTime]);
    await pool.query<InsertResult>(
      'INSERT INTO staff_contracted_hours (staff_id, day_of_week, start_time, end_time) VALUES ?',
      [values]
    );

    return this.findByStaff(staffId);
  }

  // Copy contracted hours from one staff member to another
  async copyContractedHours(fromStaffId: number, toStaffId: number): Promise<StaffContractedHours[]> {
    const sourceHours = await this.findByStaff(fromStaffId);
    
    if (sourceHours.length === 0) {
      return [];
    }

    const hours = sourceHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    return this.setContractedHoursForStaff(toStaffId, hours);
  }
}

