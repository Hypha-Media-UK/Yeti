<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">Add Staff to {{ shiftType }} Shift Bank</h2>
        <button class="modal-close" @click="handleClose" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Select staff members to make available for the <strong>{{ shiftType }} Shift</strong> on <strong>{{ formatDate(currentDate) }}</strong>.
          These staff will appear in the {{ shiftType }} shift panel and can be assigned to any department or service as needed.
        </p>

        <!-- Search/Filter -->
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search staff by name..."
            class="search-input"
          />
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading staff...</p>
        </div>

        <!-- Error State -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- Staff List -->
        <div v-else-if="!isLoading" class="staff-list">
          <div v-if="filteredStaff.length === 0" class="empty-state">
            <p>No staff members found.</p>
          </div>

          <label
            v-for="staff in filteredStaff"
            :key="staff.id"
            class="staff-checkbox-item"
          >
            <input
              type="checkbox"
              :value="staff.id"
              v-model="selectedStaffIds"
            />
            <div class="staff-info">
              <span class="staff-name">{{ staff.firstName }} {{ staff.lastName }}</span>
              <span class="staff-status">{{ staff.status }}</span>
            </div>
          </label>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">
          Cancel
        </button>
        <button
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="selectedStaffIds.length === 0 || isSubmitting"
        >
          {{ isSubmitting ? 'Adding...' : `Add ${selectedStaffIds.length} to ${shiftType} Shift` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStaffStore } from '@/stores/staff';
import { useDayStore } from '@/stores/day';
import { api } from '@/services/api';
import type { StaffMember } from '@shared/types/staff';

const props = defineProps<{
  isOpen: boolean;
  shiftType: 'Day' | 'Night';
  currentDate: string;
}>();

const emit = defineEmits<{
  close: [];
  staffAdded: [];
}>();

const staffStore = useStaffStore();
const dayStore = useDayStore();
const searchQuery = ref('');
const selectedStaffIds = ref<number[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const error = ref<string | null>(null);

// Fetch all active staff when modal opens
watch(() => props.isOpen, async (newValue) => {
  if (newValue) {
    selectedStaffIds.value = [];
    searchQuery.value = '';
    error.value = null;
    isLoading.value = true;
    
    try {
      await staffStore.fetchAllStaff();
    } catch (err) {
      error.value = 'Failed to load staff members';
      console.error('Error loading staff:', err);
    } finally {
      isLoading.value = false;
    }
  }
});

// Filter staff based on search query
const filteredStaff = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();

  const allStaff = staffStore.activeStaff;

  if (!query) {
    return allStaff;
  }

  return allStaff.filter(staff => {
    const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
    return fullName.includes(query);
  });
});

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close');
  }
};

const handleSubmit = async () => {
  if (selectedStaffIds.value.length === 0) return;

  isSubmitting.value = true;
  error.value = null;

  try {
    // Create manual assignments for each selected staff member
    // This makes them available for the specific shift on the specific date
    const assignmentPromises = selectedStaffIds.value.map(staffId =>
      api.createAssignment({
        staffId,
        assignmentDate: props.currentDate,
        shiftType: props.shiftType,
        areaType: null,
        areaId: null,
        shiftStart: null,
        shiftEnd: null,
        startTime: null,
        endTime: null,
        endDate: null,
        notes: `Added to ${props.shiftType} shift bank via Bank button`
      })
    );

    await Promise.all(assignmentPromises);

    // Clear cache and emit success
    dayStore.clearRotaCache([props.currentDate]);
    emit('staffAdded');
    emit('close');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to add staff to shift bank';
    console.error('Error adding staff to shift bank:', err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.search-box {
  margin-bottom: 1rem;
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9375rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 0.75rem 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
  margin-bottom: 1rem;
}

.staff-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.staff-checkbox-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.staff-checkbox-item:hover {
  background-color: var(--bg-hover);
  border-color: var(--primary-color);
}

.staff-checkbox-item input[type="checkbox"] {
  margin-right: 0.75rem;
  cursor: pointer;
}

.staff-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.staff-name {
  font-weight: 500;
  color: var(--text-primary);
}

.staff-status {
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary);
  border-radius: 3px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}
</style>

