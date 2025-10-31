import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useModal, useModalForm, useAccordion } from '../useModal';

describe('useModal', () => {
  it('should initialize with closed state by default', () => {
    const { isOpen } = useModal();
    expect(isOpen.value).toBe(false);
  });

  it('should initialize with provided state', () => {
    const { isOpen } = useModal(true);
    expect(isOpen.value).toBe(true);
  });

  it('should open modal', () => {
    const { isOpen, open } = useModal();
    open();
    expect(isOpen.value).toBe(true);
  });

  it('should close modal', () => {
    const { isOpen, close } = useModal(true);
    close();
    expect(isOpen.value).toBe(false);
  });

  it('should toggle modal state', () => {
    const { isOpen, toggle } = useModal();
    
    toggle();
    expect(isOpen.value).toBe(true);
    
    toggle();
    expect(isOpen.value).toBe(false);
  });

  it('should handle loading state', async () => {
    const { isLoading, withLoading } = useModal();
    
    expect(isLoading.value).toBe(false);
    
    const promise = withLoading(async () => {
      expect(isLoading.value).toBe(true);
      return 'result';
    });
    
    const result = await promise;
    expect(result).toBe('result');
    expect(isLoading.value).toBe(false);
  });

  it('should reset loading state on error', async () => {
    const { isLoading, withLoading } = useModal();
    
    try {
      await withLoading(async () => {
        throw new Error('Test error');
      });
    } catch (error) {
      // Expected error
    }
    
    expect(isLoading.value).toBe(false);
  });

  it('should submit and close modal on success', async () => {
    const { isOpen, submitAndClose } = useModal(true);
    
    const result = await submitAndClose(async () => {
      return 'success';
    });
    
    expect(result).toBe('success');
    expect(isOpen.value).toBe(false);
  });
});

describe('useModalForm', () => {
  const initialData = {
    name: '',
    email: '',
    age: 0,
  };

  const validators = {
    name: (value: string) => value.trim().length > 0,
    email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    age: (value: number) => value >= 18,
  };

  it('should initialize with provided data', () => {
    const { formData } = useModalForm(initialData);
    expect(formData.value).toEqual(initialData);
  });

  it('should track dirty state', () => {
    const { formData, isDirty, update } = useModalForm(initialData);
    
    expect(isDirty.value).toBe(false);
    
    update({ name: 'John' });
    expect(isDirty.value).toBe(true);
  });

  it('should validate single field', () => {
    const { formData, validateField, errors } = useModalForm(initialData, validators);
    
    formData.value.name = '';
    expect(validateField('name')).toBe(false);
    expect(errors.value.name).toBeDefined();
    
    formData.value.name = 'John';
    expect(validateField('name')).toBe(true);
    expect(errors.value.name).toBeUndefined();
  });

  it('should validate all fields', () => {
    const { formData, validate } = useModalForm(initialData, validators);
    
    expect(validate()).toBe(false);
    
    formData.value = {
      name: 'John',
      email: 'john@example.com',
      age: 25,
    };
    
    expect(validate()).toBe(true);
  });

  it('should compute isValid correctly', () => {
    const { formData, isValid } = useModalForm(initialData, validators);
    
    expect(isValid.value).toBe(false);
    
    formData.value = {
      name: 'John',
      email: 'john@example.com',
      age: 25,
    };
    
    expect(isValid.value).toBe(true);
  });

  it('should reset form to initial state', () => {
    const { formData, reset, update, isDirty } = useModalForm(initialData);
    
    update({ name: 'John', email: 'john@example.com' });
    expect(isDirty.value).toBe(true);
    
    reset();
    expect(formData.value).toEqual(initialData);
    expect(isDirty.value).toBe(false);
  });

  it('should update form data', () => {
    const { formData, update } = useModalForm(initialData);
    
    update({ name: 'John' });
    expect(formData.value.name).toBe('John');
    expect(formData.value.email).toBe('');
  });

  it('should set new initial data', () => {
    const { formData, isDirty, setInitialData } = useModalForm(initialData);
    
    const newData = {
      name: 'Jane',
      email: 'jane@example.com',
      age: 30,
    };
    
    setInitialData(newData);
    expect(formData.value).toEqual(newData);
    expect(isDirty.value).toBe(false);
  });

  it('should work without validators', () => {
    const { isValid, validate } = useModalForm(initialData);
    
    expect(isValid.value).toBe(true);
    expect(validate()).toBe(true);
  });
});

describe('useAccordion', () => {
  it('should initialize with no expanded section', () => {
    const { expandedId } = useAccordion<number>();
    expect(expandedId.value).toBeNull();
  });

  it('should check if section is expanded', () => {
    const { isExpanded } = useAccordion<number>();
    expect(isExpanded(1)).toBe(false);
  });

  it('should toggle section', () => {
    const { expandedId, toggle, isExpanded } = useAccordion<number>();
    
    toggle(1);
    expect(expandedId.value).toBe(1);
    expect(isExpanded(1)).toBe(true);
    
    toggle(1);
    expect(expandedId.value).toBeNull();
    expect(isExpanded(1)).toBe(false);
  });

  it('should expand different sections', () => {
    const { expandedId, toggle } = useAccordion<number>();
    
    toggle(1);
    expect(expandedId.value).toBe(1);
    
    toggle(2);
    expect(expandedId.value).toBe(2);
  });

  it('should expand specific section', () => {
    const { expandedId, expand } = useAccordion<number>();
    
    expand(5);
    expect(expandedId.value).toBe(5);
  });

  it('should collapse all sections', () => {
    const { expandedId, expand, collapse } = useAccordion<number>();
    
    expand(3);
    expect(expandedId.value).toBe(3);
    
    collapse();
    expect(expandedId.value).toBeNull();
  });

  it('should work with string IDs', () => {
    const { expandedId, toggle } = useAccordion<string>();
    
    toggle('section-1');
    expect(expandedId.value).toBe('section-1');
    
    toggle('section-2');
    expect(expandedId.value).toBe('section-2');
  });
});

