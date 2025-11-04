import { Department } from '../../shared/types/department';
import { BaseRepository } from './base.repository';

interface DepartmentRow {
  id: number;
  name: string;
  building_id: number | null;
  description: string | null;
  include_in_main_rota: boolean;
  include_in_tasks: boolean;
  is_24_7: boolean;
  requires_minimum_staffing: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type DepartmentCreateInput = {
  name: string;
  buildingId?: number | null;
  description?: string | null;
  includeInMainRota?: boolean;
  includeInTasks?: boolean;
  is24_7?: boolean;
  requiresMinimumStaffing?: boolean;
};

type DepartmentUpdateInput = {
  name?: string;
  buildingId?: number | null;
  description?: string | null;
  includeInMainRota?: boolean;
  includeInTasks?: boolean;
  is24_7?: boolean;
  requiresMinimumStaffing?: boolean;
  isActive?: boolean;
};

export class DepartmentRepository extends BaseRepository<
  Department,
  DepartmentRow,
  DepartmentCreateInput,
  DepartmentUpdateInput
> {
  protected readonly tableName = 'departments';

  protected mapRowToEntity(row: DepartmentRow): Department {
    return {
      id: row.id,
      name: row.name,
      buildingId: row.building_id,
      description: row.description,
      includeInMainRota: row.include_in_main_rota,
      includeInTasks: row.include_in_tasks,
      is24_7: row.is_24_7,
      requiresMinimumStaffing: row.requires_minimum_staffing,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToInsertRow(input: DepartmentCreateInput): Partial<DepartmentRow> {
    return {
      name: input.name,
      building_id: input.buildingId || null,
      description: input.description || null,
      include_in_main_rota: input.includeInMainRota ?? false,
      include_in_tasks: input.includeInTasks ?? false,
      is_24_7: input.is24_7 ?? false,
      requires_minimum_staffing: input.requiresMinimumStaffing ?? false,
      is_active: true,
    };
  }

  protected mapEntityToUpdateRow(input: DepartmentUpdateInput): Partial<DepartmentRow> {
    const updateData: Partial<DepartmentRow> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.buildingId !== undefined) {
      updateData.building_id = input.buildingId;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.includeInMainRota !== undefined) {
      updateData.include_in_main_rota = input.includeInMainRota;
    }

    if (input.includeInTasks !== undefined) {
      updateData.include_in_tasks = input.includeInTasks;
    }

    if (input.is24_7 !== undefined) {
      updateData.is_24_7 = input.is24_7;
    }

    if (input.requiresMinimumStaffing !== undefined) {
      updateData.requires_minimum_staffing = input.requiresMinimumStaffing;
    }

    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }

    return updateData;
  }

  /**
   * Override applyFilters to support buildingId filtering
   */
  protected applyFilters(query: any, filters: Record<string, any>): any {
    if (filters.buildingId) {
      query = query.eq('building_id', filters.buildingId);
    }
    return query;
  }

  /**
   * Override findAll to add custom ordering
   */
  async findAll(filters?: { buildingId?: number; includeInactive?: boolean }): Promise<Department[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    // Apply is_active filter by default
    if (filters?.includeInactive !== true) {
      query = query.eq('is_active', true);
    }

    // Apply custom filters
    if (filters) {
      query = this.applyFilters(query, filters);
    }

    // Add custom ordering
    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as DepartmentRow));
  }

  /**
   * Custom method: Find departments by building ID
   */
  async findByBuildingId(buildingId: number): Promise<Department[]> {
    return this.findAll({ buildingId });
  }
}

