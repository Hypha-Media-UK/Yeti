import { BaseRepository } from './base.repository';
import type { Task, TaskWithRelations, CreateTaskInput, UpdateTaskInput, TaskFilterOptions } from '@shared/types/task';
import { pool } from '../config/database';

interface TaskRow {
  id: number;
  origin_area_id: number;
  origin_area_type: 'department' | 'service';
  destination_area_id: number;
  destination_area_type: 'department' | 'service';
  task_type: string;
  task_type_id: number | null;
  task_detail: string;
  task_item_id: number | null;
  requested_time: string;
  allocated_time: string;
  completed_time: string | null;
  assigned_staff_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  task_item?: {
    id: number;
    name: string;
    task_type: {
      id: number;
      label: string;
    };
  } | null;
}

export class TaskRepository extends BaseRepository<Task, TaskRow, CreateTaskInput, UpdateTaskInput> {
  protected readonly tableName = 'tasks';

  protected mapRowToEntity(row: TaskRow): TaskWithRelations {
    return {
      id: row.id,
      originAreaId: row.origin_area_id,
      originAreaType: row.origin_area_type,
      destinationAreaId: row.destination_area_id,
      destinationAreaType: row.destination_area_type,
      taskType: row.task_type as Task['taskType'],
      taskTypeId: row.task_type_id,
      taskDetail: row.task_detail,
      taskItemId: row.task_item_id,
      requestedTime: row.requested_time,
      allocatedTime: row.allocated_time,
      completedTime: row.completed_time,
      assignedStaffId: row.assigned_staff_id,
      status: row.status as Task['status'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      taskItem: row.task_item ? {
        id: row.task_item.id,
        name: row.task_item.name,
        taskType: {
          id: row.task_item.task_type.id,
          label: row.task_item.task_type.label,
        },
      } : null,
    };
  }

  protected mapEntityToInsertRow(input: CreateTaskInput): Partial<TaskRow> {
    return {
      origin_area_id: input.originAreaId,
      origin_area_type: input.originAreaType,
      destination_area_id: input.destinationAreaId,
      destination_area_type: input.destinationAreaType,
      task_type: input.taskType,
      task_type_id: input.taskTypeId ?? null,
      task_detail: input.taskDetail,
      task_item_id: input.taskItemId ?? null,
      requested_time: input.requestedTime,
      allocated_time: input.allocatedTime,
      completed_time: input.completedTime ?? null,
      assigned_staff_id: input.assignedStaffId ?? null,
      status: input.status ?? 'pending',
    };
  }

  protected mapEntityToUpdateRow(input: UpdateTaskInput): Partial<TaskRow> {
    const updateRow: Partial<TaskRow> = {};

    if (input.taskType !== undefined) updateRow.task_type = input.taskType;
    if (input.taskDetail !== undefined) updateRow.task_detail = input.taskDetail;
    if (input.requestedTime !== undefined) updateRow.requested_time = input.requestedTime;
    if (input.allocatedTime !== undefined) updateRow.allocated_time = input.allocatedTime;
    if (input.completedTime !== undefined) updateRow.completed_time = input.completedTime;
    if (input.assignedStaffId !== undefined) updateRow.assigned_staff_id = input.assignedStaffId;
    if (input.status !== undefined) updateRow.status = input.status;

    return updateRow;
  }

  /**
   * Find tasks with optional filtering
   */
  async findWithFilters(filters: TaskFilterOptions = {}): Promise<TaskWithRelations[]> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        task_item:task_items(
          id,
          name,
          task_type:task_types(
            id,
            label
          )
        )
      `);

    // Status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    // Task type filter
    if (filters.taskType) {
      if (Array.isArray(filters.taskType)) {
        query = query.in('task_type', filters.taskType);
      } else {
        query = query.eq('task_type', filters.taskType);
      }
    }

    // Assigned staff filter
    if (filters.assignedStaffId !== undefined) {
      query = query.eq('assigned_staff_id', filters.assignedStaffId);
    }

    // Origin area filter
    if (filters.originAreaId !== undefined && filters.originAreaType !== undefined) {
      query = query
        .eq('origin_area_id', filters.originAreaId)
        .eq('origin_area_type', filters.originAreaType);
    }

    // Destination area filter
    if (filters.destinationAreaId !== undefined && filters.destinationAreaType !== undefined) {
      query = query
        .eq('destination_area_id', filters.destinationAreaId)
        .eq('destination_area_type', filters.destinationAreaType);
    }

    // Date range filter (based on created_at)
    if (filters.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }

    if (filters.toDate) {
      query = query.lte('created_at', filters.toDate);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find tasks: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToEntity(row as TaskRow));
  }

  /**
   * Find tasks by assigned staff member
   */
  async findByStaffId(staffId: number): Promise<TaskWithRelations[]> {
    return this.findWithFilters({ assignedStaffId: staffId });
  }

  /**
   * Find tasks by origin area
   */
  async findByOriginArea(areaId: number, areaType: 'department' | 'service'): Promise<TaskWithRelations[]> {
    return this.findWithFilters({ originAreaId: areaId, originAreaType: areaType });
  }

  /**
   * Find tasks by destination area
   */
  async findByDestinationArea(areaId: number, areaType: 'department' | 'service'): Promise<TaskWithRelations[]> {
    return this.findWithFilters({ destinationAreaId: areaId, destinationAreaType: areaType });
  }

  /**
   * Find pending tasks (not completed or cancelled)
   */
  async findPending(): Promise<TaskWithRelations[]> {
    return this.findWithFilters({ status: ['pending', 'in-progress'] });
  }

  /**
   * Update task status
   */
  async updateStatus(id: number, status: Task['status']): Promise<Task | null> {
    return this.update(id, { status });
  }

  /**
   * Assign task to staff member
   */
  async assignToStaff(id: number, staffId: number | null): Promise<Task | null> {
    return this.update(id, { assignedStaffId: staffId });
  }

  /**
   * Mark task as completed
   */
  async markCompleted(id: number, completedTime: string): Promise<Task | null> {
    return this.update(id, { status: 'completed', completedTime });
  }
}

