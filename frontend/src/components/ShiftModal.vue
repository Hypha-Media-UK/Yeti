<template>
  <BaseModal 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    :title="shift ? 'Edit Shift' : 'Add Shift'" 
    modal-class="shift-form"
  >
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="shiftName" class="form-label">Shift Name *</label>
        <input
          id="shiftName"
          v-model="formData.name"
          type="text"
          class="form-input"
          required
          placeholder="e.g., A Shift, B Shift, Day Shift"
        />
      </div>

      <div class="form-group">
        <label for="shiftType" class="form-label">Shift Type *</label>
        <select
          id="shiftType"
          v-model="formData.type"
          class="form-input"
          required
        >
          <option value="day">Day</option>
          <option value="night">Night</option>
        </select>
        <p class="form-hint">Determines which column staff appear in on the rota</p>
      </div>

      <div class="form-group">
        <label for="shiftColor" class="form-label">Color *</label>
        <div class="color-picker-group">
          <input
            id="shiftColor"
            v-model="formData.color"
            type="color"
            class="color-input"
            required
          />
          <input
            v-model="formData.color"
            type="text"
            class="form-input color-text"
            pattern="^#[0-9A-Fa-f]{6}$"
            placeholder="#3B82F6"
            required
          />
        </div>
        <p class="form-hint">Used for visual identification in the UI</p>
      </div>

      <div class="form-group">
        <label for="shiftDescription" class="form-label">Description</label>
        <textarea
          id="shiftDescription"
          v-model="formData.description"
          class="form-input"
          rows="2"
          placeholder="Optional description of this shift"
        />
      </div>

      <div class="form-group">
        <label for="cycleType" class="form-label">Cycle Type *</label>
        <select
          id="cycleType"
          v-model="formData.cycleType"
          class="form-input"
          required
        >
          <option value="4-on-4-off">4-on-4-off (Regular 8-day cycle)</option>
          <option value="16-day-supervisor">16-day Supervisor (4 day, 4 off, 4 night, 4 off)</option>
          <option value="relief">Relief (No cycle, manual assignments only)</option>
          <option value="fixed">Fixed Schedule (Uses fixed_schedules table)</option>
        </select>
        <p class="form-hint">Determines the rotation pattern for this shift</p>
      </div>

      <div v-if="formData.cycleType !== 'relief' && formData.cycleType !== 'fixed'" class="form-group">
        <label for="cycleLength" class="form-label">Cycle Length (days) *</label>
        <input
          id="cycleLength"
          v-model.number="formData.cycleLength"
          type="number"
          class="form-input"
          min="1"
          max="365"
          required
          :placeholder="formData.cycleType === '16-day-supervisor' ? '16' : '8'"
        />
        <p class="form-hint">
          {{ formData.cycleType === '16-day-supervisor'
            ? 'Typically 16 days for supervisor shifts'
            : 'Typically 8 days for regular shifts (4 on, 4 off)' }}
        </p>
      </div>

      <div class="form-group">
        <label for="daysOffset" class="form-label">Days Offset *</label>
        <input
          id="daysOffset"
          v-model.number="formData.daysOffset"
          type="number"
          class="form-input"
          min="0"
          :max="formData.cycleLength || 365"
          required
        />
        <p class="form-hint">
          Offset from app zero date ({{ appZeroDate }}).
          {{ formData.cycleType === 'relief' || formData.cycleType === 'fixed'
            ? 'Not used for relief/fixed shifts, but required for database.'
            : `Must be 0-${(formData.cycleLength || 8) - 1} for ${formData.cycleLength || 8}-day cycles.` }}
        </p>
      </div>

      <div v-if="shift" class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="formData.isActive"
            class="checkbox-input"
          />
          <span>Active</span>
        </label>
        <p class="form-hint">Inactive shifts cannot be assigned to new staff</p>
      </div>

      <div v-if="error" class="form-error">
        {{ error }}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('update:modelValue', false)">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : (shift ? 'Update' : 'Create') }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import BaseModal from './BaseModal.vue';
import type { Shift, CycleType } from '@shared/types/shift';
import { api } from '@/services/api';

interface Props {
  modelValue: boolean;
  shift?: Shift | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: {
    name: string;
    type: 'day' | 'night';
    color: string;
    description: string | null;
    cycleType: CycleType | null;
    cycleLength: number | null;
    daysOffset: number;
    isActive?: boolean;
  }];
}>();

const loading = ref(false);
const error = ref('');
const appZeroDate = ref('Loading...');

