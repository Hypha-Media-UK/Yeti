import { Router } from 'express';
import { AbsenceController } from '../controllers/absence.controller';

const router = Router();
const absenceController = new AbsenceController();

// Get all absences for a staff member
router.get('/staff/:staffId', absenceController.getAbsencesByStaffId);

// Get absences for a staff member within a date range
router.get('/staff/:staffId/range', absenceController.getAbsencesByStaffIdAndDateRange);

// Get active absence for a staff member
router.get('/staff/:staffId/active', absenceController.getActiveAbsence);

// Create a new absence
router.post('/', absenceController.createAbsence);

// Update an absence
router.put('/:id', absenceController.updateAbsence);

// Delete an absence
router.delete('/:id', absenceController.deleteAbsence);

export default router;

