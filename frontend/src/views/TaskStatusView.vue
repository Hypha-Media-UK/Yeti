<template>
  <div class="task-status-view">
    <div class="container">
      <header class="page-header">
        <button class="btn btn-secondary back-btn" @click="goBack">
          ← Back to Rota
        </button>
        <h1 class="page-title">Task Status</h1>
      </header>

      <div class="rota-nav">
        <DateSelector v-model="selectedDate" @open-task-status="handleOpenTaskStatus" />
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading tasks...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button class="btn btn-primary" @click="loadTasks">
          Retry
        </button>
      </div>

      <div v-else class="tasks-content">
        <!-- Pending Tasks Section -->
        <div class="tasks-section">
          <h2 class="section-title">
            Pending Tasks
            <span class="task-count">{{ pendingTasks.length }}</span>
          </h2>
          
          <div v-if="pendingTasks.length === 0" class="empty-state">
            <p>No pending tasks for this day</p>
          </div>
          
          <div v-else class="tasks-list">
            <div
              v-for="task in pendingTasks"
              :key="task.id"
              class="task-card task-pending"
            >
              <div class="task-card-content" @click="handleEditTask(task)">
                <span class="task-info">
                  <strong>{{ getTaskTypeLabel(task) }}:</strong> {{ getTaskDetail(task) }}
                </span>
                <span class="task-route">
                  {{ getAreaName(task.originAreaId, task.originAreaType) }} → {{ getAreaName(task.destinationAreaId, task.destinationAreaType) }}
                </span>
                <span class="task-staff">
                  {{ task.assignedStaffId ? getStaffName(task.assignedStaffId) : 'Unassigned' }}
                </span>
                <span class="task-time">{{ formatTime(task.requestedTime) }}</span>
              </div>
              <button
                class="btn-icon btn-complete"
                @click.stop="handleQuickComplete(task)"
                title="Mark as complete"
              >
                ✓
              </button>
            </div>
          </div>
        </div>

        <!-- Completed Tasks Section -->
        <div class="tasks-section">
          <h2 class="section-title">
            Completed Tasks
            <span class="task-count">{{ completedTasks.length }}</span>
          </h2>
          
          <div v-if="completedTasks.length === 0" class="empty-state">
            <p>No completed tasks for this day</p>
          </div>
          
          <div v-else class="tasks-list">
            <div
              v-for="task in completedTasks"
              :key="task.id"
              class="task-card task-completed"
            >
              <div class="task-card-content" @click="handleEditTask(task)">
                <span class="task-info">
                  <strong>{{ getTaskTypeLabel(task) }}:</strong> {{ getTaskDetail(task) }}
                </span>
                <span class="task-route">
                  {{ getAreaName(task.originAreaId, task.originAreaType) }} → {{ getAreaName(task.destinationAreaId, task.destinationAreaType) }}
                </span>
                <span class="task-staff">
                  {{ task.assignedStaffId ? getStaffName(task.assignedStaffId) : 'Unassigned' }}
                </span>
                <span class="task-time">{{ formatTime(task.requestedTime) }}</span>
              </div>
              <button
                class="btn-icon btn-pending"
                @click.stop="handleQuickPending(task)"
                title="Move to pending"
              >
                ↻
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Edit Modal -->
    <TaskEditModal
      v-model="showEditModal"
      v-if="selectedTask"
      :task="selectedTask"
      @task-updated="handleTaskUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/task';
import { useStaffStore } from '@/stores/staff';
import { useTaskConfigStore } from '@/stores/task-config';
import { useDayStore } from '@/stores/day';
import { useTimeZone } from '@/composables/useTimeZone';
import { api } from '@/services/api';
import DateSelector from '@/components/DateSelector.vue';
import TaskEditModal from '@/components/TaskEditModal.vue';
import type { Task } from '@shared/types/task';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';

