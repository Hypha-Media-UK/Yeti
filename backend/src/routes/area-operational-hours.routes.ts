import { Router } from 'express';
import { AreaOperationalHoursController } from '../controllers/area-operational-hours.controller';

const router = Router();
const controller = new AreaOperationalHoursController();

// Get operational hours for a specific area
router.get('/area/:areaType/:areaId', controller.getByArea);

// Get all areas operational on a specific day
router.get('/day/:dayOfWeek', controller.getByDay);

// Create a new operational hours entry
router.post('/', controller.create);

// Update an operational hours entry
router.put('/:id', controller.update);

// Delete an operational hours entry
router.delete('/:id', controller.delete);

// Bulk set operational hours for an area (replaces all existing)
router.put('/area/:areaType/:areaId', controller.setForArea);

// Copy operational hours from one area to another
router.post('/copy', controller.copy);

export default router;

