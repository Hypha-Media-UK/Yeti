import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/services/api';
import type {
  TaskTypeWithItems,
  TaskType,
  TaskItem,
  CreateTaskTypeInput,
  UpdateTaskTypeInput,
  CreateTaskItemInput,
  UpdateTaskItemInput,
} from '@shared/types/task-config';

export const useTaskConfigStore = defineStore('taskConfig', () => {
  // State
  const taskTypes = ref<TaskTypeWithItems[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ============================================================================
  // Task Type Actions
  // ============================================================================

  async function fetchTaskTypes(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get('/task-config/types');
      taskTypes.value = response.data.taskTypes;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch task types';
      console.error('Error fetching task types:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createTaskType(input: CreateTaskTypeInput): Promise<TaskType> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/task-config/types', input);
      const newTaskType = response.data.taskType;
      
      // Add to local state with empty items and departments
      taskTypes.value.push({
        ...newTaskType,
        items: [],
        departmentIds: [],
      });

      return newTaskType;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create task type';
      console.error('Error creating task type:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTaskType(id: number, input: UpdateTaskTypeInput): Promise<TaskType> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.patch(`/task-config/types/${id}`, input);
      const updatedTaskType = response.data.taskType;

      // Update in local state
      const index = taskTypes.value.findIndex(tt => tt.id === id);
      if (index !== -1) {
        taskTypes.value[index] = {
          ...taskTypes.value[index],
          ...updatedTaskType,
        };
      }

      return updatedTaskType;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update task type';
      console.error('Error updating task type:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTaskType(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await api.delete(`/task-config/types/${id}`);

      // Remove from local state
      taskTypes.value = taskTypes.value.filter(tt => tt.id !== id);
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete task type';
      console.error('Error deleting task type:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // Task Item Actions
  // ============================================================================

  async function createTaskItem(taskTypeId: number, input: CreateTaskItemInput): Promise<TaskItem> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post(`/task-config/types/${taskTypeId}/items`, input);
      const newItem = response.data.item;

      // Add to local state
      const taskType = taskTypes.value.find(tt => tt.id === taskTypeId);
      if (taskType) {
        taskType.items.push(newItem);
      }

      return newItem;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create task item';
      console.error('Error creating task item:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTaskItem(id: number, input: UpdateTaskItemInput): Promise<TaskItem> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.patch(`/task-config/items/${id}`, input);
      const updatedItem = response.data.item;

      // Update in local state
      for (const taskType of taskTypes.value) {
        const itemIndex = taskType.items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          taskType.items[itemIndex] = updatedItem;
          break;
        }
      }

      return updatedItem;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update task item';
      console.error('Error updating task item:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTaskItem(id: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await api.delete(`/task-config/items/${id}`);

      // Remove from local state
      for (const taskType of taskTypes.value) {
        const itemIndex = taskType.items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          taskType.items.splice(itemIndex, 1);
          break;
        }
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete task item';
      console.error('Error deleting task item:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // Department Link Actions
  // ============================================================================

  async function updateTaskTypeDepartments(taskTypeId: number, departmentIds: number[]): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await api.put(`/task-config/types/${taskTypeId}/departments`, { departmentIds });

      // Update in local state
      const taskType = taskTypes.value.find(tt => tt.id === taskTypeId);
      if (taskType) {
        taskType.departmentIds = departmentIds;
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update department links';
      console.error('Error updating department links:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function linkDepartment(taskTypeId: number, departmentId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await api.post(`/task-config/types/${taskTypeId}/departments/${departmentId}`);

      // Update in local state
      const taskType = taskTypes.value.find(tt => tt.id === taskTypeId);
      if (taskType && !taskType.departmentIds.includes(departmentId)) {
        taskType.departmentIds.push(departmentId);
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to link department';
      console.error('Error linking department:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function unlinkDepartment(taskTypeId: number, departmentId: number): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      await api.delete(`/task-config/types/${taskTypeId}/departments/${departmentId}`);

      // Update in local state
      const taskType = taskTypes.value.find(tt => tt.id === taskTypeId);
      if (taskType) {
        taskType.departmentIds = taskType.departmentIds.filter(id => id !== departmentId);
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to unlink department';
      console.error('Error unlinking department:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    taskTypes,
    loading,
    error,

    // Actions
    fetchTaskTypes,
    createTaskType,
    updateTaskType,
    deleteTaskType,
    createTaskItem,
    updateTaskItem,
    deleteTaskItem,
    updateTaskTypeDepartments,
    linkDepartment,
    unlinkDepartment,
  };
});

