import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Task, TaskWithRelations, CreateTaskInput, UpdateTaskInput, TaskFilterOptions, TaskStatus } from '@shared/types/task';

// API service for tasks
const API_BASE = '/api/tasks';

async function fetchTasks(filters?: TaskFilterOptions): Promise<{ tasks: TaskWithRelations[] }> {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach(s => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    if (filters.taskType) {
      if (Array.isArray(filters.taskType)) {
        filters.taskType.forEach(t => params.append('taskType', t));
      } else {
        params.append('taskType', filters.taskType);
      }
    }
    if (filters.assignedStaffId !== undefined) {
      params.append('assignedStaffId', filters.assignedStaffId.toString());
    }
    if (filters.originAreaId !== undefined && filters.originAreaType !== undefined) {
      params.append('originAreaId', filters.originAreaId.toString());
      params.append('originAreaType', filters.originAreaType);
    }
    if (filters.destinationAreaId !== undefined && filters.destinationAreaType !== undefined) {
      params.append('destinationAreaId', filters.destinationAreaId.toString());
      params.append('destinationAreaType', filters.destinationAreaType);
    }
    if (filters.fromDate) {
      params.append('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params.append('toDate', filters.toDate);
    }
  }

  const url = params.toString() ? `${API_BASE}?${params.toString()}` : API_BASE;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  
  return response.json();
}

async function fetchTaskById(id: number): Promise<{ task: Task }> {
  const response = await fetch(`${API_BASE}/${id}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch task');
  }
  
  return response.json();
}

async function createTask(input: CreateTaskInput): Promise<{ task: Task }> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create task');
  }
  
  return response.json();
}

async function updateTask(id: number, input: UpdateTaskInput): Promise<{ task: Task }> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update task');
  }
  
  return response.json();
}

async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete task');
  }
}

async function updateTaskStatus(id: number, status: TaskStatus): Promise<{ task: Task }> {
  const response = await fetch(`${API_BASE}/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update task status');
  }
  
  return response.json();
}

async function assignTask(id: number, staffId: number | null): Promise<{ task: Task }> {
  const response = await fetch(`${API_BASE}/${id}/assign`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ staffId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to assign task');
  }
  
  return response.json();
}

export const useTaskStore = defineStore('task', () => {
  const taskList = ref<TaskWithRelations[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const pendingTasks = computed(() => 
    taskList.value.filter(t => t.status === 'pending' || t.status === 'in-progress')
  );

  const completedTasks = computed(() => 
    taskList.value.filter(t => t.status === 'completed')
  );

  const cancelledTasks = computed(() => 
    taskList.value.filter(t => t.status === 'cancelled')
  );

  // Filter tasks by status
  function tasksByStatus(status: TaskStatus) {
    return taskList.value.filter(t => t.status === status);
  }

  // Filter tasks by assigned staff
  function tasksByStaff(staffId: number) {
    return taskList.value.filter(t => t.assignedStaffId === staffId);
  }

  // Fetch all tasks with optional filters
  async function fetchAllTasks(filters?: TaskFilterOptions) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetchTasks(filters);
      taskList.value = response.tasks;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tasks';
      console.error('Error fetching tasks:', err);
    } finally {
      isLoading.value = false;
    }
  }

  // Fetch a single task by ID
  async function fetchTask(id: number) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await fetchTaskById(id);
      return response.task;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch task';
      console.error('Error fetching task:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  // Create a new task
  async function addTask(input: CreateTaskInput) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await createTask(input);
      taskList.value.unshift(response.task); // Add to beginning of list
      return response.task;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create task';
      console.error('Error creating task:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Update an existing task
  async function modifyTask(id: number, updates: UpdateTaskInput) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await updateTask(id, updates);
      const index = taskList.value.findIndex(t => t.id === id);
      if (index !== -1) {
        taskList.value[index] = response.task;
      }
      return response.task;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update task';
      console.error('Error updating task:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Delete a task
  async function removeTask(id: number) {
    isLoading.value = true;
    error.value = null;

    try {
      await deleteTask(id);
      const index = taskList.value.findIndex(t => t.id === id);
      if (index !== -1) {
        taskList.value.splice(index, 1);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete task';
      console.error('Error deleting task:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Update task status
  async function changeTaskStatus(id: number, status: TaskStatus) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await updateTaskStatus(id, status);
      const index = taskList.value.findIndex(t => t.id === id);
      if (index !== -1) {
        taskList.value[index] = response.task;
      }
      return response.task;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update task status';
      console.error('Error updating task status:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Assign task to staff
  async function assignTaskToStaff(id: number, staffId: number | null) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await assignTask(id, staffId);
      const index = taskList.value.findIndex(t => t.id === id);
      if (index !== -1) {
        taskList.value[index] = response.task;
      }
      return response.task;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to assign task';
      console.error('Error assigning task:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    taskList,
    isLoading,
    error,
    
    // Computed
    pendingTasks,
    completedTasks,
    cancelledTasks,
    
    // Methods
    tasksByStatus,
    tasksByStaff,
    fetchAllTasks,
    fetchTask,
    addTask,
    modifyTask,
    removeTask,
    changeTaskStatus,
    assignTaskToStaff,
  };
});

