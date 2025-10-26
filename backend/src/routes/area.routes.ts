import { Router } from 'express';
import { AreaController } from '../controllers/area.controller';

const router = Router();
const controller = new AreaController();

// Get all areas that should appear on main rota
router.get('/main-rota', controller.getAllMainRotaAreas);

// Get areas operational on a specific day that should appear on main rota
router.get('/main-rota/day/:dayOfWeek', controller.getMainRotaAreasForDay);

export default router;

