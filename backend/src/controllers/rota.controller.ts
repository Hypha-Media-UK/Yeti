import { Request, Response } from 'express';
import { RotaService } from '../services/rota.service';
import { OverrideRepository } from '../repositories/override.repository';
import { validateDateString, validateShiftType } from '../utils/validation.utils';

export class RotaController {
  private rotaService: RotaService;
  private overrideRepo: OverrideRepository;

  constructor() {
    this.rotaService = new RotaService();
    this.overrideRepo = new OverrideRepository();
  }

  getRotaForDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.params;

      const validation = validateDateString(date);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const rota = await this.rotaService.getRotaForDate(date);

      res.json(rota);
    } catch (error) {
      console.error('Error fetching rota:', error);
      res.status(500).json({ error: 'Failed to fetch rota' });
    }
  };

  getRotaForRange = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const startValidation = validateDateString(startDate as string);
      if (!startValidation.valid) {
        res.status(400).json({ error: `Start date: ${startValidation.error}` });
        return;
      }

      const endValidation = validateDateString(endDate as string);
      if (!endValidation.valid) {
        res.status(400).json({ error: `End date: ${endValidation.error}` });
        return;
      }

      const days = await this.rotaService.getRotaForRange(startDate as string, endDate as string);

      res.json({ days });
    } catch (error) {
      console.error('Error fetching rota range:', error);
      res.status(500).json({ error: 'Failed to fetch rota range' });
    }
  };

  getAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const assignments = await this.overrideRepo.findByDateRange(
        startDate as string,
        endDate as string
      );

      res.json({ assignments });
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  };

  createAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { staffId, assignmentDate, shiftType, shiftStart, shiftEnd, notes } = req.body;

      if (!staffId || !assignmentDate || !shiftType) {
        res.status(400).json({ error: 'Staff ID, assignment date, and shift type are required' });
        return;
      }

      const dateValidation = validateDateString(assignmentDate);
      if (!dateValidation.valid) {
        res.status(400).json({ error: dateValidation.error });
        return;
      }

      const shiftValidation = validateShiftType(shiftType);
      if (!shiftValidation.valid) {
        res.status(400).json({ error: shiftValidation.error });
        return;
      }

      const assignment = await this.overrideRepo.create({
        staffId: parseInt(staffId),
        assignmentDate,
        shiftType,
        shiftStart: shiftStart || null,
        shiftEnd: shiftEnd || null,
        notes: notes || null,
      });

      res.status(201).json({ assignment });
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      
      // Handle duplicate key error
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Assignment already exists for this staff member, date, and shift type' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  };

  deleteAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid assignment ID' });
        return;
      }

      const success = await this.overrideRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Assignment not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      res.status(500).json({ error: 'Failed to delete assignment' });
    }
  };
}

