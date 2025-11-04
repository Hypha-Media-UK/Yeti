import type { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import type { CreateTaskInput, UpdateTaskInput, TaskFilterOptions } from '@shared/types/task';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  /**
   * GET /api/tasks
   * Get all tasks with optional filtering
   */
  getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: TaskFilterOptions = {};

      // Parse query parameters for filtering
      if (req.query.status) {
        filters.status = Array.isArray(req.query.status)
          ? req.query.status as any[]
          : req.query.status as any;
      }

      if (req.query.taskType) {
        filters.taskType = Array.isArray(req.query.taskType)
          ? req.query.taskType as any[]
          : req.query.taskType as any;
      }

      if (req.query.assignedStaffId) {
        filters.assignedStaffId = parseInt(req.query.assignedStaffId as string, 10);
      }

      if (req.query.originAreaId && req.query.originAreaType) {
        filters.originAreaId = parseInt(req.query.originAreaId as string, 10);
        filters.originAreaType = req.query.originAreaType as 'department' | 'service';
      }

      if (req.query.destinationAreaId && req.query.destinationAreaType) {
        filters.destinationAreaId = parseInt(req.query.destinationAreaId as string, 10);
        filters.destinationAreaType = req.query.destinationAreaType as 'department' | 'service';
      }

      if (req.query.fromDate) {
        filters.fromDate = req.query.fromDate as string;
      }

      if (req.query.toDate) {
        filters.toDate = req.query.toDate as string;
      }

      const tasks = await this.taskService.getTasks(filters);
      res.json({ tasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  };

  /**
   * GET /api/tasks/:id
   * Get a single task by ID
   */
  getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const task = await this.taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json({ task });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  };

  /**
   * POST /api/tasks
   * Create a new task
   */
  createTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        originAreaId,
        originAreaType,
        destinationAreaId,
        destinationAreaType,
        taskType,
        taskDetail,
        taskItemId,
        requestedTime,
        allocatedTime,
        completedTime,
        assignedStaffId,
        status,
      } = req.body;

      // Validate required fields
      if (!originAreaId || !originAreaType || !destinationAreaId || !destinationAreaType) {
        res.status(400).json({ error: 'Origin and destination area information is required' });
        return;
      }

      // Either taskItemId (new) or taskType+taskDetail (old) must be provided
      if (!taskItemId && (!taskType || !taskDetail)) {
        res.status(400).json({ error: 'Task item is required' });
        return;
      }

      if (!requestedTime || !allocatedTime) {
        res.status(400).json({ error: 'Requested time and allocated time are required' });
        return;
      }

      const input: CreateTaskInput = {
        originAreaId: parseInt(originAreaId, 10),
        originAreaType,
        destinationAreaId: parseInt(destinationAreaId, 10),
        destinationAreaType,
        taskType: taskType || null,
        taskDetail: taskDetail || null,
        taskItemId: taskItemId ? parseInt(taskItemId, 10) : null,
        requestedTime,
        allocatedTime,
        completedTime: completedTime || null,
        assignedStaffId: assignedStaffId ? parseInt(assignedStaffId, 10) : null,
        status: status || 'pending',
      };

      const task = await this.taskService.createTask(input);
      res.status(201).json({ task });
    } catch (error: any) {
      console.error('Error creating task:', error);
      if (error.message.includes('Origin and destination must be different')) {
        res.status(400).json({ error: error.message });
      } else if (error.message.includes('Allocated time must be after')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create task' });
      }
    }
  };

  /**
   * PATCH /api/tasks/:id
   * Update a task
   */
  updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const input: UpdateTaskInput = {};

      if (req.body.taskType !== undefined) input.taskType = req.body.taskType;
      if (req.body.taskDetail !== undefined) input.taskDetail = req.body.taskDetail;
      if (req.body.requestedTime !== undefined) input.requestedTime = req.body.requestedTime;
      if (req.body.allocatedTime !== undefined) input.allocatedTime = req.body.allocatedTime;
      if (req.body.completedTime !== undefined) input.completedTime = req.body.completedTime;
      if (req.body.assignedStaffId !== undefined) {
        input.assignedStaffId = req.body.assignedStaffId ? parseInt(req.body.assignedStaffId, 10) : null;
      }
      if (req.body.status !== undefined) input.status = req.body.status;

      const task = await this.taskService.updateTask(id, input);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json({ task });
    } catch (error: any) {
      console.error('Error updating task:', error);
      if (error.message.includes('time must be')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update task' });
      }
    }
  };

  /**
   * DELETE /api/tasks/:id
   * Delete a task
   */
  deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const deleted = await this.taskService.deleteTask(id);

      if (!deleted) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  };

  /**
   * GET /api/tasks/pending
   * Get all pending tasks
   */
  getPendingTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const tasks = await this.taskService.getPendingTasks();
      res.json({ tasks });
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      res.status(500).json({ error: 'Failed to fetch pending tasks' });
    }
  };

  /**
   * PATCH /api/tasks/:id/status
   * Update task status
   */
  updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      const task = await this.taskService.updateTaskStatus(id, status);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json({ task });
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ error: 'Failed to update task status' });
    }
  };

  /**
   * PATCH /api/tasks/:id/assign
   * Assign task to staff member
   */
  assignTask = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { staffId } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const task = await this.taskService.assignTaskToStaff(
        id,
        staffId ? parseInt(staffId, 10) : null
      );

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json({ task });
    } catch (error) {
      console.error('Error assigning task:', error);
      res.status(500).json({ error: 'Failed to assign task' });
    }
  };
}

