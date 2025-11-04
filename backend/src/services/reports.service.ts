import { pool } from '../config/database';
import { StaffTaskStats, DepartmentTaskStats, TaskReportsData } from '../../shared/types/reports';

export class ReportsService {
  /**
   * Get task completion statistics by staff member
   * Only includes pool staff who have been assigned tasks
   */
  async getStaffTaskStats(): Promise<StaffTaskStats[]> {
    const query = `
      SELECT 
        s.id as staff_id,
        CONCAT(s.first_name, ' ', s.last_name) as staff_name,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        CASE 
          WHEN COUNT(t.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / COUNT(t.id)::numeric) * 100, 1)
          ELSE 0
        END as completion_percentage
      FROM staff s
      INNER JOIN tasks t ON t.assigned_staff_id = s.id
      WHERE s.is_pool_staff = true AND s.is_active = true
      GROUP BY s.id, s.first_name, s.last_name
      ORDER BY s.last_name, s.first_name
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({
      staffId: row.staff_id,
      staffName: row.staff_name,
      totalTasks: parseInt(row.total_tasks, 10),
      completedTasks: parseInt(row.completed_tasks, 10),
      completionPercentage: parseFloat(row.completion_percentage),
    }));
  }

  /**
   * Get task statistics by origin department
   * Shows percentage of tasks originating from each department
   */
  async getDepartmentTaskStats(): Promise<DepartmentTaskStats[]> {
    const query = `
      SELECT 
        d.id as department_id,
        d.name as department_name,
        COUNT(t.id) as total_tasks,
        CASE 
          WHEN COUNT(t.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::numeric / COUNT(t.id)::numeric) * 100, 1)
          ELSE 0
        END as completion_percentage
      FROM departments d
      INNER JOIN tasks t ON t.origin_area_id = d.id AND t.origin_area_type = 'department'
      WHERE d.is_active = true
      GROUP BY d.id, d.name
      ORDER BY total_tasks DESC, d.name
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({
      departmentId: row.department_id,
      departmentName: row.department_name,
      totalTasks: parseInt(row.total_tasks, 10),
      completionPercentage: parseFloat(row.completion_percentage),
    }));
  }

  /**
   * Get all reports data in a single call
   */
  async getAllReportsData(): Promise<TaskReportsData> {
    const [staffStats, departmentStats] = await Promise.all([
      this.getStaffTaskStats(),
      this.getDepartmentTaskStats(),
    ]);

    return {
      staffStats,
      departmentStats,
    };
  }
}

