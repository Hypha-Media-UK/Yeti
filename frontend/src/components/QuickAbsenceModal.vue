<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Mark Absence</h2>
        <button class="close-button" @click="closeModal" aria-label="Close">×</button>
      </div>

      <div class="modal-body">
        <div class="staff-info">
          <strong>{{ staffMember.firstName }} {{ staffMember.lastName }}</strong>
          <span class="shift-badge" :class="`shift-${shiftType}`">
            {{ shiftType === 'day' ? 'Day Shift' : 'Night Shift' }}
          </span>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="absence-type" class="form-label">Absence Type *</label>
            <select
              id="absence-type"
              v-model="formData.absenceType"
              class="form-control"
              required
            >
              <option value="">Select type...</option>
              <option value="sickness">Sickness</option>
              <option value="annual_leave">Annual Leave</option>
              <option value="training">Training</option>
              <option value="absence">Absence (General)</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="start-date" class="form-label">Start Date *</label>
              <input
                id="start-date"
                type="date"
                v-model="formData.startDate"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="start-time" class="form-label">Start Time *</label>
              <input
                id="start-time"
                type="time"
                v-model="formData.startTime"
                class="form-control"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="end-date" class="form-label">End Date *</label>
              <input
                id="end-date"
                type="date"
                v-model="formData.endDate"
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label for="end-time" class="form-label">End Time *</label>
              <input
                id="end-time"
                type="time"
                v-model="formData.endTime"
                class="form-control"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="notes" class="form-label">Notes (Optional)</label>
            <textarea
              id="notes"
              v-model="formData.notes"
              class="form-control"
              rows="3"
              placeholder="Additional information about this absence..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Quick Duration</label>
            <div class="quick-actions">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="setQuickDuration('rest-of-shift')"
              >
                Rest of Shift
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="setQuickDuration('1-hour')"
              >
                1 Hour
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="setQuickDuration('2-hours')"
              >
                2 Hours
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="setQuickDuration('full-day')"
              >
                Full Day
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Create Absence
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { StaffMember } from '@shared/types/staff';
import type { AbsenceType, CreateAbsenceRequest } from '@shared/types/absence';
import { format, addHours, parseISO } from 'date-fns';

interface Props {
  modelValue: boolean;
  staffMember: StaffMember;
  shiftType: 'day' | 'night';
  currentDate: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [absence: CreateAbsenceRequest];
}>();

const formData = ref({
  absenceType: '' as AbsenceType | '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  notes: '',
});

// Initialize form with current date/time when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    
    formData.value = {
      absenceType: '',
      startDate: props.currentDate,
      startTime: currentTime,
      endDate: props.currentDate,
      endTime: format(addHours(now, 1), 'HH:mm'),
      notes: '',
    };
  }
});

function closeModal() {
  emit('update:modelValue', false);
}

function setQuickDuration(duration: string) {
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  
  formData.value.startDate = props.currentDate;
  formData.value.startTime = currentTime;
  formData.value.endDate = props.currentDate;

  switch (duration) {
    case 'rest-of-shift':
      // Set end time to end of current shift
      formData.value.endTime = props.shiftType === 'day' ? '20:00' : '08:00';
      if (props.shiftType === 'night') {
        // Night shift ends next day
        const nextDay = new Date(props.currentDate);
        nextDay.setDate(nextDay.getDate() + 1);
        formData.value.endDate = format(nextDay, 'yyyy-MM-dd');
      }
      break;
    case '1-hour':
      formData.value.endTime = format(addHours(now, 1), 'HH:mm');
      break;
    case '2-hours':
      formData.value.endTime = format(addHours(now, 2), 'HH:mm');
      break;
    case 'full-day':
      formData.value.startTime = '00:00';
      formData.value.endTime = '23:59';
      break;
  }
}

function handleSubmit() {
  if (!formData.value.absenceType) {
    return;
  }

  const startDatetime = `${formData.value.startDate}T${formData.value.startTime}:00`;
  const endDatetime = `${formData.value.endDate}T${formData.value.endTime}:00`;

  // Validate end is after start
  if (new Date(endDatetime) <= new Date(startDatetime)) {
    alert('End date/time must be after start date/time');
    return;
  }

  const absence: CreateAbsenceRequest = {
    staffId: props.staffMember.id,
    absenceType: formData.value.absenceType as AbsenceType,
    startDatetime,
    endDatetime,
    notes: formData.value.notes || undefined,
  };

  emit('submit', absence);
  closeModal();
}
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
  padding: var(--spacing-4);
}

.modal-content {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-large);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
}

.modal-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

/* Close button styles inherited from global main.css */

.modal-body {
  padding: var(--spacing-4);
}

.staff-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background-color: var(--color-bg);
  border-radius: var(--radius-button);
  margin-bottom: var(--spacing-4);
}

.shift-badge {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
}

.shift-badge.shift-day {
  background-color: var(--color-day-shift-light);
  color: var(--color-day-shift);
}

.shift-badge.shift-night {
  background-color: var(--color-night-shift-light);
  color: var(--color-night-shift);
}

.form-group {
  margin-bottom: var(--spacing-3);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-1);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  font-size: var(--font-size-body-sm);
}

.form-control {
  width: 100%;
  padding: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  transition: border-color var(--transition-enter);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.quick-actions {
  display: flex;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
  flex-wrap: wrap;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-border);
}

/* Button styles inherited from global main.css */

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

