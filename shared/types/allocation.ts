export type AreaType = 'department' | 'service';

export interface StaffAllocation {
  id: number;
  staffId: number;
  areaType: AreaType;
  areaId: number;
  createdAt: string;
  updatedAt: string;
}

export interface AllocationWithDetails extends StaffAllocation {
  areaName: string;
  buildingId?: number;
  buildingName?: string;
}

