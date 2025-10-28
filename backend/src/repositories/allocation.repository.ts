import { supabase } from '../config/database';
import type { StaffAllocation, AllocationWithDetails, AreaType } from '../../shared/types/allocation';

interface AllocationRow {
  id: number;
  staff_id: number;
  area_type: 'department' | 'service';
  area_id: number;
  created_at: string;
  updated_at: string;
}

export class AllocationRepository {
  private mapRowToAllocation(row: AllocationRow): StaffAllocation {
    return {
      id: row.id,
      staffId: row.staff_id,
      areaType: row.area_type,
      areaId: row.area_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findByStaffId(staffId: number): Promise<AllocationWithDetails[]> {
    const { data, error } = await supabase
      .from('staff_allocations')
      .select('*')
      .eq('staff_id', staffId)
      .order('area_type');

    if (error) {
      throw new Error(`Failed to find allocations: ${error.message}`);
    }

    // Fetch related area details
    const allocationsWithDetails: AllocationWithDetails[] = [];

    for (const row of (data || [])) {
      const allocation = this.mapRowToAllocation(row);
      let areaName = '';
      let buildingId: number | undefined;
      let buildingName: string | undefined;

      if (row.area_type === 'department') {
        const { data: dept } = await supabase
          .from('departments')
          .select('name, building_id, buildings(name)')
          .eq('id', row.area_id)
          .single();

        if (dept) {
          areaName = dept.name;
          buildingId = dept.building_id || undefined;
          buildingName = (dept.buildings as any)?.name || undefined;
        }
      } else if (row.area_type === 'service') {
        const { data: service } = await supabase
          .from('services')
          .select('name')
          .eq('id', row.area_id)
          .single();

        if (service) {
          areaName = service.name;
        }
      }

      allocationsWithDetails.push({
        ...allocation,
        areaName,
        buildingId,
        buildingName
      });
    }

    return allocationsWithDetails;
  }

  async findByArea(areaType: AreaType, areaId: number): Promise<StaffAllocation[]> {
    const { data, error } = await supabase
      .from('staff_allocations')
      .select('*')
      .eq('area_type', areaType)
      .eq('area_id', areaId);

    if (error) {
      throw new Error(`Failed to find allocations by area: ${error.message}`);
    }

    return (data || []).map(row => this.mapRowToAllocation(row));
  }

  async create(staffId: number, areaType: AreaType, areaId: number): Promise<StaffAllocation> {
    const { data, error } = await supabase
      .from('staff_allocations')
      .insert({
        staff_id: staffId,
        area_type: areaType,
        area_id: areaId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create allocation: ${error.message}`);
    }

    return this.mapRowToAllocation(data);
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('staff_allocations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete allocation: ${error.message}`);
    }

    return true;
  }

  async deleteByStaffId(staffId: number): Promise<number> {
    const { data, error } = await supabase
      .from('staff_allocations')
      .delete()
      .eq('staff_id', staffId)
      .select();

    if (error) {
      throw new Error(`Failed to delete allocations by staff: ${error.message}`);
    }

    return (data || []).length;
  }

  async deleteByArea(areaType: AreaType, areaId: number): Promise<number> {
    const { data, error } = await supabase
      .from('staff_allocations')
      .delete()
      .eq('area_type', areaType)
      .eq('area_id', areaId)
      .select();

    if (error) {
      throw new Error(`Failed to delete allocations by area: ${error.message}`);
    }

    return (data || []).length;
  }

  async setAllocationsForStaff(
    staffId: number,
    allocations: Array<{ areaType: AreaType; areaId: number }>
  ): Promise<AllocationWithDetails[]> {
    // Delete existing allocations
    await this.deleteByStaffId(staffId);

    // Create new allocations
    if (allocations.length > 0) {
      const inserts = allocations.map(a => ({
        staff_id: staffId,
        area_type: a.areaType,
        area_id: a.areaId
      }));

      const { error } = await supabase
        .from('staff_allocations')
        .insert(inserts);

      if (error) {
        throw new Error(`Failed to set allocations: ${error.message}`);
      }
    }

    // Return updated allocations with details
    return this.findByStaffId(staffId);
  }

  async exists(staffId: number, areaType: AreaType, areaId: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('staff_allocations')
      .select('id', { count: 'exact', head: true })
      .eq('staff_id', staffId)
      .eq('area_type', areaType)
      .eq('area_id', areaId)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check allocation existence: ${error.message}`);
    }

    return (count || 0) > 0;
  }
}

