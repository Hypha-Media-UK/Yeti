<template>
  <div class="staffing-requirements-editor">
    <div class="requirements-header">
      <h4 class="requirements-title">Minimum Staffing Requirements</h4>
    </div>

    <div v-if="entries.length === 0" class="empty-state">
      No staffing requirements configured
    </div>

    <div v-else class="requirements-list">
      <div v-for="(entry, index) in entries" :key="index" class="requirement-entry">
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
          v-model="entry.timeStart"
          type="time"
          class="time-input"
          @change="emitChange"
        />

        <span class="time-separator">to</span>

        <input
          v-model="entry.timeEnd"
          type="time"
          class="time-input"
          @change="emitChange"
        />

        <input
          v-model.number="entry.requiredStaff"
          type="number"
          min="1"
          class="staff-input"
          placeholder="Min staff"
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
        + Add Requirement
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface StaffingRequirement {
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  requiredStaff: number;
}

interface Props {
  modelValue: StaffingRequirement[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: StaffingRequirement[]): void;
}>();

const entries = ref<StaffingRequirement[]>([...props.modelValue]);

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  entries.value = [...newValue];
}, { deep: true });

function addEntry() {
  entries.value.push({
    dayOfWeek: 1, // Monday
    timeStart: '08:00',
    timeEnd: '17:00',
    requiredStaff: 1,
  });
  emitChange();
}

function removeEntry(index: number) {
  entries.value.splice(index, 1);
  emitChange();
}

function emitChange() {
  emit('update:modelValue', entries.value);
}
</script>

<style scoped>
.staffing-requirements-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.requirements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.requirements-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin: 0;
}

.empty-state {
  padding: var(--spacing-3);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-card);
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.requirement-entry {
  display: grid;
  grid-template-columns: 120px 80px auto 80px 80px 32px;
  gap: var(--spacing-2);
  align-items: center;
}

.day-select,
.time-input,
.staff-input {
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-size-body-sm);
  font-family: inherit;
  transition: var(--transition-base);
}

.day-select:focus,
.time-input:focus,
.staff-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.time-separator {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  text-align: center;
}

.staff-input {
  width: 80px;
}

.add-section {
  display: flex;
  justify-content: flex-start;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}
</style>

