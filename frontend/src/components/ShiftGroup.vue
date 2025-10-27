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
        :clickable="true"
        @click="$emit('staffClick', assignment)"
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

const emit = defineEmits<{
  staffClick: [assignment: ShiftAssignment];
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
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
  box-shadow: var(--shadow-medium);
}

.shift-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
  padding-bottom: var(--spacing-2);
  border-bottom: 2px solid var(--color-border);
}

.group-day .shift-header {
  border-bottom-color: var(--color-day-shift-light);
}

.group-night .shift-header {
  border-bottom-color: var(--color-night-shift-light);
}

.shift-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.shift-time {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

.shift-count {
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-bg);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
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
  gap: var(--spacing-2);
}

.empty-state {
  padding: var(--spacing-4);
  text-align: center;
  color: var(--color-text-secondary);
  font-style: italic;
}

@media (max-width: 600px) {
  .shift-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
  }

  .shift-title {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
  }
}
</style>

