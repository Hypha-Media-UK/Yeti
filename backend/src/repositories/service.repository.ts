import { pool } from '../config/database';
import { ServiceRow, InsertResult } from '../types/database.types';
import { Service } from '../../shared/types/service';

export class ServiceRepository {
  private mapRowToService(row: ServiceRow): Service {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      includeInMainRota: row.include_in_main_rota,
      is24_7: row.is_24_7,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async findAll(): Promise<Service[]> {
    const [rows] = await pool.query<ServiceRow[]>(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY name'
    );
    return rows.map(row => this.mapRowToService(row));
  }

  async findById(id: number): Promise<Service | null> {
    const [rows] = await pool.query<ServiceRow[]>(
      'SELECT * FROM services WHERE id = ? AND is_active = TRUE',
      [id]
    );
    return rows.length > 0 ? this.mapRowToService(rows[0]) : null;
  }

  async create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    const [result] = await pool.query<InsertResult>(
      'INSERT INTO services (name, description, include_in_main_rota, is_24_7, is_active) VALUES (?, ?, ?, ?, ?)',
      [service.name, service.description, service.includeInMainRota, service.is24_7, service.isActive]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to create service');
    }
    return created;
  }

  async update(id: number, updates: Partial<Service>): Promise<Service | null> {
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
      `UPDATE services SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'UPDATE services SET is_active = FALSE WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

