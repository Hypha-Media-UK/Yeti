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
      <div
        v-for="assignment in getSupervisors(assignments)"
        :key="`${assignment.staff.id}-${assignment.assignmentDate}`"
        class="staff-item"
        :class="getStaffItemClass(assignment)"
        @click="handleStaffClick(assignment)"
        :title="getStaffItemTitle(assignment)"
      >
        <span class="staff-name">
          {{ assignment.staff.firstName }} {{ assignment.staff.lastName }}
        </span>
        <span class="staff-time">{{ formatTime(assignment.shiftStart) }} - {{ formatTime(assignment.shiftEnd) }}</span>
      </div>

      <!-- Separator after supervisors if there are any -->
      <div v-if="getSupervisors(assignments).length > 0 && getRegularStaff(assignments).length > 0" class="staff-separator"></div>

      <!-- Regular Staff (present) -->
      <div
        v-for="assignment in getRegularStaff(assignments)"
        :key="`${assignment.staff.id}-${assignment.assignmentDate}`"
        class="staff-item"
        :class="getStaffItemClass(assignment)"
        @click="handleStaffClick(assignment)"
        :title="getStaffItemTitle(assignment)"
      >
        <span class="staff-name">
          {{ assignment.staff.firstName }} {{ assignment.staff.lastName }}
        </span>
        <span class="staff-time">{{ formatTime(assignment.shiftStart) }} - {{ formatTime(assignment.shiftEnd) }}</span>
      </div>

      <!-- Absent staff (separate container at bottom) -->
      <div v-if="getAbsentStaff(assignments).length > 0" class="absent-staff-container">
        <div
          v-for="assignment in getAbsentStaff(assignments)"
          :key="`${assignment.staff.id}-${assignment.assignmentDate}`"
          class="staff-item staff-absent"
          :title="formatAbsenceDisplay(assignment.staff.currentAbsence!)"
        >
          <span class="staff-name">
            {{ assignment.staff.firstName }} {{ assignment.staff.lastName }}
            <span class="absence-badge" :title="formatAbsenceDisplay(assignment.staff.currentAbsence!)">
              {{ formatAbsencePeriod(assignment.staff.currentAbsence!) }}
            </span>
          </span>
          <span class="staff-time">{{ formatTime(assignment.shiftStart) }} - {{ formatTime(assignment.shiftEnd) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ShiftAssignment } from '@shared/types/shift';
import { useAbsence } from '@/composables/useAbsence';
import { useTimeZone } from '@/composables/useTimeZone';

const props = defineProps<{
  shiftType: 'Day' | 'Night';
  assignments: ShiftAssignment[];
}>();

const emit = defineEmits<{
  staffAssignment: [assignment: ShiftAssignment];
  staffAbsence: [assignment: ShiftAssignment];
}>();

const { isAbsenceActive, formatAbsencePeriod, formatAbsenceDisplay } = useAbsence();
const { formatTime } = useTimeZone();

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

// Get CSS class for staff item based on status
function getStaffItemClass(assignment: ShiftAssignment): string {
  const classes = ['clickable'];

  if (assignment.status === 'active') {
    classes.push('status-active');
  } else if (assignment.status === 'pending') {
    classes.push('status-pending');
  } else if (assignment.status === 'expired') {
    classes.push('status-expired');
  }

  return classes.join(' ');
}

// Get title/tooltip for staff item
function getStaffItemTitle(assignment: ShiftAssignment): string {
  const parts: string[] = [];

  if (assignment.isManualAssignment) {
    parts.push('Manual assignment');
  }
  if (assignment.isFixedSchedule) {
    parts.push('Fixed schedule');
  }
  if (assignment.status === 'pending') {
    parts.push('Pending (starts in future)');
  } else if (assignment.status === 'expired') {
    parts.push('Expired (ended in past)');
  }

  return parts.length > 0 ? parts.join(' • ') : 'Click to manage assignment or absence';
}

// Handle staff click - show context menu or modal
function handleStaffClick(assignment: ShiftAssignment) {
  // For now, emit both events and let parent decide
  // In future, could show a context menu
  emit('staffAssignment', assignment);
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
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.staff-separator {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-1) 0;
}

.staff-item {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  padding: var(--spacing-1);
  background-color: var(--color-bg);
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: var(--transition-base);
}

.staff-item.clickable {
  cursor: pointer;
}

.staff-item.clickable:hover {
  background-color: var(--color-background);
  box-shadow: var(--shadow-low);
  transform: translateY(-1px);
}

/* Status-based styling */
.staff-item.status-active {
  background-color: var(--color-bg);
}

.staff-item.status-pending {
  background-color: rgba(254, 243, 199, 0.3); /* Very pale yellow */
}

.staff-item.status-expired {
  background-color: rgba(156, 163, 175, 0.15); /* Grey */
  opacity: 0.6;
  color: var(--color-text-secondary);
}

.staff-item.status-expired .staff-time {
  color: var(--color-text-tertiary, #9ca3af);
}

/* Absent staff styling - overrides status colors */
.staff-item.staff-absent {
  background-color: rgba(239, 68, 68, 0.15) !important; /* Red background */
  border: 1px solid rgba(239, 68, 68, 0.3);
  cursor: not-allowed !important;
  opacity: 1 !important;
}

.staff-item.staff-absent:hover {
  box-shadow: none !important;
  transform: none !important;
}

.staff-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.staff-time {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-surface);
  padding: 2px var(--spacing-1);
  border-radius: 4px;
  margin-left: var(--spacing-2);
}

.absence-badge {
  background-color: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 0.125rem 0.375rem;
  font-size: var(--font-size-secondary);
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-badge);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.absent-staff-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
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

