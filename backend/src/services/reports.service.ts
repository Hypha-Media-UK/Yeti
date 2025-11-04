import { supabase } from '../config/database';
import { StaffTaskStats, DepartmentTaskStats, TaskReportsData } from '../../shared/types/reports';

export class ReportsService {
  /**
   * Get task completion statistics by staff member
   * Only includes pool staff who have been assigned tasks
   */
  async getStaffTaskStats(): Promise<StaffTaskStats[]> {
    // Fetch all pool staff
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('is_pool_staff', true)
      .eq('is_active', true)
      .order('last_name')
      .order('first_name');

    if (staffError) {
      throw new Error(`Failed to fetch staff: ${staffError.message}`);
    }

    if (!staff || staff.length === 0) {
      return [];
    }

    // Fetch all tasks assigned to pool staff
    const staffIds = staff.map(s => s.id);
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, assigned_staff_id, status')
      .in('assigned_staff_id', staffIds);

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    // Group tasks by staff member and calculate stats
    const tasksByStaff = new Map<number, { total: number; completed: number }>();

    (tasks || []).forEach(task => {
      if (!task.assigned_staff_id) return;

      const stats = tasksByStaff.get(task.assigned_staff_id) || { total: 0, completed: 0 };
      stats.total++;
      if (task.status === 'completed') {
        stats.completed++;
      }
      tasksByStaff.set(task.assigned_staff_id, stats);
    });

    // Build result array - only include staff who have been assigned tasks
    const result: StaffTaskStats[] = [];

    staff.forEach(s => {
      const stats = tasksByStaff.get(s.id);
      if (stats && stats.total > 0) {
        const completionPercentage = Math.round((stats.completed / stats.total) * 1000) / 10; // Round to 1 decimal
        result.push({
          staffId: s.id,
          staffName: `${s.first_name} ${s.last_name}`,
          totalTasks: stats.total,
          completedTasks: stats.completed,
          completionPercentage,
        });
      }
    });

    return result;
  }

  /**
   * Get task statistics by origin department
   * Shows percentage of tasks originating from each department
   */
  async getDepartmentTaskStats(): Promise<DepartmentTaskStats[]> {
    // Fetch all active departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (deptError) {
      throw new Error(`Failed to fetch departments: ${deptError.message}`);
    }

    if (!departments || departments.length === 0) {
      return [];
    }

    // Fetch all tasks originating from departments
    const departmentIds = departments.map(d => d.id);
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, origin_area_id, origin_area_type, status')
      .eq('origin_area_type', 'department')
      .in('origin_area_id', departmentIds);

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    // Group tasks by department and calculate stats
    const tasksByDept = new Map<number, { total: number; completed: number }>();

    (tasks || []).forEach(task => {
      if (!task.origin_area_id) return;

      const stats = tasksByDept.get(task.origin_area_id) || { total: 0, completed: 0 };
      stats.total++;
      if (task.status === 'completed') {
        stats.completed++;
      }
      tasksByDept.set(task.origin_area_id, stats);
    });

    // Build result array - only include departments that have tasks
    const result: DepartmentTaskStats[] = [];

    departments.forEach(d => {
      const stats = tasksByDept.get(d.id);
      if (stats && stats.total > 0) {
        const completionPercentage = Math.round((stats.completed / stats.total) * 1000) / 10; // Round to 1 decimal
        result.push({
          departmentId: d.id,
          departmentName: d.name,
          totalTasks: stats.total,
          completionPercentage,
        });
      }
    });

    // Sort by total tasks descending, then by name
    result.sort((a, b) => {
      if (b.totalTasks !== a.totalTasks) {
        return b.totalTasks - a.totalTasks;
      }
      return a.departmentName.localeCompare(b.departmentName);
    });

    return result;
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

