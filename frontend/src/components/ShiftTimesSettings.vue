<template>
  <div class="shift-times-settings">
    <div class="settings-header">
      <h2 class="settings-title">Shift Times Configuration</h2>
      <p class="settings-description">
        Configure the default start and end times for day and night shifts. These times are used
        throughout the system for rota generation and display.
      </p>
    </div>

    <form @submit.prevent="handleSubmit" class="settings-form">
      <div class="shift-section">
        <h3 class="shift-section-title">
          <span class="shift-type-badge shift-type-day">Day Shift</span>
        </h3>
        <div class="time-inputs">
          <div class="form-group">
            <label for="dayShiftStart" class="form-label">Start Time *</label>
            <input
              id="dayShiftStart"
              v-model="formData.dayShiftStart"
              type="time"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="dayShiftEnd" class="form-label">End Time *</label>
            <input
              id="dayShiftEnd"
              v-model="formData.dayShiftEnd"
              type="time"
              class="form-input"
              required
            />
          </div>
        </div>
        <p class="form-hint">
          Default: 08:00 - 20:00 (12 hours)
        </p>
      </div>

      <div class="shift-section">
        <h3 class="shift-section-title">
          <span class="shift-type-badge shift-type-night">Night Shift</span>
        </h3>
        <div class="time-inputs">
          <div class="form-group">
            <label for="nightShiftStart" class="form-label">Start Time *</label>
            <input
              id="nightShiftStart"
              v-model="formData.nightShiftStart"
              type="time"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="nightShiftEnd" class="form-label">End Time *</label>
            <input
              id="nightShiftEnd"
              v-model="formData.nightShiftEnd"
              type="time"
              class="form-input"
              required
            />
          </div>
        </div>
        <p class="form-hint">
          Default: 20:00 - 08:00 (12 hours, crosses midnight)
        </p>
      </div>

      <div v-if="error" class="form-error">
        {{ error }}
      </div>

      <div v-if="successMessage" class="form-success">
        {{ successMessage }}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="resetToDefaults">
          Reset to Defaults
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { api } from '@/services/api';

const loading = ref(false);
const error = ref('');
const successMessage = ref('');

const formData = reactive({
  dayShiftStart: '08:00',
  dayShiftEnd: '20:00',
  nightShiftStart: '20:00',
  nightShiftEnd: '08:00',
});

const loadShiftTimes = async () => {
  try {
    const times = await api.getShiftTimes();
    formData.dayShiftStart = times.dayShiftStart;
    formData.dayShiftEnd = times.dayShiftEnd;
    formData.nightShiftStart = times.nightShiftStart;
    formData.nightShiftEnd = times.nightShiftEnd;
  } catch (err) {
    console.error('Failed to load shift times:', err);
    error.value = 'Failed to load shift times. Using defaults.';
  }
};

const handleSubmit = async () => {
  error.value = '';
  successMessage.value = '';
  loading.value = true;

  try {
    await api.updateShiftTimes({
      dayShiftStart: formData.dayShiftStart,
      dayShiftEnd: formData.dayShiftEnd,
      nightShiftStart: formData.nightShiftStart,
      nightShiftEnd: formData.nightShiftEnd,
    });
    
    successMessage.value = 'Shift times updated successfully!';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    console.error('Failed to save shift times:', err);
    error.value = 'Failed to save shift times. Please try again.';
  } finally {
    loading.value = false;
  }
};

const resetToDefaults = () => {
  formData.dayShiftStart = '08:00';
  formData.dayShiftEnd = '20:00';
  formData.nightShiftStart = '20:00';
  formData.nightShiftEnd = '08:00';
  error.value = '';
  successMessage.value = '';
};

onMounted(() => {
  loadShiftTimes();
});
</script>

<style scoped>
.shift-times-settings {
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: var(--spacing-4);
}

.settings-title {
  font-size: var(--font-size-headline);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.settings-description {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.settings-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: var(--spacing-4);
}

.shift-section {
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
}

.shift-section:last-of-type {
  border-bottom: none;
}

.shift-section-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.shift-type-badge {
  font-size: var(--font-size-body-sm);
  padding: 4px 12px;
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

.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.form-label {
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-input {
  padding: var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  font-size: var(--font-size-body);
  font-family: inherit;
  transition: var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-hint {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: var(--spacing-1) 0 0 0;
}

.form-error {
  padding: var(--spacing-2);
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-card);
  font-size: var(--font-size-body-sm);
  margin-bottom: var(--spacing-3);
}

.form-success {
  padding: var(--spacing-2);
  background-color: rgba(34, 197, 94, 0.1);
  color: #22C55E;
  border-radius: var(--radius-card);
  font-size: var(--font-size-body-sm);
  margin-bottom: var(--spacing-3);
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  margin-top: var(--spacing-3);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 600px) {
  .time-inputs {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- Unscoped button styles -->
<style>
.shift-times-settings .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1);
  padding: 0.625rem var(--spacing-2);
  font-family: var(--font-family);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  line-height: 1;
  border: none;
  border-radius: var(--radius-button);
  cursor: pointer;
  transition: background-color var(--transition-enter),
              box-shadow var(--transition-enter);
  white-space: nowrap;
}

.shift-times-settings .btn:hover:not(:disabled) {
  box-shadow: var(--shadow-low);
}

.shift-times-settings .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.shift-times-settings .btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.shift-times-settings .btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.shift-times-settings .btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.shift-times-settings .btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg);
  border-color: var(--color-text-secondary);
}
</style>

