import { pool } from '../config/database';
import { DepartmentRow, InsertResult } from '../types/database.types';
import { Department } from '../../shared/types/department';

export class DepartmentRepository {
  private mapRowToDepartment(row: DepartmentRow): Department {
    return {
      id: row.id,
      name: row.name,
      buildingId: row.building_id,
      description: row.description,
      includeInMainRota: row.include_in_main_rota,
      is24_7: row.is_24_7,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(filters?: { buildingId?: number }): Promise<Department[]> {
    let query = 'SELECT * FROM departments WHERE is_active = TRUE';
    const params: any[] = [];

    if (filters?.buildingId) {
      query += ' AND building_id = ?';
      params.push(filters.buildingId);
    }

    query += ' ORDER BY name';

    const [rows] = await pool.query<DepartmentRow[]>(query, params);
    return rows.map(row => this.mapRowToDepartment(row));
  }

  async findById(id: number): Promise<Department | null> {
    const [rows] = await pool.query<DepartmentRow[]>(
      'SELECT * FROM departments WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows.length > 0 ? this.mapRowToDepartment(rows[0]) : null;
  }

  async findByBuildingId(buildingId: number): Promise<Department[]> {
    const [rows] = await pool.query<DepartmentRow[]>(
      'SELECT * FROM departments WHERE building_id = ? AND is_active = TRUE ORDER BY name',
      [buildingId]
    );
    return rows.map(row => this.mapRowToDepartment(row));
  }

  async create(department: { name: string; buildingId?: number | null; description?: string | null }): Promise<Department> {
    const [result] = await pool.query<InsertResult>(
      'INSERT INTO departments (name, building_id, description, is_active) VALUES (?, ?, ?, TRUE)',
      [department.name, department.buildingId || null, department.description || null]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to create department');
    }
    return created;
  }

  async update(id: number, updates: { name?: string; buildingId?: number | null; description?: string | null; includeInMainRota?: boolean; is24_7?: boolean; isActive?: boolean }): Promise<Department | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.buildingId !== undefined) {
      fields.push('building_id = ?');
      values.push(updates.buildingId);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }

    if (updates.includeInMainRota !== undefined) {
      fields.push('include_in_main_rota = ?');
      values.push(updates.includeInMainRota);
    }

    if (updates.is24_7 !== undefined) {
      fields.push('is_24_7 = ?');
      values.push(updates.is24_7);
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
      `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'UPDATE departments SET is_active = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

