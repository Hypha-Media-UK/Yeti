<template>
  <BaseModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :title="service ? 'Edit Service' : 'Add Service'" modal-class="service-form">
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="serviceName" class="form-label">Service Name *</label>
        <input
          id="serviceName"
          v-model="formData.name"
          type="text"
          class="form-input"
          required
        />
      </div>

      <div class="form-group">
        <label for="serviceDescription" class="form-label">Description</label>
        <textarea
          id="serviceDescription"
          v-model="formData.description"
          class="form-input"
          rows="2"
        />
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="formData.includeInMainRota"
            class="checkbox-input"
          />
          <span>Include in Main Rota</span>
        </label>
        <p class="form-hint">When enabled, this service will be displayed on the main rota screen</p>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="formData.is24_7"
            class="checkbox-input"
          />
          <span>Operates 24/7/365</span>
        </label>
        <p class="form-hint">When enabled, operational hours are not required</p>
      </div>

      <div v-if="!formData.is24_7" class="form-group">
        <OperationalHoursEditor
          v-model="formData.operationalHours"
          title="Operational Hours"
          :show-copy-from="false"
        />
      </div>

      <!-- Minimum Staffing Requirements -->
      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="formData.requiresMinimumStaffing"
            class="checkbox-input"
          />
          <span>Requires Minimum Staffing</span>
        </label>
        <p class="form-hint">When enabled, this service will be flagged if understaffed</p>
      </div>

      <div v-if="formData.requiresMinimumStaffing" class="form-group">
        <StaffingRequirementsEditor
          v-model="formData.staffingRequirements"
        />
      </div>

      <div v-if="error" class="form-error">
        {{ error }}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('update:modelValue', false)">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : (service ? 'Update' : 'Create') }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import OperationalHoursEditor from './OperationalHoursEditor.vue';
import StaffingRequirementsEditor from './StaffingRequirementsEditor.vue';
import { api } from '../services/api';
import type { Service } from '@shared/types/service';

interface HoursEntry {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface StaffingRequirement {
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  requiredStaff: number;
}

interface Props {
  modelValue: boolean;
  service?: Service | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: {
    name: string;
    description: string | null;
    includeInMainRota: boolean;
    is24_7: boolean;
    operationalHours: HoursEntry[];
    requiresMinimumStaffing: boolean;
    staffingRequirements: StaffingRequirement[];
  }];
}>();

const loading = ref(false);
const error = ref('');

const formData = reactive({
  name: props.service?.name || '',
  description: props.service?.description || '',
  includeInMainRota: Boolean(props.service?.includeInMainRota),
  is24_7: Boolean(props.service?.is24_7),
  operationalHours: [] as HoursEntry[],
  requiresMinimumStaffing: Boolean(props.service?.requiresMinimumStaffing),
  staffingRequirements: [] as StaffingRequirement[],
});

const handleSubmit = () => {
  error.value = '';
  loading.value = true;

  const data = {
    name: formData.name.trim(),
    description: formData.description?.trim() || null,
    includeInMainRota: formData.includeInMainRota,
    is24_7: formData.is24_7,
    operationalHours: formData.operationalHours,
    requiresMinimumStaffing: formData.requiresMinimumStaffing,
    staffingRequirements: formData.staffingRequirements,
  };

  emit('submit', data);
  loading.value = false;
};



// Watch for prop changes (when editing)
watch(() => props.service, async (newService) => {
  if (newService) {
    formData.name = newService.name;
    formData.description = newService.description || '';
    formData.includeInMainRota = Boolean(newService.includeInMainRota);
    formData.is24_7 = Boolean(newService.is24_7);
    formData.requiresMinimumStaffing = Boolean(newService.requiresMinimumStaffing);

    // Load operational hours
    try {
      const response = await api.getOperationalHoursByArea('service', newService.id);
      formData.operationalHours = response.operationalHours.map(h => ({
        id: h.id,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime.substring(0, 5), // Convert "HH:mm:ss" to "HH:mm"
        endTime: h.endTime.substring(0, 5),
      }));
    } catch (error) {
      console.error('Failed to load operational hours:', error);
      formData.operationalHours = [];
    }

    // Load staffing requirements
    if (newService.requiresMinimumStaffing) {
      try {
        const response = await api.getStaffingRequirements('service', newService.id);
        formData.staffingRequirements = response.requirements.map((r: any) => ({
          dayOfWeek: r.dayOfWeek,
          timeStart: r.timeStart.substring(0, 5),
          timeEnd: r.timeEnd.substring(0, 5),
          requiredStaff: r.requiredStaff,
        }));
      } catch (error) {
        console.error('Failed to load staffing requirements:', error);
        formData.staffingRequirements = [];
      }
    } else {
      formData.staffingRequirements = [];
    }
  } else {
    formData.name = '';
    formData.description = '';
    formData.includeInMainRota = false;
    formData.is24_7 = false;
    formData.operationalHours = [];
    formData.requiresMinimumStaffing = false;
    formData.staffingRequirements = [];
  }
}, { immediate: true });
</script>

<style scoped>
.service-form {
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

textarea.form-input {
  resize: vertical;
  min-height: 80px;
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

.form-hint {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}
</style>

<!-- Unscoped button styles to ensure global classes work -->
<style>
.service-form .btn {
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

.service-form .btn:hover:not(:disabled) {
  box-shadow: var(--shadow-low);
}

.service-form .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.service-form .btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.service-form .btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.service-form .btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.service-form .btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg);
  border-color: var(--color-text-secondary);
}
</style>

