<template>
  <div class="day-view">
    <div class="container">
      <header class="page-header">
        <h1 class="page-title">Staff Rota</h1>
      </header>

      <div class="date-section">
        <DateSelector v-model="selectedDate" />
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading rota...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-message">{{ error }}</p>
        <button class="btn btn-primary" @click="loadDay">
          Retry
        </button>
      </div>

      <div v-else class="rota-content">
        <!-- Shifts Grid -->
        <div class="shifts-grid">
          <ShiftGroup
            shift-type="Day"
            :assignments="dayShifts"
            @staff-assignment="handleStaffAssignment"
            @staff-absence="handleStaffAbsence"
          />

          <ShiftGroup
            shift-type="Night"
            :assignments="nightShifts"
            @staff-assignment="handleStaffAssignment"
            @staff-absence="handleStaffAbsence"
          />
        </div>

        <!-- Departments Section -->
        <div v-if="allDepartments.length > 0" class="areas-section">
          <h2 class="section-title">Departments</h2>
          <div class="areas-grid">
            <div
              v-for="area in allDepartments"
              :key="`dept-${area.id}`"
              class="area-card"
            >
              <div class="area-header">
                <div class="area-name">{{ area.name }}</div>
                <div class="area-hours">
                  <span v-if="area.operationalHours.length === 0" class="hours-24-7">
                    24/7/365
                  </span>
                  <span
                    v-for="(hours, idx) in area.operationalHours"
                    :key="idx"
                    class="hours-time"
                  >
                    {{ formatTime(hours.startTime) }} - {{ formatTime(hours.endTime) }}
                  </span>
                </div>
              </div>
              <div v-if="area.staff === undefined" class="area-loading">
                <div class="loading-spinner"></div>
                <span>Loading staff...</span>
              </div>
              <div v-else-if="area.staff && area.staff.length > 0" class="area-staff">
                <div
                  v-for="staff in area.staff"
                  :key="staff.id"
                  class="staff-item"
                  :class="getStaffItemClass(staff)"
                  @click="handleAreaStaffClick(staff)"
                  :title="getStaffItemTitle(staff)"
                >
                  <span class="staff-name">
                    {{ staff.firstName }} {{ staff.lastName }}
                    <span v-if="isStaffAbsent(staff)" class="absence-badge" :title="formatAbsenceDisplay(staff.currentAbsence!)">
                      {{ formatAbsencePeriod(staff.currentAbsence!) }}
                    </span>
                  </span>
                  <span class="staff-hours">{{ getContractedHoursForToday(staff.contractedHours) }}</span>
                </div>
              </div>
              <div v-else class="area-no-staff">No staff assigned</div>
            </div>
          </div>
        </div>

        <!-- Services Section -->
        <div v-if="allServices.length > 0" class="areas-section">
          <h2 class="section-title">Services</h2>
          <div class="areas-grid">
            <div
              v-for="area in allServices"
              :key="`svc-${area.id}`"
              class="area-card"
            >
              <div class="area-header">
                <div class="area-name">{{ area.name }}</div>
                <div class="area-hours">
                  <span v-if="area.operationalHours.length === 0" class="hours-24-7">
                    24/7/365
                  </span>
                  <span
                    v-for="(hours, idx) in area.operationalHours"
                    :key="idx"
                    class="hours-time"
                  >
                    {{ formatTime(hours.startTime) }} - {{ formatTime(hours.endTime) }}
                  </span>
                </div>
              </div>
              <div v-if="area.staff === undefined" class="area-loading">
                <div class="loading-spinner"></div>
                <span>Loading staff...</span>
              </div>
              <div v-else-if="area.staff && area.staff.length > 0" class="area-staff">
                <div
                  v-for="staff in area.staff"
                  :key="staff.id"
                  class="staff-item"
                  :class="getStaffItemClass(staff)"
                  @click="handleAreaStaffClick(staff)"
                  :title="getStaffItemTitle(staff)"
                >
                  <span class="staff-name">
                    {{ staff.firstName }} {{ staff.lastName }}
                    <span v-if="isStaffAbsent(staff)" class="absence-badge" :title="formatAbsenceDisplay(staff.currentAbsence!)">
                      {{ formatAbsencePeriod(staff.currentAbsence!) }}
                    </span>
                  </span>
                  <span class="staff-hours">{{ getContractedHoursForToday(staff.contractedHours) }}</span>
                </div>
              </div>
              <div v-else class="area-no-staff">No staff assigned</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Temporary Assignment Modal -->
    <TemporaryAssignmentModal
      v-model="showTemporaryAssignmentModal"
      v-if="selectedStaffForAssignment"
      :staff-member="selectedStaffForAssignment.staff"
      :shift-type="selectedStaffForAssignment.shiftType"
      :current-date="selectedDate"
      :departments="allDepartments"
      :services="allServices"
      @submit="handleCreateTemporaryAssignment"
    />

    <!-- Manage Assignments Modal -->
    <ManageAssignmentsModal
      v-model="showManageAssignmentsModal"
      v-if="selectedStaffForManagement"
      :key="`manage-${selectedStaffForManagement.id}`"
      :staff-member="selectedStaffForManagement"
      :current-date="selectedDate"
      :departments="allDepartments"
      :services="allServices"
      @deleted="loadDay"
    />

    <!-- Quick Absence Modal -->
    <QuickAbsenceModal
      v-model="showQuickAbsenceModal"
      v-if="selectedStaffForAbsence"
      :staff-member="selectedStaffForAbsence.staff"
      :shift-type="selectedStaffForAbsence.shiftType"
      :current-date="selectedDate"
      @submit="handleCreateQuickAbsence"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDayStore } from '@/stores/day';
