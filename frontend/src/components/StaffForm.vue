<template>
  <form @submit.prevent="handleSubmit" class="staff-form">
    <!-- First Name & Last Name (side by side) -->
    <div class="form-row">
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
    </div>

    <!-- Status & Shift (side by side) -->
    <div class="form-row">
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
        <label for="shift" class="form-label">Shift {{ hasAllocations ? '' : '*' }}</label>
        <select
          id="shift"
          v-model="formData.shiftId"
          class="form-input"
          :required="!hasAllocations"
        >
          <option :value="null" :disabled="!hasAllocations">
            {{ hasAllocations ? 'No Shift (Permanently Assigned)' : 'Select a shift' }}
          </option>
          <optgroup label="Day Shifts">
            <option
              v-for="shift in dayShifts"
              :key="shift.id"
              :value="shift.id"
            >
              {{ shift.name }}
            </option>
          </optgroup>
          <optgroup label="Night Shifts">
            <option
              v-for="shift in nightShifts"
              :key="shift.id"
              :value="shift.id"
            >
              {{ shift.name }}
            </option>
          </optgroup>
        </select>
        <p class="form-hint">
          {{ hasAllocations
            ? 'Staff with permanent area assignments should select "No Shift"'
            : 'Pool staff must be assigned to a shift group'
          }}
        </p>
      </div>
    </div>

    <!-- Custom Shift Times (only show if staff has a shift) -->
    <div v-if="formData.shiftId !== null" class="form-group">
      <label class="form-label">Custom Shift Times (Optional)</label>
      <div class="time-range-group">
        <div class="time-input-wrapper">
          <label for="customShiftStart" class="time-label">Start Time</label>
          <input
            id="customShiftStart"
            v-model="formData.customShiftStart"
            type="time"
            class="form-input"
            placeholder="HH:mm"
          />
        </div>
        <div class="time-input-wrapper">
          <label for="customShiftEnd" class="time-label">End Time</label>
          <input
            id="customShiftEnd"
            v-model="formData.customShiftEnd"
            type="time"
            class="form-input"
            placeholder="HH:mm"
          />
        </div>
      </div>
      <p class="form-hint">
        Leave blank to use default shift times. Set custom times for staff with non-standard hours (e.g., 10:00-22:00).
      </p>
    </div>

    <!-- Days Offset (only show if staff has a shift) -->
    <div v-if="formData.shiftId !== null" class="form-group">
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

    <!-- Department & Service (side by side) -->
    <div class="form-row">
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
        <label for="service" class="form-label">Service</label>
        <select
          id="service"
          v-model="formData.serviceId"
          class="form-input"
        >
          <option :value="null">No Service</option>
          <option
            v-for="service in services"
            :key="service.id"
            :value="service.id"
          >
            {{ service.name }}
          </option>
        </select>
        <p class="form-hint">Optional: Assign staff to a specific service</p>
      </div>
    </div>

    <!-- Contracted Hours -->
    <div class="form-group">
      <OperationalHoursEditor
        v-model="formData.contractedHours"
        title="Contracted Hours"
        :show-copy-from="false"
      />
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
import { ref, reactive, watch, computed, onMounted } from 'vue';
import OperationalHoursEditor from './OperationalHoursEditor.vue';
import { api } from '../services/api';
import type { StaffMember, StaffStatus } from '@shared/types/staff';
import type { Building } from '@shared/types/building';
import type { Department } from '@shared/types/department';
import type { Service } from '@shared/types/service';
import type { Shift } from '@shared/types/shift';
import type { AllocationWithDetails } from '@shared/types/allocation';

