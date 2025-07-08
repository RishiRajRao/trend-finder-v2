<template>
  <div class="home-container">
    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button
        @click="activeTab = 'NON-YT-TREND'"
        :class="['tab-button', { active: activeTab === 'NON-YT-TREND' }]"
      >
        📰 NON-YT-TREND
      </button>
      <button
        @click="activeTab = 'YT-TREND'"
        :class="['tab-button', { active: activeTab === 'YT-TREND' }]"
      >
        📹 YT-TREND
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- NON-YT-TREND Tab -->
      <div v-if="activeTab === 'NON-YT-TREND'" class="tab-panel">
        <ViralNewsV2 />
      </div>

      <!-- YT-TREND Tab -->
      <div v-if="activeTab === 'YT-TREND'" class="tab-panel">
        <YTTrend />
      </div>
    </div>
  </div>
</template>

<script>
import ViralNewsV2 from './ViralNewsV2.vue';
import YTTrend from './YTTrend.vue';

export default {
  name: 'Home',
  components: {
    ViralNewsV2,
    YTTrend,
  },
  data() {
    return {
      activeTab: 'NON-YT-TREND', // Default to NON-YT-TREND tab
    };
  },
};
</script>

<style scoped>
.home-container {
  max-width: 100%;
  margin: 0 auto;
}

.tab-navigation {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e2e8f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px 12px 0 0;
  padding: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tab-button {
  flex: 1;
  max-width: 200px;
  padding: 0.75rem 1.5rem;
  margin: 0 0.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tab-button.active {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
  transform: translateY(-2px);
}

.tab-button.active:hover {
  background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
}

.tab-content {
  min-height: 600px;
  background: white;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tab-panel {
  padding: 1rem;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .tab-navigation {
    flex-direction: column;
    padding: 0.5rem;
  }

  .tab-button {
    max-width: 100%;
    margin: 0.25rem 0;
  }
}
</style>
