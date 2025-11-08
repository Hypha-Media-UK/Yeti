<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">Add Staff to Bank (Pool)</h2>
        <button class="modal-close" @click="handleClose" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Select staff members to add to the bank (pool). Bank staff are available for temporary assignments to any department or service.
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
            :class="{ 'already-pool': staff.isPoolStaff }"
          >
            <input
              type="checkbox"
              :value="staff.id"
              v-model="selectedStaffIds"
              :disabled="staff.isPoolStaff"
            />
            <div class="staff-info">
              <span class="staff-name">{{ staff.firstName }} {{ staff.lastName }}</span>
              <span class="staff-status">{{ staff.status }}</span>
              <span v-if="staff.isPoolStaff" class="pool-badge">Already in Pool</span>
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
          {{ isSubmitting ? 'Adding...' : `Add ${selectedStaffIds.length} to Pool` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useStaffStore } from '@/stores/staff';
import type { StaffMember } from '@shared/types/staff';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  staffAdded: [];
}>();

const staffStore = useStaffStore();
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
  
  if (!query) {
    return staffStore.activeStaff;
  }
  
  return staffStore.activeStaff.filter(staff => {
    const fullName = `${staff.firstName} ${staff.lastName}`.toLowerCase();
    return fullName.includes(query);
  });
});

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
    // Update each selected staff member to set isPoolStaff = true
    const updatePromises = selectedStaffIds.value.map(staffId =>
      staffStore.updateStaff(staffId, { isPoolStaff: true })
    );
    
    await Promise.all(updatePromises);
    
    // Emit success and close
    emit('staffAdded');
    emit('close');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to add staff to pool';
    console.error('Error adding staff to pool:', err);
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

.staff-checkbox-item:hover:not(.already-pool) {
  background-color: var(--bg-hover);
  border-color: var(--primary-color);
}

.staff-checkbox-item.already-pool {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: var(--bg-secondary);
}

.staff-checkbox-item input[type="checkbox"] {
  margin-right: 0.75rem;
  cursor: pointer;
}

.staff-checkbox-item.already-pool input[type="checkbox"] {
  cursor: not-allowed;
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

.pool-badge {
  font-size: 0.875rem;
  color: var(--success-color);
  padding: 0.25rem 0.5rem;
  background: var(--success-bg);
  border-radius: 3px;
  margin-left: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}
</style>

