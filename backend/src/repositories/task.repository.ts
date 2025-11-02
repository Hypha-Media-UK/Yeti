import { BaseRepository } from './base.repository';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilterOptions } from '@shared/types/task';
import { pool } from '../config/database';

interface TaskRow {
  id: number;
  origin_area_id: number;
  origin_area_type: 'department' | 'service';
  destination_area_id: number;
  destination_area_type: 'department' | 'service';
  task_type: string;
  task_detail: string;
  requested_time: string;
  allocated_time: string;
  completed_time: string | null;
  assigned_staff_id: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export class TaskRepository extends BaseRepository<Task, TaskRow, CreateTaskInput, UpdateTaskInput> {
  protected readonly tableName = 'tasks';

  protected mapRowToEntity(row: TaskRow): Task {
    return {
      id: row.id,
      originAreaId: row.origin_area_id,
      originAreaType: row.origin_area_type,
      destinationAreaId: row.destination_area_id,
      destinationAreaType: row.destination_area_type,
      taskType: row.task_type as Task['taskType'],
      taskDetail: row.task_detail,
      requestedTime: row.requested_time,
      allocatedTime: row.allocated_time,
      completedTime: row.completed_time,
      assignedStaffId: row.assigned_staff_id,
      status: row.status as Task['status'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected mapEntityToInsertRow(input: CreateTaskInput): Partial<TaskRow> {
    return {
      origin_area_id: input.originAreaId,
      origin_area_type: input.originAreaType,
      destination_area_id: input.destinationAreaId,
      destination_area_type: input.destinationAreaType,
      task_type: input.taskType,
      task_detail: input.taskDetail,
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
  async findWithFilters(filters: TaskFilterOptions = {}): Promise<Task[]> {
    let query = this.client
      .from(this.tableName)
      .select('*');

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
  async findByStaffId(staffId: number): Promise<Task[]> {
    return this.findWithFilters({ assignedStaffId: staffId });
  }

  /**
   * Find tasks by origin area
   */
  async findByOriginArea(areaId: number, areaType: 'department' | 'service'): Promise<Task[]> {
    return this.findWithFilters({ originAreaId: areaId, originAreaType: areaType });
  }

  /**
   * Find tasks by destination area
   */
  async findByDestinationArea(areaId: number, areaType: 'department' | 'service'): Promise<Task[]> {
    return this.findWithFilters({ destinationAreaId: areaId, destinationAreaType: areaType });
  }

  /**
   * Find pending tasks (not completed or cancelled)
   */
  async findPending(): Promise<Task[]> {
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

