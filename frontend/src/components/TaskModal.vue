<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content modal-slide-up">
      <div class="modal-header">
        <h2>Create Task</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent class="task-create-form">
          <!-- Origin and Destination Row -->
          <div class="form-row">
            <!-- Origin Department -->
            <div class="form-group">
              <label for="originArea" class="form-label">From (Origin) *</label>
              <select
                id="originArea"
                v-model="formData.originAreaKey"
                required
                class="form-input"
                @change="handleOriginChange"
              >
                <option value="">Select origin...</option>

                <!-- Departments grouped by building -->
                <optgroup
                  v-for="(depts, buildingKey) in departmentsByBuilding"
                  :key="`building-${buildingKey}`"
                  :label="getBuildingName(buildingKey === 'unassigned' ? null : Number(buildingKey))"
                >
                  <option
                    v-for="dept in depts"
                    :key="`dept-${dept.id}`"
                    :value="`department-${dept.id}`"
                  >
                    {{ dept.name }}
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- Destination Department (only includeInTasks=true) -->
            <div class="form-group">
              <label for="destinationArea" class="form-label">To (Destination) *</label>
              <select
                id="destinationArea"
                v-model="formData.destinationAreaKey"
                required
                class="form-input"
                :disabled="!formData.originAreaKey"
              >
                <option value="">Select destination...</option>

                <!-- Departments grouped by building (only includeInTasks=true) -->
                <optgroup
                  v-for="(depts, buildingKey) in destinationDepartmentsByBuilding"
                  :key="`building-${buildingKey}`"
                  :label="getBuildingName(buildingKey === 'unassigned' ? null : Number(buildingKey))"
                >
                  <option
                    v-for="dept in depts"
                    :key="`dept-${dept.id}`"
                    :value="`department-${dept.id}`"
                  >
                    {{ dept.name }}
                  </option>
                </optgroup>
              </select>
            </div>
          </div>

          <!-- Task Type and Task Detail Row -->
          <div class="form-row">
            <!-- Task Type -->
            <div class="form-group">
              <label for="taskType" class="form-label">Task Type *</label>
              <select
                id="taskType"
                v-model="formData.taskType"
                required
                class="form-input"
                @change="handleTaskTypeChange"
              >
                <option value="">Select task type...</option>
                <option
                  v-for="taskType in taskTypes"
                  :key="taskType.id"
                  :value="taskType.label"
                >
                  {{ taskType.label }}
                </option>
              </select>
            </div>

            <!-- Task Detail -->
            <div class="form-group">
              <label for="taskDetail" class="form-label">Task Detail *</label>
              <select
                id="taskDetail"
                v-model="formData.taskDetail"
                required
                class="form-input"
                :disabled="!formData.taskType"
              >
                <option value="">Select detail...</option>
                <option
                  v-for="detail in taskDetailOptions"
                  :key="detail"
                  :value="detail"
                >
                  {{ detail }}
                </option>
              </select>
            </div>
          </div>

          <!-- Time Fields Row (3 columns) -->
          <div class="form-row form-row-three">
            <div class="form-group">
              <label for="requestedTime" class="form-label">Requested Time *</label>
              <input
                id="requestedTime"
                v-model="formData.requestedTime"
                type="time"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="allocatedTime" class="form-label">Allocated Time *</label>
              <input
                id="allocatedTime"
                v-model="formData.allocatedTime"
                type="time"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="completedTime" class="form-label">Expected Completion</label>
              <input
                id="completedTime"
                v-model="formData.completedTime"
                type="time"
                class="form-input"
              />
            </div>
          </div>

          <!-- Assigned Staff (full width) -->
          <div class="form-group">
            <label for="assignedStaff" class="form-label">Assign to Staff Member</label>
            <select
              id="assignedStaff"
              v-model="formData.assignedStaffId"
              class="form-input"
            >
              <option :value="null">Unassigned</option>
              <option
                v-for="staff in staffInShiftPool"
                :key="staff.id"
                :value="staff.id"
              >
                {{ staff.firstName }} {{ staff.lastName }} ({{ staff.status }})
              </option>
            </select>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <!-- Actions -->
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" @click="handleSubmit('pending')" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating...' : 'Pending' }}
            </button>
            <button type="button" class="btn btn-primary" @click="handleSubmit('completed')" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating...' : 'Complete' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useTaskStore } from '@/stores/task';
