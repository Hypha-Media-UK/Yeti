<template>
  <div class="config-view">
    <div class="container">
      <h1 class="page-title">Configuration</h1>

      <BaseTabs v-model="activeTab" :tabs="tabs">
        <!-- Staff Tab -->
        <div v-if="activeTab === 'staff'" class="tab-content">
          <BaseTabs v-model="activeStaffTab" :tabs="staffTabs">
            <!-- Regular Staff -->
            <div v-if="activeStaffTab === 'regular'" class="staff-section">
              <div class="section-header">
                <h2 class="section-title">Regular Staff</h2>
                <button class="btn btn-primary" @click="openAddStaffModal('Regular')">
                  + Add Staff
                </button>
              </div>
              <div v-if="regularStaff.length > 0" class="staff-grid">
                <StaffManagementCard
                  v-for="staff in regularStaff"
                  :key="staff.id"
                  :staff="staff"
                  @edit="openEditStaffModal"
                  @delete="confirmDeleteStaff"
                />
              </div>
              <p v-else class="empty-state">No staff</p>
            </div>

            <!-- Relief Staff -->
            <div v-if="activeStaffTab === 'relief'" class="staff-section">
              <div class="section-header">
                <h2 class="section-title">Relief Staff</h2>
                <button class="btn btn-primary" @click="openAddStaffModal('Relief')">
                  + Add Staff
                </button>
              </div>
              <div v-if="reliefStaff.length > 0" class="staff-grid">
                <StaffManagementCard
                  v-for="staff in reliefStaff"
                  :key="staff.id"
                  :staff="staff"
                  @edit="openEditStaffModal"
                  @delete="confirmDeleteStaff"
                />
              </div>
              <p v-else class="empty-state">No staff</p>
            </div>

            <!-- Supervisors -->
            <div v-if="activeStaffTab === 'supervisors'" class="staff-section">
              <div class="section-header">
                <h2 class="section-title">Supervisors</h2>
                <button class="btn btn-primary" @click="openAddStaffModal('Supervisor')">
                  + Add Staff
                </button>
              </div>
              <div v-if="supervisorStaff.length > 0" class="staff-grid">
                <StaffManagementCard
                  v-for="staff in supervisorStaff"
                  :key="staff.id"
                  :staff="staff"
                  @edit="openEditStaffModal"
                  @delete="confirmDeleteStaff"
                />
              </div>
              <p v-else class="empty-state">No staff</p>
            </div>

            <!-- Inactive Staff -->
            <div v-if="activeStaffTab === 'inactive'" class="staff-section">
              <h2 class="section-title">Inactive Staff</h2>
              <div v-if="inactiveStaff.length > 0" class="staff-grid">
                <StaffManagementCard
                  v-for="staff in inactiveStaff"
                  :key="staff.id"
                  :staff="staff"
                  @edit="openEditStaffModal"
                  @delete="confirmDeleteStaff"
                />
              </div>
              <p v-else class="empty-state">No inactive staff</p>
            </div>
          </BaseTabs>
        </div>

        <!-- Locations Tab -->
        <div v-if="activeTab === 'locations'" class="tab-content">
          <div class="section-header">
            <h2 class="section-title">Buildings</h2>
            <button class="btn btn-primary" @click="openAddBuildingModal">
              + Add Building
            </button>
          </div>
          <div v-if="buildings.length > 0" class="buildings-grid">
            <BuildingCard
              v-for="building in buildings"
              :key="building.id"
              :building="building"
              :department-count="getDepartmentCount(building.id)"
              @click="openBuildingModal"
              @delete="confirmDeleteBuilding"
            />
          </div>
          <p v-else class="empty-state">No buildings</p>
        </div>

        <!-- Services Tab -->
        <div v-if="activeTab === 'services'" class="tab-content">
          <div class="section-header">
            <h2 class="section-title">Services</h2>
            <button class="btn btn-primary" @click="openAddServiceModal">
              + Add Service
            </button>
          </div>
          <div v-if="services.length > 0" class="services-grid">
            <ServiceCard
              v-for="service in services"
              :key="service.id"
              :service="service"
              @edit="openEditServiceModal"
              @delete="confirmDeleteService"
            />
          </div>
          <p v-else class="empty-state">No services</p>
        </div>
      </BaseTabs>
    </div>

    <!-- Staff Modal -->
    <BaseModal v-model="showStaffModal" :title="editingStaff ? 'Edit Staff' : 'Add Staff'" modal-class="staff-form">
      <StaffForm
        :staff="editingStaff"
        :staff-allocations="editingStaffAllocations"
        :buildings="buildings"
        :departments="departments"
        :services="services"
        @submit="handleStaffSubmit"
        @cancel="closeStaffModal"
      />
    </BaseModal>

    <!-- Building Modal -->
    <BuildingModal
      v-if="selectedBuilding"
      v-model="showBuildingModal"
      :building="selectedBuilding"
      :departments="getBuildingDepartments(selectedBuilding.id)"
      @updateBuilding="handleUpdateBuilding"
      @addDepartment="handleAddDepartment"
      @updateDepartment="handleUpdateDepartment"
      @deleteDepartment="confirmDeleteDepartment"
    />

    <!-- Add Building Modal -->
    <BaseModal v-model="showAddBuildingModal" title="Add Building" modal-class="config-view">
      <form @submit.prevent="handleAddBuilding">
        <div class="form-group">
          <label for="buildingName" class="form-label">Building Name *</label>
          <input
            id="buildingName"
            v-model="newBuildingName"
            type="text"
            class="form-input"
            required
          />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="showAddBuildingModal = false">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Service Modal -->
    <ServiceModal
      v-model="showServiceModal"
      :service="editingService"
      @submit="handleServiceSubmit"
    />

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      :title="deleteConfirmTitle"
      :message="deleteConfirmMessage"
      confirm-text="Delete"
      cancel-text="Cancel"
      danger-mode
      @confirm="handleDeleteConfirm"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/services/api';
