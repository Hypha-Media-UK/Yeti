<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content modal-slide-up">
      <div class="modal-header">
        <h2>Edit Task</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent>
          <!-- Origin Department/Service -->
          <div class="form-group">
            <label for="origin-area">Origin</label>
            <select
              id="origin-area"
              v-model="formData.originAreaKey"
              class="form-control"
              required
            >
              <option value="">Select origin...</option>
              <optgroup label="Departments">
                <option
                  v-for="dept in departments"
                  :key="`dept-${dept.id}`"
                  :value="`department-${dept.id}`"
                >
                  {{ dept.name }}
                </option>
              </optgroup>
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
            <label for="destination-area">Destination</label>
            <select
              id="destination-area"
              v-model="formData.destinationAreaKey"
              class="form-control"
              required
            >
              <option value="">Select destination...</option>
              <optgroup label="Departments">
                <option
                  v-for="dept in departments"
                  :key="`dept-${dept.id}`"
                  :value="`department-${dept.id}`"
                >
                  {{ dept.name }}
                </option>
              </optgroup>
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

          <!-- Task Type -->
          <div class="form-group">
            <label for="task-type">Task Type</label>
            <select
              id="task-type"
              v-model="formData.taskType"
              class="form-control"
              required
            >
              <option value="">Select task type...</option>
              <option
                v-for="type in taskTypes"
                :key="type.id"
                :value="type.label"
              >
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Task Detail -->
          <div class="form-group">
            <label for="task-detail">Task Detail</label>
            <select
              id="task-detail"
              v-model="formData.taskDetail"
              class="form-control"
              :disabled="!formData.taskType"
              required
            >
              <option value="">Select task detail...</option>
              <option
                v-for="item in availableTaskItems"
                :key="item.id"
                :value="item.name"
              >
                {{ item.name }}
              </option>
            </select>
          </div>

          <!-- Requested Time -->
          <div class="form-group">
            <label for="requested-time">Requested Time</label>
            <input
              id="requested-time"
              type="time"
              v-model="formData.requestedTime"
              class="form-control"
              required
            />
          </div>

          <!-- Allocated Time -->
          <div class="form-group">
            <label for="allocated-time">Allocated Time</label>
            <input
              id="allocated-time"
              type="time"
              v-model="formData.allocatedTime"
              class="form-control"
              required
            />
          </div>

          <!-- Completed Time (if completed) -->
          <div v-if="task.status === 'completed'" class="form-group">
            <label for="completed-time">Completed Time</label>
            <input
              id="completed-time"
              type="time"
              v-model="formData.completedTime"
              class="form-control"
            />
          </div>

          <!-- Assign to Staff Member -->
          <div class="form-group">
            <label for="assigned-staff">Assign to Staff Member</label>
            <select
              id="assigned-staff"
              v-model="formData.assignedStaffId"
              class="form-control"
            >
              <option :value="null">Unassigned</option>
              <option
                v-for="assignment in availableStaff"
                :key="assignment.staff.id"
                :value="assignment.staff.id"
              >
                {{ assignment.staff.firstName }} {{ assignment.staff.lastName }}
                ({{ assignment.shiftType }} - {{ assignment.shiftStart }} to {{ assignment.shiftEnd }})
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
            <button type="button" class="btn btn-primary" @click="handleUpdate" :disabled="isSubmitting">
              {{ isSubmitting ? 'Updating...' : 'Update' }}
            </button>
            <button
              v-if="task.status === 'pending' || task.status === 'in-progress'"
              type="button"
              class="btn btn-primary"
              @click="handleComplete"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Updating...' : 'Complete' }}
            </button>
            <button
              v-if="task.status === 'completed'"
              type="button"
              class="btn btn-secondary"
              @click="handleMoveToPending"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Updating...' : 'Move to Pending' }}
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
import { useTaskConfigStore } from '@/stores/task-config';
import { useDayStore } from '@/stores/day';
import { api } from '@/services/api';
import type { Task, UpdateTaskInput } from '@shared/types/task';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';

const props = defineProps<{
  modelValue: boolean;
  task: Task;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  taskUpdated: [];
}>();

const taskStore = useTaskStore();
const taskConfigStore = useTaskConfigStore();
const dayStore = useDayStore();

const isSubmitting = ref(false);
const errorMessage = ref('');

// Local state for departments and services
const departments = ref<Department[]>([]);
const services = ref<Service[]>([]);

