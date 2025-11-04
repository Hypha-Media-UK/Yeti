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
</style>

