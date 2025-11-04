import { Router } from 'express';
import { TaskConfigController } from '../controllers/task-config.controller';

const router = Router();
const taskConfigController = new TaskConfigController();

// Task Type routes
router.get('/types', taskConfigController.getTaskTypes);
router.get('/types/:id', taskConfigController.getTaskTypeById);
router.post('/types', taskConfigController.createTaskType);
router.patch('/types/:id', taskConfigController.updateTaskType);
router.delete('/types/:id', taskConfigController.deleteTaskType);

// Task Item routes
router.get('/types/:typeId/items', taskConfigController.getTaskItems);
router.post('/types/:typeId/items', taskConfigController.createTaskItem);
router.patch('/items/:id', taskConfigController.updateTaskItem);
router.delete('/items/:id', taskConfigController.deleteTaskItem);

export default router;

