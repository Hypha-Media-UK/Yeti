import { TaskTypeRepository } from '../repositories/task-type.repository';
import { TaskItemRepository } from '../repositories/task-item.repository';
import { TaskTypeDepartmentRepository } from '../repositories/task-type-department.repository';
import type {
  TaskType,
  TaskItem,
  TaskTypeWithItems,
  CreateTaskTypeInput,
  UpdateTaskTypeInput,
  CreateTaskItemInput,
  UpdateTaskItemInput,
} from '@shared/types/task-config';

export class TaskConfigService {
  private taskTypeRepo: TaskTypeRepository;
  private taskItemRepo: TaskItemRepository;
  private taskTypeDeptRepo: TaskTypeDepartmentRepository;

  constructor() {
    this.taskTypeRepo = new TaskTypeRepository();
    this.taskItemRepo = new TaskItemRepository();
    this.taskTypeDeptRepo = new TaskTypeDepartmentRepository();
  }

  // ============================================================================
  // Task Type Operations
  // ============================================================================

  /**
   * Get all task types with their items
   */
  async getTaskTypesWithItems(): Promise<TaskTypeWithItems[]> {
    const taskTypes = await this.taskTypeRepo.findAll();

    const taskTypesWithItems = await Promise.all(
      taskTypes.map(async (taskType) => {
        const items = await this.taskItemRepo.findByTaskType(taskType.id);

        return {
          ...taskType,
          items,
        };
      })
    );

    return taskTypesWithItems;
  }

  /**
   * Get a single task type by ID with items
   */
  async getTaskTypeById(id: number): Promise<TaskTypeWithItems | null> {
    const taskType = await this.taskTypeRepo.findById(id);

    if (!taskType) {
      return null;
    }

    const items = await this.taskItemRepo.findByTaskType(id);

    return {
      ...taskType,
      items,
    };
  }

  /**
   * Create a new task type
   */
  async createTaskType(input: CreateTaskTypeInput): Promise<TaskType> {
    // Check if label already exists
    const existing = await this.taskTypeRepo.findByLabel(input.label);
    if (existing) {
      throw new Error(`Task type with label "${input.label}" already exists`);
    }

    return await this.taskTypeRepo.create(input);
  }

  /**
   * Update a task type
   */
  async updateTaskType(id: number, input: UpdateTaskTypeInput): Promise<TaskType> {
    // If updating label, check for duplicates
    if (input.label) {
      const existing = await this.taskTypeRepo.findByLabel(input.label);
      if (existing && existing.id !== id) {
        throw new Error(`Task type with label "${input.label}" already exists`);
      }
    }

    const updated = await this.taskTypeRepo.update(id, input);

    if (!updated) {
      throw new Error('Task type not found');
    }

    return updated;
  }

  /**
   * Delete a task type (soft delete by setting isActive = false)
   */
  async deleteTaskType(id: number): Promise<boolean> {
    // Soft delete by setting isActive to false
    const updated = await this.taskTypeRepo.update(id, { isActive: false });
    return !!updated;
  }

  // ============================================================================
  // Task Item Operations
  // ============================================================================

  /**
   * Get all task items for a task type
   */
  async getTaskItemsByType(taskTypeId: number): Promise<TaskItem[]> {
    return await this.taskItemRepo.findByTaskType(taskTypeId);
  }

  /**
   * Create a new task item
   */
  async createTaskItem(input: CreateTaskItemInput): Promise<TaskItem> {
    // Verify task type exists
    const taskType = await this.taskTypeRepo.findById(input.taskTypeId);
    if (!taskType) {
      throw new Error('Task type not found');
    }

    // Validate that origin and destination are different if both are set
    if (
      input.defaultOriginAreaId &&
      input.defaultDestinationAreaId &&
      input.defaultOriginAreaType &&
      input.defaultDestinationAreaType &&
      input.defaultOriginAreaId === input.defaultDestinationAreaId &&
      input.defaultOriginAreaType === input.defaultDestinationAreaType
    ) {
      throw new Error('Default origin and destination must be different');
    }

    return await this.taskItemRepo.create(input);
  }

  /**
   * Update a task item
   */
  async updateTaskItem(id: number, input: UpdateTaskItemInput): Promise<TaskItem> {
    const existing = await this.taskItemRepo.findById(id);
    if (!existing) {
      throw new Error('Task item not found');
    }

    // Validate that origin and destination are different if both are being set
    const newOriginId = input.defaultOriginAreaId ?? existing.defaultOriginAreaId;
    const newOriginType = input.defaultOriginAreaType ?? existing.defaultOriginAreaType;
    const newDestId = input.defaultDestinationAreaId ?? existing.defaultDestinationAreaId;
    const newDestType = input.defaultDestinationAreaType ?? existing.defaultDestinationAreaType;

    if (
      newOriginId &&
      newDestId &&
      newOriginType &&
      newDestType &&
      newOriginId === newDestId &&
      newOriginType === newDestType
    ) {
      throw new Error('Default origin and destination must be different');
    }

    const updated = await this.taskItemRepo.update(id, input);
    
    if (!updated) {
      throw new Error('Task item not found');
    }

    return updated;
  }

  /**
   * Delete a task item (soft delete by setting isActive = false)
   */
  async deleteTaskItem(id: number): Promise<boolean> {
    // Soft delete by setting isActive to false
    const updated = await this.taskItemRepo.update(id, { isActive: false });
    return !!updated;
  }

}

