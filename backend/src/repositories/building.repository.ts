import { Building } from '../../shared/types/building';
import { BaseRepository } from './base.repository';

interface BuildingRow {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type BuildingCreateInput = {
  name: string;
  description?: string | null;
};

type BuildingUpdateInput = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export class BuildingRepository extends BaseRepository<
  Building,
  BuildingRow,
  BuildingCreateInput,
  BuildingUpdateInput
> {
  protected readonly tableName = 'buildings';

  protected mapRowToEntity(row: BuildingRow): Building {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToInsertRow(input: BuildingCreateInput): Partial<BuildingRow> {
    return {
      name: input.name,
      description: input.description || null,
      is_active: true,
    };
  }

  protected mapEntityToUpdateRow(input: BuildingUpdateInput): Partial<BuildingRow> {
    const updateData: Partial<BuildingRow> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive;
    }

    return updateData;
  }

  /**
   * Override findAll to add custom ordering
   */
  async findAll(filters?: Record<string, any>): Promise<Building[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    // Apply is_active filter by default
    if (filters?.includeInactive !== true) {
      query = query.eq('is_active', true);
    }

    // Add custom ordering
    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as BuildingRow));
  }
}

