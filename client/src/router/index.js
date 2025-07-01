import { createRouter, createWebHistory } from 'vue-router';
import ViralNewsV2 from '../views/ViralNewsV2.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'ViralNews',
      component: ViralNewsV2,
    },
  ],
});

export default router;
