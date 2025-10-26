import { Request, Response } from 'express';
import { AreaService } from '../services/area.service';

export class AreaController {
  private areaService: AreaService;

  constructor() {
    this.areaService = new AreaService();
  }

  /**
   * GET /api/areas/main-rota/day/:dayOfWeek
   * Get all areas that should appear on the main rota for a specific day
   */
  getMainRotaAreasForDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);

      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        res.status(400).json({ error: 'Invalid day of week. Must be 1-7 (Monday-Sunday)' });
        return;
      }

      const areas = await this.areaService.getAreasForDay(dayOfWeek);
      res.json({ areas });
    } catch (error) {
      console.error('Error fetching main rota areas for day:', error);
      res.status(500).json({ error: 'Failed to fetch main rota areas' });
    }
  };

  /**
   * GET /api/areas/main-rota
   * Get all areas that should appear on the main rota (regardless of day)
   */
  getAllMainRotaAreas = async (req: Request, res: Response): Promise<void> => {
    try {
      const areas = await this.areaService.getAllMainRotaAreas();
      res.json({ areas });
    } catch (error) {
      console.error('Error fetching all main rota areas:', error);
      res.status(500).json({ error: 'Failed to fetch main rota areas' });
    }
  };
}

