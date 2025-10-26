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
        <button class="btn btn-primary" @click="loadRota">
          Retry
        </button>
      </div>

      <div v-else class="rota-content">
        <!-- Shifts and Areas Grid -->
        <div class="shifts-areas-grid">
          <!-- Day Shift Column -->
          <div class="shift-column">
            <ShiftGroup
              shift-type="Day"
              :assignments="dayShifts"
            />

            <!-- Day Shift Departments -->
            <div v-if="dayDepartments.length > 0" class="areas-section">
              <h3 class="areas-title">Departments</h3>
              <div class="areas-list">
                <div
                  v-for="area in dayDepartments"
                  :key="`day-dept-${area.id}`"
                  class="area-card"
                >
                  <div class="area-name">{{ area.name }}</div>
                  <div class="area-hours">
                    <span
                      v-for="(hours, idx) in area.operationalHours"
                      :key="idx"
                      class="hours-time"
                    >
                      {{ formatTime(hours.startTime) }} - {{ formatTime(hours.endTime) }}
                    </span>
                  </div>
                  <div v-if="area.staff && area.staff.length > 0" class="area-staff">
                    <div
                      v-for="staff in area.staff"
                      :key="staff.id"
                      class="staff-item"
                    >
                      {{ staff.firstName }} {{ staff.lastName }}
                    </div>
                  </div>
                  <div v-else class="area-no-staff">No staff assigned</div>
                </div>
              </div>
            </div>

            <!-- Day Shift Services -->
            <div v-if="dayServices.length > 0" class="areas-section">
              <h3 class="areas-title">Services</h3>
              <div class="areas-list">
                <div
                  v-for="area in dayServices"
                  :key="`day-svc-${area.id}`"
                  class="area-card"
                >
                  <div class="area-name">{{ area.name }}</div>
                  <div class="area-hours">
                    <span
                      v-for="(hours, idx) in area.operationalHours"
                      :key="idx"
                      class="hours-time"
                    >
                      {{ formatTime(hours.startTime) }} - {{ formatTime(hours.endTime) }}
                    </span>
                  </div>
                  <div v-if="area.staff && area.staff.length > 0" class="area-staff">
                    <div
                      v-for="staff in area.staff"
                      :key="staff.id"
                      class="staff-item"
                    >
                      {{ staff.firstName }} {{ staff.lastName }}
                    </div>
                  </div>
                  <div v-else class="area-no-staff">No staff assigned</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Night Shift Column -->
          <div class="shift-column">
            <ShiftGroup
              shift-type="Night"
              :assignments="nightShifts"
            />

            <!-- Night Shift Departments -->
            <div v-if="nightDepartments.length > 0" class="areas-section">
              <h3 class="areas-title">Departments</h3>
              <div class="areas-list">
                <div
                  v-for="area in nightDepartments"
                  :key="`night-dept-${area.id}`"
                  class="area-card"
                >
                  <div class="area-name">{{ area.name }}</div>
                  <div class="area-hours">
                    <span
                      v-for="(hours, idx) in area.operationalHours"
                      :key="idx"
                      class="hours-time"
                    >
                      {{ formatTime(hours.startTime) }} - {{ formatTime(hours.endTime) }}
                    </span>
                  </div>
                  <div v-if="area.staff && area.staff.length > 0" class="area-staff">
                    <div
                      v-for="staff in area.staff"
                      :key="staff.id"
                      class="staff-item"
                    >
                      {{ staff.firstName }} {{ staff.lastName }}
                    </div>
                  </div>
                  <div v-else class="area-no-staff">No staff assigned</div>
                </div>
              </div>
            </div>

            <!-- Night Shift Services -->
            <div v-if="nightServices.length > 0" class="areas-section">
              <h3 class="areas-title">Services</h3>
              <div class="areas-list">
                <div
                  v-for="area in nightServices"
                  :key="`night-svc-${area.id}`"
                  class="area-card"
                >
                  <div class="area-name">{{ area.name }}</div>
                  <div class="area-hours">
                    <span
                      v-for="(hours, idx) in area.operationalHours"
                      :key="idx"
                      class="hours-time"
                    >
                      {{ formatTime(hours.startTime) }} - {{ formatTime(hours.endTime) }}
                    </span>
                  </div>
                  <div v-if="area.staff && area.staff.length > 0" class="area-staff">
                    <div
                      v-for="staff in area.staff"
                      :key="staff.id"
                      class="staff-item"
                    >
                      {{ staff.firstName }} {{ staff.lastName }}
                    </div>
                  </div>
                  <div v-else class="area-no-staff">No staff assigned</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRotaStore } from '@/stores/rota';