interface HoursEntry {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Props {
  staff?: StaffMember | null;
  staffAllocations?: AllocationWithDetails[];
  buildings?: Building[];
  departments?: Department[];
  services?: Service[];
}

const props = withDefaults(defineProps<Props>(), {
  staffAllocations: () => [],
  buildings: () => [],
  departments: () => [],
  services: () => [],
});

interface SubmitData {
  staff: Partial<StaffMember>;
  allocations: Array<{ areaType: 'department' | 'service'; areaId: number }>;
  contractedHours: HoursEntry[];
}

const emit = defineEmits<{
  submit: [data: SubmitData];
  cancel: [];
}>();

const loading = ref(false);
const error = ref('');
const shifts = ref<Shift[]>([]);

const formData = reactive({
  firstName: props.staff?.firstName || '',
  lastName: props.staff?.lastName || '',
  status: (props.staff?.status || 'Regular') as StaffStatus,
  shiftId: props.staff?.shiftId || null as number | null,
  departmentId: null as number | null,
  serviceId: null as number | null,
  daysOffset: props.staff?.daysOffset || 0,
  customShiftStart: props.staff?.customShiftStart?.substring(0, 5) || '',  // Convert "HH:mm:ss" to "HH:mm"
  customShiftEnd: props.staff?.customShiftEnd?.substring(0, 5) || '',      // Convert "HH:mm:ss" to "HH:mm"
  contractedHours: [] as HoursEntry[],
});

// Check if staff has permanent area allocations
const hasAllocations = computed(() => {
  return formData.departmentId !== null || formData.serviceId !== null;
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

// Organize shifts by type
const dayShifts = computed(() => {
  return shifts.value.filter(s => s.type === 'day' && s.isActive);
});

const nightShifts = computed(() => {
  return shifts.value.filter(s => s.type === 'night' && s.isActive);
});

// Auto-set cycle type and shift based on status
const handleStatusChange = () => {
  if (formData.status === 'Relief') {
    formData.shiftId = null;
    formData.daysOffset = 0;
  } else if (formData.status === 'Supervisor') {
    formData.shiftId = null;
  } else if (formData.status === 'Regular' && !formData.shiftId) {
    // If staff has allocations, set to null (No Shift)
    if (hasAllocations.value) {
      formData.shiftId = null;
    } else {
      // Auto-select first day shift if available for pool staff
      if (dayShifts.value.length > 0) {
        formData.shiftId = dayShifts.value[0].id;
      }
    }
  }
};

const handleSubmit = () => {
  error.value = '';

  // Build allocations array from selected department and service
  const allocations: Array<{ areaType: 'department' | 'service'; areaId: number }> = [];

  if (formData.departmentId) {
    allocations.push({ areaType: 'department', areaId: formData.departmentId });
  }

  if (formData.serviceId) {
    allocations.push({ areaType: 'service', areaId: formData.serviceId });
  }

  // Validation: Regular staff must have either a shift OR permanent allocations
  if (formData.status === 'Regular') {
    if (!formData.shiftId && allocations.length === 0) {
      error.value = 'Regular staff must either be assigned to a shift (for pool staff) or have permanent area assignments.';
      return;
    }
  }

  loading.value = true;

  const cycleType = formData.status === 'Supervisor' ? 'supervisor' :
                    formData.status === 'Regular' ? '4-on-4-off' : null;

  // Convert custom shift times to HH:mm:ss format or null
  const customShiftStart = formData.customShiftStart ? `${formData.customShiftStart}:00` : null;
  const customShiftEnd = formData.customShiftEnd ? `${formData.customShiftEnd}:00` : null;

  const staffData: Partial<StaffMember> = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    status: formData.status,
    shiftId: formData.status === 'Regular' ? formData.shiftId : null,
    cycleType,
    daysOffset: formData.daysOffset,
    customShiftStart,
    customShiftEnd,
    isActive: true,
  };

  emit('submit', { staff: staffData, allocations, contractedHours: formData.contractedHours });
  loading.value = false;
};



// Load shifts on mount
const loadShifts = async () => {
  try {
    const response = await api.getShifts();
    shifts.value = response.shifts;
  } catch (err) {
    console.error('Failed to load shifts:', err);
    error.value = 'Failed to load shifts. Please refresh the page.';
  }
};

onMounted(() => {
  loadShifts();
});

// Watch for prop changes (when editing)
watch(() => props.staff, async (newStaff) => {
  if (newStaff) {
    formData.firstName = newStaff.firstName;
    formData.lastName = newStaff.lastName;
    formData.status = newStaff.status;
    formData.shiftId = newStaff.shiftId;
    formData.daysOffset = newStaff.daysOffset;
    formData.customShiftStart = newStaff.customShiftStart?.substring(0, 5) || '';
    formData.customShiftEnd = newStaff.customShiftEnd?.substring(0, 5) || '';

    // Load contracted hours
    try {
      const response = await api.getContractedHoursByStaff(newStaff.id);
      formData.contractedHours = response.contractedHours.map(h => ({
        id: h.id,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime.substring(0, 5), // Convert "HH:mm:ss" to "HH:mm"
        endTime: h.endTime.substring(0, 5),
      }));
    } catch (error) {
      console.error('Failed to load contracted hours:', error);
      formData.contractedHours = [];
    }
  } else {
    formData.contractedHours = [];
  }
}, { immediate: true });

// Watch for allocation changes to populate form
watch(() => props.staffAllocations, (allocations) => {
  if (allocations && allocations.length > 0) {
    // Find department allocation
    const deptAlloc = allocations.find(a => a.areaType === 'department');
    formData.departmentId = deptAlloc ? deptAlloc.areaId : null;

    // Find service allocation
    const serviceAlloc = allocations.find(a => a.areaType === 'service');
    formData.serviceId = serviceAlloc ? serviceAlloc.areaId : null;
  } else {
    formData.departmentId = null;
    formData.serviceId = null;
  }
}, { immediate: true });

// Reset daysOffset and custom times when 'No Shift' is selected
watch(() => formData.shiftId, (newShiftId) => {
  if (newShiftId === null) {
    formData.daysOffset = 0;
    formData.customShiftStart = '';
    formData.customShiftEnd = '';
  }
});
</script>

<style scoped>
.staff-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

/* Button styles inherited from global main.css */
</style>

<!-- Unscoped button styles -->
<style>
.staff-form .btn {
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

.staff-form .btn:hover:not(:disabled) {
  box-shadow: var(--shadow-low);
}

.staff-form .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.staff-form .btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.staff-form .btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.staff-form .btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.staff-form .btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg);
  border-color: var(--color-text-secondary);
}

.time-range-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.time-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.time-label {
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}
</style>

