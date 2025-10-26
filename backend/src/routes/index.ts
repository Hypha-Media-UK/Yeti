import { Router } from 'express';
import configRoutes from './config.routes';
import staffRoutes from './staff.routes';
import rotaRoutes from './rota.routes';
import buildingRoutes from './building.routes';
import departmentRoutes from './department.routes';
import serviceRoutes from './service.routes';

const router = Router();

router.use('/config', configRoutes);
router.use('/staff', staffRoutes);
router.use('/rota', rotaRoutes);
router.use('/buildings', buildingRoutes);
router.use('/departments', departmentRoutes);
router.use('/services', serviceRoutes);

export default router;

