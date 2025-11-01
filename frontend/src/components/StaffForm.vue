<template>
  <form @submit.prevent="handleSubmit" class="staff-form">
    <!-- SECTION 1: Basic Info -->
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

    <!-- Status & Permanent Assignment (side by side) -->
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
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="formData.permanentAssignment"
          />
          <span>Permanent Assignment</span>
        </label>
        <p class="form-hint">
          Check this to assign staff to specific departments/services.
        </p>
      </div>
    </div>

    <!-- SECTION 2: Permanent Assignment Areas (only if checkbox checked) -->
    <div v-if="showAllocations" class="form-row">
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
            v-for="service in props.services"
            :key="service.id"
            :value="service.id"
          >
            {{ service.name }}
          </option>
        </select>
        <p class="form-hint">Optional: Assign staff to a specific service</p>
      </div>
    </div>

    <!-- SECTION 3: Shift Assignment -->
    <div v-if="formData.status === 'Regular'" class="form-row">
      <div class="form-group">
        <label for="shift" class="form-label">Shift</label>
        <select
          id="shift"
          v-model="formData.shiftId"
          class="form-input"
        >
          <option :value="null">No Shift</option>
          <option :value="null" disabled>──────────</option>
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
          Select a shift to use its cycle pattern for determining working days.
          Leave as "No Shift" to use contracted hours instead.
        </p>
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            v-model="formData.useContractedHours"
            :disabled="isContractedHoursDisabled"
          />
          <span>Contracted Hours</span>
        </label>
        <p class="form-hint">
          Check this to define custom working days/hours.
          {{ isContractedHoursDisabled ? '(Disabled when shift is selected)' : '' }}
        </p>
      </div>
    </div>

    <!-- Adjust Start and End Time (only show for shift-based staff) -->
    <div v-if="showAdjustShiftTimes" class="form-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          v-model="formData.adjustShiftTimes"
        />
        <span>Adjust Start and End Time</span>
      </label>
      <p class="form-hint">
        Check this for staff who work the shift pattern but have slightly different hours
        (e.g., phased return to work, part-time hours).
      </p>
    </div>

    <!-- Custom Shift Times (only show when "Adjust Start and End Time" is checked) -->
    <div v-if="showCustomShiftTimes" class="form-group">
      <label class="form-label">Custom Shift Times</label>
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
        Set custom start and end times for this staff member.
      </p>
    </div>

    <!-- Days Offset (only show for shift-based staff) -->
    <div v-if="showDaysOffset" class="form-group">
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
        Shift default offset: {{ selectedShiftDefaultOffset ?? 0 }}.
        Leave blank or set to {{ selectedShiftDefaultOffset ?? 0 }} to use shift's default.
        Set a personal offset if this staff member works different days than the rest of their shift.
      </p>
    </div>

    <!-- Early Finish Day (only show for shift-based staff without contracted hours) -->
    <div v-if="showEarlyFinishDay" class="form-group">
      <label class="form-label">Early Finish Day (Optional)</label>
      <p class="form-hint">
        Select which day of the 4-day cycle this staff member finishes early.
        Day shifts finish at 19:00 instead of 20:00. Night shifts finish at 07:00 instead of 08:00.
      </p>
      <div class="early-finish-options">
        <label v-for="day in [1, 2, 3, 4]" :key="day" class="radio-label">
          <input
            type="radio"
            :value="day"
            v-model="formData.earlyFinishDay"
            name="earlyFinishDay"
          />
          <span>Day {{ day }}</span>
        </label>
        <label class="radio-label">
          <input
            type="radio"
            :value="null"
            v-model="formData.earlyFinishDay"
            name="earlyFinishDay"
          />
          <span>None</span>
        </label>
      </div>
    </div>

    <!-- Contracted Hours (only show for permanent assignments, relief, or supervisor) -->
    <div v-if="showContractedHours" class="form-group">
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
  permanentAssignment: false,  // Will be set in watch
  shiftId: props.staff?.shiftId || null as number | null,
  departmentId: null as number | null,
  serviceId: null as number | null,
  useContractedHours: false,  // Will be set in watch
  adjustShiftTimes: false,  // Will be set based on customShiftStart/End
  daysOffset: props.staff?.daysOffset || 0,
  customShiftStart: props.staff?.customShiftStart?.substring(0, 5) || '',  // Convert "HH:mm:ss" to "HH:mm"
  customShiftEnd: props.staff?.customShiftEnd?.substring(0, 5) || '',      // Convert "HH:mm:ss" to "HH:mm"
  earlyFinishDay: props.staff?.earlyFinishDay || null as number | null,
  contractedHours: [] as HoursEntry[],
});

