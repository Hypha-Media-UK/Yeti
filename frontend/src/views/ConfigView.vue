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
      </BaseTabs>
    </div>

    <!-- Staff Modal -->
    <BaseModal v-model="showStaffModal" :title="editingStaff ? 'Edit Staff' : 'Add Staff'">
      <StaffForm
        :staff="editingStaff"
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
    <BaseModal v-model="showAddBuildingModal" title="Add Building">
      <form @submit.prevent="handleAddBuilding" class="building-form">
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
import type { StaffMember, StaffStatus } from '@shared/types/staff';
import type { Building } from '@shared/types/building';
import type { Department } from '@shared/types/department';

const activeTab = ref('staff');
const activeStaffTab = ref('regular');

const allStaff = ref<StaffMember[]>([]);
const buildings = ref<Building[]>([]);
const departments = ref<Department[]>([]);

const showStaffModal = ref(false);
const editingStaff = ref<StaffMember | null>(null);
const defaultStaffStatus = ref<StaffStatus>('Regular');

const showBuildingModal = ref(false);
const selectedBuilding = ref<Building | null>(null);

const showAddBuildingModal = ref(false);
const newBuildingName = ref('');

const showDeleteConfirm = ref(false);
const deleteConfirmTitle = ref('');
const deleteConfirmMessage = ref('');
const deleteTarget = ref<any>(null);
const deleteType = ref<'staff' | 'building' | 'department'>('staff');

// Computed
const tabs = computed<Tab[]>(() => [
  { label: 'Staff', value: 'staff' },
  { label: 'Locations', value: 'locations' },
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

// Staff handlers
const openAddStaffModal = (status: StaffStatus) => {
  editingStaff.value = null;
  defaultStaffStatus.value = status;
  showStaffModal.value = true;
};

const openEditStaffModal = (staff: StaffMember) => {
  editingStaff.value = staff;
  showStaffModal.value = true;
};

const closeStaffModal = () => {
  showStaffModal.value = false;
  editingStaff.value = null;
};

const handleStaffSubmit = async (data: Partial<StaffMember>) => {
  try {
    if (editingStaff.value) {
      await api.updateStaff(editingStaff.value.id, data);
    } else {
      await api.createStaff(data as any);
    }
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

const handleUpdateDepartment = async (id: number, name: string) => {
  try {
    await api.updateDepartment(id, { name });
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

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
  padding: var(--spacing-4);
  margin: 0;
}

.btn {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-base);
  border: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

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

