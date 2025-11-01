import { Request, Response } from 'express';
import { ServiceRepository } from '../repositories/service.repository';
import { StaffingLevelService } from '../services/staffing-level.service';
import { parseId } from '../utils/validation.utils';
import { isDuplicateError, isForeignKeyError } from '../utils/error.utils';

export class ServiceController {
  private serviceRepo: ServiceRepository;
  private staffingLevelService: StaffingLevelService;

  constructor() {
    this.serviceRepo = new ServiceRepository();
    this.staffingLevelService = new StaffingLevelService();
  }

  getAllServices = async (req: Request, res: Response): Promise<void> => {
    try {
      const services = await this.serviceRepo.findAll();
      res.json({ services });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  };

  getServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Service ID');

      const service = await this.serviceRepo.findById(id);

      if (!service) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.json({ service });
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ error: 'Failed to fetch service' });
    }
  };

  createService = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, includeInMainRota, is24_7 } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Service name is required' });
        return;
      }

      const service = await this.serviceRepo.create({
        name,
        description: description || null,
        includeInMainRota: includeInMainRota ?? false,
        is24_7: is24_7 ?? false,
        isActive: true,
      });

      res.status(201).json({ service });
    } catch (error: any) {
      console.error('Error creating service:', error);

      if (isDuplicateError(error)) {
        res.status(409).json({ error: 'A service with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to create service' });
    }
  };

  updateService = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Service ID');

      const updates = req.body;
      const service = await this.serviceRepo.update(id, updates);

      if (!service) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.json({ service });
    } catch (error: any) {
      console.error('Error updating service:', error);

      if (isDuplicateError(error)) {
        res.status(409).json({ error: 'A service with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to update service' });
    }
  };

  deleteService = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Service ID');

      const success = await this.serviceRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.json({ message: 'Service deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting service:', error);

      if (isForeignKeyError(error)) {
        res.status(409).json({ error: 'Cannot delete service because it has staff allocations' });
        return;
      }

      res.status(500).json({ error: 'Failed to delete service' });
    }
  };

  // Staffing requirement endpoints
  getStaffingRequirements = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Service ID');

      const requirements = await this.staffingLevelService.getStaffingRequirements('service', id);
      res.json({ requirements });
    } catch (error) {
      console.error('Error fetching staffing requirements:', error);
      res.status(500).json({ error: 'Failed to fetch staffing requirements' });
    }
  };

  setStaffingRequirements = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Service ID');
      const { requirements } = req.body;

      if (!Array.isArray(requirements)) {
        res.status(400).json({ error: 'Requirements must be an array' });
        return;
      }

      const updated = await this.staffingLevelService.setStaffingRequirements('service', id, requirements);
      res.json({ requirements: updated });
    } catch (error) {
      console.error('Error setting staffing requirements:', error);
      res.status(500).json({ error: 'Failed to set staffing requirements' });
    }
  };
}

