<template>
  <BaseModal v-model="isOpen" :title="building.name" modal-class="building-modal">
    <div>
      <!-- Building Edit Section -->
      <div class="building-edit-section">
        <h3 class="section-title">Building Details</h3>
        <div class="form-group">
          <label for="buildingName" class="form-label">Building Name *</label>
          <input
            id="buildingName"
            v-model="buildingName"
            type="text"
            class="form-input"
            required
          />
        </div>
      </div>

    <!-- Departments Section -->
    <div class="departments-section">
      <div class="section-header">
        <h3 class="section-title">Departments</h3>
        <button class="btn btn-sm btn-primary" @click="startAddingDepartment">
          + Add Department
        </button>
      </div>

      <!-- Add Department Form -->
      <form v-if="isAddingDepartment" @submit.prevent="handleAddDepartment" class="department-form">
        <input
          v-model="newDepartmentName"
          type="text"
          class="form-input"
          placeholder="Department name"
          required
          ref="newDepartmentInput"
        />
        <div class="form-actions-inline">
          <button type="submit" class="btn btn-sm btn-primary" :disabled="savingDepartment">
            {{ savingDepartment ? 'Adding...' : 'Add' }}
          </button>
          <button type="button" class="btn btn-sm btn-secondary" @click="cancelAddingDepartment">
            Cancel
          </button>
        </div>
      </form>

      <!-- Departments List -->
      <div v-if="departments.length > 0" class="departments-list">
        <div
          v-for="dept in departments"
          :key="dept.id"
          class="department-accordion"
        >
          <!-- Department Header -->
          <div class="department-header">
            <span class="department-name">{{ dept.name }}</span>
            <div class="department-actions">
              <button class="btn-icon" @click="toggleDepartment(dept.id)" :title="expandedDepartmentId === dept.id ? 'Collapse' : 'Edit'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button class="btn-icon btn-danger" @click="handleDeleteDepartment(dept)" title="Delete">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Department Edit Form (Accordion Content) -->
          <div v-if="expandedDepartmentId === dept.id" class="department-content">
            <div class="form-group">
              <label class="form-label">Department Name *</label>
              <input
                v-model="editingDepartmentName"
                type="text"
                class="form-input"
                @keyup.enter="handleUpdateDepartment(dept.id)"
              />
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="editingIncludeInMainRota"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span>Include in Main Rota</span>
              </label>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="editingIs24_7"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span>Operates 24/7/365</span>
              </label>
              <p class="form-hint">When enabled, operational hours are not required</p>
            </div>

            <div v-if="!editingIs24_7" class="form-group">
              <OperationalHoursEditor
                v-model="editingOperationalHours"
                title="Operational Hours"
                :show-copy-from="false"
              />
            </div>

            <!-- Minimum Staffing Requirements -->
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="editingRequiresMinimumStaffing"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span>Requires Minimum Staffing</span>
              </label>
              <p class="form-hint">When enabled, this department will be flagged if understaffed</p>
            </div>

            <div v-if="editingRequiresMinimumStaffing" class="form-group">
              <StaffingRequirementsEditor
                v-model="editingStaffingRequirements"
              />
            </div>

            <div class="form-actions">
              <button class="btn btn-sm btn-primary" @click="handleUpdateDepartment(dept.id)">
                Save Changes
              </button>
              <button class="btn btn-sm btn-secondary" @click="cancelEditingDepartment">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="empty-state">No departments</p>
    </div>
    </div>

    <template #footer>
      <button class="btn btn-primary" @click="handleUpdateBuilding" :disabled="savingBuilding || !buildingName.trim()">
        {{ savingBuilding ? 'Saving...' : 'Update Building' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import BaseModal from './BaseModal.vue';
import OperationalHoursEditor from './OperationalHoursEditor.vue';
import StaffingRequirementsEditor from './StaffingRequirementsEditor.vue';
import { api } from '../services/api';
import type { Building } from '@shared/types/building';
import type { Department } from '@shared/types/department';

interface HoursEntry {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface StaffingRequirement {
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  requiredStaff: number;
}

interface Props {
  modelValue: boolean;
  building: Building;
  departments: Department[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updateBuilding': [id: number, name: string];
  'addDepartment': [buildingId: number, name: string];
  'updateDepartment': [id: number, name: string, includeInMainRota: boolean, is24_7: boolean, operationalHours: HoursEntry[], requiresMinimumStaffing: boolean, staffingRequirements: StaffingRequirement[]];
  'deleteDepartment': [department: Department];
}>();

const isOpen = ref(props.modelValue);
const buildingName = ref(props.building.name);
const savingBuilding = ref(false);

const isAddingDepartment = ref(false);
const newDepartmentName = ref('');
const newDepartmentInput = ref<HTMLInputElement | null>(null);
const savingDepartment = ref(false);

const expandedDepartmentId = ref<number | null>(null);
const editingDepartmentName = ref('');
const editingIncludeInMainRota = ref(false);
const editingIs24_7 = ref(false);
const editingOperationalHours = ref<HoursEntry[]>([]);
const editingRequiresMinimumStaffing = ref(false);
const editingStaffingRequirements = ref<StaffingRequirement[]>([]);

watch(() => props.modelValue, (value) => {
  isOpen.value = value;
  if (value) {
    buildingName.value = props.building.name;
  }
});

watch(isOpen, (value) => {
  emit('update:modelValue', value);
});

const handleUpdateBuilding = () => {
  if (buildingName.value.trim()) {
    savingBuilding.value = true;
    emit('updateBuilding', props.building.id, buildingName.value.trim());
    savingBuilding.value = false;
  }
};

const startAddingDepartment = async () => {
  isAddingDepartment.value = true;
  await nextTick();
  newDepartmentInput.value?.focus();
};

const cancelAddingDepartment = () => {
  isAddingDepartment.value = false;
  newDepartmentName.value = '';
};

const handleAddDepartment = () => {
  if (newDepartmentName.value.trim()) {
    savingDepartment.value = true;
    emit('addDepartment', props.building.id, newDepartmentName.value.trim());
    newDepartmentName.value = '';
    isAddingDepartment.value = false;
    savingDepartment.value = false;
  }
};

const toggleDepartment = async (deptId: number) => {
  if (expandedDepartmentId.value === deptId) {
    // Collapse
    expandedDepartmentId.value = null;
    editingDepartmentName.value = '';
    editingIncludeInMainRota.value = false;
    editingIs24_7.value = false;
    editingOperationalHours.value = [];
    editingRequiresMinimumStaffing.value = false;
    editingStaffingRequirements.value = [];
  } else {
    // Expand and load data
    expandedDepartmentId.value = deptId;
    const dept = props.departments.find(d => d.id === deptId);
    if (dept) {
      editingDepartmentName.value = dept.name;
      editingIncludeInMainRota.value = Boolean(dept.includeInMainRota);
      editingIs24_7.value = Boolean(dept.is24_7);
      editingRequiresMinimumStaffing.value = Boolean(dept.requiresMinimumStaffing);

      // Load operational hours
      try {
        const response = await api.getOperationalHoursByArea('department', deptId);
        editingOperationalHours.value = response.operationalHours.map(h => ({
          id: h.id,
          dayOfWeek: h.dayOfWeek,
          startTime: h.startTime.substring(0, 5), // Convert "HH:mm:ss" to "HH:mm"
          endTime: h.endTime.substring(0, 5),
        }));
      } catch (error) {
        console.error('Failed to load operational hours:', error);
        editingOperationalHours.value = [];
      }

      // Load staffing requirements
      if (dept.requiresMinimumStaffing) {
        try {
          const response = await api.getStaffingRequirements('department', deptId);
          editingStaffingRequirements.value = response.requirements.map((r: any) => ({
            dayOfWeek: r.dayOfWeek,
            timeStart: r.timeStart.substring(0, 5),
            timeEnd: r.timeEnd.substring(0, 5),
            requiredStaff: r.requiredStaff,
          }));
        } catch (error) {
          console.error('Failed to load staffing requirements:', error);
          editingStaffingRequirements.value = [];
        }
      } else {
        editingStaffingRequirements.value = [];
      }
    }
  }
};

const cancelEditingDepartment = () => {
  expandedDepartmentId.value = null;
  editingDepartmentName.value = '';
  editingIncludeInMainRota.value = false;
  editingIs24_7.value = false;
  editingOperationalHours.value = [];
  editingRequiresMinimumStaffing.value = false;
  editingStaffingRequirements.value = [];
};

const handleUpdateDepartment = (id: number) => {
  if (editingDepartmentName.value.trim()) {
    emit('updateDepartment', id, editingDepartmentName.value.trim(), editingIncludeInMainRota.value, editingIs24_7.value, editingOperationalHours.value, editingRequiresMinimumStaffing.value, editingStaffingRequirements.value);
    expandedDepartmentId.value = null;
    editingDepartmentName.value = '';
    editingIncludeInMainRota.value = false;
    editingIs24_7.value = false;
    editingOperationalHours.value = [];
    editingRequiresMinimumStaffing.value = false;
    editingStaffingRequirements.value = [];
  }
};



const handleDeleteDepartment = (dept: Department) => {
  emit('deleteDepartment', dept);
};
</script>

<style scoped>
.building-edit-section {
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--spacing-3);
}

.section-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.building-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
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

.departments-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.department-form {
  display: flex;
  gap: var(--spacing-2);
  align-items: flex-start;
}

.form-actions-inline {
  display: flex;
  gap: var(--spacing-1);
}

.departments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.department-accordion {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  overflow: hidden;
}

.department-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2);
  background-color: var(--color-bg);
  gap: var(--spacing-2);
}

.department-name {
  flex: 1;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.department-actions {
  display: flex;
  gap: var(--spacing-1);
}

.department-content {
  padding: var(--spacing-3);
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
}

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
  padding: var(--spacing-3);
  margin: 0;
}

/* Component-specific button styles (btn-sm and btn-icon not in global styles) */
.btn-sm {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-body-sm);
}

.btn-icon {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-button);
  transition: var(--transition-base);
}

.btn-icon:hover {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

.btn-icon.btn-danger:hover {
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
}
</style>

<!-- Unscoped button styles -->
<style>
.building-modal .btn {
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

.building-modal .btn:hover:not(:disabled) {
  box-shadow: var(--shadow-low);
}

.building-modal .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.building-modal .btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.building-modal .btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.building-modal .btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.building-modal .btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg);
  border-color: var(--color-text-secondary);
}
</style>

