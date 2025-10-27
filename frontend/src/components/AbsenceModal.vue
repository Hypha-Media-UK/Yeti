<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEditing ? 'Edit Absence' : 'Create Absence' }}</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- Absence Type -->
          <div class="form-group">
            <label for="absenceType">Absence Type *</label>
            <select
              id="absenceType"
              v-model="formData.absenceType"
              required
              class="form-control"
            >
              <option value="">Select type...</option>
              <option value="sickness">Sickness</option>
              <option value="annual_leave">Annual Leave</option>
              <option value="training">Training</option>
              <option value="absence">Absence (General)</option>
            </select>
          </div>

          <!-- Start Date and Time -->
          <div class="form-row">
            <div class="form-group">
              <label for="startDate">Start Date *</label>
              <input
                id="startDate"
                v-model="formData.startDate"
                type="date"
                required
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="startTime">Start Time *</label>
              <input
                id="startTime"
                v-model="formData.startTime"
                type="time"
                required
                class="form-control"
              />
            </div>
          </div>

          <!-- End Date and Time -->
          <div class="form-row">
            <div class="form-group">
              <label for="endDate">End Date *</label>
              <input
                id="endDate"
                v-model="formData.endDate"
                type="date"
                required
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label for="endTime">End Time *</label>
              <input
                id="endTime"
                v-model="formData.endTime"
                type="time"
                required
                class="form-control"
              />
            </div>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label for="notes">Notes</label>
            <textarea
              id="notes"
              v-model="formData.notes"
              rows="3"
              class="form-control"
              placeholder="Optional notes or reason for absence..."
            ></textarea>
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
              {{ isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { Absence, AbsenceType, CreateAbsenceRequest, UpdateAbsenceRequest } from '@shared/types/absence';

interface Props {
  modelValue: boolean;
  staffId: number;
  staffName: string;
  absence?: Absence | null;
  defaultDate?: string; // For quick creation from DayView
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'submit': [data: CreateAbsenceRequest | { id: number; updates: UpdateAbsenceRequest }];
}>();

const isEditing = computed(() => !!props.absence);

const formData = ref({
  absenceType: '' as AbsenceType | '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  notes: '',
});

const isSubmitting = ref(false);
const errorMessage = ref('');

// Initialize form when modal opens or absence changes
watch([() => props.modelValue, () => props.absence], () => {
  if (props.modelValue) {
    if (props.absence) {
      // Editing existing absence
      const startDt = new Date(props.absence.startDatetime);
      const endDt = new Date(props.absence.endDatetime);
      
      formData.value = {
        absenceType: props.absence.absenceType,
        startDate: startDt.toISOString().split('T')[0],
        startTime: startDt.toTimeString().slice(0, 5),
        endDate: endDt.toISOString().split('T')[0],
        endTime: endDt.toTimeString().slice(0, 5),
        notes: props.absence.notes || '',
      };
    } else {
      // Creating new absence
      const now = new Date();
      const defaultDate = props.defaultDate || now.toISOString().split('T')[0];
      
      formData.value = {
        absenceType: '',
        startDate: defaultDate,
        startTime: now.toTimeString().slice(0, 5),
        endDate: defaultDate,
        endTime: now.toTimeString().slice(0, 5),
        notes: '',
      };
    }
    errorMessage.value = '';
  }
}, { immediate: true });

const closeModal = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  errorMessage.value = '';

  // Validate dates
  const startDatetime = new Date(`${formData.value.startDate}T${formData.value.startTime}`);
  const endDatetime = new Date(`${formData.value.endDate}T${formData.value.endTime}`);

  if (endDatetime <= startDatetime) {
    errorMessage.value = 'End date/time must be after start date/time';
    return;
  }

  isSubmitting.value = true;

  try {
    if (isEditing.value && props.absence) {
      // Update existing absence
      const updates: UpdateAbsenceRequest = {
        absenceType: formData.value.absenceType as AbsenceType,
        startDatetime: startDatetime.toISOString(),
        endDatetime: endDatetime.toISOString(),
        notes: formData.value.notes || undefined,
      };
      emit('submit', { id: props.absence.id, updates });
    } else {
      // Create new absence
      const data: CreateAbsenceRequest = {
        staffId: props.staffId,
        absenceType: formData.value.absenceType as AbsenceType,
        startDatetime: startDatetime.toISOString(),
        endDatetime: endDatetime.toISOString(),
        notes: formData.value.notes || undefined,
      };
      emit('submit', data);
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to save absence';
  } finally {
    isSubmitting.value = false;
  }
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
  max-width: 600px;
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

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.form-control {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--color-background);
  color: var(--color-text-primary);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

textarea.form-control {
  resize: vertical;
  font-family: inherit;
}

.error-message {
  padding: 0.75rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  color: #dc2626;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary {
  background-color: var(--color-surface-variant);
  color: var(--color-text-primary);
}

.btn-secondary:hover {
  background-color: var(--color-hover);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

