<template>
  <div class="viral-news-v2">
    <div class="hero-section">
      <h1 class="title">🔥 Viral News Detector V2</h1>
      <p class="subtitle">
        News-Centric Viral Detection with Cross-Platform Validation
      </p>

      <div class="method-comparison">
        <div class="method-card v1">
          <h3>V1 Method</h3>
          <p>Multi-source → AI Sorting</p>
        </div>
        <div class="method-card v2 active">
          <h3>V2 Method</h3>
          <p>News First → Cross-Platform Validation</p>
        </div>
      </div>
    </div>

    <div class="controls">
      <div class="threshold-controls">
        <h3>🎚️ Viral Thresholds</h3>
        <div class="threshold-grid">
          <div class="threshold-item">
            <label>Min Tweets</label>
            <input
              v-model.number="thresholds.minTweets"
              type="number"
              min="1"
              max="500"
            />
          </div>
          <div class="threshold-item">
            <label>Min Impressions</label>
            <input
              v-model.number="thresholds.minImpressions"
              type="number"
              min="1"
              max="1000"
            />
          </div>
          <div class="threshold-item">
            <label>Min Reddit Posts</label>
            <input
              v-model.number="thresholds.minRedditPosts"
              type="number"
              min="1"
              max="100"
            />
          </div>
          <div class="threshold-item">
            <label>Min Upvote Ratio</label>
            <input
              v-model.number="thresholds.minUpvoteRatio"
              type="number"
              min="0"
              max="1"
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button
          @click="detectViralNews"
          :disabled="loading"
          class="primary-btn"
        >
          <span v-if="loading">🔄 Analyzing...</span>
          <span v-else>🔍 Detect Viral News</span>
        </button>
        <button
          @click="runComparison"
          :disabled="loading"
          class="secondary-btn"
        >
          <span v-if="loading">🔄 Comparing...</span>
          <span v-else>⚖️ Compare V1 vs V2</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- Results Section -->
    <div v-if="!loading && viralNews.length > 0" class="results-section">
      <div class="results-header">
        <h2>🔥 Viral News Results</h2>
        <div class="stats">
          <span class="stat">{{ viralNews.length }} Viral</span>
          <span class="stat">{{ totalAnalyzed }} Total</span>
          <span class="stat">{{ viralPercentage }}% Viral</span>
        </div>
      </div>

      <div class="viral-news-grid">
        <div
          v-for="newsItem in viralNews"
          :key="newsItem.url"
          class="news-card"
        >
          <div class="news-header">
            <h3 class="news-title">{{ newsItem.title }}</h3>
            <div class="viral-score">
              {{ newsItem.viralMetrics.viralScore }}/100
            </div>
          </div>

          <div class="news-meta">
            <span class="source">{{ newsItem.source }}</span>
            <span class="api">{{ newsItem.api }}</span>
            <span class="time">{{ formatTime(newsItem.publishedAt) }}</span>
          </div>

          <div class="cross-platform-evidence">
            <div class="platform twitter">
              <h4>🐦 Twitter Evidence</h4>
              <div class="platform-stats">
                <span>{{ newsItem.viralMetrics.twitter.count }} tweets</span>
                <span
                  >{{
                    newsItem.viralMetrics.twitter.totalImpressions.toLocaleString()
                  }}
                  impressions</span
                >
                <span
                  >{{
                    newsItem.viralMetrics.twitter.averageImpressions
                  }}
                  avg/tweet</span
                >
              </div>
            </div>

            <div class="platform reddit">
              <h4>🔴 Reddit Evidence</h4>
              <div class="platform-stats">
                <span>{{ newsItem.viralMetrics.reddit.count }} posts</span>
                <span
                  >{{
                    newsItem.viralMetrics.reddit.goodEngagementCount
                  }}
                  high-engagement</span
                >
                <span
                  >{{ newsItem.viralMetrics.reddit.averageUpvoteRatio }} avg
                  ratio</span
                >
              </div>
            </div>
          </div>

          <div class="news-keywords">
            <span
              v-for="keyword in newsItem.keywords"
              :key="keyword"
              class="keyword"
            >
              {{ keyword }}
            </span>
          </div>

          <button @click="viewDetailedAnalysis(newsItem)" class="analyze-btn">
            📊 Detailed Analysis
          </button>
        </div>
      </div>
    </div>

    <!-- Comparison Results -->
    <div v-if="!loading && comparison" class="comparison-section">
      <h2>⚖️ V1 vs V2 Comparison</h2>
      <div class="comparison-grid">
        <div class="comparison-card v1">
          <h3>V1 Traditional</h3>
          <p>{{ comparison.v1_traditional.method }}</p>
          <div class="comparison-stat">
            <span class="number">{{
              comparison.v1_traditional.viralItemsFound
            }}</span>
            <span class="label">viral items found</span>
          </div>
        </div>

        <div class="comparison-card v2">
          <h3>V2 News-Centric</h3>
          <p>{{ comparison.v2_news_centric.method }}</p>
          <div class="comparison-stat">
            <span class="number">{{
              comparison.v2_news_centric.viralItemsFound
            }}</span>
            <span class="label">viral items found</span>
          </div>
        </div>
      </div>

      <div class="recommendation">
        <h4>💡 Recommendation</h4>
        <p>{{ comparison.recommendation }}</p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && viralNews.length === 0 && hasSearched"
      class="empty-state"
    >
      <h3>📰 No Viral News Found</h3>
      <p>
        Try adjusting the viral thresholds or check back later for more recent
        news.
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ViralNewsV2',
  data() {
    return {
      loading: false,
      loadingMessage: '',
      hasSearched: false,
      viralNews: [],
      totalAnalyzed: 0,
      comparison: null,
      thresholds: {
        minTweets: 100,
        minImpressions: 100,
        minRedditPosts: 20,
        minUpvoteRatio: 0.7,
      },
    };
  },
  computed: {
    viralPercentage() {
      if (this.totalAnalyzed === 0) return 0;
      return Math.round((this.viralNews.length / this.totalAnalyzed) * 100);
    },
  },
  methods: {
    async detectViralNews() {
      this.loading = true;
      this.loadingMessage = 'Analyzing news from multiple sources...';
      this.hasSearched = true;
      this.comparison = null;

      try {
        const params = new URLSearchParams(this.thresholds).toString();
        const response = await axios.get(
          `/api/v2/viral-news/summary?${params}`
        );

        if (response.data.success) {
          this.totalAnalyzed = response.data.summary.totalNewsAnalyzed;
          // Fetch detailed data
          const detailedResponse = await axios.get('/api/v2/viral-news');
          if (detailedResponse.data.success) {
            this.viralNews = detailedResponse.data.data;
          }
        }
      } catch (error) {
        console.error('Error detecting viral news:', error);
        this.viralNews = [];
      } finally {
        this.loading = false;
      }
    },

    async runComparison() {
      this.loading = true;
      this.loadingMessage = 'Running V1 vs V2 comparison analysis...';
      this.hasSearched = true;
      this.viralNews = [];

      try {
        const response = await axios.get('/api/v2/viral-comparison');
        if (response.data.success) {
          this.comparison = response.data.comparison;
        }
      } catch (error) {
        console.error('Error running comparison:', error);
      } finally {
        this.loading = false;
      }
    },

    async viewDetailedAnalysis(newsItem) {
      // Mock detailed analysis - in real app this would navigate to detail page
      alert(
        `Detailed Analysis for: ${newsItem.title}\n\nViral Score: ${newsItem.viralMetrics.viralScore}/100\nTwitter: ${newsItem.viralMetrics.twitter.count} tweets\nReddit: ${newsItem.viralMetrics.reddit.count} posts`
      );
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString();
    },
  },
};
</script>