const formData = reactive({
  originAreaKey: '',
  destinationAreaKey: '',
  taskType: '',
  taskDetail: '',
  requestedTime: '',
  allocatedTime: '',
  completedTime: '',
  assignedStaffId: null as number | null,
});

// Computed properties
const taskTypes = computed(() => taskConfigStore.taskTypes);

const availableTaskItems = computed(() => {
  const selectedType = taskTypes.value.find(t => t.label === formData.taskType);
  return selectedType?.items || [];
});

const availableStaff = computed(() => {
  return dayStore.allShiftsIncludingPrevious || [];
});

// Initialize form with task data
function initializeForm() {
  formData.originAreaKey = `${props.task.originAreaType}-${props.task.originAreaId}`;
  formData.destinationAreaKey = `${props.task.destinationAreaType}-${props.task.destinationAreaId}`;
  
  if (props.task.taskItem) {
    formData.taskType = props.task.taskItem.taskType.label;
    formData.taskDetail = props.task.taskItem.name;
  } else {
    formData.taskType = props.task.taskType || '';
    formData.taskDetail = props.task.taskDetail || '';
  }
  
  formData.requestedTime = props.task.requestedTime.substring(0, 5);
  formData.allocatedTime = props.task.allocatedTime.substring(0, 5);
  formData.completedTime = props.task.completedTime ? props.task.completedTime.substring(0, 5) : '';
  formData.assignedStaffId = props.task.assignedStaffId;
}

// Parse area key to get ID and type
function parseAreaKey(key: string): { id: number; type: 'department' | 'service' } | null {
  if (!key) return null;
  const [type, idStr] = key.split('-');
  return {
    id: parseInt(idStr, 10),
    type: type as 'department' | 'service',
  };
}

// Handle update
async function handleUpdate() {
  await submitUpdate('update');
}

// Handle complete
async function handleComplete() {
  await submitUpdate('complete');
}

// Handle move to pending
async function handleMoveToPending() {
  await submitUpdate('move-to-pending');
}

// Submit update
async function submitUpdate(action: 'update' | 'complete' | 'move-to-pending') {
  errorMessage.value = '';
  isSubmitting.value = true;

  try {
    const origin = parseAreaKey(formData.originAreaKey);
    const destination = parseAreaKey(formData.destinationAreaKey);

    if (!origin || !destination) {
      errorMessage.value = 'Please select both origin and destination';
      return;
    }

    const taskType = taskTypes.value.find(tt => tt.label === formData.taskType);
    const taskItem = taskType?.items.find(i => i.name === formData.taskDetail);

    const updates: UpdateTaskInput = {
      taskType: null,
      taskDetail: formData.taskDetail,
      requestedTime: formData.requestedTime,
      allocatedTime: formData.allocatedTime,
      assignedStaffId: formData.assignedStaffId,
    };

    if (action === 'complete') {
      updates.status = 'completed';
      updates.completedTime = formData.allocatedTime;
    } else if (action === 'move-to-pending') {
      updates.status = 'pending';
      updates.completedTime = null;
    } else if (formData.completedTime) {
      updates.completedTime = formData.completedTime;
    }

    await taskStore.modifyTask(props.task.id, updates);
    emit('taskUpdated');
    closeModal();
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update task';
  } finally {
    isSubmitting.value = false;
  }
}

// Close modal
function closeModal() {
  emit('update:modelValue', false);
}

// Load departments and services
async function loadAreasData() {
  try {
    const [depts, servs] = await Promise.all([
      api.getDepartments(),
      api.getServices(),
    ]);
    departments.value = depts;
    services.value = servs;
  } catch (error) {
    console.error('Error loading areas:', error);
  }
}

// Watch for modal opening
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initializeForm();
    loadAreasData();
  }
});

onMounted(() => {
  if (props.modelValue) {
    initializeForm();
    loadAreasData();
  }
});
</script>

<style scoped>
/* Modal styles - same as TaskModal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-2);
}

.modal-content {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-medium);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-slide-up {
  animation: slideUp 0.3s var(--easing-standard);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
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
  padding: var(--spacing-3);
}

.form-group {
  margin-bottom: var(--spacing-3);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-1);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-body-sm);
}

.form-control {
  width: 100%;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  transition: var(--transition-base);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-control:disabled {
  background-color: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: not-allowed;
}

.error-message {
  padding: var(--spacing-2);
  background-color: rgba(220, 38, 38, 0.1);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: var(--radius-button);
  color: var(--color-error);
  font-size: var(--font-size-body-sm);
  margin-bottom: var(--spacing-2);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  margin-top: var(--spacing-3);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-border);
}
</style>