import { useStaffStore } from '@/stores/staff';
import { useConfigStore } from '@/stores/config';
import { useTimeZone } from '@/composables/useTimeZone';
import { useAbsence } from '@/composables/useAbsence';
import { api } from '@/services/api';
import DateSelector from '@/components/DateSelector.vue';
import ShiftGroup from '@/components/ShiftGroup.vue';
import TemporaryAssignmentModal from '@/components/TemporaryAssignmentModal.vue';
import ManageAssignmentsModal from '@/components/ManageAssignmentsModal.vue';
import QuickAbsenceModal from '@/components/QuickAbsenceModal.vue';
import type { ShiftAssignment } from '@shared/types/shift';
import type { StaffMember } from '@shared/types/staff';
import type { CreateTemporaryAssignmentDto } from '@shared/types/shift';
import type { CreateAbsenceRequest } from '@shared/types/absence';

const route = useRoute();
const router = useRouter();
const dayStore = useDayStore();
const staffStore = useStaffStore();
const configStore = useConfigStore();
const { getTodayString } = useTimeZone();
const { isAbsenceActive, formatAbsencePeriod, formatAbsenceDisplay } = useAbsence();

const selectedDate = ref<string>(getTodayString());
const isLoading = computed(() => dayStore.isLoading);
const error = computed(() => dayStore.error);
const dayShifts = computed(() => dayStore.dayShifts);
const nightShifts = computed(() => dayStore.nightShifts);
const areas = computed(() => dayStore.areas);

// Temporary assignment modal state
const showTemporaryAssignmentModal = ref(false);
const selectedStaffForAssignment = ref<ShiftAssignment | null>(null);

// Manage assignments modal state
const showManageAssignmentsModal = ref(false);
const selectedStaffForManagement = ref<StaffMember | null>(null);

// Quick absence modal state
const showQuickAbsenceModal = ref(false);
const selectedStaffForAbsence = ref<ShiftAssignment | null>(null);

// Categorize areas by area type (all areas, regardless of shift)
const allDepartments = computed(() =>
  areas.value.filter((a: any) => a.type === 'department')
);

const allServices = computed(() =>
  areas.value.filter((a: any) => a.type === 'service')
);

// Get day of week from date string (ISO 8601: Monday=1, Sunday=7)
function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00');
  const jsDay = date.getDay(); // JavaScript: Sunday=0, Monday=1, ..., Saturday=6
  return jsDay === 0 ? 7 : jsDay; // Convert to ISO 8601: Monday=1, Sunday=7
}

// Format time for display (remove seconds)
function formatTime(timeStr: string): string {
  const parts = timeStr.split(':');
  return `${parts[0]}:${parts[1]}`;
}

// Calculate total contracted hours per week for a staff member
function calculateTotalHours(contractedHours: any[]): number {
  if (!contractedHours || contractedHours.length === 0) return 0;

  let totalMinutes = 0;

  for (const hours of contractedHours) {
    const start = parseTimeToMinutes(hours.startTime);
    const end = parseTimeToMinutes(hours.endTime);

    // Handle shifts crossing midnight
    if (end < start) {
      totalMinutes += (24 * 60 - start) + end;
    } else {
      totalMinutes += end - start;
    }
  }

  return Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
}

// Parse time string (HH:MM:SS or HH:MM) to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

