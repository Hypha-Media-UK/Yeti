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

interface Props {
  shift: Shift;
  staffCount?: number;
}

defineProps<Props>();

defineEmits<{
  edit: [shift: Shift];
  delete: [shift: Shift];
}>();
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

