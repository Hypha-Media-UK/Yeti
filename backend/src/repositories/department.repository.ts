import { supabase } from '../config/database';
import { Department } from '../../shared/types/department';

interface DepartmentRow {
  id: number;
  name: string;
  building_id: number | null;
  description: string | null;
  include_in_main_rota: boolean;
  is_24_7: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
    let query = supabase
      .from('departments')
      .select('*')
      .eq('is_active', true);

    if (filters?.buildingId) {
      query = query.eq('building_id', filters.buildingId);
    }

    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find departments: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToDepartment(row));
  }

  async findById(id: number): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find department: ${error.message}`);
    }

    return data ? this.mapRowToDepartment(data) : null;
  }

  async findByBuildingId(buildingId: number): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('building_id', buildingId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to find departments by building: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToDepartment(row));
  }

  async create(department: { name: string; buildingId?: number | null; description?: string | null; includeInMainRota?: boolean; is24_7?: boolean }): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: department.name,
        building_id: department.buildingId || null,
        description: department.description || null,
        include_in_main_rota: department.includeInMainRota ?? false,
        is_24_7: department.is24_7 ?? false,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create department: ${error.message}`);
    }

    return this.mapRowToDepartment(data);
  }

  async update(id: number, updates: { name?: string; buildingId?: number | null; description?: string | null; includeInMainRota?: boolean; is24_7?: boolean; isActive?: boolean }): Promise<Department | null> {
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.buildingId !== undefined) {
      updateData.building_id = updates.buildingId;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.includeInMainRota !== undefined) {
      updateData.include_in_main_rota = updates.includeInMainRota;
    }

    if (updates.is24_7 !== undefined) {
      updateData.is_24_7 = updates.is24_7;
    }

    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const { data, error } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update department: ${error.message}`);
    }

    return data ? this.mapRowToDepartment(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('departments')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete department: ${error.message}`);
    }

    return true;
  }
}

