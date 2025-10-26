import { pool } from '../config/database';
import { StaffRow, InsertResult } from '../types/database.types';
import { StaffMember } from '@shared/types/staff';

export class StaffRepository {
  private mapRowToStaffMember(row: StaffRow): StaffMember {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      status: row.status,
      group: row.group,
      departmentId: row.department_id,
      cycleType: row.cycle_type as any,
      daysOffset: row.days_offset,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async findAll(filters?: { status?: string; group?: string; includeInactive?: boolean }): Promise<StaffMember[]> {
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

    if (filters?.group) {
      conditions.push('`group` = ?');
      params.push(filters.group);
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
      `INSERT INTO staff (first_name, last_name, status, \`group\`, department_id, cycle_type, days_offset, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff.firstName,
        staff.lastName,
        staff.status,
        staff.group,
        staff.departmentId,
        staff.cycleType,
        staff.daysOffset,
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
    if (updates.group !== undefined) {
      fields.push('`group` = ?');
      values.push(updates.group);
    }
    if (updates.departmentId !== undefined) {
      fields.push('department_id = ?');
      values.push(updates.departmentId);
    }
    if (updates.cycleType !== undefined) {
      fields.push('cycle_type = ?');
      values.push(updates.cycleType);
    }
    if (updates.daysOffset !== undefined) {
      fields.push('days_offset = ?');
      values.push(updates.daysOffset);
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
}

