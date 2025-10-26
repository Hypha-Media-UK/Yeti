<template>
  <div class="assignment-form card">
    <h3 class="form-title">Add Manual Assignment</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="staff-select" class="label">Staff Member</label>
        <select 
          id="staff-select" 
          v-model="formData.staffId" 
          class="input"
          required
        >
          <option value="">Select staff member</option>
          <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
            {{ staff.firstName }} {{ staff.lastName }} ({{ staff.status }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="shift-type" class="label">Shift Type</label>
        <select 
          id="shift-type" 
          v-model="formData.shiftType" 
          class="input"
          required
        >
          <option value="">Select shift type</option>
          <option value="Day">Day (08:00 - 20:00)</option>
          <option value="Night">Night (20:00 - 08:00)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="notes" class="label">Notes (optional)</label>
        <textarea 
          id="notes" 
          v-model="formData.notes" 
          class="input"
          rows="2"
          placeholder="Add any notes about this assignment"
        ></textarea>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isLoading || !isFormValid">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Add Assignment</span>
        </button>
        <button type="button" class="btn btn-secondary" @click="resetForm">
          Clear
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStaffStore } from '@/stores/staff';
import { useRotaStore } from '@/stores/rota';
import type { ShiftGroup } from '@shared/types/staff';

const props = defineProps<{
  date: string;
}>();

const staffStore = useStaffStore();
const rotaStore = useRotaStore();

const formData = ref({
  staffId: '',
  shiftType: '' as ShiftGroup | '',
  notes: '',
});

const isLoading = ref(false);
const error = ref<string | null>(null);

const staffList = computed(() => staffStore.activeStaff);

const isFormValid = computed(() => {
  return formData.value.staffId && formData.value.shiftType;
});

async function handleSubmit() {
  if (!isFormValid.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    await rotaStore.createAssignment({
      staffId: parseInt(formData.value.staffId),
      assignmentDate: props.date,
      shiftType: formData.value.shiftType as ShiftGroup,
      shiftStart: null,
      shiftEnd: null,
      notes: formData.value.notes || null,
    });

    resetForm();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create assignment';
  } finally {
    isLoading.value = false;
  }
}

function resetForm() {
  formData.value = {
    staffId: '',
    shiftType: '',
    notes: '',
  };
  error.value = null;
}
</script>

<style scoped>
.assignment-form {
  margin-top: var(--spacing-3);
}

.form-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-3);
}

.form-group {
  margin-bottom: var(--spacing-2);
}

.form-actions {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}

.form-actions button {
  flex: 1;
}

textarea.input {
  resize: vertical;
  min-height: 60px;
}

@media (max-width: 600px) {
  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>

