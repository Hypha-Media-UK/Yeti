import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';

const router = Router();
const staffController = new StaffController();

router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

router.get('/:staffId/schedules', staffController.getStaffSchedules);
router.post('/:staffId/schedules', staffController.createStaffSchedule);

export default router;

