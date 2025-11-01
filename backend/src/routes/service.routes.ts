import { Router } from 'express';
import { ServiceController } from '../controllers/service.controller';

const router = Router();
const serviceController = new ServiceController();

router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);
router.post('/', serviceController.createService);
router.put('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

// Staffing requirements
router.get('/:id/staffing-requirements', serviceController.getStaffingRequirements);
router.put('/:id/staffing-requirements', serviceController.setStaffingRequirements);

export default router;

