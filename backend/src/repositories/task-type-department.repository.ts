import { BaseRepository } from './base.repository';
import type { TaskTypeDepartment } from '@shared/types/task-config';

interface TaskTypeDepartmentRow {
  id: number;
  task_type_id: number;
  department_id: number;
  created_at: string;
}

type CreateTaskTypeDepartmentInput = {
  taskTypeId: number;
  departmentId: number;
};

type UpdateTaskTypeDepartmentInput = Partial<CreateTaskTypeDepartmentInput>;

export class TaskTypeDepartmentRepository extends BaseRepository<
  TaskTypeDepartment,
  TaskTypeDepartmentRow,
  CreateTaskTypeDepartmentInput,
  UpdateTaskTypeDepartmentInput
> {
  protected readonly tableName = 'task_type_departments';

  protected mapRowToEntity(row: TaskTypeDepartmentRow): TaskTypeDepartment {
    return {
      id: row.id,
      taskTypeId: row.task_type_id,
      departmentId: row.department_id,
      createdAt: row.created_at,
    };
  }

  protected mapEntityToInsertRow(input: CreateTaskTypeDepartmentInput): Partial<TaskTypeDepartmentRow> {
    return {
      task_type_id: input.taskTypeId,
      department_id: input.departmentId,
    };
  }

  protected mapEntityToUpdateRow(input: UpdateTaskTypeDepartmentInput): Partial<TaskTypeDepartmentRow> {
    const updateRow: Partial<TaskTypeDepartmentRow> = {};

    if (input.taskTypeId !== undefined) updateRow.task_type_id = input.taskTypeId;
    if (input.departmentId !== undefined) updateRow.department_id = input.departmentId;

    return updateRow;
  }

  /**
   * Find all department IDs linked to a task type
   */
  async findDepartmentIdsByTaskType(taskTypeId: number): Promise<number[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('department_id')
      .eq('task_type_id', taskTypeId);

    if (error) {
      throw new Error(`Failed to find departments for task type: ${error.message}`);
    }

    return (data || []).map(row => row.department_id);
  }

  /**
   * Find all task type IDs linked to a department
   */
  async findTaskTypeIdsByDepartment(departmentId: number): Promise<number[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('task_type_id')
      .eq('department_id', departmentId);

    if (error) {
      throw new Error(`Failed to find task types for department: ${error.message}`);
    }

    return (data || []).map(row => row.task_type_id);
  }

  /**
   * Delete a specific task type-department link
   */
  async deleteLink(taskTypeId: number, departmentId: number): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('task_type_id', taskTypeId)
      .eq('department_id', departmentId);

    if (error) {
      throw new Error(`Failed to delete task type-department link: ${error.message}`);
    }

    return true;
  }

  /**
   * Delete all links for a task type
   */
  async deleteAllForTaskType(taskTypeId: number): Promise<boolean> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('task_type_id', taskTypeId);

    if (error) {
      throw new Error(`Failed to delete task type-department links: ${error.message}`);
    }

    return true;
  }
}

