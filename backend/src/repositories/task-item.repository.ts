import { BaseRepository } from './base.repository';
import type { TaskItem, CreateTaskItemInput, UpdateTaskItemInput } from '@shared/types/task-config';

interface TaskItemRow {
  id: number;
  task_type_id: number;
  name: string;
  default_origin_area_id: number | null;
  default_origin_area_type: 'department' | 'service' | null;
  default_destination_area_id: number | null;
  default_destination_area_type: 'department' | 'service' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class TaskItemRepository extends BaseRepository<
  TaskItem,
  TaskItemRow,
  CreateTaskItemInput,
  UpdateTaskItemInput
> {
  protected readonly tableName = 'task_items';

  protected mapRowToEntity(row: TaskItemRow): TaskItem {
    return {
      id: row.id,
      taskTypeId: row.task_type_id,
      name: row.name,
      defaultOriginAreaId: row.default_origin_area_id,
      defaultOriginAreaType: row.default_origin_area_type,
      defaultDestinationAreaId: row.default_destination_area_id,
      defaultDestinationAreaType: row.default_destination_area_type,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToInsertRow(input: CreateTaskItemInput): Partial<TaskItemRow> {
    return {
      task_type_id: input.taskTypeId,
      name: input.name,
      default_origin_area_id: input.defaultOriginAreaId ?? null,
      default_origin_area_type: input.defaultOriginAreaType ?? null,
      default_destination_area_id: input.defaultDestinationAreaId ?? null,
      default_destination_area_type: input.defaultDestinationAreaType ?? null,
      is_active: true,
    };
  }

  protected mapEntityToUpdateRow(input: UpdateTaskItemInput): Partial<TaskItemRow> {
    const updateRow: Partial<TaskItemRow> = {};

    if (input.name !== undefined) updateRow.name = input.name;
    if (input.defaultOriginAreaId !== undefined) updateRow.default_origin_area_id = input.defaultOriginAreaId;
    if (input.defaultOriginAreaType !== undefined) updateRow.default_origin_area_type = input.defaultOriginAreaType;
    if (input.defaultDestinationAreaId !== undefined) updateRow.default_destination_area_id = input.defaultDestinationAreaId;
    if (input.defaultDestinationAreaType !== undefined) updateRow.default_destination_area_type = input.defaultDestinationAreaType;
    if (input.isActive !== undefined) updateRow.is_active = input.isActive;

    return updateRow;
  }

  /**
   * Find all task items for a specific task type
   */
  async findByTaskType(taskTypeId: number, includeInactive = false): Promise<TaskItem[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('task_type_id', taskTypeId);

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Order by name
    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find task items by task type: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as TaskItemRow));
  }

  /**
   * Override findAll to add custom ordering
   */
  async findAll(filters?: { taskTypeId?: number; includeInactive?: boolean }): Promise<TaskItem[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

    // Apply is_active filter by default
    if (filters?.includeInactive !== true) {
      query = query.eq('is_active', true);
    }

    // Apply task type filter if provided
    if (filters?.taskTypeId) {
      query = query.eq('task_type_id', filters.taskTypeId);
    }

    // Add custom ordering
    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as TaskItemRow));
  }
}

