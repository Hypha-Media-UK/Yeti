<template>
  <BaseModal v-model="isOpen" :title="title" :close-on-overlay="false" modal-class="confirm-dialog">
    <p class="confirm-message">{{ message }}</p>

    <template #footer>
      <button class="btn btn-secondary" @click="cancel">
        {{ cancelText }}
      </button>
      <button :class="['btn', dangerMode ? 'btn-destructive' : 'btn-primary']" @click="confirm">
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

/* Button styles inherited from global main.css */
/* Note: .btn-danger uses global .btn-destructive class instead */
</style>

<!-- Unscoped button styles -->
<style>
.confirm-dialog .btn {
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

.confirm-dialog .btn:hover:not(:disabled) {
  box-shadow: var(--shadow-low);
}

.confirm-dialog .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-dialog .btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.confirm-dialog .btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.confirm-dialog .btn-secondary {
  background-color: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.confirm-dialog .btn-secondary:hover:not(:disabled) {
  background-color: var(--color-bg);
  border-color: var(--color-text-secondary);
}

.confirm-dialog .btn-destructive {
  background-color: var(--color-error);
  color: white;
}

.confirm-dialog .btn-destructive:hover:not(:disabled) {
  background-color: #B91C1C;
}
</style>

