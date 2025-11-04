import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';

const router = Router();
const reportsController = new ReportsController();

// Get all reports data
router.get('/', reportsController.getReportsData);

// Get staff statistics
router.get('/staff', reportsController.getStaffStats);

// Get department statistics
router.get('/departments', reportsController.getDepartmentStats);

export default router;

