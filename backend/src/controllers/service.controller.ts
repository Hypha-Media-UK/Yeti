import { Request, Response } from 'express';
import { ServiceRepository } from '../repositories/service.repository';

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
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid service ID' });
        return;
      }

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
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Service name is required' });
        return;
      }

      const service = await this.serviceRepo.create({
        name,
        description: description || null,
        isActive: true,
      });

      res.status(201).json({ service });
    } catch (error: any) {
      console.error('Error creating service:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A service with this name already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create service' });
    }
  };

  updateService = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid service ID' });
        return;
      }

      const updates = req.body;
      const service = await this.serviceRepo.update(id, updates);

      if (!service) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.json({ service });
    } catch (error: any) {
      console.error('Error updating service:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A service with this name already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update service' });
    }
  };

  deleteService = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid service ID' });
        return;
      }

      const success = await this.serviceRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  };
}

