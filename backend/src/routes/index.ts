import { Router } from 'express';
import configRoutes from './config.routes';
import staffRoutes from './staff.routes';
import rotaRoutes from './rota.routes';

const router = Router();

router.use('/config', configRoutes);
router.use('/staff', staffRoutes);
router.use('/rota', rotaRoutes);

export default router;