// Get contracted hours for today (returns formatted time range or empty string)
function getContractedHoursForToday(contractedHours: any[]): string {
  if (!contractedHours || contractedHours.length === 0) return '';

  // Get day of week for selected date (1=Monday, 7=Sunday)
  const date = new Date(selectedDate.value);
  const jsDay = date.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  // Find contracted hours for this day
  const hoursForDay = contractedHours.find((h: any) => h.dayOfWeek === dayOfWeek);

  if (!hoursForDay) return '';

  return `${formatTime(hoursForDay.startTime)} - ${formatTime(hoursForDay.endTime)}`;
}

// Check if staff is currently absent
function isStaffAbsent(staff: any): boolean {
  return isAbsenceActive(staff.currentAbsence);
}

// Get combined class for staff item (status + absence)
function getStaffItemClass(staff: any): string {
  const classes: string[] = [];

  // Check if staff is absent
  if (isStaffAbsent(staff)) {
    classes.push('staff-absent');
  } else {
    // Only add clickable if not absent
    classes.push('clickable');
    // Add status class
    const statusClass = getStaffStatusClass(staff.contractedHours);
    if (statusClass) {
      classes.push(statusClass);
    }
  }

  return classes.join(' ');
}

// Get title for staff item
function getStaffItemTitle(staff: any): string {
  if (isStaffAbsent(staff)) {
    return `${formatAbsenceDisplay(staff.currentAbsence!)} - Cannot assign`;
  }
  return 'Click to manage temporary assignments';
}

// Get status class for area staff based on their contracted hours
function getStaffStatusClass(contractedHours: any[]): string {
  if (!contractedHours || contractedHours.length === 0) return '';

  // Get day of week for selected date (1=Monday, 7=Sunday)
  const date = new Date(selectedDate.value);
  const jsDay = date.getDay();
  const dayOfWeek = jsDay === 0 ? 7 : jsDay;

  // Find contracted hours for this day
  const hoursForDay = contractedHours.find((h: any) => h.dayOfWeek === dayOfWeek);

  if (!hoursForDay) return '';

  // Only apply status if we're viewing today
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const viewDate = new Date(selectedDate.value);

  if (viewDate.getTime() !== today.getTime()) {
    return 'status-active'; // Default for past/future dates
  }

  // Parse current time as minutes since midnight
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Parse shift times
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  const startMinutes = parseTime(hoursForDay.startTime);
  const endMinutes = parseTime(hoursForDay.endTime);

  // Check if contracted hours cross midnight
  if (endMinutes < startMinutes) {
    // Overnight shift (e.g., 13:00 - 01:00)
    if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
      return 'status-active'; // Currently working
    } else {
      return 'status-pending'; // Between end and start
    }
  } else {
    // Normal shift within same day
    if (currentMinutes < startMinutes) {
      return 'status-pending'; // Shift hasn't started yet
    } else if (currentMinutes >= endMinutes) {
      return 'status-expired'; // Shift has ended
    } else {
      return 'status-active'; // Currently working
    }
  }
}

// Watch for date changes and update URL
watch(selectedDate, async (newDate) => {
  router.push({ name: 'day', params: { date: newDate } });
  await loadDay();
});

// Watch for route changes
watch(
  () => route.params.date,
  (newDate) => {
    if (newDate && typeof newDate === 'string' && newDate !== selectedDate.value) {
      selectedDate.value = newDate;
    }
  },
  { immediate: true }
);

// Load day data (rota + areas) and prefetch adjacent days
async function loadDay() {
  await dayStore.loadDay(selectedDate.value);
  // Prefetch adjacent days in background (non-blocking)
  dayStore.prefetchAdjacentDays(selectedDate.value);
}

// Handle staff assignment button click
function handleStaffAssignment(assignment: ShiftAssignment) {
  selectedStaffForAssignment.value = assignment;
  showTemporaryAssignmentModal.value = true;
}

// Handle staff absence button click
function handleStaffAbsence(assignment: ShiftAssignment) {
  selectedStaffForAbsence.value = assignment;
  showQuickAbsenceModal.value = true;
}

