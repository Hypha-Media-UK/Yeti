<template>
  <div class="staff-card" :class="cardClass">
    <div class="staff-info">
      <div class="staff-name">
        {{ staff.firstName }} {{ staff.lastName }}
      </div>
      <div class="staff-meta">
        <span class="staff-status">{{ staff.status }}</span>
        <span class="staff-time">{{ formattedTime }}</span>
      </div>
    </div>
    
    <div class="staff-badges">
      <span v-if="isManualAssignment" class="badge badge-manual" title="Manual assignment">
        Manual
      </span>
      <span v-if="isFixedSchedule" class="badge badge-fixed" title="Fixed schedule">
        Fixed
      </span>
      <span v-if="isOvernight" class="badge badge-overnight" title="Shift started previous day">
        Overnight
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ShiftAssignment } from '@shared/types/shift';
import { useTimeZone } from '@/composables/useTimeZone';

const props = defineProps<{
  assignment: ShiftAssignment;
}>();

const { formatTime } = useTimeZone();

const staff = computed(() => props.assignment.staff);
const isManualAssignment = computed(() => props.assignment.isManualAssignment);
const isFixedSchedule = computed(() => props.assignment.isFixedSchedule);
const isOvernight = computed(() => {
  // Check if assignment date is before the current view date (for night shifts)
  return props.assignment.shiftType === 'Night' && 
         props.assignment.assignmentDate !== new Date().toISOString().split('T')[0];
});

const formattedTime = computed(() => {
  return `${formatTime(props.assignment.shiftStart)} - ${formatTime(props.assignment.shiftEnd)}`;
});

const cardClass = computed(() => ({
  'shift-day': props.assignment.shiftType === 'Day',
  'shift-night': props.assignment.shiftType === 'Night',
}));
</script>

<style scoped>
.staff-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border-left: 4px solid var(--color-outline);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.staff-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.staff-card.shift-day {
  border-left-color: var(--color-day-shift);
}

.staff-card.shift-night {
  border-left-color: var(--color-night-shift);
}

.staff-info {
  flex: 1;
}

.staff-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--color-on-surface);
  margin-bottom: var(--spacing-xs);
}

.staff-meta {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-on-surface-variant);
}

.staff-status {
  font-weight: var(--font-weight-medium);
}

.staff-time {
  font-family: 'Courier New', monospace;
}

.staff-badges {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-manual {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}

.badge-fixed {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.badge-overnight {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .staff-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .staff-badges {
    width: 100%;
  }
}
</style>

