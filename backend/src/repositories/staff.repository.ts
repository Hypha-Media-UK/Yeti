import { pool } from '../config/database';
import { StaffRow, InsertResult, ShiftRow } from '../types/database.types';
import { StaffMember, StaffMemberWithShift } from '../../shared/types/staff';
import { Shift } from '../../shared/types/shift';

export class StaffRepository {
  private mapRowToStaffMember(row: StaffRow): StaffMember {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      status: row.status,
      shiftId: row.shift_id,
      cycleType: row.cycle_type as any,
      daysOffset: row.days_offset,
      customShiftStart: row.custom_shift_start || null,
      customShiftEnd: row.custom_shift_end || null,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async findAll(filters?: { status?: string; includeInactive?: boolean }): Promise<StaffMember[]> {
    let query = 'SELECT * FROM staff';
    const params: any[] = [];
    const conditions: string[] = [];

    // Only filter by is_active if not explicitly including inactive
    if (!filters?.includeInactive) {
      conditions.push('is_active = TRUE');
    }

    if (filters?.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY last_name, first_name';

    const [rows] = await pool.query<StaffRow[]>(query, params);
    return rows.map(row => this.mapRowToStaffMember(row));
  }

  async findById(id: number): Promise<StaffMember | null> {
    const [rows] = await pool.query<StaffRow[]>(
      'SELECT * FROM staff WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows.length > 0 ? this.mapRowToStaffMember(rows[0]) : null;
  }

  async create(staff: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<StaffMember> {
    const [result] = await pool.query<InsertResult>(
      `INSERT INTO staff (first_name, last_name, status, shift_id, cycle_type, days_offset, custom_shift_start, custom_shift_end, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff.firstName,
        staff.lastName,
        staff.status,
        staff.shiftId,
        staff.cycleType,
        staff.daysOffset,
        staff.customShiftStart,
        staff.customShiftEnd,
        staff.isActive,
      ]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to create staff member');
    }
    return created;
  }

  async update(id: number, updates: Partial<StaffMember>): Promise<StaffMember | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.firstName !== undefined) {
      fields.push('first_name = ?');
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      fields.push('last_name = ?');
      values.push(updates.lastName);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.shiftId !== undefined) {
      fields.push('shift_id = ?');
      values.push(updates.shiftId);
    }
    if (updates.cycleType !== undefined) {
      fields.push('cycle_type = ?');
      values.push(updates.cycleType);
    }
    if (updates.daysOffset !== undefined) {
      fields.push('days_offset = ?');
      values.push(updates.daysOffset);
    }
    if (updates.customShiftStart !== undefined) {
      fields.push('custom_shift_start = ?');
      values.push(updates.customShiftStart);
    }
    if (updates.customShiftEnd !== undefined) {
      fields.push('custom_shift_end = ?');
      values.push(updates.customShiftEnd);
    }
    if (updates.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(updates.isActive);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    await pool.query<InsertResult>(
      `UPDATE staff SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'UPDATE staff SET is_active = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'DELETE FROM staff WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Find all staff with their shift information
   */
  async findAllWithShifts(filters?: { status?: string; includeInactive?: boolean }): Promise<StaffMemberWithShift[]> {
    let query = `
      SELECT
        s.*,
        sh.id as shift_id,
        sh.name as shift_name,
        sh.type as shift_type,
        sh.color as shift_color,
        sh.description as shift_description,
        sh.is_active as shift_is_active,
        sh.created_at as shift_created_at,
        sh.updated_at as shift_updated_at
      FROM staff s
      LEFT JOIN shifts sh ON s.shift_id = sh.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (!filters?.includeInactive) {
      conditions.push('s.is_active = TRUE');
    }

    if (filters?.status) {
      conditions.push('s.status = ?');
      params.push(filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.last_name, s.first_name';

    const [rows] = await pool.query<any[]>(query, params);

    return rows.map(row => {
      const staff = this.mapRowToStaffMember(row as StaffRow);
      const shift: Shift | null = row.shift_id ? {
        id: row.shift_id,
        name: row.shift_name,
        type: row.shift_type,
        color: row.shift_color,
        description: row.shift_description,
        isActive: row.shift_is_active,
        createdAt: row.shift_created_at?.toISOString() || '',
        updatedAt: row.shift_updated_at?.toISOString() || '',
      } : null;

      return {
        ...staff,
        shift,
      };
    });
  }
}

