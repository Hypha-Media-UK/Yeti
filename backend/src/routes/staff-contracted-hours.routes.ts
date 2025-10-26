import { Router } from 'express';
import { StaffContractedHoursController } from '../controllers/staff-contracted-hours.controller';

const router = Router();
const controller = new StaffContractedHoursController();

// Get contracted hours for a specific staff member
router.get('/staff/:staffId', controller.getByStaff);

// Get all staff contracted on a specific day
router.get('/day/:dayOfWeek', controller.getByDay);

// Create a new contracted hours entry
router.post('/', controller.create);

// Update a contracted hours entry
router.put('/:id', controller.update);

// Delete a contracted hours entry
router.delete('/:id', controller.delete);

// Bulk set contracted hours for a staff member (replaces all existing)
router.put('/staff/:staffId', controller.setForStaff);

// Copy contracted hours from one staff member to another
router.post('/copy', controller.copy);

export default router;

