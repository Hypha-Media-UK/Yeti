<template>
  <div class="shift-card">
    <div class="shift-header">
      <div class="shift-color" :style="{ backgroundColor: shift.color }"></div>
      <div class="shift-info">
        <h3 class="shift-name">{{ shift.name }}</h3>
        <span class="shift-type-badge" :class="`shift-type-${shift.type}`">
          {{ shift.type === 'day' ? 'Day' : 'Night' }}
        </span>
      </div>
    </div>
    <p v-if="shift.description" class="shift-description">{{ shift.description }}</p>
    <div class="shift-meta">
      <span class="shift-status" :class="{ inactive: !shift.isActive }">
        {{ shift.isActive ? 'Active' : 'Inactive' }}
      </span>
      <span v-if="staffCount !== undefined" class="staff-count">
        {{ staffCount }} {{ staffCount === 1 ? 'staff member' : 'staff members' }}
      </span>
    </div>
    <div v-if="staffMembers && staffMembers.length > 0" class="staff-list">
      <div class="staff-list-header">Staff:</div>
      <ul class="staff-items">
        <li
          v-for="staff in staffMembers"
          :key="staff.id"
          class="staff-item"
          @click="$emit('staff-click', staff)"
        >
          {{ staff.firstName }} {{ staff.lastName }}
          <span v-if="hasPersonalOffset(staff)" class="offset-badge">
            {{ formatOffset(staff) }}
          </span>
        </li>
      </ul>
    </div>
    <div class="shift-actions">
      <button class="btn-icon" @click="$emit('edit', shift)" title="Edit">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button 
        class="btn-icon btn-danger" 
        @click="$emit('delete', shift)" 
        title="Delete"
        :disabled="staffCount && staffCount > 0"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Shift } from '@shared/types/shift';
import type { StaffMember } from '@shared/types/staff';

interface Props {
  shift: Shift;
  staffCount?: number;
  staffMembers?: StaffMember[];
}

const props = defineProps<Props>();

defineEmits<{
  edit: [shift: Shift];
  delete: [shift: Shift];
  'staff-click': [staff: StaffMember];
}>();

// Check if staff has a personal offset different from the shift's default
const hasPersonalOffset = (staff: StaffMember): boolean => {
  if (!props.shift.daysOffset && staff.daysOffset === 0) return false;
  return staff.daysOffset !== props.shift.daysOffset;
};

// Format the offset for display
const formatOffset = (staff: StaffMember): string => {
  const offset = staff.daysOffset;
  return offset >= 0 ? `+${offset}` : `${offset}`;
};
</script>

<style scoped>
.shift-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
  transition: var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.shift-card:hover {
  box-shadow: var(--shadow-medium);
  border-color: var(--color-primary);
}

.shift-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.shift-color {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-button);
  flex-shrink: 0;
  border: 2px solid var(--color-border);
}

.shift-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.shift-name {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.shift-type-badge {
  font-size: var(--font-size-body-sm);
  padding: 2px 8px;
  border-radius: var(--radius-button);
  font-weight: var(--font-weight-medium);
}

.shift-type-day {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3B82F6;
}

.shift-type-night {
  background-color: rgba(139, 92, 246, 0.1);
  color: #8B5CF6;
}

.shift-description {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.shift-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-body-sm);
}

.shift-status {
  padding: 2px 8px;
  border-radius: var(--radius-button);
  font-weight: var(--font-weight-medium);
  background-color: rgba(34, 197, 94, 0.1);
  color: #22C55E;
}

.shift-status.inactive {
  background-color: rgba(156, 163, 175, 0.1);
  color: #9CA3AF;
}

.staff-count {
  color: var(--color-text-secondary);
}

.staff-list {
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
}

.staff-list-header {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-1);
}

.staff-items {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.staff-item {
  font-size: var(--font-size-body-sm);
  padding: 6px 10px;
  background-color: rgba(156, 163, 175, 0.1);
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: var(--transition-base);
  color: var(--color-text-primary);
}

.staff-item:hover {
  background-color: rgba(156, 163, 175, 0.2);
  color: var(--color-primary);
}

.offset-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  background-color: rgba(99, 102, 241, 0.15);
  color: #6366F1;
  border-radius: 4px;
  vertical-align: middle;
}

.shift-actions {
  display: flex;
  gap: var(--spacing-1);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border);
}

.btn-icon {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-button);
  transition: var(--transition-base);
}

.btn-icon:hover:not(:disabled) {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}

.btn-icon.btn-danger:hover:not(:disabled) {
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

