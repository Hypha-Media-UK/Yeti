import { pool } from '../config/database';
import { AreaOperationalHoursRow, InsertResult } from '../types/database.types';
import { AreaOperationalHours, AreaType } from '../../shared/types/operational-hours';

export class AreaOperationalHoursRepository {
  private mapRowToOperationalHours(row: AreaOperationalHoursRow): AreaOperationalHours {
    return {
      id: row.id,
      areaType: row.area_type,
      areaId: row.area_id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async findByArea(areaType: AreaType, areaId: number): Promise<AreaOperationalHours[]> {
    const [rows] = await pool.query<AreaOperationalHoursRow[]>(
      'SELECT * FROM area_operational_hours WHERE area_type = ? AND area_id = ? ORDER BY day_of_week, start_time',
      [areaType, areaId]
    );
    return rows.map(row => this.mapRowToOperationalHours(row));
  }

  async findByDay(dayOfWeek: number): Promise<AreaOperationalHours[]> {
    const [rows] = await pool.query<AreaOperationalHoursRow[]>(
      'SELECT * FROM area_operational_hours WHERE day_of_week = ? ORDER BY area_type, area_id, start_time',
      [dayOfWeek]
    );
    return rows.map(row => this.mapRowToOperationalHours(row));
  }

  async findById(id: number): Promise<AreaOperationalHours | null> {
    const [rows] = await pool.query<AreaOperationalHoursRow[]>(
      'SELECT * FROM area_operational_hours WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? this.mapRowToOperationalHours(rows[0]) : null;
  }

  async create(data: Omit<AreaOperationalHours, 'id' | 'createdAt' | 'updatedAt'>): Promise<AreaOperationalHours> {
    const [result] = await pool.query<InsertResult>(
      'INSERT INTO area_operational_hours (area_type, area_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
      [data.areaType, data.areaId, data.dayOfWeek, data.startTime, data.endTime]
    );

    const created = await this.findById(result.insertId);
    if (!created) {
      throw new Error('Failed to create operational hours');
    }
    return created;
  }

  async update(id: number, updates: Partial<Omit<AreaOperationalHours, 'id' | 'areaType' | 'areaId' | 'createdAt' | 'updatedAt'>>): Promise<AreaOperationalHours | null> {
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
      `UPDATE area_operational_hours SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<InsertResult>(
      'DELETE FROM area_operational_hours WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async deleteByArea(areaType: AreaType, areaId: number): Promise<number> {
    const [result] = await pool.query<InsertResult>(
      'DELETE FROM area_operational_hours WHERE area_type = ? AND area_id = ?',
      [areaType, areaId]
    );
    return result.affectedRows;
  }

  // Bulk set operational hours for an area (replaces all existing)
  async setOperationalHoursForArea(
    areaType: AreaType,
    areaId: number,
    hours: Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  ): Promise<AreaOperationalHours[]> {
    // Delete existing hours
    await this.deleteByArea(areaType, areaId);

    // Insert new hours
    if (hours.length === 0) {
      return [];
    }

    const values = hours.map(h => [areaType, areaId, h.dayOfWeek, h.startTime, h.endTime]);
    await pool.query<InsertResult>(
      'INSERT INTO area_operational_hours (area_type, area_id, day_of_week, start_time, end_time) VALUES ?',
      [values]
    );

    return this.findByArea(areaType, areaId);
  }

  // Copy operational hours from one area to another
  async copyOperationalHours(
    fromAreaType: AreaType,
    fromAreaId: number,
    toAreaType: AreaType,
    toAreaId: number
  ): Promise<AreaOperationalHours[]> {
    const sourceHours = await this.findByArea(fromAreaType, fromAreaId);
    
    if (sourceHours.length === 0) {
      return [];
    }

    const hours = sourceHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    return this.setOperationalHoursForArea(toAreaType, toAreaId, hours);
  }
}

