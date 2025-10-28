<template>
  <div
    class="staff-card"
    :class="cardClass"
    @click="handleClick"
  >
    <div class="staff-info">
      <div class="staff-name">
        {{ staff.firstName }} {{ staff.lastName }} <span class="staff-time">{{ formattedTime }}</span>
      </div>
    </div>

    <div class="staff-badges">
      <span v-if="isAbsent" class="badge badge-absent" :title="formatAbsenceDisplay(staff.currentAbsence!)">
        {{ formatAbsencePeriod(staff.currentAbsence!) }}
      </span>
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
import { useAbsence } from '@/composables/useAbsence';

interface Props {
  assignment: ShiftAssignment;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  clickable: false,
});

const emit = defineEmits<{
  click: [assignment: ShiftAssignment];
}>();

const { formatTime } = useTimeZone();
const { isAbsenceActive, formatAbsencePeriod, formatAbsenceDisplay } = useAbsence();

const staff = computed(() => props.assignment.staff);
const isAbsent = computed(() => isAbsenceActive(staff.value.currentAbsence));
const isManualAssignment = computed(() => props.assignment.isManualAssignment);
const isFixedSchedule = computed(() => props.assignment.isFixedSchedule);
const isOvernight = computed(() => {
  // Check if assignment date is before the current view date (for night shifts)
  return props.assignment.shiftType === 'night' &&
         props.assignment.assignmentDate !== new Date().toISOString().split('T')[0];
});

const formattedTime = computed(() => {
  return `${formatTime(props.assignment.shiftStart)} - ${formatTime(props.assignment.shiftEnd)}`;
});

const cardClass = computed(() => ({
  'shift-day': props.assignment.shiftType === 'day',
  'shift-night': props.assignment.shiftType === 'night',
  'clickable': props.clickable && !isAbsent.value,
  'status-active': props.assignment.status === 'active',
  'status-pending': props.assignment.status === 'pending',
  'status-expired': props.assignment.status === 'expired',
  'staff-absent': isAbsent.value,
}));

const handleClick = () => {
  // Don't allow clicks on absent staff
  if (props.clickable && !isAbsent.value) {
    emit('click', props.assignment);
  }
};
</script>

<style scoped>
.staff-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-2);
  background-color: var(--color-surface);
  border-radius: var(--radius-button);
  transition: all var(--transition-enter);
}

.staff-card:hover {
  box-shadow: var(--shadow-low);
  transform: translateY(-1px);
}

.staff-card.clickable {
  cursor: pointer;
}

.staff-card.clickable:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-2px);
}

/* Status-based styling */
.staff-card.shift-day.status-active {
  background-color: rgba(59, 130, 246, 0.08); /* Subtle blue for day shift */
}

.staff-card.shift-night.status-active {
  background-color: rgba(99, 102, 241, 0.08); /* Subtle indigo for night shift */
}

.staff-card.status-pending {
  background-color: rgba(251, 146, 60, 0.12); /* Subtle orange for pending */
}

.staff-card.status-expired {
  background-color: rgba(156, 163, 175, 0.15); /* Grey */
  opacity: 0.6;
}

/* Absent staff styling - overrides status colors */
.staff-card.staff-absent {
  background-color: rgba(239, 68, 68, 0.15) !important; /* Red background */
  border: 1px solid rgba(239, 68, 68, 0.3);
  cursor: not-allowed !important;
}

.staff-card.staff-absent:hover {
  box-shadow: none !important;
  transform: none !important;
}

.staff-info {
  flex: 1;
}

.staff-name {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.staff-time {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-normal);
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

.badge-absent {
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  font-weight: var(--font-weight-bold);
}

.badge-clickable {
  background-color: var(--color-primary);
  color: white;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
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