<style scoped>
.viral-news-v2 {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.hero-section {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 20px;
}

.method-comparison {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
}

.method-card {
  padding: 15px 25px;
  border-radius: 10px;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.method-card.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.controls {
  background: white;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.threshold-controls h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.threshold-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.threshold-item {
  display: flex;
  flex-direction: column;
}

.threshold-item label {
  font-weight: 600;
  color: #555;
  margin-bottom: 5px;
}

.threshold-item input {
  padding: 8px 12px;
  border: 2px solid #e9ecef;
  border-radius: 5px;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.primary-btn,
.secondary-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.secondary-btn {
  background: #f8f9fa;
  color: #495057;
  border: 2px solid #e9ecef;
}

.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.results-section {
  margin-top: 30px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-header h2 {
  color: #2c3e50;
}

.stats {
  display: flex;
  gap: 15px;
}

.stat {
  background: #667eea;
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: 600;
}

.viral-news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.news-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.news-title {
  font-size: 1.1rem;
  color: #2c3e50;
  line-height: 1.4;
  margin: 0;
  flex: 1;
}

.viral-score {
  background: linear-gradient(135deg, #ff6b6b, #ffa500);
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-weight: bold;
  font-size: 14px;
  margin-left: 10px;
}

.news-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  font-size: 12px;
}

.source,
.api,
.time {
  background: #f8f9fa;
  padding: 3px 8px;
  border-radius: 12px;
  color: #6c757d;
}

.cross-platform-evidence {
  margin: 15px 0;
}

.platform {
  margin-bottom: 10px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.platform h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #495057;
}

.platform-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.platform-stats span {
  background: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  color: #495057;
}

.news-keywords {
  margin: 15px 0;
}

.keyword {
  background: #e7f3ff;
  color: #0066cc;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  margin-right: 5px;
  margin-bottom: 5px;
  display: inline-block;
}

.analyze-btn {
  width: 100%;
  padding: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.analyze-btn:hover {
  background: #e9ecef;
}

.comparison-section {
  margin-top: 30px;
  padding: 25px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.comparison-card {
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.comparison-card.v1 {
  background: linear-gradient(135deg, #ff7b7b, #ff9999);
  color: white;
}

.comparison-card.v2 {
  background: linear-gradient(135deg, #51cf66, #69db7c);
  color: white;
}

.comparison-stat .number {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.recommendation {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

@media (max-width: 768px) {
  .viral-news-grid {
    grid-template-columns: 1fr;
  }

  .threshold-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
