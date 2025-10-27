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
import { ref, reactive, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import type { Shift } from '@shared/types/shift';

interface Props {
  modelValue: boolean;
  shift?: Shift | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: { name: string; type: 'day' | 'night'; color: string; description: string | null; isActive?: boolean }];
}>();

const loading = ref(false);
const error = ref('');

const formData = reactive({
  name: props.shift?.name || '',
  type: props.shift?.type || 'day' as 'day' | 'night',
  color: props.shift?.color || '#3B82F6',
  description: props.shift?.description || '',
  isActive: props.shift?.isActive !== undefined ? props.shift.isActive : true,
});

const handleSubmit = () => {
  error.value = '';
  
  // Validate color format
  if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
    error.value = 'Color must be in hex format (e.g., #3B82F6)';
    return;
  }

  loading.value = true;

  const data: any = {
    name: formData.name.trim(),
    type: formData.type,
    color: formData.color.toUpperCase(),
    description: formData.description?.trim() || null,
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
    formData.isActive = newShift.isActive;
  } else {
    formData.name = '';
    formData.type = 'day';
    formData.color = '#3B82F6';
    formData.description = '';
    formData.isActive = true;
  }
}, { immediate: true });
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

