import { Request, Response } from 'express';
import { BuildingRepository } from '../repositories/building.repository';

export class BuildingController {
  private buildingRepo: BuildingRepository;

  constructor() {
    this.buildingRepo = new BuildingRepository();
  }

  getAllBuildings = async (req: Request, res: Response): Promise<void> => {
    try {
      const buildings = await this.buildingRepo.findAll();
      res.json({ buildings });
    } catch (error) {
      console.error('Error fetching buildings:', error);
      res.status(500).json({ error: 'Failed to fetch buildings' });
    }
  };

  getBuildingById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid building ID' });
        return;
      }

      const building = await this.buildingRepo.findById(id);

      if (!building) {
        res.status(404).json({ error: 'Building not found' });
        return;
      }

      res.json({ building });
    } catch (error) {
      console.error('Error fetching building:', error);
      res.status(500).json({ error: 'Failed to fetch building' });
    }
  };

  createBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description } = req.body;

      if (!name || name.trim() === '') {
        res.status(400).json({ error: 'Building name is required' });
        return;
      }

      const building = await this.buildingRepo.create({
        name: name.trim(),
        description: description || null,
      });

      res.status(201).json({ building });
    } catch (error: any) {
      console.error('Error creating building:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A building with this name already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create building' });
    }
  };

  updateBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid building ID' });
        return;
      }

      const updates = req.body;

      if (updates.name !== undefined && updates.name.trim() === '') {
        res.status(400).json({ error: 'Building name cannot be empty' });
        return;
      }

      const building = await this.buildingRepo.update(id, updates);

      if (!building) {
        res.status(404).json({ error: 'Building not found' });
        return;
      }

      res.json({ building });
    } catch (error: any) {
      console.error('Error updating building:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A building with this name already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update building' });
    }
  };

  deleteBuilding = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid building ID' });
        return;
      }

      const success = await this.buildingRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Building not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting building:', error);
      res.status(500).json({ error: 'Failed to delete building' });
    }
  };
}

