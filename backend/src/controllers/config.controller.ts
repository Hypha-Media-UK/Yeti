import { Request, Response } from 'express';
import { ConfigRepository } from '../repositories/config.repository';
import { TIME_ZONE } from '../config/constants';
import { validateDateString } from '../utils/validation.utils';

export class ConfigController {
  private configRepo: ConfigRepository;

  constructor() {
    this.configRepo = new ConfigRepository();
  }

  getZeroDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const zeroDate = await this.configRepo.getByKey('app_zero_date');
      const timeZone = TIME_ZONE;

      res.json({
        appZeroDate: zeroDate,
        timeZone,
      });
    } catch (error) {
      console.error('Error fetching zero date:', error);
      res.status(500).json({ error: 'Failed to fetch configuration' });
    }
  };

  updateZeroDate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { zeroDate } = req.body;

      if (!zeroDate) {
        res.status(400).json({ error: 'Zero date is required' });
        return;
      }

      const validation = validateDateString(zeroDate);
      if (!validation.valid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      await this.configRepo.setByKey('app_zero_date', zeroDate);

      res.json({ appZeroDate: zeroDate });
    } catch (error) {
      console.error('Error updating zero date:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  };

  // GET /api/config/shift-times
  getShiftTimes = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayStart = await this.configRepo.getByKey('day_shift_start') || '08:00';
      const dayEnd = await this.configRepo.getByKey('day_shift_end') || '20:00';
      const nightStart = await this.configRepo.getByKey('night_shift_start') || '20:00';
      const nightEnd = await this.configRepo.getByKey('night_shift_end') || '08:00';

      res.json({
        dayShiftStart: dayStart,
        dayShiftEnd: dayEnd,
        nightShiftStart: nightStart,
        nightShiftEnd: nightEnd,
      });
    } catch (error) {
      console.error('Error fetching shift times:', error);
      res.status(500).json({ error: 'Failed to fetch shift times' });
    }
  };

  // PUT /api/config/shift-times
  updateShiftTimes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { dayShiftStart, dayShiftEnd, nightShiftStart, nightShiftEnd } = req.body;

      // Validate time format (HH:mm)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

      if (dayShiftStart && !timeRegex.test(dayShiftStart)) {
        res.status(400).json({ error: 'Day shift start time must be in HH:mm format' });
        return;
      }
      if (dayShiftEnd && !timeRegex.test(dayShiftEnd)) {
        res.status(400).json({ error: 'Day shift end time must be in HH:mm format' });
        return;
      }
      if (nightShiftStart && !timeRegex.test(nightShiftStart)) {
        res.status(400).json({ error: 'Night shift start time must be in HH:mm format' });
        return;
      }
      if (nightShiftEnd && !timeRegex.test(nightShiftEnd)) {
        res.status(400).json({ error: 'Night shift end time must be in HH:mm format' });
        return;
      }

      // Update values
      if (dayShiftStart) await this.configRepo.setByKey('day_shift_start', dayShiftStart);
      if (dayShiftEnd) await this.configRepo.setByKey('day_shift_end', dayShiftEnd);
      if (nightShiftStart) await this.configRepo.setByKey('night_shift_start', nightShiftStart);
      if (nightShiftEnd) await this.configRepo.setByKey('night_shift_end', nightShiftEnd);

      // Return updated values
      const updated = {
        dayShiftStart: dayShiftStart || await this.configRepo.getByKey('day_shift_start'),
        dayShiftEnd: dayShiftEnd || await this.configRepo.getByKey('day_shift_end'),
        nightShiftStart: nightShiftStart || await this.configRepo.getByKey('night_shift_start'),
        nightShiftEnd: nightShiftEnd || await this.configRepo.getByKey('night_shift_end'),
      };

      res.json(updated);
    } catch (error) {
      console.error('Error updating shift times:', error);
      res.status(500).json({ error: 'Failed to update shift times' });
    }
  };
}

