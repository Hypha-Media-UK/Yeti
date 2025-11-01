import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';

const router = Router();
const departmentController = new DepartmentController();

router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

// Staffing requirements
router.get('/:id/staffing-requirements', departmentController.getStaffingRequirements);
router.put('/:id/staffing-requirements', departmentController.setStaffingRequirements);

export default router;

