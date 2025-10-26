<template>
  <BaseModal v-model="isOpen" :title="title" :close-on-overlay="false">
    <p class="confirm-message">{{ message }}</p>
    
    <template #footer>
      <button class="btn btn-secondary" @click="cancel">
        {{ cancelText }}
      </button>
      <button :class="['btn', dangerMode ? 'btn-danger' : 'btn-primary']" @click="confirm">
        {{ confirmText }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';

interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  dangerMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  dangerMode: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'confirm': [];
  'cancel': [];
}>();

const isOpen = ref(props.modelValue);

watch(() => props.modelValue, (value) => {
  isOpen.value = value;
});

watch(isOpen, (value) => {
  emit('update:modelValue', value);
});

const confirm = () => {
  emit('confirm');
  isOpen.value = false;
};

const cancel = () => {
  emit('cancel');
  isOpen.value = false;
};
</script>

<style scoped>
.confirm-message {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  line-height: 1.5;
  margin: 0;
}

.btn {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-base);
  border: none;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-border);
}

.btn-danger {
  background-color: var(--color-error);
  color: white;
}

.btn-danger:hover {
  background-color: var(--color-error-hover);
}
</style>

