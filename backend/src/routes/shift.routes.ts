import { Router } from 'express';
import { ShiftController } from '../controllers/shift.controller';

const router = Router();
const shiftController = new ShiftController();

// GET /api/shifts - Get all shifts
router.get('/', shiftController.getAllShifts);

// GET /api/shifts/type/:type - Get shifts by type
router.get('/type/:type', shiftController.getShiftsByType);

// GET /api/shifts/:id - Get shift by ID
router.get('/:id', shiftController.getShiftById);

// GET /api/shifts/:id/staff-count - Get staff count for shift
router.get('/:id/staff-count', shiftController.getShiftStaffCount);

// POST /api/shifts - Create new shift
router.post('/', shiftController.createShift);

// PUT /api/shifts/:id - Update shift
router.put('/:id', shiftController.updateShift);

// DELETE /api/shifts/:id - Delete shift (soft delete)
router.delete('/:id', shiftController.deleteShift);

export default router;

