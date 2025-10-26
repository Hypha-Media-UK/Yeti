import { Request, Response } from 'express';
import { AreaOperationalHoursRepository } from '../repositories/area-operational-hours.repository';
import { AreaType, validateOperationalHours } from '../../shared/types/operational-hours';
import { validateAreaType, parseId } from '../utils/validation.utils';

export class AreaOperationalHoursController {
  private repo: AreaOperationalHoursRepository;

  constructor() {
    this.repo = new AreaOperationalHoursRepository();
  }

  // GET /api/operational-hours/area/:areaType/:areaId
  getByArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const { areaType, areaId } = req.params;

      if (!validateAreaType(areaType)) {
        res.status(400).json({ error: 'Invalid area type. Must be "department" or "service"' });
        return;
      }

      const id = parseId(areaId);
      if (!id) {
        res.status(400).json({ error: 'Invalid area ID' });
        return;
      }

      const hours = await this.repo.findByArea(areaType, id);
      res.json({ operationalHours: hours });
    } catch (error) {
      console.error('Error fetching operational hours:', error);
      res.status(500).json({ error: 'Failed to fetch operational hours' });
    }
  };

  // GET /api/operational-hours/day/:dayOfWeek
  getByDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);

      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        res.status(400).json({ error: 'Invalid day of week. Must be 1-7 (Monday-Sunday)' });
        return;
      }

      const hours = await this.repo.findByDay(dayOfWeek);
      res.json({ operationalHours: hours });
    } catch (error) {
      console.error('Error fetching operational hours by day:', error);
      res.status(500).json({ error: 'Failed to fetch operational hours' });
    }
  };

  // POST /api/operational-hours
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { areaType, areaId, dayOfWeek, startTime, endTime } = req.body;

      if (!validateAreaType(areaType)) {
        res.status(400).json({ error: 'Invalid area type. Must be "department" or "service"' });
        return;
      }

      if (!areaId || !dayOfWeek || !startTime || !endTime) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Validate the operational hours
      const validation = validateOperationalHours(dayOfWeek, startTime, endTime);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      const hours = await this.repo.create({
        areaType: areaType as AreaType,
        areaId,
        dayOfWeek,
        startTime,
        endTime,
      });

      res.status(201).json({ operationalHours: hours });
    } catch (error: any) {
      console.error('Error creating operational hours:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'This operational hours entry already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to create operational hours' });
    }
  };

  // PUT /api/operational-hours/:id
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
        res.status(404).json({ error: 'Operational hours not found' });
        return;
      }

      res.json({ operationalHours: hours });
    } catch (error: any) {
      console.error('Error updating operational hours:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'This operational hours entry already exists' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to update operational hours' });
    }
  };

  // DELETE /api/operational-hours/:id
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      const success = await this.repo.delete(id);

      if (!success) {
        res.status(404).json({ error: 'Operational hours not found' });
        return;
      }

      res.json({ message: 'Operational hours deleted successfully' });
    } catch (error) {
      console.error('Error deleting operational hours:', error);
      res.status(500).json({ error: 'Failed to delete operational hours' });
    }
  };

  // PUT /api/operational-hours/area/:areaType/:areaId
  setForArea = async (req: Request, res: Response): Promise<void> => {
    try {
      const { areaType, areaId } = req.params;
      const { hours } = req.body;

      if (!validateAreaType(areaType)) {
        res.status(400).json({ error: 'Invalid area type. Must be "department" or "service"' });
        return;
      }

      const id = parseId(areaId);
      if (!id) {
        res.status(400).json({ error: 'Invalid area ID' });
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

      const result = await this.repo.setOperationalHoursForArea(areaType, id, hours);
      res.json({ operationalHours: result });
    } catch (error: any) {
      console.error('Error setting operational hours:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Duplicate operational hours entries detected' });
        return;
      }
      
      res.status(500).json({ error: 'Failed to set operational hours' });
    }
  };

  // POST /api/operational-hours/copy
  copy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromAreaType, fromAreaId, toAreaType, toAreaId } = req.body;

      if (!validateAreaType(fromAreaType)) {
        res.status(400).json({ error: 'Invalid source area type' });
        return;
      }

      if (!validateAreaType(toAreaType)) {
        res.status(400).json({ error: 'Invalid destination area type' });
        return;
      }

      if (!fromAreaId || !toAreaId) {
        res.status(400).json({ error: 'Missing area IDs' });
        return;
      }

      const result = await this.repo.copyOperationalHours(
        fromAreaType,
        fromAreaId,
        toAreaType,
        toAreaId
      );

      res.json({ operationalHours: result, copied: result.length });
    } catch (error) {
      console.error('Error copying operational hours:', error);
      res.status(500).json({ error: 'Failed to copy operational hours' });
    }
  };
}

