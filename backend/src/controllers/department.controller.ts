import { Request, Response } from 'express';
import { DepartmentRepository } from '../repositories/department.repository';

export class DepartmentController {
  private departmentRepo: DepartmentRepository;

  constructor() {
    this.departmentRepo = new DepartmentRepository();
  }

  getAllDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { buildingId } = req.query;

      const filters: any = {};
      if (buildingId) filters.buildingId = parseInt(buildingId as string);

      const departments = await this.departmentRepo.findAll(filters);
      res.json({ departments });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ error: 'Failed to fetch departments' });
    }
  };

  getDepartmentById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid department ID' });
        return;
      }

      const department = await this.departmentRepo.findById(id);

      if (!department) {
        res.status(404).json({ error: 'Department not found' });
        return;
      }

      res.json({ department });
    } catch (error) {
      console.error('Error fetching department:', error);
      res.status(500).json({ error: 'Failed to fetch department' });
    }
  };

  createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, buildingId, description } = req.body;

      if (!name || name.trim() === '') {
        res.status(400).json({ error: 'Department name is required' });
        return;
      }

      const department = await this.departmentRepo.create({
        name: name.trim(),
        buildingId: buildingId || null,
        description: description || null,
      });

      res.status(201).json({ department });
    } catch (error: any) {
      console.error('Error creating department:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A department with this name already exists in this building' });
        return;
      }

      res.status(500).json({ error: 'Failed to create department' });
    }
  };

  updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid department ID' });
        return;
      }

      const updates = req.body;

      if (updates.name !== undefined && updates.name.trim() === '') {
        res.status(400).json({ error: 'Department name cannot be empty' });
        return;
      }

      const department = await this.departmentRepo.update(id, updates);

      if (!department) {
        res.status(404).json({ error: 'Department not found' });
        return;
      }

      res.json({ department });
    } catch (error: any) {
      console.error('Error updating department:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'A department with this name already exists in this building' });
        return;
      }

      res.status(500).json({ error: 'Failed to update department' });
    }
  };

  deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid department ID' });
        return;
      }

      const success = await this.departmentRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Department not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ error: 'Failed to delete department' });
    }
  };
}

