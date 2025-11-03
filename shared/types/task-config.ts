/**
 * Task Configuration Types
 * Defines types for the configurable task management system
 */

// ============================================================================
// Core Interfaces
// ============================================================================

export interface TaskType {
  id: number;
  name: string;  // e.g., "patient-transfer" (URL-safe identifier)
  label: string;  // e.g., "Patient Transfer" (display name)
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskItem {
  id: number;
  taskTypeId: number;
  name: string;  // e.g., "Bed", "Chair", "Trolley"
  defaultOriginAreaId: number | null;
  defaultOriginAreaType: 'department' | 'service' | null;
  defaultDestinationAreaId: number | null;
  defaultDestinationAreaType: 'department' | 'service' | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTypeDepartment {
  id: number;
  taskTypeId: number;
  departmentId: number;
  createdAt: string;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

export interface TaskTypeWithItems extends TaskType {
  items: TaskItem[];
  departmentIds: number[];  // Array of linked department IDs
}

export interface TaskItemWithAreas extends TaskItem {
  defaultOriginArea?: {
    id: number;
    name: string;
    type: 'department' | 'service';
  };
  defaultDestinationArea?: {
    id: number;
    name: string;
    type: 'department' | 'service';
  };
}

// ============================================================================
// Input Types for Create/Update Operations
// ============================================================================

export interface CreateTaskTypeInput {
  name: string;
  label: string;
  description?: string | null;
}

export interface UpdateTaskTypeInput {
  name?: string;
  label?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateTaskItemInput {
  taskTypeId: number;
  name: string;
  defaultOriginAreaId?: number | null;
  defaultOriginAreaType?: 'department' | 'service' | null;
  defaultDestinationAreaId?: number | null;
  defaultDestinationAreaType?: 'department' | 'service' | null;
}

export interface UpdateTaskItemInput {
  name?: string;
  defaultOriginAreaId?: number | null;
  defaultOriginAreaType?: 'department' | 'service' | null;
  defaultDestinationAreaId?: number | null;
  defaultDestinationAreaType?: 'department' | 'service' | null;
  isActive?: boolean;
}

// ============================================================================
// Helper Types
// ============================================================================

export interface AreaReference {
  id: number;
  name: string;
  type: 'department' | 'service';
}

