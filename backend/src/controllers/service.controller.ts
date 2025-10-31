import { Request, Response } from 'express';
import { ServiceRepository } from '../repositories/service.repository';
import { parseId } from '../utils/validation.utils';
import { isDuplicateError, isForeignKeyError } from '../utils/error.utils';

export class ServiceController {
  private serviceRepo: ServiceRepository;

  constructor() {
    this.serviceRepo = new ServiceRepository();
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
}

