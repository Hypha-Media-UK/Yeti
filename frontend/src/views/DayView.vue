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
        <!-- Areas Section -->
        <div v-if="areas.length > 0" class="areas-section">
          <h2 class="section-title">Active Areas</h2>
          <div class="areas-grid">
            <div
              v-for="area in areas"
              :key="`${area.type}-${area.id}`"
              class="area-card"
            >
              <div class="area-header">
                <h3 class="area-name">{{ area.name }}</h3>
                <span class="area-type-badge" :class="`badge-${area.type}`">
                  {{ area.type }}
                </span>
              </div>
              <div class="area-hours">
                <div
                  v-for="(hours, idx) in area.operationalHours"
                  :key="idx"
                  class="hours-entry"
                >
                  <span class="hours-time">{{ hours.startTime }} - {{ hours.endTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        <ManualAssignmentForm :date="selectedDate" />
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
import ManualAssignmentForm from '@/components/ManualAssignmentForm.vue';

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

// Get day of week from date string (ISO 8601: Monday=1, Sunday=7)
function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00');
  const jsDay = date.getDay(); // JavaScript: Sunday=0, Monday=1, ..., Saturday=6
  return jsDay === 0 ? 7 : jsDay; // Convert to ISO 8601: Monday=1, Sunday=7
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
    const response = await api.getMainRotaAreasForDay(dayOfWeek);
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
  align-items: flex-start;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
}

.area-name {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex: 1;
}

.area-type-badge {
  padding: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;
  white-space: nowrap;
}

.badge-department {
  background-color: var(--color-day-shift-light);
  color: var(--color-day-shift);
}

.badge-service {
  background-color: var(--color-night-shift-light);
  color: var(--color-night-shift);
}

.area-hours {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.hours-entry {
  display: flex;
  align-items: center;
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

.shifts-grid {
  display: grid;
  gap: var(--spacing-4);
  grid-template-columns: 1fr;
}

@media (min-width: 961px) {
  .shifts-grid {
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

