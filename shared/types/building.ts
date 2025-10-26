export interface Building {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBuildingDto {
  name: string;
  description?: string | null;
}

export interface UpdateBuildingDto {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