const route = useRoute();
const router = useRouter();
const taskStore = useTaskStore();
const staffStore = useStaffStore();
const taskConfigStore = useTaskConfigStore();
const dayStore = useDayStore();
const { getTodayString, addDaysToDate } = useTimeZone();

// Initialize date from route or use today
const routeDate = route.params.date;
const initialDate = (routeDate && typeof routeDate === 'string') ? routeDate : getTodayString();

const selectedDate = ref(initialDate);
const isLoading = ref(false);
const error = ref<string | null>(null);
const showEditModal = ref(false);
const selectedTask = ref<Task | null>(null);

// Local state for departments and services
const departments = ref<Department[]>([]);
const services = ref<Service[]>([]);

// Computed properties
const pendingTasks = computed(() => 
  taskStore.taskList.filter(t => t.status === 'pending' || t.status === 'in-progress')
);

const completedTasks = computed(() => 
  taskStore.taskList.filter(t => t.status === 'completed')
);

// Load tasks for the selected date (08:00 to 07:59 next day)
async function loadTasks() {
  isLoading.value = true;
  error.value = null;

  try {
    // Calculate the date range: 08:00 today to 07:59 tomorrow
    const fromDate = `${selectedDate.value}T08:00:00`;
    const nextDay = addDaysToDate(selectedDate.value, 1);
    const toDate = `${nextDay}T07:59:59`;

    await taskStore.fetchAllTasks({
      fromDate,
      toDate,
    });
  } catch (err: any) {
    error.value = err.message || 'Failed to load tasks';
    console.error('Error loading tasks:', err);
  } finally {
    isLoading.value = false;
  }
}

// Get task type label
function getTaskTypeLabel(task: Task): string {
  // First, try to get from the new task item system
  if (task.taskItem && task.taskItem.taskType) {
    return task.taskItem.taskType.label;
  }

  // Fallback: Try to find the task type from the config store using taskTypeId
  if (task.taskTypeId) {
    const taskType = taskConfigStore.taskTypes.find(t => t.id === task.taskTypeId);
    if (taskType) return taskType.label;
  }

  // Fallback: Try to find the task type by matching the task detail
  if (task.taskDetail) {
    // Search through all task types and their items to find a match
    for (const taskType of taskConfigStore.taskTypes) {
      const matchingItem = taskType.items.find(item => item.name === task.taskDetail);
      if (matchingItem) {
        return taskType.label;
      }
    }
  }

  // Last resort: Use the old taskType enum value if available
  if (task.taskType) {
    // Convert enum value to label (e.g., 'asset-move' -> 'Asset Move')
    return task.taskType.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  return 'Unknown';
}

// Get task detail
function getTaskDetail(task: Task): string {
  if (task.taskItem && task.taskItem.name) {
    return task.taskItem.name;
  }
  return task.taskDetail || '';
}

// Get area name
function getAreaName(areaId: number, areaType: 'department' | 'service'): string {
  if (areaType === 'department') {
    const dept = departments.value.find(d => d.id === areaId);
    return dept?.name || `Department ${areaId}`;
  } else {
    const service = services.value.find(s => s.id === areaId);
    return service?.name || `Service ${areaId}`;
  }
}

// Get staff name
function getStaffName(staffId: number): string {
  if (!staffStore.staffList || !Array.isArray(staffStore.staffList)) {
    return `Staff ${staffId}`;
  }
  const staff = staffStore.staffList.find(s => s.id === staffId);
  return staff ? `${staff.firstName} ${staff.lastName}` : `Staff ${staffId}`;
}

// Format time (HH:mm)
function formatTime(time: string): string {
  if (!time) return '';
  return time.substring(0, 5); // Extract HH:mm from HH:mm:ss
}

// Handle edit task
function handleEditTask(task: Task) {
  selectedTask.value = task;
  showEditModal.value = true;
}

// Handle quick complete
async function handleQuickComplete(task: Task) {
  try {
    await taskStore.modifyTask(task.id, {
      status: 'completed',
      completedTime: task.allocatedTime, // Use allocated time as completed time
    });
    await loadTasks();
  } catch (err: any) {
    console.error('Error completing task:', err);
    error.value = err.message || 'Failed to complete task';
  }
}

// Handle quick pending
async function handleQuickPending(task: Task) {
  try {
    await taskStore.modifyTask(task.id, {
      status: 'pending',
      completedTime: null,
    });
    await loadTasks();
  } catch (err: any) {
    console.error('Error moving task to pending:', err);
    error.value = err.message || 'Failed to move task to pending';
  }
}

// Handle task updated
async function handleTaskUpdated() {
  await loadTasks();
}

// Handle opening task status (refresh current view)
function handleOpenTaskStatus() {
  // Already on task status view, just stay here
}

// Go back to rota view
function goBack() {
  router.push({ name: 'day', params: { date: selectedDate.value } });
}

// Watch for date changes
watch(selectedDate, async (newDate) => {
  if (newDate) {
    router.replace({ name: 'task-status', params: { date: newDate } });
    await loadTasks();
  }
});

onMounted(async () => {
  // Ensure route is correct
  if (!routeDate || typeof routeDate !== 'string') {
    router.replace({ name: 'task-status', params: { date: selectedDate.value } });
  }

  // Load initial data
  try {
    await Promise.all([
      staffStore.fetchAllStaff(),
      taskConfigStore.fetchTaskTypes(),
      dayStore.loadRota(selectedDate.value),
    ]);

    // Load departments and services separately
    const [deptsResponse, servsResponse] = await Promise.all([
      api.getAllDepartments(),
      api.getAllServices(),
    ]);

    departments.value = deptsResponse.departments;
    services.value = servsResponse.services;
  } catch (err) {
    console.error('Error loading initial data:', err);
  }

  await loadTasks();
});
</script>

<style scoped>
.task-status-view {
  min-height: 100vh;
  background-color: var(--color-bg);
  padding-bottom: var(--spacing-6);
}

.container {
  max-width: var(--container-desktop);
  margin: 0 auto;
  padding: 0 var(--spacing-3);
}

.page-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) 0;
}