import { useStaffStore } from '@/stores/staff';
import { useDayStore } from '@/stores/day';
import { useTaskConfigStore } from '@/stores/task-config';
import { api } from '@/services/api';
import type { CreateTaskInput } from '@shared/types/task';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';
import type { Building } from '@shared/types/building';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  taskCreated: [];
}>();

const taskStore = useTaskStore();
const staffStore = useStaffStore();
const dayStore = useDayStore();
const taskConfigStore = useTaskConfigStore();

const isSubmitting = ref(false);
const errorMessage = ref('');

// Local state for departments, services, and buildings
const departments = ref<Department[]>([]);
const services = ref<Service[]>([]);
const buildings = ref<Building[]>([]);

const formData = reactive({
  originAreaKey: '', // Format: "department-1" or "service-2"
  destinationAreaKey: '',
  taskType: '',
  taskDetail: '',
  requestedTime: '',
  allocatedTime: '',
  completedTime: '',
  assignedStaffId: null as number | null,
});

// Computed properties
// Get staff who are currently active in their shift (within shift times)
// Uses allShiftsIncludingPrevious to include yesterday's night shift staff who are still working
const staffInShiftPool = computed(() => {
  const allShifts = dayStore.allShiftsIncludingPrevious;
  // Only include staff whose shift status is 'active' (currently within their shift hours)
  const activeShiftStaffIds = new Set(
    allShifts
      .filter(shift => shift.status === 'active')
      .map(shift => shift.staff.id)
  );
  return staffStore.activeStaff.filter(staff => activeShiftStaffIds.has(staff.id));
});

const taskTypes = computed(() => taskConfigStore.taskTypes.filter(tt => tt.isActive));

// Group departments by building for origin field
const departmentsByBuilding = computed(() => {
  const grouped: Record<number | string, Department[]> = {};

  departments.value.forEach(dept => {
    const key = dept.buildingId ?? 'unassigned';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(dept);
  });

  return grouped;
});

// Group departments by building for destination field (only includeInTasks=true)
const destinationDepartmentsByBuilding = computed(() => {
  const grouped: Record<number | string, Department[]> = {};

  // Filter to only departments with includeInTasks=true and exclude the origin
  const filteredDepts = departments.value.filter(dept =>
    dept.includeInTasks && `department-${dept.id}` !== formData.originAreaKey
  );

  filteredDepts.forEach(dept => {
    const key = dept.buildingId ?? 'unassigned';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(dept);
  });

  return grouped;
});

// Get building name by ID
const getBuildingName = (buildingId: number | null): string => {
  if (buildingId === null) return 'Unassigned';
  const building = buildings.value.find(b => b.id === buildingId);
  return building?.name || `Building ${buildingId}`;
};

const taskDetailOptions = computed(() => {
  if (!formData.taskType) return [];
  const taskType = taskTypes.value.find(tt => tt.label === formData.taskType);
  return taskType?.items.filter(item => item.isActive).map(item => item.name) || [];
});

// Initialize form with default times
function initializeForm() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  formData.requestedTime = `${hours}:${minutes}`;
  
  // Allocated time = current time + 5 minutes
  const allocatedDate = new Date(now.getTime() + 5 * 60000);
  const allocatedHours = allocatedDate.getHours().toString().padStart(2, '0');
  const allocatedMinutes = allocatedDate.getMinutes().toString().padStart(2, '0');
  formData.allocatedTime = `${allocatedHours}:${allocatedMinutes}`;
  
  // Expected completion = current time + random(15-30) minutes
  const randomMinutes = Math.floor(Math.random() * 16) + 15; // 15-30 minutes
  const completedDate = new Date(now.getTime() + randomMinutes * 60000);
  const completedHours = completedDate.getHours().toString().padStart(2, '0');
  const completedMinutes = completedDate.getMinutes().toString().padStart(2, '0');
  formData.completedTime = `${completedHours}:${completedMinutes}`;
}

// Handle origin change - reset destination if same
function handleOriginChange() {
  if (formData.originAreaKey === formData.destinationAreaKey) {
    formData.destinationAreaKey = '';
  }
}

// Handle task type change - reset task detail
function handleTaskTypeChange() {
  formData.taskDetail = '';
}

