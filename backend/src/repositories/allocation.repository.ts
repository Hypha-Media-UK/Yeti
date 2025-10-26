import { pool } from '../config/database';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { StaffAllocation, AllocationWithDetails, AreaType } from '@shared/types/allocation';

interface AllocationRow extends RowDataPacket {
  id: number;
  staff_id: number;
  area_type: 'department' | 'service';
  area_id: number;
  created_at: Date;
  updated_at: Date;
}

interface AllocationWithDetailsRow extends AllocationRow {
  area_name: string;
  building_id: number | null;
  building_name: string | null;
}

export class AllocationRepository {
  private mapRowToAllocation(row: AllocationRow): StaffAllocation {
    return {
      id: row.id,
      staffId: row.staff_id,
      areaType: row.area_type,
      areaId: row.area_id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private mapRowToAllocationWithDetails(row: AllocationWithDetailsRow): AllocationWithDetails {
    return {
      ...this.mapRowToAllocation(row),
      areaName: row.area_name,
      buildingId: row.building_id,
      buildingName: row.building_name || undefined,
    };
  }

  async findByStaffId(staffId: number): Promise<AllocationWithDetails[]> {
    const query = `
      SELECT 
        sa.*,
        CASE 
          WHEN sa.area_type = 'department' THEN d.name
          WHEN sa.area_type = 'service' THEN s.name
        END as area_name,
        CASE 
          WHEN sa.area_type = 'department' THEN d.building_id
          ELSE NULL
        END as building_id,
        CASE 
          WHEN sa.area_type = 'department' THEN b.name
          ELSE NULL
        END as building_name
      FROM staff_allocations sa
      LEFT JOIN departments d ON sa.area_type = 'department' AND sa.area_id = d.id
      LEFT JOIN services s ON sa.area_type = 'service' AND sa.area_id = s.id
      LEFT JOIN buildings b ON d.building_id = b.id
      WHERE sa.staff_id = ?
      ORDER BY sa.area_type, area_name
    `;
    
    const [rows] = await pool.query<AllocationWithDetailsRow[]>(query, [staffId]);
    return rows.map(row => this.mapRowToAllocationWithDetails(row));
  }

  async findByArea(areaType: AreaType, areaId: number): Promise<StaffAllocation[]> {
    const [rows] = await pool.query<AllocationRow[]>(
      'SELECT * FROM staff_allocations WHERE area_type = ? AND area_id = ?',
      [areaType, areaId]
    );
    return rows.map(row => this.mapRowToAllocation(row));
  }

  async create(staffId: number, areaType: AreaType, areaId: number): Promise<StaffAllocation> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO staff_allocations (staff_id, area_type, area_id) VALUES (?, ?, ?)',
      [staffId, areaType, areaId]
    );

    const [rows] = await pool.query<AllocationRow[]>(
      'SELECT * FROM staff_allocations WHERE id = ?',
      [result.insertId]
    );

    return this.mapRowToAllocation(rows[0]);
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM staff_allocations WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  async deleteByStaffId(staffId: number): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM staff_allocations WHERE staff_id = ?',
      [staffId]
    );
    return result.affectedRows;
  }

  async deleteByArea(areaType: AreaType, areaId: number): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM staff_allocations WHERE area_type = ? AND area_id = ?',
      [areaType, areaId]
    );
    return result.affectedRows;
  }

  async setAllocationsForStaff(
    staffId: number,
    allocations: Array<{ areaType: AreaType; areaId: number }>
  ): Promise<AllocationWithDetails[]> {
    // Delete existing allocations
    await this.deleteByStaffId(staffId);

    // Create new allocations
    if (allocations.length > 0) {
      const values = allocations.map(a => [staffId, a.areaType, a.areaId]);
      await pool.query(
        'INSERT INTO staff_allocations (staff_id, area_type, area_id) VALUES ?',
        [values]
      );
    }

    // Return updated allocations with details
    return this.findByStaffId(staffId);
  }

  async exists(staffId: number, areaType: AreaType, areaId: number): Promise<boolean> {
    const [rows] = await pool.query<AllocationRow[]>(
      'SELECT id FROM staff_allocations WHERE staff_id = ? AND area_type = ? AND area_id = ? LIMIT 1',
      [staffId, areaType, areaId]
    );
    return rows.length > 0;
  }
}

