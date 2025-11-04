<template>
  <div class="rota-nav">
    <div class="date-controls">
      <button
        class="btn btn-secondary nav-btn"
        @click="previousDay"
        aria-label="Previous day"
      >
        ←
      </button>

      <div class="date-display">
        <input
          type="date"
          :value="modelValue"
          @input="handleDateChange"
          class="date-input"
          aria-label="Select date"
        />
        <div class="date-text">
          {{ formattedDate }}
        </div>
      </div>

      <button
        class="btn btn-primary today-btn"
        @click="goToToday"
        :disabled="isToday"
      >
        Today
      </button>

      <button
        class="btn btn-secondary nav-btn"
        @click="nextDay"
        aria-label="Next day"
      >
        →
      </button>
    </div>

    <div class="action-buttons">
      <button
        class="btn btn-primary"
        @click="openTaskStatus"
      >
        Task Status
      </button>

      <button
        class="btn btn-primary"
        @click="openReports"
      >
        Reports
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useTimeZone } from '@/composables/useTimeZone';

const router = useRouter();

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'open-task-status': [];
}>();

const { formatDisplayDate, getTodayString, addDaysToDate, isToday: checkIsToday } = useTimeZone();

const formattedDate = computed(() => formatDisplayDate(props.modelValue));
const isToday = computed(() => checkIsToday(props.modelValue));

function handleDateChange(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
}

function previousDay() {
  const newDate = addDaysToDate(props.modelValue, -1);
  emit('update:modelValue', newDate);
}

function nextDay() {
  const newDate = addDaysToDate(props.modelValue, 1);
  emit('update:modelValue', newDate);
}

function goToToday() {
  emit('update:modelValue', getTodayString());
}

function openTaskStatus() {
  emit('open-task-status');
}

function openReports() {
  router.push({ name: 'reports' });
}
</script>

<style scoped>
.rota-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.date-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.nav-btn {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  font-size: var(--font-size-section);
}

.date-display {
  position: relative;
  min-width: 280px;
}

.date-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.date-text {
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  text-align: center;
  font-weight: var(--font-weight-medium);
  pointer-events: none;
}

.today-btn {
  min-width: 100px;
}

.task-status-btn {
  min-width: 120px;
}

@media (max-width: 600px) {
  .rota-nav {
    flex-direction: column;
    width: 100%;
  }

  .date-controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .date-display {
    flex: 1;
    min-width: 0;
  }

  .action-buttons {
    width: 100%;
    flex-direction: column;
  }

  .action-buttons .btn {
    width: 100%;
  }
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}
</style>

