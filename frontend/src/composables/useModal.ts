import { ref, computed } from 'vue';

/**
 * Composable for managing modal state and operations
 * 
 * This provides a reusable pattern for modal dialogs with open/close state,
 * loading states, and form handling.
 * 
 * @example
 * ```typescript
 * const {
 *   isOpen,
 *   isLoading,
 *   open,
 *   close,
 *   withLoading
 * } = useModal();
 * 
 * // Open modal
 * open();
 * 
 * // Perform async operation with loading state
 * await withLoading(async () => {
 *   await api.saveData(data);
 * });
 * ```
 */
export function useModal(initialState = false) {
  const isOpen = ref(initialState);
  const isLoading = ref(false);

  /**
   * Open the modal
   */
  const open = () => {
    isOpen.value = true;
  };

  /**
   * Close the modal
   */
  const close = () => {
    isOpen.value = false;
  };

  /**
   * Toggle the modal open/closed
   */
  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  /**
   * Execute an async function with loading state
   * Automatically sets isLoading to true before execution and false after
   * 
   * @param fn - Async function to execute
   * @returns Promise that resolves with the function's return value
   */
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    isLoading.value = true;
    try {
      return await fn();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Execute an async function with loading state and close modal on success
   * 
   * @param fn - Async function to execute
   * @returns Promise that resolves with the function's return value
   */
  const submitAndClose = async <T>(fn: () => Promise<T>): Promise<T> => {
    const result = await withLoading(fn);
    close();
    return result;
  };

  return {
    isOpen,
    isLoading,
    open,
    close,
    toggle,
    withLoading,
    submitAndClose,
  };
}

/**
 * Composable for managing form state within a modal
 * 
 * Provides utilities for form validation, dirty state tracking, and reset functionality.
 * 
 * @example
 * ```typescript
 * const {
 *   formData,
 *   isDirty,
 *   isValid,
 *   reset,
 *   validate
 * } = useModalForm({
 *   name: '',
 *   email: ''
 * }, {
 *   name: (value) => value.trim().length > 0,
 *   email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
 * });
 * ```
 */
export function useModalForm<T extends Record<string, any>>(
  initialData: T,
  validators?: Partial<Record<keyof T, (value: any) => boolean>>
) {
  const formData = ref<T>({ ...initialData });
  const originalData = ref<T>({ ...initialData });
  const errors = ref<Partial<Record<keyof T, string>>>({});

  /**
   * Check if form has been modified
   */
  const isDirty = computed(() => {
    return JSON.stringify(formData.value) !== JSON.stringify(originalData.value);
  });

  /**
   * Validate a single field
   */
  const validateField = (field: keyof T): boolean => {
    if (!validators || !validators[field]) {
      return true;
    }

    const isValid = validators[field]!(formData.value[field]);
    if (!isValid) {
      errors.value[field] = `Invalid ${String(field)}`;
    } else {
      delete errors.value[field];
    }
    return isValid;
  };

  /**
   * Validate all fields
   */
  const validate = (): boolean => {
    if (!validators) {
      return true;
    }

    let isValid = true;
    for (const field of Object.keys(validators) as Array<keyof T>) {
      if (!validateField(field)) {
        isValid = false;
      }
    }
    return isValid;
  };

  /**
   * Check if form is valid
   */
  const isValid = computed(() => {
    if (!validators) {
      return true;
    }

    return Object.keys(validators).every((field) => {
      const validator = validators[field as keyof T];
      return validator ? validator(formData.value[field as keyof T]) : true;
    });
  });

  /**
   * Reset form to initial state
   */
  const reset = () => {
    formData.value = { ...initialData };
    originalData.value = { ...initialData };
    errors.value = {};
  };

  /**
   * Update form data with new values
   */
  const update = (newData: Partial<T>) => {
    formData.value = { ...formData.value, ...newData };
  };

  /**
   * Set new initial data (useful when editing existing records)
   */
  const setInitialData = (newData: T) => {
    formData.value = { ...newData };
    originalData.value = { ...newData };
    errors.value = {};
  };

  return {
    formData,
    errors,
    isDirty,
    isValid,
    validate,
    validateField,
    reset,
    update,
    setInitialData,
  };
}

/**
 * Composable for managing accordion/expandable sections in modals
 * 
 * @example
 * ```typescript
 * const {
 *   expandedId,
 *   isExpanded,
 *   toggle,
 *   expand,
 *   collapse
 * } = useAccordion<number>();
 * 
 * // Toggle section
 * toggle(departmentId);
 * 
 * // Check if expanded
 * if (isExpanded(departmentId)) {
 *   // ...
 * }
 * ```
 */
export function useAccordion<T = number | string>() {
  const expandedId = ref<T | null>(null);

  /**
   * Check if a section is expanded
   */
  const isExpanded = (id: T): boolean => {
    return expandedId.value === id;
  };

  /**
   * Toggle a section's expanded state
   */
  const toggle = (id: T) => {
    expandedId.value = isExpanded(id) ? null : id;
  };

  /**
   * Expand a specific section
   */
  const expand = (id: T) => {
    expandedId.value = id;
  };

  /**
   * Collapse all sections
   */
  const collapse = () => {
    expandedId.value = null;
  };

  return {
    expandedId,
    isExpanded,
    toggle,
    expand,
    collapse,
  };
}

