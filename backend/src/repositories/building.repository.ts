import { supabase } from '../config/database';
import { Building } from '../../shared/types/building';

interface BuildingRow {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to find buildings: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToBuilding(row));
  }

  async findById(id: number): Promise<Building | null> {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find building: ${error.message}`);
    }

    return data ? this.mapRowToBuilding(data) : null;
  }

  async create(building: { name: string; description?: string | null }): Promise<Building> {
    const { data, error } = await supabase
      .from('buildings')
      .insert({
        name: building.name,
        description: building.description || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create building: ${error.message}`);
    }

    return this.mapRowToBuilding(data);
  }

  async update(id: number, updates: { name?: string; description?: string | null; isActive?: boolean }): Promise<Building | null> {
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const { data, error } = await supabase
      .from('buildings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update building: ${error.message}`);
    }

    return data ? this.mapRowToBuilding(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('buildings')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete building: ${error.message}`);
    }

    return true;
  }
}

