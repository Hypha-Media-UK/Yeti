/**
 * Reports Types
 * Defines types for the reports/analytics system
 */

// Staff task completion statistics
export interface StaffTaskStats {
  staffId: number;
  staffName: string;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}

// Department task statistics (by origin)
export interface DepartmentTaskStats {
  departmentId: number;
  departmentName: string;
  totalTasks: number;
  completionPercentage: number;
}

// Overall reports response
export interface TaskReportsData {
  staffStats: StaffTaskStats[];
  departmentStats: DepartmentTaskStats[];
}

