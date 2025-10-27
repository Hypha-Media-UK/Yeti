import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller';

const router = Router();
const configController = new ConfigController();

router.get('/zero-date', configController.getZeroDate);
router.put('/zero-date', configController.updateZeroDate);

router.get('/shift-times', configController.getShiftTimes);
router.put('/shift-times', configController.updateShiftTimes);

export default router;

