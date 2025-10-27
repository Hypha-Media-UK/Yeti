import { Router } from 'express';
import configRoutes from './config.routes';
import staffRoutes from './staff.routes';
import rotaRoutes from './rota.routes';
import buildingRoutes from './building.routes';
import departmentRoutes from './department.routes';
import serviceRoutes from './service.routes';
import allocationRoutes from './allocation.routes';
import areaRoutes from './area.routes';
import areaOperationalHoursRoutes from './area-operational-hours.routes';
import staffContractedHoursRoutes from './staff-contracted-hours.routes';
import shiftRoutes from './shift.routes';
import absenceRoutes from './absence.routes';

const router = Router();

router.use('/config', configRoutes);
router.use('/staff', staffRoutes);
router.use('/rota', rotaRoutes);
router.use('/buildings', buildingRoutes);
router.use('/departments', departmentRoutes);
router.use('/services', serviceRoutes);
router.use('/allocations', allocationRoutes);
router.use('/areas', areaRoutes);
router.use('/operational-hours', areaOperationalHoursRoutes);
router.use('/contracted-hours', staffContractedHoursRoutes);
router.use('/shifts', shiftRoutes);
router.use('/absences', absenceRoutes);

export default router;

