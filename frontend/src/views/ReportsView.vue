<template>
  <div class="reports-view">
    <div class="reports-header">
      <h1>Task Reports</h1>
      <button class="btn btn-primary" @click="refreshData" :disabled="loading">
        <svg v-if="!loading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        <span v-if="loading">Loading...</span>
        <span v-else>Refresh</span>
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="!loading && !error" class="reports-grid">
      <!-- Staff Task Completion Chart -->
      <div class="report-card">
        <h2>Staff Task Completion</h2>
        <p class="report-description">Percentage of tasks completed by individual staff in the pool</p>
        <div class="chart-container">
          <Bar
            v-if="staffChartData"
            :data="staffChartData"
            :options="staffChartOptions"
          />
          <p v-else class="no-data">No staff task data available</p>
        </div>
      </div>

      <!-- Department Task Origin Chart -->
      <div class="report-card">
        <h2>Tasks by Origin Department</h2>
        <p class="report-description">Percentage of tasks originating from each department</p>
        <div class="chart-container">
          <Doughnut
            v-if="departmentChartData"
            :data="departmentChartData"
            :options="departmentChartOptions"
          />
          <p v-else class="no-data">No department task data available</p>
        </div>
      </div>

      <!-- Staff Stats Table -->
      <div class="report-card full-width">
        <h2>Detailed Staff Statistics</h2>
        <div class="table-container">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Total Tasks</th>
                <th>Completed Tasks</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stat in staffStats" :key="stat.staffId">
                <td>{{ stat.staffName }}</td>
                <td>{{ stat.totalTasks }}</td>
                <td>{{ stat.completedTasks }}</td>
                <td>
                  <div class="completion-cell">
                    <div class="completion-bar">
                      <div class="completion-fill" :style="{ width: stat.completionPercentage + '%' }"></div>
                    </div>
                    <span class="completion-text">{{ stat.completionPercentage }}%</span>
                  </div>
                </td>
              </tr>
              <tr v-if="staffStats.length === 0">
                <td colspan="4" class="no-data-cell">No staff data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Department Stats Table -->
      <div class="report-card full-width">
        <h2>Detailed Department Statistics</h2>
        <div class="table-container">
          <table class="stats-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Tasks</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stat in departmentStats" :key="stat.departmentId">
                <td>{{ stat.departmentName }}</td>
                <td>{{ stat.totalTasks }}</td>
                <td>
                  <div class="completion-cell">
                    <div class="completion-bar">
                      <div class="completion-fill" :style="{ width: stat.completionPercentage + '%' }"></div>
                    </div>
                    <span class="completion-text">{{ stat.completionPercentage }}%</span>
                  </div>
                </td>
              </tr>
              <tr v-if="departmentStats.length === 0">
                <td colspan="3" class="no-data-cell">No department data available</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading reports data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
} from 'chart.js';
import { useReportsStore } from '../stores/reports';
import { storeToRefs } from 'pinia';

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const reportsStore = useReportsStore();
const { staffStats, departmentStats, loading, error } = storeToRefs(reportsStore);

// Chart data for staff completion
const staffChartData = computed(() => {
  if (staffStats.value.length === 0) return null;

  return {
    labels: staffStats.value.map(s => s.staffName),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: staffStats.value.map(s => s.completionPercentage),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
});

// Chart options for staff completion
const staffChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const stat = staffStats.value[context.dataIndex];
          return [
            `Completion: ${context.parsed.y}%`,
            `Completed: ${stat.completedTasks}/${stat.totalTasks}`,
          ];
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: (value: any) => value + '%',
      },
      title: {
        display: true,
        text: 'Completion Rate (%)',
      },
    },
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 45,
      },
    },
  },
};

// Chart data for department tasks
const departmentChartData = computed(() => {
  if (departmentStats.value.length === 0) return null;

  // Generate colors for each department
  const colors = departmentStats.value.map((_, index) => {
    const hue = (index * 360) / departmentStats.value.length;
    return `hsla(${hue}, 70%, 60%, 0.8)`;
  });

  return {
    labels: departmentStats.value.map(d => d.departmentName),
    datasets: [
      {
        label: 'Total Tasks',
        data: departmentStats.value.map(d => d.totalTasks),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };
});

// Chart options for department tasks
const departmentChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const stat = departmentStats.value[context.dataIndex];
          const total = departmentStats.value.reduce((sum, d) => sum + d.totalTasks, 0);
          const percentage = ((stat.totalTasks / total) * 100).toFixed(1);
          return [
            `${context.label}: ${stat.totalTasks} tasks (${percentage}%)`,
            `Completion: ${stat.completionPercentage}%`,
          ];
        },
      },
    },
  },
};

const refreshData = async () => {
  await reportsStore.fetchReportsData();
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.reports-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.reports-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text-primary);
}

.error-message {
  padding: 1rem;
  background-color: var(--error-bg, #fee);
  color: var(--error-text, #c00);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
}

.report-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.report-card.full-width {
  grid-column: 1 / -1;
}

.report-card h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: var(--text-primary);
}

.report-description {
  margin: 0 0 1.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.chart-container {
  height: 400px;
  position: relative;
}

.no-data {
  text-align: center;
  color: var(--text-secondary);
  padding: 3rem;
}

.table-container {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
}

.stats-table th {
  background-color: var(--bg-secondary, #f5f5f5);
  font-weight: 600;
  color: var(--text-primary);
}

.stats-table tbody tr:hover {
  background-color: var(--bg-hover, #f9f9f9);
}

.completion-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.completion-bar {
  flex: 1;
  height: 20px;
  background-color: var(--bg-secondary, #e0e0e0);
  border-radius: 10px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.completion-text {
  min-width: 50px;
  font-weight: 600;
  color: var(--text-primary);
}

.no-data-cell {
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem !important;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color, #e0e0e0);
  border-top-color: var(--primary-color, #2196f3);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner p {
  margin-top: 1rem;
  color: var(--text-secondary);
}
</style>

