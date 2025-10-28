import { supabase } from '../config/database';
import { Service } from '../../shared/types/service';

interface ServiceRow {
  id: number;
  name: string;
  description: string | null;
  include_in_main_rota: boolean;
  is_24_7: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class ServiceRepository {
  private mapRowToService(row: ServiceRow): Service {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      includeInMainRota: row.include_in_main_rota,
      is24_7: row.is_24_7,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findAll(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Failed to find services: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToService(row));
  }

  async findById(id: number): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find service: ${error.message}`);
    }

    return data ? this.mapRowToService(data) : null;
  }

  async create(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .insert({
        name: service.name,
        description: service.description,
        include_in_main_rota: service.includeInMainRota,
        is_24_7: service.is24_7,
        is_active: service.isActive
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create service: ${error.message}`);
    }

    return this.mapRowToService(data);
  }

  async update(id: number, updates: Partial<Service>): Promise<Service | null> {
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
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
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update service: ${error.message}`);
    }

    return data ? this.mapRowToService(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete service: ${error.message}`);
    }

    return true;
  }
}