// Handle area staff click to open manage assignments modal
function handleAreaStaffClick(staff: any) {
  // Don't allow clicks on absent staff
  if (isStaffAbsent(staff)) {
    return;
  }

  // Convert the area staff object to a StaffMember
  const staffMember: StaffMember = {
    id: staff.id,
    firstName: staff.firstName,
    lastName: staff.lastName,
    status: staff.status,
    shiftId: null,
    cycleType: '4-on-4-off',
    daysOffset: 0,
    isActive: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  selectedStaffForManagement.value = staffMember;
  showManageAssignmentsModal.value = true;
}

// Handle temporary assignment creation
async function handleCreateTemporaryAssignment(data: CreateTemporaryAssignmentDto) {
  try {
    await api.createTemporaryAssignment(data);
    showTemporaryAssignmentModal.value = false;
    selectedStaffForAssignment.value = null;

    // Clear cache and reload using day store
    dayStore.clearRotaCache([selectedDate.value]);
    await loadDay();
  } catch (err: any) {
    console.error('Error creating temporary assignment:', err);
    alert(err.message || 'Failed to create temporary assignment');
  }
}

// Handle quick absence creation
async function handleCreateQuickAbsence(data: CreateAbsenceRequest) {
  try {
    await api.createAbsence(data);
    showQuickAbsenceModal.value = false;
    selectedStaffForAbsence.value = null;

    // Clear cache and reload
    dayStore.clearCache([selectedDate.value]);
    await loadDay();
  } catch (err: any) {
    console.error('Error creating absence:', err);
    alert(err.message || 'Failed to create absence');
  }
}

onMounted(async () => {
  // Initialize date from route or use today
  const routeDate = route.params.date;
  if (routeDate && typeof routeDate === 'string') {
    selectedDate.value = routeDate;
  } else {
    selectedDate.value = getTodayString();
    router.replace({ name: 'day', params: { date: selectedDate.value } });
  }

  // Load initial data
  await Promise.all([
    configStore.fetchConfig(),
    staffStore.fetchAllStaff(),
    loadDay(),
  ]);
});
</script>

<style scoped>
.day-view {
  min-height: 100vh;
  padding: var(--spacing-3) 0;
}

.page-header {
  margin-bottom: var(--spacing-4);
}

.page-title {
  font-size: var(--font-size-headline);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.date-section {
  margin-bottom: var(--spacing-4);
  padding: var(--spacing-3);
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-medium);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-6);
  gap: var(--spacing-2);
}

.rota-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.shifts-grid {
  display: grid;
  gap: var(--spacing-4);
  grid-template-columns: 1fr;
}

.areas-section {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
  box-shadow: var(--shadow-medium);
}

.section-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3);
  padding-bottom: var(--spacing-2);
  border-bottom: 2px solid var(--color-border);
}

.areas-grid {
  display: grid;
  gap: var(--spacing-2);
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.area-card {
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  padding: var(--spacing-2);
  transition: all 0.2s ease;
}

.area-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-small);
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2);
}

.area-name {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.area-hours {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-1);
}

.hours-time {
  font-size: var(--font-size-body-sm);
  font-family: var(--font-family-mono);
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  padding: 2px var(--spacing-1);
  border-radius: 4px;
}

.hours-24-7 {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  padding: 2px var(--spacing-1);
  border-radius: 4px;
}

.area-staff {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.staff-item {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  padding: var(--spacing-1);
  background-color: var(--color-surface);
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.staff-item.clickable {
  cursor: pointer;
  transition: var(--transition-base);
}

.staff-item.clickable:hover {
  background-color: var(--color-background);
  box-shadow: var(--shadow-low);
  transform: translateY(-1px);
}

/* Status-based styling for area staff */
.staff-item.status-active {
  background-color: var(--color-surface);
}

.staff-item.status-pending {
  background-color: rgba(254, 243, 199, 0.3); /* Very pale yellow */
}

.staff-item.status-expired {
  background-color: rgba(156, 163, 175, 0.15); /* Grey */
  opacity: 0.6;
  color: var(--color-text-secondary);
}

.staff-item.status-expired .staff-hours {
  color: var(--color-text-tertiary, #9ca3af);
}

/* Absent staff styling - overrides status colors */
.staff-item.staff-absent {
  background-color: rgba(239, 68, 68, 0.15) !important; /* Red background */
  border: 1px solid rgba(239, 68, 68, 0.3);
  cursor: not-allowed !important;
  opacity: 1 !important;
}

.staff-item.staff-absent:hover {
  box-shadow: none !important;
  transform: none !important;
}

.staff-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.staff-hours {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-bg);
  padding: 2px var(--spacing-1);
  border-radius: 4px;
  margin-left: var(--spacing-2);
}

.absence-badge {
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 0.125rem 0.375rem;
  font-size: var(--font-size-secondary);
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-badge);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.area-no-staff {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-tertiary);
  font-style: italic;
}

.area-loading {
  margin-top: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-2);
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 961px) {
  .shifts-grid {
    grid-template-columns: 1fr 1fr;
  }

  .areas-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 600px) {
  .day-view {
    padding: var(--spacing-2) 0;
  }

  .page-title {
    font-size: var(--font-size-section);
  }

  .date-section {
    padding: var(--spacing-2);
  }
}
</style>

