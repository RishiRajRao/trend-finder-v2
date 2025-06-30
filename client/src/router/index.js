import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import ViralNewsV2 from '../views/ViralNewsV2.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/viral-news',
      name: 'ViralNews',
      component: ViralNewsV2,
    },
  ],
});

export default router;
