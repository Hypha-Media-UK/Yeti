import { Request, Response } from 'express';
import { AreaService } from '../services/area.service';
import { parseId } from '../utils/validation.utils';

export class AreaController {
  private areaService: AreaService;

  constructor() {
    this.areaService = new AreaService();
  }

  /**
   * GET /api/areas/main-rota/day/:dayOfWeek?date=YYYY-MM-DD&includeStaff=true|false
   * Get all areas that should appear on the main rota for a specific day
   * Optional date parameter to include staff assignments for that date
   * Optional includeStaff parameter to control whether staff data is included (default: true if date is provided)
   */
  getMainRotaAreasForDay = async (req: Request, res: Response): Promise<void> => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek);
      const date = req.query.date as string | undefined;
      const includeStaffParam = req.query.includeStaff as string | undefined;

      // Parse includeStaff parameter (default to undefined to let service decide)
      let includeStaff: boolean | undefined = undefined;
      if (includeStaffParam !== undefined) {
        includeStaff = includeStaffParam === 'true' || includeStaffParam === '1';
      }

      if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        res.status(400).json({ error: 'Invalid day of week. Must be 1-7 (Monday-Sunday)' });
        return;
      }

      const areas = await this.areaService.getAreasForDay(dayOfWeek, date, includeStaff);
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

  /**
   * GET /api/areas/:areaType/:areaId/staff?date=YYYY-MM-DD
   * Get staff assigned to a specific area on a specific date
   */
  getAreaStaff = async (req: Request, res: Response): Promise<void> => {
    try {
      const { areaType, areaId } = req.params;
      const date = req.query.date as string | undefined;

      if (!areaType || (areaType !== 'department' && areaType !== 'service')) {
        res.status(400).json({ error: 'Invalid area type. Must be "department" or "service"' });
        return;
      }

      const areaIdNum = parseId(areaId, 'Area ID');

      if (!date) {
        res.status(400).json({ error: 'Date parameter is required' });
        return;
      }

      const staff = await this.areaService.getStaffForSingleArea(
        areaType as 'department' | 'service',
        areaIdNum,
        date
      );

      res.json({ staff });
    } catch (error) {
      console.error('Error fetching area staff:', error);
      res.status(500).json({ error: 'Failed to fetch area staff' });
    }
  };
}

