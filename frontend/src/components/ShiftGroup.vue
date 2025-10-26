<template>
  <section class="shift-group" :class="groupClass">
    <header class="shift-header">
      <h2 class="shift-title">
        {{ shiftType }} Shift
        <span class="shift-time">{{ shiftTime }}</span>
      </h2>
      <div class="shift-count">
        {{ assignments.length }} {{ assignments.length === 1 ? 'person' : 'people' }}
      </div>
    </header>
    
    <div v-if="assignments.length === 0" class="empty-state">
      No staff scheduled for this shift
    </div>
    
    <div v-else class="shift-list">
      <StaffCard 
        v-for="assignment in assignments" 
        :key="`${assignment.staff.id}-${assignment.assignmentDate}`"
        :assignment="assignment"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ShiftAssignment } from '@shared/types/shift';
import StaffCard from './StaffCard.vue';

const props = defineProps<{
  shiftType: 'Day' | 'Night';
  assignments: ShiftAssignment[];
}>();

const shiftTime = computed(() => {
  return props.shiftType === 'Day' ? '08:00 - 20:00' : '20:00 - 08:00';
});

const groupClass = computed(() => ({
  'group-day': props.shiftType === 'Day',
  'group-night': props.shiftType === 'Night',
}));
</script>

<style scoped>
.shift-group {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.shift-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-outline-variant);
}

.group-day .shift-header {
  border-bottom-color: var(--color-day-shift-light);
}

.group-night .shift-header {
  border-bottom-color: var(--color-night-shift-light);
}

.shift-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-on-surface);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.shift-time {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  color: var(--color-on-surface-variant);
  font-family: 'Courier New', monospace;
}

.shift-count {
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-surface-variant);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-on-surface-variant);
}

.group-day .shift-count {
  background-color: var(--color-day-shift-light);
  color: var(--color-day-shift);
}

.group-night .shift-count {
  background-color: var(--color-night-shift-light);
  color: var(--color-night-shift);
}

.shift-list {
  display: grid;
  gap: var(--spacing-md);
}

.empty-state {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-on-surface-variant);
  font-style: italic;
}

@media (max-width: 640px) {
  .shift-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .shift-title {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style>

