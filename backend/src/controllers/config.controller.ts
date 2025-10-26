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
}

