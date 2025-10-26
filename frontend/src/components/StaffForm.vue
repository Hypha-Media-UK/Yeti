<template>
  <form @submit.prevent="handleSubmit" class="staff-form">
    <div class="form-group">
      <label for="firstName" class="form-label">First Name *</label>
      <input
        id="firstName"
        v-model="formData.firstName"
        type="text"
        class="form-input"
        required
      />
    </div>

    <div class="form-group">
      <label for="lastName" class="form-label">Last Name *</label>
      <input
        id="lastName"
        v-model="formData.lastName"
        type="text"
        class="form-input"
        required
      />
    </div>

    <div class="form-group">
      <label for="status" class="form-label">Status *</label>
      <select
        id="status"
        v-model="formData.status"
        class="form-input"
        required
        @change="handleStatusChange"
      >
        <option value="Regular">Regular</option>
        <option value="Relief">Relief</option>
        <option value="Supervisor">Supervisor</option>
      </select>
    </div>

    <div v-if="formData.status === 'Regular'" class="form-group">
      <label for="group" class="form-label">Group *</label>
      <select
        id="group"
        v-model="formData.group"
        class="form-input"
        required
      >
        <option value="Day">Day</option>
        <option value="Night">Night</option>
      </select>
    </div>

    <div class="form-group">
      <label for="department" class="form-label">Department</label>
      <select
        id="department"
        v-model="formData.departmentId"
        class="form-input"
      >
        <option :value="null">No Department</option>
        <optgroup v-for="building in buildingsWithDepartments" :key="building.id" :label="building.name">
          <option
            v-for="dept in building.departments"
            :key="dept.id"
            :value="dept.id"
          >
            {{ dept.name }}
          </option>
        </optgroup>
      </select>
      <p class="form-hint">Optional: Assign staff to a specific department</p>
    </div>

    <div class="form-group">
      <label for="daysOffset" class="form-label">Days Offset</label>
      <input
        id="daysOffset"
        v-model.number="formData.daysOffset"
        type="number"
        class="form-input"
        min="0"
        :max="formData.status === 'Supervisor' ? 15 : 7"
      />
      <p class="form-hint">
        {{ formData.status === 'Supervisor' ? '0-15 for supervisors (16-day cycle)' : '0-7 for regular staff (8-day cycle)' }}
      </p>
    </div>

    <div v-if="error" class="form-error">
      {{ error }}
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">
        Cancel
      </button>
      <button type="submit" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Saving...' : (staff ? 'Update' : 'Create') }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import type { StaffMember, StaffStatus, ShiftGroup } from '@shared/types/staff';
import type { Building } from '@shared/types/building';
import type { Department } from '@shared/types/department';

interface Props {
  staff?: StaffMember | null;
  buildings?: Building[];
  departments?: Department[];
}

const props = withDefaults(defineProps<Props>(), {
  buildings: () => [],
  departments: () => [],
});

const emit = defineEmits<{
  submit: [data: Partial<StaffMember>];
  cancel: [];
}>();

const loading = ref(false);
const error = ref('');

const formData = reactive({
  firstName: props.staff?.firstName || '',
  lastName: props.staff?.lastName || '',
  status: (props.staff?.status || 'Regular') as StaffStatus,
  group: (props.staff?.group || 'Day') as ShiftGroup | null,
  departmentId: props.staff?.departmentId || null,
  daysOffset: props.staff?.daysOffset || 0,
});

// Organize departments by building for grouped select
const buildingsWithDepartments = computed(() => {
  return props.buildings
    .map(building => ({
      ...building,
      departments: props.departments.filter(d => d.buildingId === building.id),
    }))
    .filter(building => building.departments.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Auto-set cycle type and group based on status
const handleStatusChange = () => {
  if (formData.status === 'Relief') {
    formData.group = null;
    formData.daysOffset = 0;
  } else if (formData.status === 'Supervisor') {
    formData.group = null;
  } else if (formData.status === 'Regular' && !formData.group) {
    formData.group = 'Day';
  }
};

const handleSubmit = () => {
  error.value = '';
  loading.value = true;

  const cycleType = formData.status === 'Supervisor' ? 'supervisor' : 
                    formData.status === 'Regular' ? '4-on-4-off' : null;

  const data: Partial<StaffMember> = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    status: formData.status,
    group: formData.status === 'Regular' ? formData.group : null,
    departmentId: formData.departmentId,
    cycleType,
    daysOffset: formData.daysOffset,
    isActive: true,
  };

  emit('submit', data);
  loading.value = false;
};

// Watch for prop changes (when editing)
watch(() => props.staff, (newStaff) => {
  if (newStaff) {
    formData.firstName = newStaff.firstName;
    formData.lastName = newStaff.lastName;
    formData.status = newStaff.status;
    formData.group = newStaff.group;
    formData.daysOffset = newStaff.daysOffset;
  }
}, { immediate: true });
</script>

<style scoped>
.staff-form {
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
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  transition: var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-hint {
  font-size: var(--font-size-secondary);
  color: var(--color-text-secondary);
  margin: 0;
}

.form-error {
  padding: var(--spacing-2);
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body-sm);
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  margin-top: var(--spacing-2);
}

.btn {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-base);
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}
</style>

