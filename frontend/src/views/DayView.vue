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
const isLoading = computed(() => rotaStore.isLoading);
const error = computed(() => rotaStore.error);
const dayShifts = computed(() => rotaStore.dayShifts);
const nightShifts = computed(() => rotaStore.nightShifts);

// Watch for date changes and update URL
watch(selectedDate, (newDate) => {
  router.push({ name: 'day', params: { date: newDate } });
  loadRota();
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
  ]);
});
</script>

<style scoped>
.day-view {
  min-height: 100vh;
  padding: var(--spacing-lg) 0;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-on-surface);
}

.date-section {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
}

.rota-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.shifts-grid {
  display: grid;
  gap: var(--spacing-xl);
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .shifts-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .day-view {
    padding: var(--spacing-md) 0;
  }

  .page-title {
    font-size: var(--font-size-2xl);
  }

  .date-section {
    padding: var(--spacing-md);
  }
}
</style>

