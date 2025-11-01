export interface Service {
  id: number;
  name: string;
  description: string | null;
  includeInMainRota: boolean;
  is24_7: boolean;
  requiresMinimumStaffing: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

