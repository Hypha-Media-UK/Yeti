<template>
  <BaseModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" :title="service ? 'Edit Service' : 'Add Service'">
    <form @submit.prevent="handleSubmit" class="service-form">
      <div class="form-group">
        <label for="serviceName" class="form-label">Service Name *</label>
        <input
          id="serviceName"
          v-model="formData.name"
          type="text"
          class="form-input"
          required
        />
      </div>

      <div class="form-group">
        <label for="serviceDescription" class="form-label">Description</label>
        <textarea
          id="serviceDescription"
          v-model="formData.description"
          class="form-input"
          rows="3"
        />
      </div>

      <div v-if="error" class="form-error">
        {{ error }}
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="$emit('update:modelValue', false)">
          Cancel
        </button>
        <button type="submit" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : (service ? 'Update' : 'Create') }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import type { Service } from '@shared/types/service';

interface Props {
  modelValue: boolean;
  service?: Service | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: { name: string; description: string | null }];
}>();

const loading = ref(false);
const error = ref('');

const formData = reactive({
  name: props.service?.name || '',
  description: props.service?.description || '',
});

const handleSubmit = () => {
  error.value = '';
  loading.value = true;

  const data = {
    name: formData.name.trim(),
    description: formData.description?.trim() || null,
  };

  emit('submit', data);
  loading.value = false;
};

// Watch for prop changes (when editing)
watch(() => props.service, (newService) => {
  if (newService) {
    formData.name = newService.name;
    formData.description = newService.description || '';
  } else {
    formData.name = '';
    formData.description = '';
  }
}, { immediate: true });
</script>

<style scoped>
.service-form {
  display: flex;
  flex-direction: column;
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

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.form-error {
  padding: var(--spacing-2);
  background-color: rgba(220, 38, 38, 0.1);
  color: var(--color-error);
  border-radius: var(--radius-card);
  font-size: var(--font-size-body-sm);
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  justify-content: flex-end;
  margin-top: var(--spacing-2);
}
</style>