// Computed properties for conditional field visibility
const showAllocations = computed(() => {
  // Show for Relief, Supervisor, or Regular with "Permanent Assignment" checked
  return formData.status === 'Relief' ||
         formData.status === 'Supervisor' ||
         (formData.status === 'Regular' && formData.permanentAssignment);
});

const isContractedHoursDisabled = computed(() => {
  // Contracted hours checkbox is disabled when a shift is selected
  return formData.shiftId !== null;
});

const showAdjustShiftTimes = computed(() => {
  // Show "Adjust Start and End Time" checkbox only when shift is selected
  return formData.status === 'Regular' && formData.shiftId !== null;
});

const showCustomShiftTimes = computed(() => {
  // Show custom shift times only when "Adjust Start and End Time" is checked
  return formData.adjustShiftTimes && formData.shiftId !== null;
});

const showDaysOffset = computed(() => {
  // Show days offset only when shift is selected
  return formData.status === 'Regular' && formData.shiftId !== null;
});

const showEarlyFinishDay = computed(() => {
  // Show early finish day only when shift is selected and NOT using contracted hours
  return formData.shiftId !== null && !formData.useContractedHours && !formData.adjustShiftTimes;
});

const showContractedHours = computed(() => {
  // Show for Relief, Supervisor
  if (formData.status === 'Relief' || formData.status === 'Supervisor') {
    return true;
  }

  // Show for Regular staff when "Contracted Hours" checkbox is checked
  if (formData.status === 'Regular' && formData.useContractedHours) {
    return true;
  }

  return false;
});

