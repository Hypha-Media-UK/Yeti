/**
 * Task Management Types
 * Defines types for the task management system
 */

// Task type enum - matches database enum
export type TaskType = 
  | 'patient-transfer'
  | 'samples'
  | 'asset-move'
  | 'gases'
  | 'service';

// Task status enum - matches database enum
export type TaskStatus = 
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'cancelled';

// Area type enum - matches database enum
export type AreaType = 'department' | 'service';

// Task detail options for each task type
export type TaskDetail = {
  'patient-transfer': 'Bed' | 'Chair' | 'Trolley';
  'samples': 'Blood' | 'Other';
  'asset-move': 'Complete Bed' | 'Bed Frame' | 'Mattress';
  'gases': 'F Size Oxygen' | 'E Size Oxygen' | 'D Size Oxygen' | 'E Size CO2';
  'service': 'Equinox Change' | 'Nitrus Change' | 'Notes Conveyed' | 'Bed Pans' | "MU's";
};

// Main Task interface
export interface Task {
  id: number;
  originAreaId: number;
  originAreaType: AreaType;
  destinationAreaId: number;
  destinationAreaType: AreaType;
  taskType: TaskType;
  taskDetail: string; // Deprecated - kept for backward compatibility
  taskItemId: number | null; // New - references task_items table
  requestedTime: string; // HH:MM format
  allocatedTime: string; // HH:MM format
  completedTime: string | null; // HH:MM format
  assignedStaffId: number | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

// Task with populated relationships
export interface TaskWithRelations extends Task {
  originArea?: {
    id: number;
    name: string;
    type: AreaType;
  };
  destinationArea?: {
    id: number;
    name: string;
    type: AreaType;
  };
  assignedStaff?: {
    id: number;
    firstName: string;
    lastName: string;
    status: string;
  };
}

// Task creation input (omits auto-generated fields)
export interface CreateTaskInput {
  originAreaId: number;
  originAreaType: AreaType;
  destinationAreaId: number;
  destinationAreaType: AreaType;
  taskType: TaskType;
  taskDetail: string; // Deprecated - kept for backward compatibility
  taskItemId?: number | null; // New - references task_items table
  requestedTime: string;
  allocatedTime: string;
  completedTime?: string | null;
  assignedStaffId?: number | null;
  status?: TaskStatus;
}

// Task update input (all fields optional except id)
export interface UpdateTaskInput {
  taskType?: TaskType;
  taskDetail?: string;
  requestedTime?: string;
  allocatedTime?: string;
  completedTime?: string | null;
  assignedStaffId?: number | null;
  status?: TaskStatus;
}

// Constants for task type labels and details
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  'patient-transfer': 'Patient Transfer',
  'samples': 'Samples',
  'asset-move': 'Asset Move',
  'gases': 'Gases',
  'service': 'Service',
};

export const TASK_DETAIL_OPTIONS: Record<TaskType, readonly string[]> = {
  'patient-transfer': ['Bed', 'Chair', 'Trolley'] as const,
  'samples': ['Blood', 'Other'] as const,
  'asset-move': ['Complete Bed', 'Bed Frame', 'Mattress'] as const,
  'gases': ['F Size Oxygen', 'E Size Oxygen', 'D Size Oxygen', 'E Size CO2'] as const,
  'service': ['Equinox Change', 'Nitrus Change', 'Notes Conveyed', 'Bed Pans', "MU's"] as const,
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'pending': 'Pending',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'cancelled': 'Cancelled',
};

// Helper type to get task detail options for a specific task type
export type TaskDetailForType<T extends TaskType> = TaskDetail[T];

// Filter options for task queries
export interface TaskFilterOptions {
  status?: TaskStatus | TaskStatus[];
  taskType?: TaskType | TaskType[];
  assignedStaffId?: number;
  originAreaId?: number;
  originAreaType?: AreaType;
  destinationAreaId?: number;
  destinationAreaType?: AreaType;
  fromDate?: string;
  toDate?: string;
}

