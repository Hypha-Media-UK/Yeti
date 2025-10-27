import { pool } from '../config/database';
import { ShiftRow, InsertResult } from '../types/database.types';
import { Shift, CreateShiftDto, UpdateShiftDto } from '../../shared/types/shift';

export class ShiftRepository {
  private mapRowToShift(row: ShiftRow): Shift {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      color: row.color,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async findAll(includeInactive = false): Promise<Shift[]> {
    const query = includeInactive
      ? 'SELECT * FROM shifts ORDER BY name'
      : 'SELECT * FROM shifts WHERE is_active = TRUE ORDER BY name';
    
    const [rows] = await pool.query<ShiftRow[]>(query);
    return rows.map(row => this.mapRowToShift(row));
  }

  async findById(id: number): Promise<Shift | null> {
    const [rows] = await pool.query<ShiftRow[]>(
      'SELECT * FROM shifts WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows.length > 0 ? this.mapRowToShift(rows[0]) : null;
  }

  async findByType(type: 'day' | 'night'): Promise<Shift[]> {
    const [rows] = await pool.query<ShiftRow[]>(
      'SELECT * FROM shifts WHERE type = ? AND is_active = TRUE ORDER BY name',
      [type]
    );
    return rows.map(row => this.mapRowToShift(row));
  }

  async create(data: CreateShiftDto): Promise<Shift> {
    const [result] = await pool.query<InsertResult>(
      'INSERT INTO shifts (name, type, color, description, is_active) VALUES (?, ?, ?, ?, TRUE)',
      [
        data.name,
        data.type,
        data.color || '#3B82F6',
        data.description || null,
      ]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to create shift');
    }
    return created;
  }

  async update(id: number, updates: UpdateShiftDto): Promise<Shift | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
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
      `UPDATE shifts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    // Soft delete
    const [result] = await pool.query<InsertResult>(
      'UPDATE shifts SET is_active = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Check if a shift name already exists (case-insensitive)
   */
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const query = excludeId
      ? 'SELECT COUNT(*) as count FROM shifts WHERE LOWER(name) = LOWER(?) AND id != ? AND is_active = TRUE'
      : 'SELECT COUNT(*) as count FROM shifts WHERE LOWER(name) = LOWER(?) AND is_active = TRUE';
    
    const params = excludeId ? [name, excludeId] : [name];
    const [rows] = await pool.query<any[]>(query, params);
    return rows[0].count > 0;
  }

  /**
   * Get count of staff members assigned to this shift
   */
  async getStaffCount(shiftId: number): Promise<number> {
    const [rows] = await pool.query<any[]>(
      'SELECT COUNT(*) as count FROM staff WHERE shift_id = ? AND is_active = TRUE',
      [shiftId]
    );
    return rows[0].count;
  }
}

