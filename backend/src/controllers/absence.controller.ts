import { Request, Response } from 'express';
import { AbsenceRepository } from '../repositories/absence.repository';
import type { CreateAbsenceRequest, UpdateAbsenceRequest } from '../../shared/types/absence';

export class AbsenceController {
  private absenceRepo: AbsenceRepository;

  constructor() {
    this.absenceRepo = new AbsenceRepository();
  }

  /**
   * Get all absences for a specific staff member
   * GET /api/absences/staff/:staffId
   */
  getAbsencesByStaffId = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      
      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const absences = await this.absenceRepo.findByStaffId(staffId);
      res.json(absences);
    } catch (error) {
      console.error('Error fetching absences:', error);
      res.status(500).json({ error: 'Failed to fetch absences' });
    }
  };

  /**
   * Get absences for a staff member within a date range
   * GET /api/absences/staff/:staffId/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  getAbsencesByStaffIdAndDateRange = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      const { startDate, endDate } = req.query;

      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const absences = await this.absenceRepo.findByStaffIdAndDateRange(
        staffId,
        startDate as string,
        endDate as string
      );
      res.json(absences);
    } catch (error) {
      console.error('Error fetching absences by date range:', error);
      res.status(500).json({ error: 'Failed to fetch absences' });
    }
  };

  /**
   * Get active absence for a staff member at a specific datetime
   * GET /api/absences/staff/:staffId/active?datetime=ISO8601
   */
  getActiveAbsence = async (req: Request, res: Response): Promise<void> => {
    try {
      const staffId = parseInt(req.params.staffId);
      const { datetime } = req.query;

      if (isNaN(staffId)) {
        res.status(400).json({ error: 'Invalid staff ID' });
        return;
      }

      const checkDatetime = datetime ? datetime as string : new Date().toISOString();
      const absence = await this.absenceRepo.findActiveAbsence(staffId, checkDatetime);
      
      res.json(absence || null);
    } catch (error) {
      console.error('Error fetching active absence:', error);
      res.status(500).json({ error: 'Failed to fetch active absence' });
    }
  };

  /**
   * Create a new absence record
   * POST /api/absences
   */
  createAbsence = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: CreateAbsenceRequest = req.body;

      // Validate required fields
      if (!data.staffId || !data.absenceType || !data.startDatetime || !data.endDatetime) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Validate absence type
      const validTypes = ['sickness', 'annual_leave', 'training', 'absence'];
      if (!validTypes.includes(data.absenceType)) {
        res.status(400).json({ error: 'Invalid absence type' });
        return;
      }

      // Validate date range
      const startDate = new Date(data.startDatetime);
      const endDate = new Date(data.endDatetime);
      if (endDate <= startDate) {
        res.status(400).json({ error: 'End datetime must be after start datetime' });
        return;
      }

      const absence = await this.absenceRepo.create(data);
      res.status(201).json(absence);
    } catch (error) {
      console.error('Error creating absence:', error);
      res.status(500).json({ error: 'Failed to create absence' });
    }
  };

  /**
   * Update an absence record
   * PUT /api/absences/:id
   */
  updateAbsence = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const data: UpdateAbsenceRequest = req.body;

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid absence ID' });
        return;
      }

      // Validate absence type if provided
      if (data.absenceType) {
        const validTypes = ['sickness', 'annual_leave', 'training', 'absence'];
        if (!validTypes.includes(data.absenceType)) {
          res.status(400).json({ error: 'Invalid absence type' });
          return;
        }
      }

      // Validate date range if both dates are provided
      if (data.startDatetime && data.endDatetime) {
        const startDate = new Date(data.startDatetime);
        const endDate = new Date(data.endDatetime);
        if (endDate <= startDate) {
          res.status(400).json({ error: 'End datetime must be after start datetime' });
          return;
        }
      }

      const absence = await this.absenceRepo.update(id, data);
      
      if (!absence) {
        res.status(404).json({ error: 'Absence not found' });
        return;
      }

      res.json(absence);
    } catch (error) {
      console.error('Error updating absence:', error);
      res.status(500).json({ error: 'Failed to update absence' });
    }
  };

  /**
   * Delete an absence record
   * DELETE /api/absences/:id
   */
  deleteAbsence = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid absence ID' });
        return;
      }

      const success = await this.absenceRepo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Absence not found' });
        return;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting absence:', error);
      res.status(500).json({ error: 'Failed to delete absence' });
    }
  };
}

