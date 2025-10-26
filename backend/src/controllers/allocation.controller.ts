import { Request, Response } from 'express';
import { AllocationRepository } from '../repositories/allocation.repository';
import type { AreaType } from '@shared/types/allocation';

export class AllocationController {
  private allocationRepo: AllocationRepository;

  constructor() {
    this.allocationRepo = new AllocationRepository();
  }

  // Get all allocations for a staff member
  getStaffAllocations = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      
      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const allocations = await this.allocationRepo.findByStaffId(staffId);
      res.json({ allocations });
    } catch (error) {
      console.error('Error fetching staff allocations:', error);
      res.status(500).json({ error: 'Failed to fetch allocations' });
    }
  };

  // Get all staff allocated to an area
  getAreaAllocations = async (req: Request, res: Response): Promise<void> => {
    try {
      const { areaType, areaId } = req.params;
      const parsedAreaId = parseInt(areaId);

      if (!['department', 'service'].includes(areaType)) {
        res.status(400).json({ error: 'Invalid area type. Must be "department" or "service"' });
        return;
      }

      if (isNaN(parsedAreaId)) {
        res.status(400).json({ error: 'Invalid area ID' });
        return;
      }

      const allocations = await this.allocationRepo.findByArea(areaType as AreaType, parsedAreaId);
      res.json({ allocations });
    } catch (error) {
      console.error('Error fetching area allocations:', error);
      res.status(500).json({ error: 'Failed to fetch allocations' });
    }
  };

  // Create a single allocation
  createAllocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { staffId, areaType, areaId } = req.body;

      if (!staffId || !areaType || !areaId) {
        res.status(400).json({ error: 'staffId, areaType, and areaId are required' });
        return;
      }

      if (!['department', 'service'].includes(areaType)) {
        res.status(400).json({ error: 'Invalid area type. Must be "department" or "service"' });
        return;
      }

      // Check if allocation already exists
      const exists = await this.allocationRepo.exists(staffId, areaType, areaId);
      if (exists) {
        res.status(409).json({ error: 'Allocation already exists' });
        return;
      }

      const allocation = await this.allocationRepo.create(staffId, areaType, areaId);
      res.status(201).json({ allocation });
    } catch (error) {
      console.error('Error creating allocation:', error);
      res.status(500).json({ error: 'Failed to create allocation' });
    }
  };

  // Set all allocations for a staff member (replaces existing)
  setStaffAllocations = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      const { allocations } = req.body;

      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      if (!Array.isArray(allocations)) {
        res.status(400).json({ error: 'allocations must be an array' });
        return;
      }

      // Validate each allocation
      for (const alloc of allocations) {
        if (!alloc.areaType || !alloc.areaId) {
          res.status(400).json({ error: 'Each allocation must have areaType and areaId' });
          return;
        }
        if (!['department', 'service'].includes(alloc.areaType)) {
          res.status(400).json({ error: 'Invalid area type. Must be "department" or "service"' });
          return;
        }
      }

      const updatedAllocations = await this.allocationRepo.setAllocationsForStaff(staffId, allocations);
      res.json({ allocations: updatedAllocations });
    } catch (error) {
      console.error('Error setting staff allocations:', error);
      res.status(500).json({ error: 'Failed to set allocations' });
    }
  };

  // Delete a single allocation
  deleteAllocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid allocation ID' });
        return;
      }

      const success = await this.allocationRepo.delete(id);
      if (!success) {
        res.status(404).json({ error: 'Allocation not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting allocation:', error);
      res.status(500).json({ error: 'Failed to delete allocation' });
    }
  };
}

