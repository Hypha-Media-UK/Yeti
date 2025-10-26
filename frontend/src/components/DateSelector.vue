<template>
  <div class="date-selector">
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
        class="btn btn-secondary nav-btn" 
        @click="nextDay"
        aria-label="Next day"
      >
        →
      </button>
    </div>
    
    <button 
      class="btn btn-primary today-btn" 
      @click="goToToday"
      :disabled="isToday"
    >
      Today
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTimeZone } from '@/composables/useTimeZone';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
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
</script>

<style scoped>
.date-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.date-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.nav-btn {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  font-size: var(--font-size-xl);
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
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: var(--font-weight-medium);
  pointer-events: none;
}

.today-btn {
  min-width: 100px;
}

@media (max-width: 640px) {
  .date-selector {
    flex-direction: column;
    width: 100%;
  }

  .date-controls {
    width: 100%;
  }

  .date-display {
    flex: 1;
    min-width: 0;
  }

  .today-btn {
    width: 100%;
  }
}
</style>

