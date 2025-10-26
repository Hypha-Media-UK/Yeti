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
          class="department-item"
        >
          <template v-if="editingDepartmentId === dept.id">
            <input
              v-model="editingDepartmentName"
              type="text"
              class="form-input"
              @keyup.enter="handleUpdateDepartment(dept.id)"
              @keyup.esc="cancelEditingDepartment"
              ref="editDepartmentInput"
            />
            <div class="department-actions">
              <button class="btn-icon" @click="handleUpdateDepartment(dept.id)" title="Save">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button class="btn-icon" @click="cancelEditingDepartment" title="Cancel">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </template>
          <template v-else>
            <span class="department-name">{{ dept.name }}</span>
            <div class="department-actions">
              <button class="btn-icon" @click="startEditingDepartment(dept)" title="Edit">
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
          </template>
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
import type { Building } from '@shared/types/building';
import type { Department } from '@shared/types/department';

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
  'updateDepartment': [id: number, name: string];
  'deleteDepartment': [department: Department];
}>();

const isOpen = ref(props.modelValue);
const buildingName = ref(props.building.name);
const savingBuilding = ref(false);

const isAddingDepartment = ref(false);
const newDepartmentName = ref('');
const newDepartmentInput = ref<HTMLInputElement | null>(null);
const savingDepartment = ref(false);

const editingDepartmentId = ref<number | null>(null);
const editingDepartmentName = ref('');
const editDepartmentInput = ref<HTMLInputElement | null>(null);

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

const startEditingDepartment = async (dept: Department) => {
  editingDepartmentId.value = dept.id;
  editingDepartmentName.value = dept.name;
  await nextTick();
  editDepartmentInput.value?.focus();
};

const cancelEditingDepartment = () => {
  editingDepartmentId.value = null;
  editingDepartmentName.value = '';
};

const handleUpdateDepartment = (id: number) => {
  if (editingDepartmentName.value.trim()) {
    emit('updateDepartment', id, editingDepartmentName.value.trim());
    editingDepartmentId.value = null;
    editingDepartmentName.value = '';
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
  gap: var(--spacing-1);
}

.department-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2);
  background-color: var(--color-bg);
  border-radius: var(--radius-button);
  gap: var(--spacing-2);
}

.department-name {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.department-actions {
  display: flex;
  gap: var(--spacing-1);
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

