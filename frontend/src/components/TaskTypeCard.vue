<template>
  <div class="task-type-card" @click="$emit('click', taskType)">
    <div class="task-type-info">
      <h3 class="task-type-name">{{ taskType.label }}</h3>
      <p class="task-type-meta">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}</p>
      <p v-if="taskType.description" class="task-type-description">{{ taskType.description }}</p>
    </div>
    <div class="task-type-actions" @click.stop>
      <button class="btn-icon btn-danger" @click="$emit('delete', taskType)" title="Delete">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TaskTypeWithItems } from '@shared/types/task-config';

interface Props {
  taskType: TaskTypeWithItems;
  itemCount: number;
}

defineProps<Props>();

defineEmits<{
  click: [taskType: TaskTypeWithItems];
  delete: [taskType: TaskTypeWithItems];
}>();
</script>

<style scoped>
.task-type-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  cursor: pointer;
}

.task-type-card:hover {
  box-shadow: var(--shadow-medium);
  border-color: var(--color-primary);
}

.task-type-info {
  flex: 1;
  min-width: 0;
}

.task-type-name {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.task-type-meta {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-1) 0;
}

.task-type-description {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.task-type-actions {
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

