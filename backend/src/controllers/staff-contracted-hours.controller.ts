import { Request, Response } from 'express';
import { StaffContractedHoursRepository } from '../repositories/staff-contracted-hours.repository';
import { validateOperationalHours } from '../../shared/types/operational-hours';

export class StaffContractedHoursController {
  private repo: StaffContractedHoursRepository;

  constructor() {
    this.repo = new StaffContractedHoursRepository();
  }

  // GET /api/contracted-hours/staff/:staffId
  getByStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);

      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const hours = await this.repo.findByStaff(staffId);
      res.json({ contractedHours: hours });
    } catch (error) {
      console.error('Error fetching contracted hours:', error);
      res.status(500).json({ error: 'Failed to fetch contracted hours' });
    }
  };

  // GET /api/contracted-hours/day/:dayOfWeek
  getByDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);

      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        res.status(400).json({ error: 'Invalid day of week. Must be 1-7 (Monday-Sunday)' });
        return;
      }

      const hours = await this.repo.findByDay(dayOfWeek);
      res.json({ contractedHours: hours });
    } catch (error) {
      console.error('Error fetching contracted hours by day:', error);
      res.status(500).json({ error: 'Failed to fetch contracted hours' });
    }
  };

  // POST /api/contracted-hours
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { staffId, dayOfWeek, startTime, endTime } = req.body;

      if (!staffId || !dayOfWeek || !startTime || !endTime) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Validate the contracted hours
      const validation = validateOperationalHours(dayOfWeek, startTime, endTime);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const hours = await this.repo.create({
        staffId,
        dayOfWeek,
        startTime,
        endTime,
      });

      res.status(201).json({ contractedHours: hours });
    } catch (error: any) {
      console.error('Error creating contracted hours:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'This contracted hours entry already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create contracted hours' });
    }
  };

  // PUT /api/contracted-hours/:id
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      const { dayOfWeek, startTime, endTime } = req.body;

      // Validate if provided
      if (dayOfWeek !== undefined || startTime !== undefined || endTime !== undefined) {
        const validation = validateOperationalHours(
          dayOfWeek ?? 1,
          startTime ?? '00:00',
          endTime ?? '23:59'
        );
        if (!validation.valid) {
          res.status(400).json({ error: validation.error });
          return;
        }
      }

      const hours = await this.repo.update(id, { dayOfWeek, startTime, endTime });

      if (!hours) {
        res.status(404).json({ error: 'Contracted hours not found' });
        return;
      }

      res.json({ contractedHours: hours });
    } catch (error: any) {
      console.error('Error updating contracted hours:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'This contracted hours entry already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update contracted hours' });
    }
  };

  // DELETE /api/contracted-hours/:id
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      const success = await this.repo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Contracted hours not found' });
        return;
      }

      res.json({ message: 'Contracted hours deleted successfully' });
    } catch (error) {
      console.error('Error deleting contracted hours:', error);
      res.status(500).json({ error: 'Failed to delete contracted hours' });
    }
  };

  // PUT /api/contracted-hours/staff/:staffId
  setForStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      const { hours } = req.body;

      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      if (!Array.isArray(hours)) {
        res.status(400).json({ error: 'Hours must be an array' });
        return;
      }

      // Validate all entries
      for (const entry of hours) {
        const validation = validateOperationalHours(entry.dayOfWeek, entry.startTime, entry.endTime);
        if (!validation.valid) {
          res.status(400).json({ error: `Invalid entry: ${validation.error}` });
          return;
        }
      }

      const result = await this.repo.setContractedHoursForStaff(staffId, hours);
      res.json({ contractedHours: result });
    } catch (error: any) {
      console.error('Error setting contracted hours:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Duplicate contracted hours entries detected' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to set contracted hours' });
    }
  };

  // POST /api/contracted-hours/copy
  copy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromStaffId, toStaffId } = req.body;

      if (!fromStaffId || !toStaffId) {
        res.status(400).json({ error: 'Missing staff IDs' });
        return;
      }

      const result = await this.repo.copyContractedHours(fromStaffId, toStaffId);

      res.json({ contractedHours: result, copied: result.length });
    } catch (error) {
      console.error('Error copying contracted hours:', error);
      res.status(500).json({ error: 'Failed to copy contracted hours' });
    }
  };
}

