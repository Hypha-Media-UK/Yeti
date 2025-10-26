import { Router } from 'express';
import { AllocationController } from '../controllers/allocation.controller';

const router = Router();
const allocationController = new AllocationController();

// Get all allocations for a staff member
router.get('/staff/:staffId', allocationController.getStaffAllocations);

// Set all allocations for a staff member (replaces existing)
router.put('/staff/:staffId', allocationController.setStaffAllocations);

// Get all staff allocated to an area
router.get('/area/:areaType/:areaId', allocationController.getAreaAllocations);

// Create a single allocation
router.post('/', allocationController.createAllocation);

// Delete a single allocation
router.delete('/:id', allocationController.deleteAllocation);

export default router;

