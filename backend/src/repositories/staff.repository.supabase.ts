/**
 * Staff Repository - Supabase Version
 * 
 * This is an example of how to convert the MySQL repository to use Supabase.
 * Apply the same pattern to all other repository files.
 */

import { supabase, query, insert, update, deleteRecord, findById, findAll } from '../config/database.supabase';
import type { StaffMember, CreateStaffRequest, UpdateStaffRequest } from '@shared/types/staff';

export class StaffRepository {
  private tableName = 'staff';

  /**
   * Find all staff members
   */
  async findAll(): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching all staff:', error);
      throw new Error('Failed to fetch staff members');
    }

    return this.mapRows(data || []);
  }

  /**
   * Find staff by ID
   */
  async findById(id: number): Promise<StaffMember | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching staff by ID:', error);
      throw new Error('Failed to fetch staff member');
    }

    return data ? this.mapRow(data) : null;
  }

  /**
   * Find active staff members
   */
  async findActive(): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching active staff:', error);
      throw new Error('Failed to fetch active staff members');
    }

    return this.mapRows(data || []);
  }

  /**
   * Find inactive staff members
   */
  async findInactive(): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', false)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching inactive staff:', error);
      throw new Error('Failed to fetch inactive staff members');
    }

    return this.mapRows(data || []);
  }

  /**
   * Find staff by status
   */
  async findByStatus(status: 'Regular' | 'Relief' | 'Supervisor'): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .eq('is_active', true)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching staff by status:', error);
      throw new Error('Failed to fetch staff members by status');
    }

    return this.mapRows(data || []);
  }

  /**
   * Create a new staff member
   */
  async create(data: CreateStaffRequest): Promise<StaffMember> {
    const insertData = {
      first_name: data.firstName,
      last_name: data.lastName,
      status: data.status,
      cycle_type: data.cycleType || null,
      days_offset: data.daysOffset || 0,
      is_active: true
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating staff member:', error);
      throw new Error('Failed to create staff member');
    }

    return this.mapRow(result);
  }

  /**
   * Update a staff member
   */
  async update(id: number, data: UpdateStaffRequest): Promise<StaffMember> {
    const updateData: any = {};

    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.cycleType !== undefined) updateData.cycle_type = data.cycleType;
    if (data.daysOffset !== undefined) updateData.days_offset = data.daysOffset;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff member:', error);
      throw new Error('Failed to update staff member');
    }

    return this.mapRow(result);
  }

  /**
   * Soft delete a staff member (set is_active = false)
   */
  async softDelete(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error soft deleting staff member:', error);
      throw new Error('Failed to soft delete staff member');
    }
  }

  /**
   * Hard delete a staff member (permanent deletion)
   */
  async hardDelete(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error hard deleting staff member:', error);
      throw new Error('Failed to hard delete staff member');
    }
  }

  /**
   * Restore a soft-deleted staff member
   */
  async restore(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ is_active: true })
      .eq('id', id);

    if (error) {
      console.error('Error restoring staff member:', error);
      throw new Error('Failed to restore staff member');
    }
  }

  /**
   * Count staff members
   */
  async count(activeOnly: boolean = false): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting staff:', error);
      throw new Error('Failed to count staff members');
    }

    return count || 0;
  }

  /**
   * Search staff by name
   */
  async searchByName(searchTerm: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error searching staff:', error);
      throw new Error('Failed to search staff members');
    }

    return this.mapRows(data || []);
  }

  /**
   * Map database row to StaffMember type
   */
  private mapRow(row: any): StaffMember {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      status: row.status,
      cycleType: row.cycle_type,
      daysOffset: row.days_offset,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Map multiple database rows to StaffMember array
   */
  private mapRows(rows: any[]): StaffMember[] {
    return rows.map(row => this.mapRow(row));
  }
}

