<template>
  <div class="operational-hours-editor">
    <div class="hours-header">
      <h4 class="hours-title">{{ title }}</h4>
      <button v-if="showCopyFrom" type="button" class="btn btn-sm btn-secondary" @click="$emit('copy')">
        Copy from another {{ copyFromLabel }}
      </button>
    </div>

    <div v-if="entries.length === 0" class="empty-state">
      No operational hours configured
    </div>

    <div v-else class="hours-list">
      <div v-for="(entry, index) in entries" :key="index" class="hours-entry">
        <select v-model="entry.dayOfWeek" class="day-select" @change="emitChange">
          <option :value="1">Monday</option>
          <option :value="2">Tuesday</option>
          <option :value="3">Wednesday</option>
          <option :value="4">Thursday</option>
          <option :value="5">Friday</option>
          <option :value="6">Saturday</option>
          <option :value="7">Sunday</option>
        </select>

        <input
          v-model="entry.startTime"
          type="time"
          class="time-input"
          @change="emitChange"
        />

        <span class="time-separator">to</span>

        <input
          v-model="entry.endTime"
          type="time"
          class="time-input"
          @change="emitChange"
        />

        <button
          type="button"
          class="btn btn-sm btn-icon btn-destructive"
          @click="removeEntry(index)"
          title="Remove"
        >
          ×
        </button>
      </div>
    </div>

    <div class="add-section">
      <button type="button" class="btn btn-sm btn-secondary" @click="addEntry">
        + Add Day
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface HoursEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Props {
  modelValue: HoursEntry[];
  title?: string;
  showCopyFrom?: boolean;
  copyFromLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Operational Hours',
  showCopyFrom: false,
  copyFromLabel: 'area',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: HoursEntry[]): void;
  (e: 'copy'): void;
}>();

const entries = ref<HoursEntry[]>([...props.modelValue]);

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  entries.value = [...newValue];
}, { deep: true });

function addEntry() {
  entries.value.push({
    dayOfWeek: 1, // Monday
    startTime: '08:00',
    endTime: '17:00',
  });
  emitChange();
}

function removeEntry(index: number) {
  entries.value.splice(index, 1);
  emitChange();
}

function emitChange() {
  emit('update:modelValue', [...entries.value]);
}
</script>

<style scoped>
.operational-hours-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hours-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hours-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  background: var(--surface-secondary);
  border-radius: 4px;
}

.hours-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hours-entry {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-select {
  flex: 0 0 120px;
  padding: 6px 8px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  font-size: 14px;
  background: var(--surface-primary);
  color: var(--text-primary);
}

.day-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.time-input {
  flex: 0 0 100px;
  padding: 6px 8px;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  font-size: 14px;
  background: var(--surface-primary);
  color: var(--text-primary);
}

.time-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.time-separator {
  color: var(--text-secondary);
  font-size: 14px;
}

.add-section {
  padding-top: 8px;
  border-top: 1px solid var(--border-primary);
}
</style>

<style>
/* Unscoped styles for buttons */
.operational-hours-editor .btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.operational-hours-editor .btn-sm {
  padding: 4px 8px;
  font-size: 13px;
}

.operational-hours-editor .btn-icon {
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
}

.operational-hours-editor .btn-secondary {
  background: var(--surface-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.operational-hours-editor .btn-secondary:hover {
  background: var(--surface-tertiary);
}

.operational-hours-editor .btn-destructive {
  background: var(--error);
  color: white;
}

.operational-hours-editor .btn-destructive:hover {
  background: var(--error-dark);
}
</style>

