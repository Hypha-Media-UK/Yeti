<template>
  <BaseModal 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    title="Temporary Area Assignment" 
    modal-class="temporary-assignment-form"
  >
    <form @submit.prevent="handleSubmit">
      <div class="staff-info-section">
        <div class="staff-name">{{ staffMember.firstName }} {{ staffMember.lastName }}</div>
        <div class="staff-meta">
          <span class="badge badge-status">{{ staffMember.status }}</span>
          <span class="badge badge-shift" :class="`badge-${shiftType}`">
            {{ shiftType === 'day' ? 'Day' : 'Night' }} Shift
          </span>
        </div>
      </div>

      <div class="form-group">
        <label for="area" class="form-label">Area *</label>
        <select
          id="area"
          v-model="formData.selectedArea"
          class="form-input"
          required
        >
          <option :value="null" disabled>Select an area</option>
          <optgroup v-if="departments.length > 0" label="Departments">
            <option
              v-for="dept in departments"
              :key="`dept-${dept.id}`"
              :value="{ type: 'department', id: dept.id, name: dept.name }"
            >
              {{ dept.name }}
            </option>
          </optgroup>
          <optgroup v-if="services.length > 0" label="Services">
            <option
              v-for="service in services"
              :key="`service-${service.id}`"
              :value="{ type: 'service', id: service.id, name: service.name }"
            >
              {{ service.name }}
            </option>
          </optgroup>
        </select>
        <p class="form-hint">Select the area to temporarily assign this staff member to</p>
      </div>

      <div class="time-range-group">
        <div class="form-group">
          <label for="startTime" class="form-label">Start Time *</label>
          <input
            id="startTime"
            v-model="formData.startTime"
            type="time"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label for="endTime" class="form-label">End Time *</label>
          <input
            id="endTime"
            v-model="formData.endTime"
            type="time"
            class="form-input"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Duration *</label>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              v-model="formData.durationType"
              value="today"
              name="durationType"
            />
            <span>Today only</span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              v-model="formData.durationType"
              value="range"
              name="durationType"
            />
            <span>Date range</span>
          </label>
        </div>
      </div>

      <div v-if="formData.durationType === 'range'" class="date-range-group">
        <div class="form-group">
          <label for="startDate" class="form-label">Start Date *</label>
          <input
            id="startDate"
            v-model="formData.startDate"
            type="date"
            class="form-input"
            :min="currentDate"
            required
          />
        </div>

        <div class="form-group">
          <label for="endDate" class="form-label">End Date *</label>
          <input
            id="endDate"
            v-model="formData.endDate"
            type="date"
            class="form-input"
            :min="formData.startDate || currentDate"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="notes" class="form-label">Notes</label>
        <textarea
          id="notes"
          v-model="formData.notes"
          class="form-input"
          rows="2"
          placeholder="Optional notes about this assignment"
        />
      </div>

      <div v-if="error" class="form-error">
        {{ error }}
      </div>

      <div class="assignment-summary" v-if="formData.selectedArea">
        <strong>Summary:</strong>
        <p>
          {{ formData.selectedArea.name }}: {{ formData.startTime }} to {{ formData.endTime }}
          <span v-if="formData.durationType === 'today'">, Today</span>
          <span v-else-if="formData.startDate && formData.endDate">
            , {{ formatDate(formData.startDate) }} to {{ formatDate(formData.endDate) }}
          </span>
        </p>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('update:modelValue', false)">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Creating...' : 'Create Assignment' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import type { StaffMember } from '@shared/types/staff';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';
import type { ShiftType } from '@shared/types/shift';

interface AreaOption {
  type: 'department' | 'service';
  id: number;
  name: string;
}

interface Props {
  modelValue: boolean;
  staffMember: StaffMember;
  shiftType: ShiftType;
  currentDate: string;
  departments: Department[];
  services: Service[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: {
    staffId: number;
    areaType: 'department' | 'service';
    areaId: number;
    assignmentDate: string;
    endDate: string | null;
    shiftType: ShiftType;
    startTime: string;
    endTime: string;
    notes: string | null;
  }];
}>();

const loading = ref(false);
const error = ref('');

const formData = reactive({
  selectedArea: null as AreaOption | null,
  startTime: '08:00',
  endTime: '16:00',
  durationType: 'today' as 'today' | 'range',
  startDate: props.currentDate,
  endDate: props.currentDate,
  notes: '',
});

const handleSubmit = () => {
  error.value = '';

  // Validation
  if (!formData.selectedArea) {
    error.value = 'Please select an area';
    return;
  }

  if (!formData.startTime || !formData.endTime) {
    error.value = 'Please specify start and end times';
    return;
  }

  // Validate time range
  if (formData.startTime >= formData.endTime) {
    error.value = 'End time must be after start time';
    return;
  }

  // Validate date range if applicable
  if (formData.durationType === 'range') {
    if (!formData.startDate || !formData.endDate) {
      error.value = 'Please specify start and end dates';
      return;
    }
    if (formData.startDate > formData.endDate) {
      error.value = 'End date must be after start date';
      return;
    }
  }

  loading.value = true;

  const assignmentData = {
    staffId: props.staffMember.id,
    areaType: formData.selectedArea.type,
    areaId: formData.selectedArea.id,
    assignmentDate: formData.durationType === 'today' ? props.currentDate : formData.startDate,
    endDate: formData.durationType === 'range' ? formData.endDate : null,
    shiftType: props.shiftType,
    startTime: formData.startTime,
    endTime: formData.endTime,
    notes: formData.notes.trim() || null,
  };

  emit('submit', assignmentData);
  loading.value = false;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Reset form when modal opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    formData.selectedArea = null;
    formData.startTime = '08:00';
    formData.endTime = '16:00';
    formData.durationType = 'today';
    formData.startDate = props.currentDate;
    formData.endDate = props.currentDate;
    formData.notes = '';
    error.value = '';
  }
});
</script>

<style scoped>
.temporary-assignment-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.staff-info-section {
  padding: var(--spacing-2);
  background-color: var(--color-background);
  border-radius: var(--radius-button);
  border-left: 4px solid var(--color-primary);
}

.staff-name {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-1);
}

.staff-meta {
  display: flex;
  gap: var(--spacing-2);
}

.badge {
  padding: 0.25rem 0.5rem;
  font-size: var(--font-size-secondary);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-badge);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-status {
  background-color: #E0E7FF;
  color: var(--color-primary);
}

.badge-shift {
  font-weight: var(--font-weight-medium);
}

.badge-day {
  background-color: var(--color-day-shift-light);
  color: var(--color-day-shift);
}

.badge-night {
  background-color: var(--color-night-shift-light);
  color: var(--color-night-shift);
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
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-hint {
  font-size: var(--font-size-secondary);
  color: var(--color-text-secondary);
  margin: 0;
}

.time-range-group,
.date-range-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.radio-group {
  display: flex;
  gap: var(--spacing-3);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  cursor: pointer;
  font-size: var(--font-size-body);
}

.radio-option input[type="radio"] {
  cursor: pointer;
}

.assignment-summary {
  padding: var(--spacing-2);
  background-color: #F0F9FF;
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body-sm);
}

.assignment-summary strong {
  display: block;
  margin-bottom: var(--spacing-1);
  color: var(--color-text-primary);
}

.assignment-summary p {
  margin: 0;
  color: var(--color-text-secondary);
}

.form-error {
  padding: var(--spacing-2);
  background-color: #FEE2E2;
  border-left: 4px solid var(--color-error);
  border-radius: var(--radius-button);
  color: var(--color-error);
  font-size: var(--font-size-body-sm);
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
}
</style>

