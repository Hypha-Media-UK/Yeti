<template>
  <div class="tabs">
    <div class="tabs-header">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-button', { active: modelValue === tab.value }]"
        @click="selectTab(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>
    <div class="tabs-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Tab {
  label: string;
  value: string;
  count?: number;
}

interface Props {
  tabs: Tab[];
  modelValue: string;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectTab = (value: string) => {
  emit('update:modelValue', value);
};
</script>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.tabs-header {
  display: flex;
  gap: var(--spacing-1);
  border-bottom: 2px solid var(--color-border);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-button {
  background: none;
  border: none;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: var(--transition-base);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.tab-button:hover {
  color: var(--color-text-primary);
}

.tab-button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-count {
  background-color: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-badge);
  font-weight: var(--font-weight-medium);
}

.tab-button.active .tab-count {
  background-color: var(--color-primary);
  color: white;
}

.tabs-content {
  /* Content slot */
}
</style>