import BaseTabs, { type Tab } from '@/components/BaseTabs.vue';
import BaseModal from '@/components/BaseModal.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import StaffForm from '@/components/StaffForm.vue';
import StaffManagementCard from '@/components/StaffManagementCard.vue';
import BuildingCard from '@/components/BuildingCard.vue';
import BuildingModal from '@/components/BuildingModal.vue';
import ServiceCard from '@/components/ServiceCard.vue';
import ServiceModal from '@/components/ServiceModal.vue';
import type { StaffMember, StaffStatus } from '@shared/types/staff';
import type { Building } from '@shared/types/building';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';
import type { AllocationWithDetails } from '@shared/types/allocation';
import { deduplicateHours } from '@/utils/hours';

const activeTab = ref('staff');
const activeStaffTab = ref('regular');

const allStaff = ref<StaffMember[]>([]);
const buildings = ref<Building[]>([]);
const departments = ref<Department[]>([]);
const services = ref<Service[]>([]);

const showStaffModal = ref(false);
const editingStaff = ref<StaffMember | null>(null);
const editingStaffAllocations = ref<AllocationWithDetails[]>([]);
const defaultStaffStatus = ref<StaffStatus>('Regular');

const showBuildingModal = ref(false);
const selectedBuilding = ref<Building | null>(null);

const showAddBuildingModal = ref(false);
const newBuildingName = ref('');

const showServiceModal = ref(false);
const editingService = ref<Service | null>(null);

const showDeleteConfirm = ref(false);
const deleteConfirmTitle = ref('');
const deleteConfirmMessage = ref('');
const deleteTarget = ref<any>(null);
const deleteType = ref<'staff' | 'building' | 'department' | 'service'>('staff');

// Computed
const tabs = computed<Tab[]>(() => [
  { label: 'Staff', value: 'staff' },
  { label: 'Locations', value: 'locations' },
  { label: 'Services', value: 'services' },
]);

const regularStaff = computed(() => allStaff.value.filter(s => s.status === 'Regular' && s.isActive));
const reliefStaff = computed(() => allStaff.value.filter(s => s.status === 'Relief' && s.isActive));
const supervisorStaff = computed(() => allStaff.value.filter(s => s.status === 'Supervisor' && s.isActive));
const inactiveStaff = computed(() => allStaff.value.filter(s => !s.isActive));

const staffTabs = computed<Tab[]>(() => [
  { label: 'Regular', value: 'regular', count: regularStaff.value.length },
  { label: 'Relief', value: 'relief', count: reliefStaff.value.length },
  { label: 'Supervisors', value: 'supervisors', count: supervisorStaff.value.length },
  { label: 'Inactive', value: 'inactive', count: inactiveStaff.value.length },
]);

const getDepartmentCount = (buildingId: number) => {
  return departments.value.filter(d => d.buildingId === buildingId).length;
};

const getBuildingDepartments = (buildingId: number) => {
  return departments.value.filter(d => d.buildingId === buildingId);
};

