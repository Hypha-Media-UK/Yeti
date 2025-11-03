import { Request, Response } from 'express';
import { TaskConfigService } from '../services/task-config.service';
import { parseId } from '../utils/validation.utils';

export class TaskConfigController {
  private taskConfigService: TaskConfigService;

  constructor() {
    this.taskConfigService = new TaskConfigService();
  }

  // ============================================================================
  // Task Type Endpoints
  // ============================================================================

  /**
   * GET /api/task-config/types
   * Get all task types with their items and linked departments
   */
  getTaskTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskTypes = await this.taskConfigService.getTaskTypesWithItems();
      res.json({ taskTypes });
    } catch (error) {
      console.error('Error fetching task types:', error);
      res.status(500).json({ error: 'Failed to fetch task types' });
    }
  };

  /**
   * GET /api/task-config/types/:id
   * Get a single task type by ID
   */
  getTaskTypeById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Task type ID');
      const taskType = await this.taskConfigService.getTaskTypeById(id);

      if (!taskType) {
        res.status(404).json({ error: 'Task type not found' });
        return;
      }

      res.json({ taskType });
    } catch (error) {
      console.error('Error fetching task type:', error);
      res.status(500).json({ error: 'Failed to fetch task type' });
    }
  };

  /**
   * POST /api/task-config/types
   * Create a new task type
   */
  createTaskType = async (req: Request, res: Response): Promise<void> => {
    try {
      const { label, description } = req.body;

      if (!label) {
        res.status(400).json({ error: 'Label is required' });
        return;
      }

      const taskType = await this.taskConfigService.createTaskType({
        label: label.trim(),
        description: description?.trim() || null,
      });

      res.status(201).json({ taskType });
    } catch (error: any) {
      console.error('Error creating task type:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      if (error.message.includes('must be lowercase')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to create task type' });
    }
  };

  /**
   * PATCH /api/task-config/types/:id
   * Update a task type
   */
  updateTaskType = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Task type ID');
      const updates = req.body;

      const taskType = await this.taskConfigService.updateTaskType(id, updates);

      res.json({ taskType });
    } catch (error: any) {
      console.error('Error updating task type:', error);

      if (error.message === 'Task type not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      if (error.message.includes('must be lowercase')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to update task type' });
    }
  };

  /**
   * DELETE /api/task-config/types/:id
   * Delete a task type (soft delete)
   */
  deleteTaskType = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Task type ID');
      const success = await this.taskConfigService.deleteTaskType(id);

      if (!success) {
        res.status(404).json({ error: 'Task type not found' });
        return;
      }

      res.json({ message: 'Task type deleted successfully' });
    } catch (error) {
      console.error('Error deleting task type:', error);
      res.status(500).json({ error: 'Failed to delete task type' });
    }
  };

  // ============================================================================
  // Task Item Endpoints
  // ============================================================================

  /**
   * GET /api/task-config/types/:typeId/items
   * Get all items for a task type
   */
  getTaskItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const typeId = parseId(req.params.typeId, 'Task type ID');
      const items = await this.taskConfigService.getTaskItemsByType(typeId);
      res.json({ items });
    } catch (error) {
      console.error('Error fetching task items:', error);
      res.status(500).json({ error: 'Failed to fetch task items' });
    }
  };

  /**
   * POST /api/task-config/types/:typeId/items
   * Create a new task item
   */
  createTaskItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const taskTypeId = parseId(req.params.typeId, 'Task type ID');
      const {
        name,
        defaultOriginAreaId,
        defaultOriginAreaType,
        defaultDestinationAreaId,
        defaultDestinationAreaType,
      } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const item = await this.taskConfigService.createTaskItem({
        taskTypeId,
        name: name.trim(),
        defaultOriginAreaId: defaultOriginAreaId || null,
        defaultOriginAreaType: defaultOriginAreaType || null,
        defaultDestinationAreaId: defaultDestinationAreaId || null,
        defaultDestinationAreaType: defaultDestinationAreaType || null,
      });

      res.status(201).json({ item });
    } catch (error: any) {
      console.error('Error creating task item:', error);

      if (error.message === 'Task type not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('must be different')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to create task item' });
    }
  };

  /**
   * PATCH /api/task-config/items/:id
   * Update a task item
   */
  updateTaskItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Task item ID');
      const updates = req.body;

      const item = await this.taskConfigService.updateTaskItem(id, updates);

      res.json({ item });
    } catch (error: any) {
      console.error('Error updating task item:', error);

      if (error.message === 'Task item not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('must be different')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to update task item' });
    }
  };

  /**
   * DELETE /api/task-config/items/:id
   * Delete a task item (soft delete)
   */
  deleteTaskItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Task item ID');
      const success = await this.taskConfigService.deleteTaskItem(id);

      if (!success) {
        res.status(404).json({ error: 'Task item not found' });
        return;
      }

      res.json({ message: 'Task item deleted successfully' });
    } catch (error) {
      console.error('Error deleting task item:', error);
      res.status(500).json({ error: 'Failed to delete task item' });
    }
  };

  // ============================================================================
  // Department Link Endpoints
  // ============================================================================

  /**
   * PUT /api/task-config/types/:typeId/departments
   * Update all department links for a task type
   */
  updateTaskTypeDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      const typeId = parseId(req.params.typeId, 'Task type ID');
      const { departmentIds } = req.body;

      if (!Array.isArray(departmentIds)) {
        res.status(400).json({ error: 'departmentIds must be an array' });
        return;
      }

      await this.taskConfigService.updateTaskTypeDepartments(typeId, departmentIds);

      res.json({ message: 'Department links updated successfully' });
    } catch (error) {
      console.error('Error updating department links:', error);
      res.status(500).json({ error: 'Failed to update department links' });
    }
  };

  /**
   * POST /api/task-config/types/:typeId/departments/:deptId
   * Link a department to a task type
   */
  linkDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const typeId = parseId(req.params.typeId, 'Task type ID');
      const deptId = parseId(req.params.deptId, 'Department ID');

      await this.taskConfigService.linkDepartmentToTaskType(typeId, deptId);

      res.json({ message: 'Department linked successfully' });
    } catch (error) {
      console.error('Error linking department:', error);
      res.status(500).json({ error: 'Failed to link department' });
    }
  };

  /**
   * DELETE /api/task-config/types/:typeId/departments/:deptId
   * Unlink a department from a task type
   */
  unlinkDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const typeId = parseId(req.params.typeId, 'Task type ID');
      const deptId = parseId(req.params.deptId, 'Department ID');

      await this.taskConfigService.unlinkDepartmentFromTaskType(typeId, deptId);

      res.json({ message: 'Department unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking department:', error);
      res.status(500).json({ error: 'Failed to unlink department' });
    }
  };
}