// Fetch app zero date for display
api.getConfig('app_zero_date').then(config => {
  appZeroDate.value = config.value || 'Not set';
}).catch(() => {
  appZeroDate.value = 'Error loading';
});

const formData = reactive({
  name: props.shift?.name || '',
  type: props.shift?.type || 'day' as 'day' | 'night',
  color: props.shift?.color || '#3B82F6',
  description: props.shift?.description || '',
  cycleType: (props.shift?.cycleType || '4-on-4-off') as CycleType,
  cycleLength: props.shift?.cycleLength || 8,
  daysOffset: props.shift?.daysOffset || 0,
  isActive: props.shift?.isActive !== undefined ? props.shift.isActive : true,
});

const handleSubmit = () => {
  error.value = '';

  // Validate color format
  if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
    error.value = 'Color must be in hex format (e.g., #3B82F6)';
    return;
  }

  // Validate cycle length for non-relief/fixed shifts
  if (formData.cycleType !== 'relief' && formData.cycleType !== 'fixed') {
    if (!formData.cycleLength || formData.cycleLength < 1) {
      error.value = 'Cycle length must be at least 1 day';
      return;
    }

    // Validate offset is within cycle length
    if (formData.daysOffset >= formData.cycleLength) {
      error.value = `Days offset must be less than cycle length (0-${formData.cycleLength - 1})`;
      return;
    }
  }

  // Validate offset is non-negative
  if (formData.daysOffset < 0) {
    error.value = 'Days offset cannot be negative';
    return;
  }

  loading.value = true;

  const data: any = {
    name: formData.name.trim(),
    type: formData.type,
    color: formData.color.toUpperCase(),
    description: formData.description?.trim() || null,
    cycleType: formData.cycleType,
    cycleLength: formData.cycleType === 'relief' || formData.cycleType === 'fixed' ? null : formData.cycleLength,
    daysOffset: formData.daysOffset,
  };

  // Only include isActive when editing
  if (props.shift) {
    data.isActive = formData.isActive;
  }

  emit('submit', data);
  loading.value = false;
};

// Watch for prop changes (when editing)
watch(() => props.shift, (newShift) => {
  if (newShift) {
    formData.name = newShift.name;
    formData.type = newShift.type;
    formData.color = newShift.color;
    formData.description = newShift.description || '';
    formData.cycleType = newShift.cycleType || '4-on-4-off';
    formData.cycleLength = newShift.cycleLength || 8;
    formData.daysOffset = newShift.daysOffset || 0;
    formData.isActive = newShift.isActive;
  } else {
    formData.name = '';
    formData.type = 'day';
    formData.color = '#3B82F6';
    formData.description = '';
    formData.cycleType = '4-on-4-off';
    formData.cycleLength = 8;
    formData.daysOffset = 0;
    formData.isActive = true;
  }
}, { immediate: true });

// Auto-set cycle length based on cycle type
watch(() => formData.cycleType, (newType) => {
  if (newType === '16-day-supervisor') {
    formData.cycleLength = 16;
  } else if (newType === '4-on-4-off') {
    formData.cycleLength = 8;
  } else if (newType === 'relief' || newType === 'fixed') {
    formData.cycleLength = null as any;
  }

  // Reset offset if it's now out of range
  if (formData.cycleLength && formData.daysOffset >= formData.cycleLength) {
    formData.daysOffset = 0;
  }
});
</script>

<style scoped>
.shift-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
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

select.form-input {
  cursor: pointer;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.color-picker-group {
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.color-input {
  width: 60px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  cursor: pointer;
  padding: 2px;
}

.color-text {
  flex: 1;
  font-family: monospace;
}

.form-hint {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: var(--font-size-body);
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.form-error {
  padding: var(--spacing-2);
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-card);
  font-size: var(--font-size-body-sm);
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  margin-top: var(--spacing-2);
}
</style>

<!-- Unscoped button styles to ensure global classes work -->
<style>
.shift-form .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1);
  padding: 0.625rem var(--spacing-2);
  font-family: var(--font-family);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border: none;
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: background-color var(--transition-enter),
              box-shadow var(--transition-enter);
  white-space: nowrap;
}

.shift-form .btn:hover:not(:disabled) {
  box-shadow: var(--shadow-low);
}

.shift-form .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.shift-form .btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.shift-form .btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.shift-form .btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.shift-form .btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg);
  border-color: var(--color-text-secondary);
}
</style>

