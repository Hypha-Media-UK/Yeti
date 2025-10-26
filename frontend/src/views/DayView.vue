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
        <!-- Shifts Grid -->
        <div class="shifts-grid">
          <ShiftGroup
            shift-type="Day"
            :assignments="dayShifts"
          />

          <ShiftGroup
            shift-type="Night"
            :assignments="nightShifts"
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
              <div v-if="area.staff && area.staff.length > 0" class="area-staff">
                <div
                  v-for="staff in area.staff"
                  :key="staff.id"
                  class="staff-item"
                >
                  <span class="staff-name">{{ staff.firstName }} {{ staff.lastName }}</span>
                  <span class="staff-hours">{{ calculateTotalHours(staff.contractedHours) }}h</span>
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
              <div v-if="area.staff && area.staff.length > 0" class="area-staff">
                <div
                  v-for="staff in area.staff"
                  :key="staff.id"
                  class="staff-item"
                >
                  <span class="staff-name">{{ staff.firstName }} {{ staff.lastName }}</span>
                  <span class="staff-hours">{{ calculateTotalHours(staff.contractedHours) }}h</span>
                </div>
              </div>
              <div v-else class="area-no-staff">No staff assigned</div>
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

// Categorize areas by area type (all areas, regardless of shift)
const allDepartments = computed(() =>
  areas.value.filter(a => a.type === 'department')
);

const allServices = computed(() =>
  areas.value.filter(a => a.type === 'service')
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

.staff-name {
  flex: 1;
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

.area-no-staff {
  margin-top: var(--spacing-2);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-tertiary);
  font-style: italic;
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

