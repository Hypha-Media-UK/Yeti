<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content modal-slide-up">
      <div class="modal-header">
        <h2>Create Task</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- Origin Department/Service -->
          <div class="form-group">
            <label for="originArea">From (Origin) *</label>
            <select
              id="originArea"
              v-model="formData.originAreaKey"
              required
              class="form-control"
              @change="handleOriginChange"
            >
              <option value="">Select origin...</option>

              <!-- Prioritized Departments (if any) -->
              <optgroup v-if="prioritizedDepartments.length > 0" label="Frequent Departments">
                <option
                  v-for="dept in prioritizedDepartments"
                  :key="`dept-${dept.id}`"
                  :value="`department-${dept.id}`"
                >
                  {{ dept.name }}
                </option>
              </optgroup>

              <!-- Regular Departments -->
              <optgroup v-if="regularDepartments.length > 0" :label="prioritizedDepartments.length > 0 ? 'Other Departments' : 'Departments'">
                <option
                  v-for="dept in regularDepartments"
                  :key="`dept-${dept.id}`"
                  :value="`department-${dept.id}`"
                >
                  {{ dept.name }}
                </option>
              </optgroup>

              <!-- Services -->
              <optgroup label="Services">
                <option
                  v-for="service in services"
                  :key="`service-${service.id}`"
                  :value="`service-${service.id}`"
                >
                  {{ service.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- Destination Department/Service -->
          <div class="form-group">
            <label for="destinationArea">To (Destination) *</label>
            <select
              id="destinationArea"
              v-model="formData.destinationAreaKey"
              required
              class="form-control"
              :disabled="!formData.originAreaKey"
            >
              <option value="">Select destination...</option>
              <optgroup label="Departments">
                <option
                  v-for="dept in availableDestinationDepartments"
                  :key="`dept-${dept.id}`"
                  :value="`department-${dept.id}`"
                >
                  {{ dept.name }}
                </option>
              </optgroup>
              <optgroup label="Services">
                <option
                  v-for="service in availableDestinationServices"
                  :key="`service-${service.id}`"
                  :value="`service-${service.id}`"
                >
                  {{ service.name }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- Task Type -->
          <div class="form-group">
            <label for="taskType">Task Type *</label>
            <select
              id="taskType"
              v-model="formData.taskType"
              required
              class="form-control"
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
            <label for="taskDetail">Task Detail *</label>
            <select
              id="taskDetail"
              v-model="formData.taskDetail"
              required
              class="form-control"
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

          <!-- Time Fields Row -->
          <div class="form-row">
            <div class="form-group">
              <label for="requestedTime">Requested Time *</label>
              <input
                id="requestedTime"
                v-model="formData.requestedTime"
                type="time"
                required
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="allocatedTime">Allocated Time *</label>
              <input
                id="allocatedTime"
                v-model="formData.allocatedTime"
                type="time"
                required
                class="form-control"
              />
            </div>
          </div>

          <!-- Expected Completion Time -->
          <div class="form-group">
            <label for="completedTime">Expected Completion Time</label>
            <input
              id="completedTime"
              v-model="formData.completedTime"
              type="time"
              class="form-control"
            />
            <p class="form-hint">Optional - estimated completion time</p>
          </div>

          <!-- Assigned Staff -->
          <div class="form-group">
            <label for="assignedStaff">Assign to Staff Member</label>
            <select
              id="assignedStaff"
              v-model="formData.assignedStaffId"
              class="form-control"
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
            <p class="form-hint">Optional - assign task to a staff member currently active in their shift</p>
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
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Creating...' : 'Create Task' }}
            </button>
            <button
              v-if="createAnother"
              type="button"
              class="btn btn-outline"
              @click="handleCreateAnother"
              :disabled="isSubmitting"
            >
              Create Another
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

const props = defineProps<{
  modelValue: boolean;
  createAnother?: boolean;
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

// Local state for departments and services
const departments = ref<Department[]>([]);
const services = ref<Service[]>([]);

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

// Split departments into prioritized (includeInTasks=true) and regular
const prioritizedDepartments = computed(() =>
  departments.value.filter(dept => dept.includeInTasks)
);

const regularDepartments = computed(() =>
  departments.value.filter(dept => !dept.includeInTasks)
);

const availableDestinationDepartments = computed(() => {
  if (!formData.originAreaKey) return departments.value;
  return departments.value.filter(dept => `department-${dept.id}` !== formData.originAreaKey);
});

const availableDestinationServices = computed(() => {
  if (!formData.originAreaKey) return services.value;
  return services.value.filter(service => `service-${service.id}` !== formData.originAreaKey);
});

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
async function handleSubmit() {
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
      taskType: formData.taskType,
      taskDetail: formData.taskDetail, // Keep for backward compatibility
      taskItemId: taskItem?.id || null, // New field
      requestedTime: formData.requestedTime,
      allocatedTime: formData.allocatedTime,
      completedTime: formData.completedTime || null,
      assignedStaffId: formData.assignedStaffId,
      status: 'pending',
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

// Handle create another
function handleCreateAnother() {
  // Keep origin, destination, and task type, but reset other fields
  formData.taskDetail = '';
  formData.assignedStaffId = null;
  initializeForm();
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
    const [departmentsResponse, servicesResponse] = await Promise.all([
      api.getAllDepartments(),
      api.getAllServices(),
      staffStore.fetchAllStaff(), // No status filter - activeStaff computed property filters by isActive
      taskConfigStore.fetchTaskTypes(),
    ]);

    departments.value = departmentsResponse.departments;
    services.value = servicesResponse.services;
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

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-button);
  transition: var(--transition-base);
}

.close-button:hover {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--spacing-4);
}

.form-group {
  margin-bottom: var(--spacing-3);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-1);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-body);
}

.form-control {
  width: 100%;
  padding: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  background-color: var(--color-bg);
  transition: var(--transition-base);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-control:disabled {
  background-color: var(--color-background);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
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

.btn {
  padding: var(--spacing-2) var(--spacing-4);
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

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-background);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.btn-outline:hover:not(:disabled) {
  background-color: rgba(59, 130, 246, 0.1);
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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

