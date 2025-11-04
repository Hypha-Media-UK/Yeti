import { Request, Response } from 'express';
import { ReportsService } from '../services/reports.service';

export class ReportsController {
  private reportsService: ReportsService;

  constructor() {
    this.reportsService = new ReportsService();
  }

  /**
   * GET /api/reports
   * Get all reports data (staff stats and department stats)
   */
  getReportsData = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.reportsService.getAllReportsData();
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching reports data:', error);
      res.status(500).json({ error: 'Failed to fetch reports data' });
    }
  };

  /**
   * GET /api/reports/staff
   * Get task completion statistics by staff member
   */
  getStaffStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.reportsService.getStaffTaskStats();
      res.json({ staffStats: stats });
    } catch (error: any) {
      console.error('Error fetching staff stats:', error);
      res.status(500).json({ error: 'Failed to fetch staff statistics' });
    }
  };

  /**
   * GET /api/reports/departments
   * Get task statistics by origin department
   */
  getDepartmentStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.reportsService.getDepartmentTaskStats();
      res.json({ departmentStats: stats });
    } catch (error: any) {
      console.error('Error fetching department stats:', error);
      res.status(500).json({ error: 'Failed to fetch department statistics' });
    }
  };
}