// Load data
const loadStaff = async () => {
  try {
    const response = await api.getAllStaff({ includeInactive: true });
    allStaff.value = response.staff;
  } catch (error) {
    console.error('Failed to load staff:', error);
  }
};

const loadBuildings = async () => {
  try {
    const response = await api.getAllBuildings();
    buildings.value = response.buildings;
  } catch (error) {
    console.error('Failed to load buildings:', error);
  }
};

const loadDepartments = async () => {
  try {
    const response = await api.getAllDepartments();
    departments.value = response.departments;
  } catch (error) {
    console.error('Failed to load departments:', error);
  }
};

const loadServices = async () => {
  try {
    const response = await api.getAllServices();
    services.value = response.services;
  } catch (error) {
    console.error('Failed to load services:', error);
  }
};

// Staff handlers
const openAddStaffModal = (status: StaffStatus) => {
  editingStaff.value = null;
  editingStaffAllocations.value = [];
  defaultStaffStatus.value = status;
  showStaffModal.value = true;
};

const openEditStaffModal = async (staff: StaffMember) => {
  editingStaff.value = staff;

  // Load allocations for this staff member
  try {
    const response = await api.getStaffAllocations(staff.id);
    editingStaffAllocations.value = response.allocations;
  } catch (error) {
    console.error('Failed to load staff allocations:', error);
    editingStaffAllocations.value = [];
  }

  showStaffModal.value = true;
};

const closeStaffModal = () => {
  showStaffModal.value = false;
  editingStaff.value = null;
  editingStaffAllocations.value = [];
};

const handleStaffSubmit = async (data: {
  staff: Partial<StaffMember>;
  allocations: Array<{ areaType: 'department' | 'service'; areaId: number }>;
  contractedHours: Array<{ id?: number; dayOfWeek: number; startTime: string; endTime: string }>;
}) => {
  try {
    let staffId: number;

    if (editingStaff.value) {
      // Update existing staff
      await api.updateStaff(editingStaff.value.id, data.staff);
      staffId = editingStaff.value.id;
    } else {
      // Create new staff
      const response = await api.createStaff(data.staff as any);
      staffId = response.staff.id;
    }

    // Update allocations
    await api.setStaffAllocations(staffId, data.allocations);

    // Update contracted hours - deduplicate first
    const hoursToSave = data.contractedHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    const uniqueHours = deduplicateHours(hoursToSave);
    await api.setContractedHoursForStaff(staffId, uniqueHours);

    await loadStaff();
    closeStaffModal();
  } catch (error) {
    console.error('Failed to save staff:', error);
  }
};

const confirmDeleteStaff = (staff: StaffMember) => {
  deleteTarget.value = staff;
  deleteType.value = 'staff';
  deleteConfirmTitle.value = 'Delete Staff Member';
  deleteConfirmMessage.value = `Are you sure you want to delete ${staff.firstName} ${staff.lastName}? This will soft-delete the staff member.`;
  showDeleteConfirm.value = true;
};

// Building handlers
const openAddBuildingModal = () => {
  newBuildingName.value = '';
  showAddBuildingModal.value = true;
};

const handleAddBuilding = async () => {
  try {
    await api.createBuilding({ name: newBuildingName.value.trim() });
    await loadBuildings();
    showAddBuildingModal.value = false;
  } catch (error) {
    console.error('Failed to create building:', error);
  }
};

const openBuildingModal = (building: Building) => {
  selectedBuilding.value = building;
  showBuildingModal.value = true;
};

const handleUpdateBuilding = async (id: number, name: string) => {
  try {
    await api.updateBuilding(id, { name });
    await loadBuildings();
    if (selectedBuilding.value && selectedBuilding.value.id === id) {
      selectedBuilding.value.name = name;
    }
    showBuildingModal.value = false;
  } catch (error) {
    console.error('Failed to update building:', error);
  }
};

const confirmDeleteBuilding = (building: Building) => {
  deleteTarget.value = building;
  deleteType.value = 'building';
  deleteConfirmTitle.value = 'Delete Building';
  deleteConfirmMessage.value = `Are you sure you want to delete ${building.name}? This will also affect all departments in this building.`;
  showDeleteConfirm.value = true;
};

// Department handlers
const handleAddDepartment = async (buildingId: number, name: string) => {
  try {
    await api.createDepartment({ name, buildingId });
    await loadDepartments();
  } catch (error) {
    console.error('Failed to create department:', error);
  }
};

