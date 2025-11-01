import { Request, Response } from 'express';
import { DepartmentRepository } from '../repositories/department.repository';
import { StaffingLevelService } from '../services/staffing-level.service';
import { parseId } from '../utils/validation.utils';
import { isDuplicateError, isForeignKeyError } from '../utils/error.utils';

export class DepartmentController {
  private departmentRepo: DepartmentRepository;
  private staffingLevelService: StaffingLevelService;

  constructor() {
    this.departmentRepo = new DepartmentRepository();
    this.staffingLevelService = new StaffingLevelService();
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
      const id = parseId(req.params.id, 'Department ID');

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
      const { name, buildingId, description, includeInMainRota, is24_7 } = req.body;

      if (!name || name.trim() === '') {
        res.status(400).json({ error: 'Department name is required' });
        return;
      }

      const department = await this.departmentRepo.create({
        name: name.trim(),
        buildingId: buildingId || null,
        description: description || null,
        includeInMainRota: includeInMainRota ?? false,
        is24_7: is24_7 ?? false,
      });

      res.status(201).json({ department });
    } catch (error: any) {
      console.error('Error creating department:', error);

      if (isDuplicateError(error)) {
        res.status(409).json({ error: 'A department with this name already exists in this building' });
        return;
      }

      res.status(500).json({ error: 'Failed to create department' });
    }
  };

  updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Department ID');

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

      if (isDuplicateError(error)) {
        res.status(409).json({ error: 'A department with this name already exists in this building' });
        return;
      }

      res.status(500).json({ error: 'Failed to update department' });
    }
  };

  deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Department ID');

      const success = await this.departmentRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Department not found' });
        return;
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting department:', error);

      if (isForeignKeyError(error)) {
        res.status(409).json({ error: 'Cannot delete department because it has staff allocations' });
        return;
      }

      res.status(500).json({ error: 'Failed to delete department' });
    }
  };

  // Staffing requirement endpoints
  getStaffingRequirements = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Department ID');

      const requirements = await this.staffingLevelService.getStaffingRequirements('department', id);
      res.json({ requirements });
    } catch (error) {
      console.error('Error fetching staffing requirements:', error);
      res.status(500).json({ error: 'Failed to fetch staffing requirements' });
    }
  };

  setStaffingRequirements = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseId(req.params.id, 'Department ID');
      const { requirements } = req.body;

      if (!Array.isArray(requirements)) {
        res.status(400).json({ error: 'Requirements must be an array' });
        return;
      }

      const updated = await this.staffingLevelService.setStaffingRequirements('department', id, requirements);
      res.json({ requirements: updated });
    } catch (error) {
      console.error('Error setting staffing requirements:', error);
      res.status(500).json({ error: 'Failed to set staffing requirements' });
    }
  };
}