// Watch for task detail changes to auto-populate origin/destination
watch(() => formData.taskDetail, (selectedItemName) => {
  if (!selectedItemName || !formData.taskType) return;

  const taskType = taskTypes.value.find(tt => tt.label === formData.taskType);
  const taskItem = taskType?.items.find(i => i.name === selectedItemName);

  if (taskItem) {
    // Auto-populate origin if set and not already selected
    if (taskItem.defaultOriginAreaId && taskItem.defaultOriginAreaType && !formData.originAreaKey) {
      formData.originAreaKey = `${taskItem.defaultOriginAreaType}-${taskItem.defaultOriginAreaId}`;
    }

    // Auto-populate destination if set and not already selected
    if (taskItem.defaultDestinationAreaId && taskItem.defaultDestinationAreaType && !formData.destinationAreaKey) {
      formData.destinationAreaKey = `${taskItem.defaultDestinationAreaType}-${taskItem.defaultDestinationAreaId}`;
    }
  }
});

// Parse area key to get ID and type
function parseAreaKey(key: string): { id: number; type: 'department' | 'service' } | null {
  if (!key) return null;
  const [type, idStr] = key.split('-');
  return {
    id: parseInt(idStr, 10),
    type: type as 'department' | 'service',
  };
}

// Handle form submission
async function handleSubmit(status: 'pending' | 'completed') {
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    const origin = parseAreaKey(formData.originAreaKey);
    const destination = parseAreaKey(formData.destinationAreaKey);

    if (!origin || !destination) {
      errorMessage.value = 'Please select both origin and destination';
      return;
    }

    // Find the task item ID
    const taskType = taskTypes.value.find(tt => tt.label === formData.taskType);
    const taskItem = taskType?.items.find(i => i.name === formData.taskDetail);

    const input: CreateTaskInput = {
      originAreaId: origin.id,
      originAreaType: origin.type,
      destinationAreaId: destination.id,
      destinationAreaType: destination.type,
      taskType: null, // Set to null - we use task_item_id instead
      taskDetail: formData.taskDetail, // Keep for backward compatibility
      taskItemId: taskItem?.id || null, // New field
      requestedTime: formData.requestedTime,
      allocatedTime: formData.allocatedTime,
      completedTime: status === 'completed' ? formData.allocatedTime : null,
      assignedStaffId: formData.assignedStaffId,
      status: status,
    };

    await taskStore.addTask(input);
    emit('taskCreated');
    closeModal();
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to create task';
  } finally {
    isSubmitting.value = false;
  }
}

// Close modal
function closeModal() {
  emit('update:modelValue', false);
  resetForm();
}

// Reset form
function resetForm() {
  formData.originAreaKey = '';
  formData.destinationAreaKey = '';
  formData.taskType = '';
  formData.taskDetail = '';
  formData.assignedStaffId = null;
  errorMessage.value = '';
  initializeForm();
}

// Watch for modal open
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeForm();
  }
});

// Load data on mount
onMounted(async () => {
  try {
    const [departmentsResponse, servicesResponse, buildingsResponse] = await Promise.all([
      api.getAllDepartments(),
      api.getAllServices(),
      api.getAllBuildings(),
      staffStore.fetchAllStaff(), // No status filter - activeStaff computed property filters by isActive
      taskConfigStore.fetchTaskTypes(),
    ]);

    departments.value = departmentsResponse.departments;
    services.value = servicesResponse.services;
    buildings.value = buildingsResponse.buildings;
  } catch (error) {
    console.error('Error loading task modal data:', error);
    errorMessage.value = 'Failed to load required data. Please try again.';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background-color: var(--color-surface);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  box-shadow: var(--shadow-high);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-size-heading);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* Close button styles inherited from global main.css */

.modal-body {
  padding: var(--spacing-4);
}

.task-create-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.form-row-three {
  grid-template-columns: 1fr 1fr 1fr;
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
  border-radius: var(--radius-input);
  font-size: var(--font-size-body);
  font-family: inherit;
  transition: var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-input:disabled {
  background-color: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: not-allowed;
  opacity: 0.6;
}

select.form-input {
  cursor: pointer;
}

.form-hint {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.error-message {
  padding: var(--spacing-2);
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-button);
  color: var(--color-error);
  font-size: var(--font-size-body-sm);
  margin-bottom: var(--spacing-3);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-border);
}

/* Button styles inherited from global main.css */

@media (max-width: 600px) {
  .modal-content {
    max-width: 100%;
    max-height: 95vh;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>