const handleUpdateDepartment = async (
  id: number,
  name: string,
  includeInMainRota: boolean,
  operationalHours: Array<{ id?: number; dayOfWeek: number; startTime: string; endTime: string }>
) => {
  try {
    // Update department basic info
    await api.updateDepartment(id, { name, includeInMainRota });

    // Update operational hours - deduplicate first
    const hoursToSave = operationalHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    const uniqueHours = deduplicateHours(hoursToSave);
    await api.setOperationalHoursForArea('department', id, uniqueHours);

    await loadDepartments();
  } catch (error) {
    console.error('Failed to update department:', error);
  }
};

const confirmDeleteDepartment = (department: Department) => {
  deleteTarget.value = department;
  deleteType.value = 'department';
  deleteConfirmTitle.value = 'Delete Department';
  deleteConfirmMessage.value = `Are you sure you want to delete ${department.name}?`;
  showDeleteConfirm.value = true;
};

// Service handlers
const openAddServiceModal = () => {
  editingService.value = null;
  showServiceModal.value = true;
};

const openEditServiceModal = (service: Service) => {
  editingService.value = service;
  showServiceModal.value = true;
};

const handleServiceSubmit = async (data: {
  name: string;
  description: string | null;
  includeInMainRota: boolean;
  operationalHours: Array<{ id?: number; dayOfWeek: number; startTime: string; endTime: string }>;
}) => {
  try {
    let serviceId: number;

    if (editingService.value) {
      await api.updateService(editingService.value.id, {
        name: data.name,
        description: data.description,
        includeInMainRota: data.includeInMainRota,
      });
      serviceId = editingService.value.id;
    } else {
      const response = await api.createService({
        name: data.name,
        description: data.description,
        includeInMainRota: data.includeInMainRota,
      });
      serviceId = response.service.id;
    }

    // Update operational hours - deduplicate first
    const hoursToSave = data.operationalHours.map(h => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
    }));

    const uniqueHours = deduplicateHours(hoursToSave);
    await api.setOperationalHoursForArea('service', serviceId, uniqueHours);

    await loadServices();
    showServiceModal.value = false;
  } catch (error) {
    console.error('Failed to save service:', error);
  }
};

const confirmDeleteService = (service: Service) => {
  deleteTarget.value = service;
  deleteType.value = 'service';
  deleteConfirmTitle.value = 'Delete Service';
  deleteConfirmMessage.value = `Are you sure you want to delete ${service.name}?`;
  showDeleteConfirm.value = true;
};

// Delete confirmation
const handleDeleteConfirm = async () => {
  try {
    if (deleteType.value === 'staff') {
      await api.deleteStaff(deleteTarget.value.id);
      await loadStaff();
    } else if (deleteType.value === 'building') {
      await api.deleteBuilding(deleteTarget.value.id);
      await loadBuildings();
      showBuildingModal.value = false;
    } else if (deleteType.value === 'department') {
      await api.deleteDepartment(deleteTarget.value.id);
      await loadDepartments();
    } else if (deleteType.value === 'service') {
      await api.deleteService(deleteTarget.value.id);
      await loadServices();
    }
  } catch (error) {
    console.error('Failed to delete:', error);
  }
};

const cancelDelete = () => {
  deleteTarget.value = null;
};

onMounted(() => {
  loadStaff();
  loadBuildings();
  loadDepartments();
  loadServices();
});
</script>

<style scoped>
.config-view {
  min-height: 100vh;
  padding: var(--spacing-3) 0;
  background-color: var(--color-bg);
}

.page-title {
  font-size: var(--font-size-headline);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

.tab-content {
  /* Tab content wrapper */
}

.staff-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.section-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-2);
}

.buildings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-3);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-3);
}

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
  padding: var(--spacing-4);
  margin: 0;
}

/* Button styles inherited from global main.css */

.building-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-label {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-input {
  padding: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  transition: var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .staff-grid,
  .buildings-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 600px) {
  .staff-grid,
  .buildings-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>



<!-- Unscoped button styles -->
<style>
.config-view .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1);
  padding: 0.625rem var(--spacing-2);
  font-family: var(--font-family);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border: none;
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: background-color var(--transition-enter),
              box-shadow var(--transition-enter);
  white-space: nowrap;
}

.config-view .btn:hover:not(:disabled) {
  box-shadow: var(--shadow-low);
}

.config-view .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.config-view .btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.config-view .btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.config-view .btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.config-view .btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg);
  border-color: var(--color-text-secondary);
}
</style>