<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Manage Absences - {{ staffMember.firstName }} {{ staffMember.lastName }}</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Add New Absence Button -->
        <div class="actions-bar">
          <button class="btn btn-primary" @click="openCreateModal">
            <span class="icon">+</span> Add Absence
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          Loading absences...
        </div>

        <!-- Empty State -->
        <div v-else-if="absences.length === 0" class="empty-state">
          <p>No absences recorded for this staff member.</p>
        </div>

        <!-- Absences List -->
        <div v-else class="absences-list">
          <div
            v-for="absence in sortedAbsences"
            :key="absence.id"
            class="absence-card"
            :class="{ 'absence-active': isAbsenceActive(absence) }"
          >
            <div class="absence-header">
              <span class="absence-type" :class="`type-${absence.absenceType}`">
                {{ formatAbsenceType(absence.absenceType) }}
              </span>
              <span v-if="isAbsenceActive(absence)" class="active-badge">Active</span>
            </div>

            <div class="absence-details">
              <div class="detail-row">
                <span class="label">Start:</span>
                <span class="value">{{ formatDateTime(absence.startDatetime) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">End:</span>
                <span class="value">{{ formatDateTime(absence.endDatetime) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">{{ calculateDuration(absence) }}</span>
              </div>
              <div v-if="absence.notes" class="detail-row notes">
                <span class="label">Notes:</span>
                <span class="value">{{ absence.notes }}</span>
              </div>
            </div>

            <div class="absence-actions">
              <button class="btn-icon" @click="openEditModal(absence)" title="Edit">
                ✏️
              </button>
              <button class="btn-icon btn-delete" @click="confirmDelete(absence)" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Absence Modal (Create/Edit) -->
  <AbsenceModal
    v-model="showAbsenceModal"
    :staff-id="staffMember.id"
    :staff-name="`${staffMember.firstName} ${staffMember.lastName}`"
    :absence="selectedAbsence"
    @submit="handleAbsenceSubmit"
  />

  <!-- Delete Confirmation -->
  <ConfirmDialog
    v-model="showDeleteConfirm"
    title="Delete Absence"
    :message="`Are you sure you want to delete this ${deleteTarget ? formatAbsenceType(deleteTarget.absenceType).toLowerCase() : 'absence'}?`"
    @confirm="handleDeleteConfirm"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { api } from '@/services/api';
import type { Absence, CreateAbsenceRequest, UpdateAbsenceRequest } from '@shared/types/absence';
import type { StaffMember } from '@shared/types/staff';
import AbsenceModal from './AbsenceModal.vue';
import ConfirmDialog from './ConfirmDialog.vue';

interface Props {
  modelValue: boolean;
  staffMember: StaffMember;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const absences = ref<Absence[]>([]);
const isLoading = ref(false);
const showAbsenceModal = ref(false);
const selectedAbsence = ref<Absence | null>(null);
const showDeleteConfirm = ref(false);
const deleteTarget = ref<Absence | null>(null);

// Load absences function (defined before watch to avoid hoisting issues)
const loadAbsences = async () => {
  isLoading.value = true;
  try {
    absences.value = await api.getAbsencesByStaffId(props.staffMember.id);
  } catch (error) {
    console.error('Error loading absences:', error);
  } finally {
    isLoading.value = false;
  }
};

// Load absences when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadAbsences();
  }
}, { immediate: true });

const sortedAbsences = computed(() => {
  return [...absences.value].sort((a, b) => {
    // Sort by start date descending (most recent first)
    return new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime();
  });
});

const closeModal = () => {
  emit('update:modelValue', false);
};

const openCreateModal = () => {
  selectedAbsence.value = null;
  showAbsenceModal.value = true;
};

const openEditModal = (absence: Absence) => {
  selectedAbsence.value = absence;
  showAbsenceModal.value = true;
};

const handleAbsenceSubmit = async (data: CreateAbsenceRequest | { id: number; updates: UpdateAbsenceRequest }) => {
  try {
    if ('id' in data) {
      // Update existing absence
      await api.updateAbsence(data.id, data.updates);
    } else {
      // Create new absence
      await api.createAbsence(data);
    }
    showAbsenceModal.value = false;
    await loadAbsences();
  } catch (error) {
    console.error('Error saving absence:', error);
  }
};

const confirmDelete = (absence: Absence) => {
  deleteTarget.value = absence;
  showDeleteConfirm.value = true;
};

const handleDeleteConfirm = async () => {
  if (!deleteTarget.value) return;

  try {
    await api.deleteAbsence(deleteTarget.value.id);
    await loadAbsences();
  } catch (error) {
    console.error('Error deleting absence:', error);
  } finally {
    showDeleteConfirm.value = false;
    deleteTarget.value = null;
  }
};

const isAbsenceActive = (absence: Absence): boolean => {
  const now = new Date();
  const start = new Date(absence.startDatetime);
  const end = new Date(absence.endDatetime);
  return now >= start && now <= end;
};

const formatAbsenceType = (type: string): string => {
  const types: Record<string, string> = {
    'sickness': 'Sickness',
    'annual_leave': 'Annual Leave',
    'training': 'Training',
    'absence': 'Absence',
  };
  return types[type] || type;
};

const formatDateTime = (datetime: string): string => {
  const dt = new Date(datetime);
  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calculateDuration = (absence: Absence): string => {
  const start = new Date(absence.startDatetime);
  const end = new Date(absence.endDatetime);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  if (diffDays > 0) {
    return remainingHours > 0
      ? `${diffDays} day${diffDays > 1 ? 's' : ''} ${remainingHours}h`
      : `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }
  return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
};
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-surface);
  border-radius: 8px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: var(--color-hover);
}

.modal-body {
  padding: 1.5rem;
}

.actions-bar {
  margin-bottom: 1.5rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.icon {
  font-size: 1.25rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
}

.absences-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.absence-card {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  background-color: var(--color-background);
  transition: box-shadow 0.2s;
}

.absence-card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.absence-card.absence-active {
  border-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.absence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.absence-type {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.type-sickness {
  background-color: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.type-annual_leave {
  background-color: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.type-training {
  background-color: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.type-absence {
  background-color: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.active-badge {
  background-color: #ef4444;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.absence-details {
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.detail-row .label {
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 70px;
}

.detail-row .value {
  color: var(--color-text-primary);
}

.detail-row.notes {
  flex-direction: column;
  gap: 0.25rem;
}

.detail-row.notes .value {
  font-style: italic;
  color: var(--color-text-secondary);
}

.absence-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.375rem 0.625rem;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: var(--color-hover);
}

.btn-icon.btn-delete:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}
</style>

