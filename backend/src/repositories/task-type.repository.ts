import { BaseRepository } from './base.repository';
import type { TaskType, CreateTaskTypeInput, UpdateTaskTypeInput } from '@shared/types/task-config';

interface TaskTypeRow {
  id: number;
  label: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class TaskTypeRepository extends BaseRepository<
  TaskType,
  TaskTypeRow,
  CreateTaskTypeInput,
  UpdateTaskTypeInput
> {
  protected readonly tableName = 'task_types';

  protected mapRowToEntity(row: TaskTypeRow): TaskType {
    return {
      id: row.id,
      label: row.label,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToInsertRow(input: CreateTaskTypeInput): Partial<TaskTypeRow> {
    return {
      label: input.label,
      description: input.description ?? null,
      is_active: true,
    };
  }

  protected mapEntityToUpdateRow(input: UpdateTaskTypeInput): Partial<TaskTypeRow> {
    const updateRow: Partial<TaskTypeRow> = {};

    if (input.label !== undefined) updateRow.label = input.label;
    if (input.description !== undefined) updateRow.description = input.description;
    if (input.isActive !== undefined) updateRow.is_active = input.isActive;

    return updateRow;
  }

  /**
   * Override findAll to add custom ordering
   */
  async findAll(filters?: { includeInactive?: boolean }): Promise<TaskType[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    // Apply is_active filter by default
    if (filters?.includeInactive !== true) {
      query = query.eq('is_active', true);
    }

    // Add custom ordering by label
    query = query.order('label');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as TaskTypeRow));
  }

  /**
   * Find task type by label
   */
  async findByLabel(label: string): Promise<TaskType | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('label', label)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find task type by label: ${error.message}`);
    }

    return data ? this.mapRowToEntity(data as TaskTypeRow) : null;
  }
}

