<template>
  <BaseModal 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    :title="`Manage Assignments - ${staffMember.firstName} ${staffMember.lastName}`" 
    modal-class="manage-assignments-modal"
  >
    <div class="assignments-container">
      <div v-if="loading" class="loading-state">
        Loading assignments...
      </div>

      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <div v-else>
        <div v-if="assignments.length === 0" class="no-assignments">
          No temporary assignments for this date.
        </div>

        <div v-else class="assignments-list">
          <div
            v-for="assignment in assignments"
            :key="assignment.id"
            class="assignment-card"
          >
            <!-- View Mode -->
            <div v-if="editingId !== assignment.id" class="assignment-info">
              <div class="assignment-header">
                <strong>{{ getAreaName(assignment) }}</strong>
                <span class="badge badge-shift" :class="`badge-${assignment.shiftType}`">
                  {{ assignment.shiftType === 'day' ? 'Day' : 'Night' }}
                </span>
              </div>
              <div class="assignment-details">
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span>{{ assignment.startTime?.substring(0, 5) }} - {{ assignment.endTime?.substring(0, 5) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span>
                    {{ formatDate(assignment.assignmentDate) }}
                    <span v-if="assignment.endDate && assignment.endDate !== assignment.assignmentDate">
                      to {{ formatDate(assignment.endDate) }}
                    </span>
                  </span>
                </div>
                <div v-if="assignment.notes" class="detail-row">
                  <span class="label">Notes:</span>
                  <span>{{ assignment.notes }}</span>
                </div>
              </div>
            </div>

            <!-- Edit Mode -->
            <div v-else class="assignment-edit-form">
              <div class="assignment-header">
                <strong>{{ getAreaName(assignment) }}</strong>
                <span class="badge badge-shift" :class="`badge-${assignment.shiftType}`">
                  {{ assignment.shiftType === 'day' ? 'Day' : 'Night' }}
                </span>
              </div>
              <div class="form-group">
                <label>Start Time:</label>
                <input
                  type="time"
                  v-model="editForm.startTime"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>End Time:</label>
                <input
                  type="time"
                  v-model="editForm.endTime"
                  class="form-input"
                />
              </div>
              <div class="form-group">
                <label>Notes:</label>
                <textarea
                  v-model="editForm.notes"
                  class="form-input"
                  rows="2"
                ></textarea>
              </div>
            </div>

            <!-- Actions -->
            <div class="assignment-actions">
              <template v-if="editingId !== assignment.id">
                <button
                  class="btn-icon"
                  @click="startEdit(assignment)"
                  title="Edit assignment"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  class="btn-icon btn-danger"
                  @click="handleDelete(assignment.id)"
                  title="Delete assignment"
                  :disabled="deleting === assignment.id"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </template>
              <template v-else>
                <button
                  class="btn btn-primary btn-sm"
                  @click="saveEdit(assignment.id)"
                  :disabled="saving"
                >
                  Save
                </button>
                <button
                  class="btn btn-secondary btn-sm"
                  @click="cancelEdit"
                  :disabled="saving"
                >
                  Cancel
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="$emit('update:modelValue', false)">
        Close
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import BaseModal from './BaseModal.vue';
import { api } from '@/services/api';
import type { StaffMember } from '@shared/types/staff';
import type { ManualAssignment } from '@shared/types/shift';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';

interface Props {
  modelValue: boolean;
  staffMember: StaffMember;
  currentDate: string;
  departments: Department[];
  services: Service[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'deleted': [];
}>();

const loading = ref(false);
const error = ref('');
const assignments = ref<ManualAssignment[]>([]);
const deleting = ref<number | null>(null);
const editingId = ref<number | null>(null);
const saving = ref(false);
const editForm = ref({
  startTime: '',
  endTime: '',
  notes: ''
});

const loadAssignments = async () => {
  if (!props.staffMember?.id) {
    console.warn('No staff member ID available');
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    console.log('[ManageAssignmentsModal] Loading assignments for staff:', props.staffMember.id, 'date:', props.currentDate);
    const response = await api.getTemporaryAssignments(props.staffMember.id, props.currentDate);
    console.log('[ManageAssignmentsModal] Received assignments:', response.assignments);
    assignments.value = response.assignments;
  } catch (err) {
    console.error('Error loading assignments:', err);
    error.value = 'Failed to load assignments';
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (assignmentId: number) => {
  if (!confirm('Are you sure you want to delete this temporary assignment?')) {
    return;
  }

  deleting.value = assignmentId;

  try {
    await api.deleteAssignment(assignmentId);

    // Remove from local list immediately for responsive UI
    const wasLastAssignment = assignments.value.length === 1;
    assignments.value = assignments.value.filter(a => a.id !== assignmentId);

    // Notify parent to refresh the main view
    emit('deleted');

    // If this was the last assignment, close the modal after a brief delay
    // to allow the parent to refresh and show the updated state
    if (wasLastAssignment) {
      // Small delay to ensure parent has time to process the deletion
      setTimeout(() => {
        emit('update:modelValue', false);
      }, 300);
    }
  } catch (err) {
    console.error('Error deleting assignment:', err);
    alert('Failed to delete assignment');
  } finally {
    deleting.value = null;
  }
};

const getAreaName = (assignment: ManualAssignment): string => {
  if (assignment.areaType === 'department') {
    const dept = props.departments.find(d => d.id === assignment.areaId);
    return dept?.name || `Department ${assignment.areaId}`;
  } else {
    const service = props.services.find(s => s.id === assignment.areaId);
    return service?.name || `Service ${assignment.areaId}`;
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const startEdit = (assignment: ManualAssignment) => {
  editingId.value = assignment.id;
  editForm.value = {
    startTime: assignment.startTime?.substring(0, 5) || '',
    endTime: assignment.endTime?.substring(0, 5) || '',
    notes: assignment.notes || ''
  };
};

const cancelEdit = () => {
  editingId.value = null;
  editForm.value = {
    startTime: '',
    endTime: '',
    notes: ''
  };
};

const saveEdit = async (assignmentId: number) => {
  if (!editForm.value.startTime || !editForm.value.endTime) {
    alert('Start time and end time are required');
    return;
  }

  saving.value = true;

  try {
    const updates = {
      startTime: editForm.value.startTime + ':00', // Add seconds
      endTime: editForm.value.endTime + ':00',
      notes: editForm.value.notes || null
    };

    const response = await api.updateAssignment(assignmentId, updates);

    // Update the local assignment
    const index = assignments.value.findIndex(a => a.id === assignmentId);
    if (index !== -1) {
      assignments.value[index] = response.assignment;
    }

    // Notify parent to refresh the main view
    emit('deleted'); // Reusing this event to trigger refresh

    cancelEdit();
  } catch (err) {
    console.error('Error updating assignment:', err);
    alert('Failed to update assignment');
  } finally {
    saving.value = false;
  }
};

// Load assignments when component is mounted (since v-if recreates the component each time)
onMounted(() => {
  console.log('[ManageAssignmentsModal] Component mounted, loading assignments');
  loadAssignments();
});

// Load assignments when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    loadAssignments();
  }
});

// Also watch for staff member changes while modal is open
watch(() => props.staffMember?.id, (newId, oldId) => {
  if (props.modelValue && newId && newId !== oldId) {
    loadAssignments();
  }
});
</script>

<style scoped>
.manage-assignments-modal {
  min-height: 200px;
}

.assignments-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.loading-state,
.error-state,
.no-assignments {
  padding: var(--spacing-4);
  text-align: center;
  color: var(--color-text-secondary);
}

.error-state {
  color: var(--color-destructive);
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.assignment-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  transition: var(--transition-base);
}

.assignment-card:hover {
  box-shadow: var(--shadow-low);
}

.assignment-info {
  flex: 1;
  min-width: 0;
}

.assignment-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.assignment-header strong {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.assignment-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.detail-row {
  display: flex;
  gap: var(--spacing-2);
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.detail-row .label {
  font-weight: var(--font-weight-semibold);
  min-width: 50px;
}

.assignment-actions {
  display: flex;
  gap: var(--spacing-1);
}

.badge-shift {
  padding: 2px 8px;
  border-radius: var(--radius-button);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
}

.badge-day {
  background-color: #E5F6FF;
  color: #0066CC;
}

.badge-night {
  background-color: #2C3E50;
  color: #ECF0F1;
}

.assignment-edit-form {
  flex: 1;
  min-width: 0;
}

.form-group {
  margin-bottom: var(--spacing-2);
}

.form-group label {
  display: block;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-1);
}

.form-input {
  width: 100%;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  background-color: var(--color-background);
  transition: var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-small);
}
</style>

