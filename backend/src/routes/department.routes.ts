import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';

const router = Router();
const departmentController = new DepartmentController();

router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

export default router;

