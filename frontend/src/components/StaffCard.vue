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
  padding: var(--spacing-2);
  background-color: var(--color-surface);
  border-left: 4px solid var(--color-border);
  border-radius: var(--radius-button);
  transition: all var(--transition-enter);
}

.staff-card:hover {
  box-shadow: var(--shadow-low);
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
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-1);
}

.staff-meta {
  display: flex;
  gap: var(--spacing-2);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.staff-status {
  font-weight: var(--font-weight-medium);
}

.staff-time {
  font-family: var(--font-family-mono);
}

.staff-badges {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
  font-size: var(--font-size-secondary);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-badge);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-manual {
  background-color: #FEF3C7;
  color: var(--color-warning);
}

.badge-fixed {
  background-color: #D1FAE5;
  color: var(--color-success);
}

.badge-overnight {
  background-color: var(--color-day-shift-light);
  color: var(--color-primary);
}

@media (max-width: 600px) {
  .staff-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-1);
  }

  .staff-badges {
    width: 100%;
  }
}
</style>

