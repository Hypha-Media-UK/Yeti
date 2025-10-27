<template>
  <div class="staff-management-card">
    <div class="staff-info">
      <h3 class="staff-name">{{ staff.firstName }} {{ staff.lastName }}</h3>
      <div class="staff-details">
        <span class="badge badge-status">{{ staff.status }}</span>
      </div>
    </div>
    <div class="staff-actions">
      <button class="btn-icon" @click="$emit('edit', staff)" title="Edit">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button class="btn-icon btn-danger" @click="$emit('delete', staff)" title="Delete">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StaffMember } from '@shared/types/staff';

interface Props {
  staff: StaffMember;
}

defineProps<Props>();

defineEmits<{
  edit: [staff: StaffMember];
  delete: [staff: StaffMember];
}>();
</script>

<style scoped>
.staff-management-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-button);
  padding: var(--spacing-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  transition: var(--transition-base);
}

.staff-management-card:hover {
  box-shadow: var(--shadow-low);
}

.staff-info {
  flex: 1;
  min-width: 0;
}

.staff-name {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.staff-details {
  display: flex;
  gap: var(--spacing-1);
  align-items: center;
}

.badge {
  font-size: var(--font-size-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-badge);
  font-weight: var(--font-weight-medium);
}

.badge-status {
  background-color: var(--color-badge-regular);
  color: var(--color-text-primary);
}

.staff-actions {
  display: flex;
  gap: var(--spacing-1);
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

.btn-icon:hover {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}

.btn-icon.btn-danger:hover {
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
}
</style>