// Get the selected shift's default offset for reference
const selectedShiftDefaultOffset = computed(() => {
  if (!formData.shiftId) return null;
  const shift = shifts.value.find(s => s.id === formData.shiftId);
  return shift?.daysOffset ?? null;
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
    // Default to "No Shift" for all regular staff
    // User can manually select a shift if needed
    formData.shiftId = null;
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

  // Validation: Regular staff with permanent assignment must have allocations OR contracted hours
  if (formData.status === 'Regular' && formData.permanentAssignment) {
    if (allocations.length === 0) {
      error.value = 'Permanent assignment requires at least one department or service allocation.';
      return;
    }
    if (!formData.shiftId && !formData.useContractedHours) {
      error.value = 'Permanent assignment requires either a shift (for cycle pattern) or contracted hours.';
      return;
    }
  }

  loading.value = true;

  // Map UI state to database fields
  let shiftId: number | null = null;
  let referenceShiftId: number | null = null;
  let useContractedHoursForShift = false;

  if (formData.status === 'Regular') {
    if (formData.permanentAssignment && formData.shiftId) {
      // Permanent assignment with shift cycle pattern
      referenceShiftId = formData.shiftId;
      shiftId = null;  // Not in shift pool
    } else if (!formData.permanentAssignment && formData.shiftId) {
      // Pool staff assigned to shift
      shiftId = formData.shiftId;
      referenceShiftId = null;
    } else {
      // No shift selected
      shiftId = null;
      referenceShiftId = null;
    }
  }

  // Determine cycle type based on status (DEPRECATED - kept for backward compatibility)
  let cycleType: CycleType | '' = null;

  if (formData.status === 'Supervisor') {
    cycleType = '16-day-supervisor';
  } else if (formData.status === 'Regular' && shiftId) {
    // For shift-based staff, default to 4-on-4-off
    cycleType = '4-on-4-off';
  }

  // Convert custom shift times to HH:mm:ss format or null
  const customShiftStart = formData.customShiftStart ? `${formData.customShiftStart}:00` : null;
  const customShiftEnd = formData.customShiftEnd ? `${formData.customShiftEnd}:00` : null;

  const staffData: Partial<StaffMember> = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    status: formData.status,
    shiftId,
    cycleType: cycleType || null,
    daysOffset: formData.daysOffset,
    customShiftStart,
    customShiftEnd,
    earlyFinishDay: formData.earlyFinishDay,
    useCycleForPermanent: false,  // DEPRECATED
    referenceShiftId,
    useContractedHoursForShift,
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
    formData.daysOffset = newStaff.daysOffset;
    formData.customShiftStart = newStaff.customShiftStart?.substring(0, 5) || '';
    formData.customShiftEnd = newStaff.customShiftEnd?.substring(0, 5) || '';

    // Determine UI state from database fields
    // If referenceShiftId is set, this is permanent assignment with shift cycle
    if (newStaff.referenceShiftId) {
      formData.permanentAssignment = true;
      formData.shiftId = newStaff.referenceShiftId;  // Show the reference shift in dropdown
      formData.useContractedHours = false;
    }
    // If shiftId is set, this is pool staff
    else if (newStaff.shiftId) {
      formData.permanentAssignment = false;
      formData.shiftId = newStaff.shiftId;
      formData.useContractedHours = false;
    }
    // Otherwise, check if they have allocations (permanent without shift)
    else if (props.staffAllocations && props.staffAllocations.length > 0) {
      formData.permanentAssignment = true;
      formData.shiftId = null;
      formData.useContractedHours = true;  // They must be using contracted hours
    }
    // No shift, no allocations
    else {
      formData.permanentAssignment = false;
      formData.shiftId = null;
      formData.useContractedHours = false;
    }

    // Set adjustShiftTimes based on whether custom times are set
    formData.adjustShiftTimes = !!(newStaff.customShiftStart || newStaff.customShiftEnd);

    // Load contracted hours
    try {
      const response = await api.getContractedHoursByStaff(newStaff.id);
      formData.contractedHours = response.contractedHours.map(h => ({
        id: h.id,
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime.substring(0, 5), // Convert "HH:mm:ss" to "HH:mm"
        endTime: h.endTime.substring(0, 5),
      }));

      // If they have contracted hours, set the checkbox
      if (formData.contractedHours.length > 0 && !formData.shiftId) {
        formData.useContractedHours = true;
      }
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

    // If staff has allocations, set permanent assignment checkbox
    if (props.staff?.id) {
      formData.permanentAssignment = true;
    }
  } else {
    formData.departmentId = null;
    formData.serviceId = null;
  }
}, { immediate: true });

// Watch for shift selection changes
watch(() => formData.shiftId, (newShiftId) => {
  // When shift is selected, disable contracted hours checkbox
  if (newShiftId !== null) {
    formData.useContractedHours = false;
  }

  // When "No Shift" is selected, reset days offset and custom times
  if (newShiftId === null) {
    formData.daysOffset = 0;
    formData.adjustShiftTimes = false;
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
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

.early-finish-options {
  display: flex;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  cursor: pointer;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  transition: background-color var(--transition-enter), border-color var(--transition-enter);
}

.radio-label:hover {
  background-color: var(--color-bg);
  border-color: var(--color-primary);
}

.radio-label input[type="radio"] {
  margin: 0;
  cursor: pointer;
}

.radio-label input[type="radio"]:checked + span {
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
}
</style>

