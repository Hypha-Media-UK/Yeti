<template>
  <BaseModal v-model="isOpen" :title="taskType.label" modal-class="task-type-modal">
    <div class="modal-content">
      <!-- Task Type Edit Section -->
      <div class="task-type-edit-section">
        <h3 class="section-title">Task Type Details</h3>

        <div class="form-group">
          <label for="taskTypeLabel" class="form-label">Label *</label>
          <input
            id="taskTypeLabel"
            v-model="taskTypeLabel"
            type="text"
            class="form-input"
            placeholder="e.g., Patient Transfer"
            required
          />
        </div>

        <div class="form-group">
          <label for="taskTypeDescription" class="form-label">Description</label>
          <textarea
            id="taskTypeDescription"
            v-model="taskTypeDescription"
            class="form-input"
            rows="2"
            placeholder="Optional description"
          />
        </div>

        <!-- Linked Departments -->
        <div class="form-group">
          <label class="form-label">Frequent Requester Departments</label>
          <p class="form-hint">Select departments that commonly request this task type</p>
          <div class="department-checkboxes">
            <label
              v-for="dept in departments"
              :key="dept.id"
              class="checkbox-label"
            >
              <input
                type="checkbox"
                :value="dept.id"
                v-model="linkedDepartmentIds"
                class="checkbox-input"
              />
              <span>{{ dept.name }}</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-primary" @click="saveTaskType">
            Save Task Type
          </button>
        </div>
      </div>

      <!-- Task Items Section -->
      <div class="task-items-section">
        <div class="section-header">
          <h3 class="section-title">Task Items</h3>
          <button class="btn btn-sm btn-primary" @click="startAddingTaskItem">
            + Add Task Item
          </button>
        </div>

        <!-- Add New Task Item Form -->
        <div v-if="isAddingTaskItem" class="task-item-form">
          <div class="form-group">
            <label for="newItemName" class="form-label">Item Name *</label>
            <input
              id="newItemName"
              v-model="newTaskItemName"
              type="text"
              class="form-input"
              placeholder="e.g., Bed"
              required
            />
          </div>

          <!-- Origin Area Selection -->
          <div class="form-group">
            <label class="form-label">Default Origin (Optional)</label>
            <p class="form-hint">Auto-populate origin when this item is selected</p>
            <div class="area-selector">
              <select v-model="newTaskItemOriginType" class="form-input">
                <option :value="null">None</option>
                <option value="department">Department</option>
                <option value="service">Service</option>
              </select>
              <select
                v-if="newTaskItemOriginType"
                v-model="newTaskItemOriginId"
                class="form-input"
              >
                <option :value="null">Select {{ newTaskItemOriginType }}</option>
                <option
                  v-for="area in getAreasForType(newTaskItemOriginType)"
                  :key="area.id"
                  :value="area.id"
                >
                  {{ area.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Destination Area Selection -->
          <div class="form-group">
            <label class="form-label">Default Destination (Optional)</label>
            <p class="form-hint">Auto-populate destination when this item is selected</p>
            <div class="area-selector">
              <select v-model="newTaskItemDestinationType" class="form-input">
                <option :value="null">None</option>
                <option value="department">Department</option>
                <option value="service">Service</option>
              </select>
              <select
                v-if="newTaskItemDestinationType"
                v-model="newTaskItemDestinationId"
                class="form-input"
              >
                <option :value="null">Select {{ newTaskItemDestinationType }}</option>
                <option
                  v-for="area in getAreasForType(newTaskItemDestinationType)"
                  :key="area.id"
                  :value="area.id"
                >
                  {{ area.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-primary" @click="saveNewTaskItem">Save Item</button>
            <button class="btn btn-secondary" @click="cancelAddingTaskItem">Cancel</button>
          </div>
        </div>

        <!-- Task Items List (Accordion) -->
        <div v-if="taskItems.length > 0" class="task-items-list">
          <div
            v-for="item in taskItems"
            :key="item.id"
            class="task-item-accordion"
          >
            <!-- Item Header -->
            <div class="task-item-header">
              <span class="task-item-name">{{ item.name }}</span>
              <div class="task-item-actions">
                <button
                  class="btn-icon"
                  @click="toggleTaskItem(item.id)"
                  :title="expandedTaskItemId === item.id ? 'Collapse' : 'Edit'"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  class="btn-icon btn-danger"
                  @click="deleteTaskItem(item.id)"
                  title="Delete"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Item Edit Form (Expanded) -->
            <div v-if="expandedTaskItemId === item.id" class="task-item-edit">
              <div class="form-group">
                <label class="form-label">Item Name *</label>
                <input
                  v-model="editingTaskItemName"
                  type="text"
                  class="form-input"
                  required
                />
              </div>

              <!-- Origin Area Selection -->
              <div class="form-group">
                <label class="form-label">Default Origin (Optional)</label>
                <div class="area-selector">
                  <select v-model="editingTaskItemOriginType" class="form-input">
                    <option :value="null">None</option>
                    <option value="department">Department</option>
                    <option value="service">Service</option>
                  </select>
                  <select
                    v-if="editingTaskItemOriginType"
                    v-model="editingTaskItemOriginId"
                    class="form-input"
                  >
                    <option :value="null">Select {{ editingTaskItemOriginType }}</option>
                    <option
                      v-for="area in getAreasForType(editingTaskItemOriginType)"
                      :key="area.id"
                      :value="area.id"
                    >
                      {{ area.name }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Destination Area Selection -->
              <div class="form-group">
                <label class="form-label">Default Destination (Optional)</label>
                <div class="area-selector">
                  <select v-model="editingTaskItemDestinationType" class="form-input">
                    <option :value="null">None</option>
                    <option value="department">Department</option>
                    <option value="service">Service</option>
                  </select>
                  <select
                    v-if="editingTaskItemDestinationType"
                    v-model="editingTaskItemDestinationId"
                    class="form-input"
                  >
                    <option :value="null">Select {{ editingTaskItemDestinationType }}</option>
                    <option
                      v-for="area in getAreasForType(editingTaskItemDestinationType)"
                      :key="area.id"
                      :value="area.id"
                    >
                      {{ area.name }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn btn-primary" @click="saveEditedTaskItem">Save</button>
                <button class="btn btn-secondary" @click="cancelEditingTaskItem">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <p v-else-if="!isAddingTaskItem" class="empty-state">No task items</p>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import type { TaskTypeWithItems, TaskItem } from '@shared/types/task-config';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';

interface Props {
  modelValue: boolean;
  taskType: TaskTypeWithItems;
  departments: Department[];
  services: Service[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updateTaskType': [id: number, label: string, description: string | null, departmentIds: number[]];
  'addTaskItem': [taskTypeId: number, name: string, defaultOriginAreaId: number | null, defaultOriginAreaType: 'department' | 'service' | null, defaultDestinationAreaId: number | null, defaultDestinationAreaType: 'department' | 'service' | null];
  'updateTaskItem': [id: number, name: string, defaultOriginAreaId: number | null, defaultOriginAreaType: 'department' | 'service' | null, defaultDestinationAreaId: number | null, defaultDestinationAreaType: 'department' | 'service' | null];
  'deleteTaskItem': [id: number];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Task Type editing
const taskTypeLabel = ref('');
const taskTypeDescription = ref('');
const linkedDepartmentIds = ref<number[]>([]);

// Task Item adding
const isAddingTaskItem = ref(false);
const newTaskItemName = ref('');
const newTaskItemOriginType = ref<'department' | 'service' | null>(null);
const newTaskItemOriginId = ref<number | null>(null);
const newTaskItemDestinationType = ref<'department' | 'service' | null>(null);
const newTaskItemDestinationId = ref<number | null>(null);

// Task Item editing
const expandedTaskItemId = ref<number | null>(null);
const editingTaskItemName = ref('');
const editingTaskItemOriginType = ref<'department' | 'service' | null>(null);
const editingTaskItemOriginId = ref<number | null>(null);
const editingTaskItemDestinationType = ref<'department' | 'service' | null>(null);
const editingTaskItemDestinationId = ref<number | null>(null);

const taskItems = computed(() => props.taskType.items || []);

// Initialize form when modal opens or task type changes
watch(() => props.taskType, (newTaskType) => {
  if (newTaskType) {
    taskTypeLabel.value = newTaskType.label;
    taskTypeDescription.value = newTaskType.description || '';
    linkedDepartmentIds.value = [...(newTaskType.departmentIds || [])];
  }
}, { immediate: true });

const getAreasForType = (type: 'department' | 'service' | null) => {
  if (type === 'department') {
    return props.departments;
  } else if (type === 'service') {
    return props.services;
  }
  return [];
};

const saveTaskType = () => {
  emit('updateTaskType', props.taskType.id, taskTypeLabel.value, taskTypeDescription.value || null, linkedDepartmentIds.value);
};

const startAddingTaskItem = () => {
  isAddingTaskItem.value = true;
  newTaskItemName.value = '';
  newTaskItemOriginType.value = null;
  newTaskItemOriginId.value = null;
  newTaskItemDestinationType.value = null;
  newTaskItemDestinationId.value = null;
};

const cancelAddingTaskItem = () => {
  isAddingTaskItem.value = false;
};

const saveNewTaskItem = () => {
  if (!newTaskItemName.value.trim()) {
    return;
  }

  emit('addTaskItem', props.taskType.id, newTaskItemName.value.trim(), newTaskItemOriginId.value, newTaskItemOriginType.value, newTaskItemDestinationId.value, newTaskItemDestinationType.value);
  isAddingTaskItem.value = false;
};

const toggleTaskItem = (itemId: number) => {
  if (expandedTaskItemId.value === itemId) {
    expandedTaskItemId.value = null;
  } else {
    const item = taskItems.value.find(i => i.id === itemId);
    if (item) {
      expandedTaskItemId.value = itemId;
      editingTaskItemName.value = item.name;
      editingTaskItemOriginType.value = item.defaultOriginAreaType;
      editingTaskItemOriginId.value = item.defaultOriginAreaId;
      editingTaskItemDestinationType.value = item.defaultDestinationAreaType;
      editingTaskItemDestinationId.value = item.defaultDestinationAreaId;
    }
  }
};

const cancelEditingTaskItem = () => {
  expandedTaskItemId.value = null;
};

const saveEditedTaskItem = () => {
  if (!editingTaskItemName.value.trim() || expandedTaskItemId.value === null) {
    return;
  }

  emit('updateTaskItem', expandedTaskItemId.value, editingTaskItemName.value.trim(), editingTaskItemOriginId.value, editingTaskItemOriginType.value, editingTaskItemDestinationId.value, editingTaskItemDestinationType.value);
  expandedTaskItemId.value = null;
};

const deleteTaskItem = (itemId: number) => {
  if (confirm('Are you sure you want to delete this task item?')) {
    emit('deleteTaskItem', itemId);
  }
};
</script>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.task-type-edit-section,
.task-items-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}

.section-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.form-group {
  margin-bottom: var(--spacing-3);
}

.form-label {
  display: block;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-1);
}

.form-hint {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-1) 0 0 0;
}

.form-input {
  width: 100%;
  padding: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-size-body);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.department-checkboxes {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  max-height: 200px;
  overflow-y: auto;
  padding: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.checkbox-input {
  cursor: pointer;
}

.area-selector {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-2);
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}

.task-item-form {
  background-color: var(--color-bg);
  padding: var(--spacing-3);
  border-radius: var(--radius-card);
  margin-bottom: var(--spacing-3);
}

.task-items-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.task-item-accordion {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  overflow: hidden;
}

.task-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-surface);
}

.task-item-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.task-item-actions {
  display: flex;
  gap: var(--spacing-1);
}

.task-item-edit {
  padding: var(--spacing-3);
  background-color: var(--color-bg);
  border-top: 1px solid var(--color-border);
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
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}

.btn-icon.btn-danger:hover {
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
}

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  padding: var(--spacing-4);
  font-size: var(--font-size-body);
}

.btn {
  padding: var(--spacing-2) var(--spacing-3);
  border: none;
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-base);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-body-sm);
}
</style>