import { useStaffStore } from '@/stores/staff';
import { useConfigStore } from '@/stores/config';
import { useTimeZone } from '@/composables/useTimeZone';
import { api } from '@/services/api';
import DateSelector from '@/components/DateSelector.vue';
import ShiftGroup from '@/components/ShiftGroup.vue';

const route = useRoute();
const router = useRouter();
const rotaStore = useRotaStore();
const staffStore = useStaffStore();
const configStore = useConfigStore();
const { getTodayString } = useTimeZone();

const selectedDate = ref<string>(getTodayString());
const areas = ref<any[]>([]);
const isLoading = computed(() => rotaStore.isLoading);
const error = computed(() => rotaStore.error);
const dayShifts = computed(() => rotaStore.dayShifts);
const nightShifts = computed(() => rotaStore.nightShifts);

// Categorize areas by shift type and area type
const dayDepartments = computed(() =>
  areas.value.filter(a => a.type === 'department' && isOperationalDuringShift(a, 'Day'))
);

const dayServices = computed(() =>
  areas.value.filter(a => a.type === 'service' && isOperationalDuringShift(a, 'Day'))
);

const nightDepartments = computed(() =>
  areas.value.filter(a => a.type === 'department' && isOperationalDuringShift(a, 'Night'))
);

const nightServices = computed(() =>
  areas.value.filter(a => a.type === 'service' && isOperationalDuringShift(a, 'Night'))
);

// Get day of week from date string (ISO 8601: Monday=1, Sunday=7)
function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00');
  const jsDay = date.getDay(); // JavaScript: Sunday=0, Monday=1, ..., Saturday=6
  return jsDay === 0 ? 7 : jsDay; // Convert to ISO 8601: Monday=1, Sunday=7
}

// Check if area is operational during a specific shift
function isOperationalDuringShift(area: any, shiftType: 'Day' | 'Night'): boolean {
  if (!area.operationalHours || area.operationalHours.length === 0) return false;

  // Day shift: 08:00 - 20:00
  // Night shift: 20:00 - 08:00 (crosses midnight)

  for (const hours of area.operationalHours) {
    const start = parseTime(hours.startTime);
    const end = parseTime(hours.endTime);

    if (shiftType === 'Day') {
      // Day shift: 08:00 - 20:00
      // Area is operational during day if it overlaps with 08:00-20:00
      if (timeRangesOverlap(start, end, 8 * 60, 20 * 60)) {
        return true;
      }
    } else {
      // Night shift: 20:00 - 08:00 (next day)
      // Area is operational during night if it overlaps with 20:00-23:59 or 00:00-08:00
      if (timeRangesOverlap(start, end, 20 * 60, 24 * 60) ||
          timeRangesOverlap(start, end, 0, 8 * 60)) {
        return true;
      }
    }
  }

  return false;
}

// Parse time string (HH:MM:SS or HH:MM) to minutes since midnight
function parseTime(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

// Check if two time ranges overlap
function timeRangesOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  return start1 < end2 && end1 > start2;
}

// Format time for display (remove seconds)
function formatTime(timeStr: string): string {
  const parts = timeStr.split(':');
  return `${parts[0]}:${parts[1]}`;
}

// Watch for date changes and update URL
watch(selectedDate, (newDate) => {
  router.push({ name: 'day', params: { date: newDate } });
  loadRota();
  loadAreas();
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

async function loadRota() {
  await rotaStore.fetchRotaForDate(selectedDate.value);
}

async function loadAreas() {
  try {
    const dayOfWeek = getDayOfWeek(selectedDate.value);
    const response = await api.getMainRotaAreasForDay(dayOfWeek, selectedDate.value);
    areas.value = response.areas;
  } catch (err) {
    console.error('Error loading areas:', err);
    areas.value = [];
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
    loadRota(),
    loadAreas(),
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

.shifts-areas-grid {
  display: grid;
  gap: var(--spacing-4);
  grid-template-columns: 1fr;
}

.shift-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.areas-section {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
  box-shadow: var(--shadow-medium);
}

.areas-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2);
  padding-bottom: var(--spacing-1);
  border-bottom: 1px solid var(--color-border);
}

.areas-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
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

.area-name {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-1);
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
  align-items: center;
}

.staff-item::before {
  content: '👤';
  margin-right: var(--spacing-1);
  font-size: 14px;
}

.area-no-staff {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-tertiary);
  font-style: italic;
}

@media (min-width: 961px) {
  .shifts-areas-grid {
    grid-template-columns: 1fr 1fr;
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