.back-btn {
  min-width: auto;
}

.page-title {
  font-size: var(--font-size-headline);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.rota-nav {
  margin-bottom: var(--spacing-4);
  padding: var(--spacing-3);
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-medium);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-6);
  gap: var(--spacing-2);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--color-error);
  font-weight: var(--font-weight-medium);
}

.tasks-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.tasks-section {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
  box-shadow: var(--shadow-medium);
}

.section-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.task-count {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
  background-color: var(--color-bg);
  padding: 2px var(--spacing-1);
  border-radius: var(--radius-button);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-4);
  color: var(--color-text-secondary);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.task-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  padding: var(--spacing-2);
  transition: var(--transition-base);
}

.task-card:hover {
  box-shadow: var(--shadow-low);
  transform: translateY(-1px);
}

.task-card.task-pending {
  background-color: #fff4e6; /* Pale orange */
}

.task-card.task-completed {
  background-color: #e8f5e9; /* Pale green */
}

.task-card-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
}

.task-info {
  min-width: 200px;
  font-size: var(--font-size-body);
}

.task-route {
  min-width: 180px;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.task-staff {
  min-width: 150px;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.task-time {
  min-width: 60px;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  text-align: right;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-button);
  background-color: transparent;
  cursor: pointer;
  font-size: 18px;
  transition: var(--transition-base);
  flex-shrink: 0;
}

.btn-icon:hover {
  background-color: var(--color-bg-hover);
}

.btn-complete {
  color: var(--color-success);
}

.btn-complete:hover {
  background-color: var(--color-success-bg);
}

.btn-pending {
  color: var(--color-warning);
}

.btn-pending:hover {
  background-color: var(--color-warning-bg);
}
</style>

