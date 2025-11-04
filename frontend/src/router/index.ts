import { createRouter, createWebHistory } from 'vue-router';
import DayView from '@/views/DayView.vue';
import ConfigView from '@/views/ConfigView.vue';
import TaskStatusView from '@/views/TaskStatusView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const today = new Date().toISOString().split('T')[0];
        return `/day/${today}`;
      },
    },
    {
      path: '/day/:date',
      name: 'day',
      component: DayView,
    },
    {
      path: '/task-status/:date',
      name: 'task-status',
      component: TaskStatusView,
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigView,
    },
  ],
});

export default router;

