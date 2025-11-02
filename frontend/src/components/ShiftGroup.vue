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
      <!-- Supervisors (present) -->
      <div v-if="getSupervisors(assignments).length > 0" class="supervisor-container">
        <StaffCard
          v-for="assignment in getSupervisors(assignments)"
          :key="`${assignment.staff.id}-${assignment.assignmentDate}`"
          :assignment="assignment"
          :clickable="true"
          @assignment="$emit('staffAssignment', assignment)"
          @absence="$emit('staffAbsence', assignment)"
        />
      </div>

      <!-- Regular Staff (present) -->
      <StaffCard
        v-for="assignment in getRegularStaff(assignments)"
        :key="`${assignment.staff.id}-${assignment.assignmentDate}`"
        :assignment="assignment"
        :clickable="true"
        @assignment="$emit('staffAssignment', assignment)"
        @absence="$emit('staffAbsence', assignment)"
      />

      <!-- Absent staff (separate container at bottom) -->
      <div v-if="getAbsentStaff(assignments).length > 0" class="absent-staff-container">
        <StaffCard
          v-for="assignment in getAbsentStaff(assignments)"
          :key="`${assignment.staff.id}-${assignment.assignmentDate}`"
          :assignment="assignment"
          :clickable="true"
          @assignment="$emit('staffAssignment', assignment)"
          @absence="$emit('staffAbsence', assignment)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ShiftAssignment } from '@shared/types/shift';
import StaffCard from './StaffCard.vue';
import { useAbsence } from '@/composables/useAbsence';

const props = defineProps<{
  shiftType: 'Day' | 'Night';
  assignments: ShiftAssignment[];
}>();

const emit = defineEmits<{
  staffAssignment: [assignment: ShiftAssignment];
  staffAbsence: [assignment: ShiftAssignment];
}>();

const { isAbsenceActive } = useAbsence();

// Check if staff is currently absent
function isStaffAbsent(assignment: ShiftAssignment): boolean {
  return isAbsenceActive(assignment.staff.currentAbsence);
}

// Get supervisors (present only)
function getSupervisors(assignments: ShiftAssignment[]): ShiftAssignment[] {
  return assignments.filter(assignment =>
    assignment.staff.status === 'Supervisor' && !isStaffAbsent(assignment)
  );
}

// Get regular staff (present only, excluding supervisors)
function getRegularStaff(assignments: ShiftAssignment[]): ShiftAssignment[] {
  return assignments.filter(assignment =>
    assignment.staff.status !== 'Supervisor' && !isStaffAbsent(assignment)
  );
}

// Get absent staff (all statuses)
function getAbsentStaff(assignments: ShiftAssignment[]): ShiftAssignment[] {
  return assignments.filter(assignment => isStaffAbsent(assignment));
}

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

.supervisor-container {
  display: grid;
  gap: var(--spacing-2);
  padding-bottom: var(--spacing-2);
  margin-bottom: var(--spacing-2);
  border-bottom: 1px solid var(--color-border);
}

.absent-staff-container {
  display: grid;
  gap: var(--spacing-2);
  padding-top: var(--spacing-2);
  margin-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
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

