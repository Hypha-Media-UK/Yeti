<template>
  <div class="building-card" @click="$emit('click', building)">
    <div class="building-info">
      <h3 class="building-name">{{ building.name }}</h3>
      <p class="building-count">{{ departmentCount }} {{ departmentCount === 1 ? 'department' : 'departments' }}</p>
    </div>
    <div class="building-actions" @click.stop>
      <button class="btn-icon btn-danger" @click="$emit('delete', building)" title="Delete">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Building } from '@shared/types/building';

interface Props {
  building: Building;
  departmentCount: number;
}

defineProps<Props>();

defineEmits<{
  click: [building: Building];
  delete: [building: Building];
}>();
</script>

<style scoped>
.building-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
  cursor: pointer;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.building-card:hover {
  box-shadow: var(--shadow-medium);
  border-color: var(--color-primary);
}

.building-info {
  flex: 1;
  min-width: 0;
}

.building-name {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.building-count {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.building-actions {
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

