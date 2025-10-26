export interface Service {
  id: number;
  name: string;
  description: string | null;
  includeInMainRota: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

