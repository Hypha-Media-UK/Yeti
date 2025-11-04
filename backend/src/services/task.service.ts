import { TaskRepository } from '../repositories/task.repository';
import type { Task, TaskWithRelations, CreateTaskInput, UpdateTaskInput, TaskFilterOptions } from '@shared/types/task';

export class TaskService {
  private taskRepo: TaskRepository;

  constructor() {
    this.taskRepo = new TaskRepository();
  }

  /**
   * Create a new task
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    // Validate that origin and destination are different
    if (
      input.originAreaId === input.destinationAreaId &&
      input.originAreaType === input.destinationAreaType
    ) {
      throw new Error('Origin and destination must be different');
    }

    // Validate that allocated time is after or equal to requested time
    if (input.allocatedTime < input.requestedTime) {
      throw new Error('Allocated time must be after or equal to requested time');
    }

    // Create the task
    const task = await this.taskRepo.create(input);
    return task;
  }

  /**
   * Get all tasks with optional filtering
   */
  async getTasks(filters?: TaskFilterOptions): Promise<TaskWithRelations[]> {
    if (filters) {
      return this.taskRepo.findWithFilters(filters);
    }
    return this.taskRepo.findAll();
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(id: number): Promise<Task | null> {
    return this.taskRepo.findById(id);
  }

  /**
   * Update a task
   */
  async updateTask(id: number, input: UpdateTaskInput): Promise<Task | null> {
    // Validate allocated time if both times are being updated
    if (input.allocatedTime && input.requestedTime) {
      if (input.allocatedTime < input.requestedTime) {
        throw new Error('Allocated time must be after or equal to requested time');
      }
    }

    // If only allocated time is being updated, check against existing requested time
    if (input.allocatedTime && !input.requestedTime) {
      const existingTask = await this.taskRepo.findById(id);
      if (existingTask && input.allocatedTime < existingTask.requestedTime) {
        throw new Error('Allocated time must be after or equal to requested time');
      }
    }

    // If only requested time is being updated, check against existing allocated time
    if (input.requestedTime && !input.allocatedTime) {
      const existingTask = await this.taskRepo.findById(id);
      if (existingTask && existingTask.allocatedTime < input.requestedTime) {
        throw new Error('Requested time must be before or equal to allocated time');
      }
    }

    return this.taskRepo.update(id, input);
  }

  /**
   * Delete a task
   */
  async deleteTask(id: number): Promise<boolean> {
    return this.taskRepo.delete(id);
  }

  /**
   * Get tasks by assigned staff member
   */
  async getTasksByStaff(staffId: number): Promise<TaskWithRelations[]> {
    return this.taskRepo.findByStaffId(staffId);
  }

  /**
   * Get tasks by origin area
   */
  async getTasksByOriginArea(areaId: number, areaType: 'department' | 'service'): Promise<TaskWithRelations[]> {
    return this.taskRepo.findByOriginArea(areaId, areaType);
  }

  /**
   * Get tasks by destination area
   */
  async getTasksByDestinationArea(areaId: number, areaType: 'department' | 'service'): Promise<TaskWithRelations[]> {
    return this.taskRepo.findByDestinationArea(areaId, areaType);
  }

  /**
   * Get pending tasks (not completed or cancelled)
   */
  async getPendingTasks(): Promise<TaskWithRelations[]> {
    return this.taskRepo.findPending();
  }

  /**
   * Update task status
   */
  async updateTaskStatus(id: number, status: Task['status']): Promise<Task | null> {
    return this.taskRepo.updateStatus(id, status);
  }

  /**
   * Assign task to staff member
   */
  async assignTaskToStaff(id: number, staffId: number | null): Promise<Task | null> {
    // If assigning to a staff member, verify they exist
    if (staffId !== null) {
      // This would ideally check if the staff member exists
      // For now, we'll rely on the foreign key constraint
    }

    return this.taskRepo.assignToStaff(id, staffId);
  }

  /**
   * Mark task as completed
   */
  async completeTask(id: number, completedTime: string): Promise<Task | null> {
    return this.taskRepo.markCompleted(id, completedTime);
  }

  /**
   * Start task (mark as in-progress)
   */
  async startTask(id: number): Promise<Task | null> {
    return this.taskRepo.updateStatus(id, 'in-progress');
  }

  /**
   * Cancel task
   */
  async cancelTask(id: number): Promise<Task | null> {
    return this.taskRepo.updateStatus(id, 'cancelled');
  }
}

