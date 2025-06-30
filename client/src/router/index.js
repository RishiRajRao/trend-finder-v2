import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Trends from '../views/Trends.vue';
import LiveTrends from '../views/LiveTrends.vue';
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
      path: '/trends',
      name: 'Trends',
      component: Trends,
    },
    {
      path: '/live-trends',
      name: 'LiveTrends',
      component: LiveTrends,
    },
    {
      path: '/viral-news-v2',
      name: 'ViralNewsV2',
      component: ViralNewsV2,
    },
  ],
});

export default router;
