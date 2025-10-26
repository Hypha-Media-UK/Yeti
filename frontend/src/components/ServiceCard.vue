<template>
  <div class="service-card">
    <div class="service-info">
      <h3 class="service-name">{{ service.name }}</h3>
      <p v-if="service.description" class="service-description">{{ service.description }}</p>
    </div>
    <div class="service-actions">
      <button class="btn-icon" @click="$emit('edit', service)" title="Edit">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button class="btn-icon btn-danger" @click="$emit('delete', service)" title="Delete">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Service } from '@shared/types/service';

interface Props {
  service: Service;
}

defineProps<Props>();

defineEmits<{
  edit: [service: Service];
  delete: [service: Service];
}>();
</script>

<style scoped>
.service-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-3);
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.service-card:hover {
  box-shadow: var(--shadow-medium);
  border-color: var(--color-primary);
}

.service-info {
  flex: 1;
  min-width: 0;
}

.service-name {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.service-description {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.service-actions {
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

