import { Service } from '../../shared/types/service';
import { BaseRepository } from './base.repository';

interface ServiceRow {
  id: number;
  name: string;
  description: string | null;
  include_in_main_rota: boolean;
  is_24_7: boolean;
  requires_minimum_staffing: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type ServiceCreateInput = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;
type ServiceUpdateInput = Partial<Service>;

export class ServiceRepository extends BaseRepository<
  Service,
  ServiceRow,
  ServiceCreateInput,
  ServiceUpdateInput
> {
  protected readonly tableName = 'services';

  protected mapRowToEntity(row: ServiceRow): Service {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      includeInMainRota: row.include_in_main_rota,
      is24_7: row.is_24_7,
      requiresMinimumStaffing: row.requires_minimum_staffing,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToInsertRow(input: ServiceCreateInput): Partial<ServiceRow> {
    return {
      name: input.name,
      description: input.description,
      include_in_main_rota: input.includeInMainRota,
      is_24_7: input.is24_7,
      requires_minimum_staffing: input.requiresMinimumStaffing,
      is_active: input.isActive,
    };
  }

  protected mapEntityToUpdateRow(input: ServiceUpdateInput): Partial<ServiceRow> {
    const updateData: Partial<ServiceRow> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.includeInMainRota !== undefined) {
      updateData.include_in_main_rota = input.includeInMainRota;
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
   * Override findAll to add custom ordering
   */
  async findAll(filters?: Record<string, any>): Promise<Service[]> {
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

    return (data || []).map(row => this.mapRowToEntity(row as ServiceRow));
  }
}

