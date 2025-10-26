import { pool } from '../config/database';
import { BuildingRow, InsertResult } from '../types/database.types';
import { Building } from '@shared/types/building';

export class BuildingRepository {
  private mapRowToBuilding(row: BuildingRow): Building {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(): Promise<Building[]> {
    const [rows] = await pool.query<BuildingRow[]>(
      'SELECT * FROM buildings WHERE is_active = TRUE ORDER BY name'
    );
    return rows.map(row => this.mapRowToBuilding(row));
  }

  async findById(id: number): Promise<Building | null> {
    const [rows] = await pool.query<BuildingRow[]>(
      'SELECT * FROM buildings WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows.length > 0 ? this.mapRowToBuilding(rows[0]) : null;
  }

  async create(building: { name: string; description?: string | null }): Promise<Building> {
    const [result] = await pool.query<InsertResult>(
      'INSERT INTO buildings (name, description, is_active) VALUES (?, ?, TRUE)',
      [building.name, building.description || null]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to create building');
    }
    return created;
  }

  async update(id: number, updates: { name?: string; description?: string | null; isActive?: boolean }): Promise<Building | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
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
      `UPDATE buildings SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'UPDATE buildings SET is_active = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

