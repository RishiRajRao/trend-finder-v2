<template>
  <div class="viral-news-v2">
    <div class="hero-section">
      <h1 class="title">🔥 Viral News Detector</h1>
      <p class="subtitle">
        Real News Sources with Cross-Platform Social Media Validation
      </p>
    </div>

    <div class="controls">
      <div class="threshold-controls">
        <h3>🎚️ Viral Detection Thresholds</h3>
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
            <h3 class="news-title">
              <a :href="newsItem.url" target="_blank" rel="noopener">
                {{ newsItem.title }}
              </a>
            </h3>
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
            <!-- Twitter Evidence -->
            <div class="platform twitter">
              <div class="platform-header">
                <h4>🐦 Twitter Activity</h4>
                <a
                  :href="newsItem.viralMetrics.twitter.searchUrl"
                  target="_blank"
                  rel="noopener"
                  class="search-link"
                >
                  🔍 Search Twitter
                </a>
              </div>
              <div class="platform-stats">
                <span>{{ newsItem.viralMetrics.twitter.count }} tweets</span>
                <span
                  >{{
                    newsItem.viralMetrics.twitter.totalImpressions.toLocaleString()
                  }}
                  impressions</span
                >
                <span
                  >{{ newsItem.viralMetrics.twitter.verifiedAccounts }} verified
                  accounts</span
                >
              </div>
              <div class="disclaimer">
                {{ newsItem.viralMetrics.twitter.disclaimer }}
              </div>

              <!-- Twitter Posts Preview -->
              <div class="posts-preview">
                <div
                  v-for="tweet in newsItem.viralMetrics.twitter.tweets.slice(
                    0,
                    3
                  )"
                  :key="tweet.id"
                  class="tweet-preview"
                >
                  <div class="tweet-header">
                    <span class="username">@{{ tweet.username }}</span>
                    <span v-if="tweet.isVerified" class="verified">✓</span>
                    <span class="time">{{
                      tweet.timeAgo || getTimeAgo(tweet.created_at)
                    }}</span>
                  </div>
                  <div class="tweet-text">{{ tweet.text }}</div>
                  <div class="tweet-stats">
                    <span>💬 {{ tweet.replies }}</span>
                    <span>🔄 {{ tweet.retweets }}</span>
                    <span>❤️ {{ tweet.likes }}</span>
                    <span>👁️ {{ tweet.impressions }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reddit Evidence -->
            <div class="platform reddit">
              <div class="platform-header">
                <h4>🔴 Reddit Discussion</h4>
                <a
                  :href="newsItem.viralMetrics.reddit.searchUrl"
                  target="_blank"
                  rel="noopener"
                  class="search-link"
                >
                  🔍 Search Reddit
                </a>
              </div>
              <div class="platform-stats">
                <span>{{ newsItem.viralMetrics.reddit.count }} posts</span>
                <span
                  >{{ newsItem.viralMetrics.reddit.totalUpvotes }} total
                  upvotes</span
                >
                <span
                  >{{
                    newsItem.viralMetrics.reddit.totalComments
                  }}
                  comments</span
                >
              </div>
              <div class="disclaimer">
                {{ newsItem.viralMetrics.reddit.disclaimer }}
              </div>

              <!-- Reddit Posts Preview -->
              <div class="posts-preview">
                <div
                  v-for="post in newsItem.viralMetrics.reddit.posts.slice(0, 3)"
                  :key="post.id"
                  class="reddit-preview"
                >
                  <div class="reddit-header">
                    <span class="subreddit">r/{{ post.subreddit }}</span>
                    <span class="verified">✓ Real</span>
                    <span class="time">{{ post.timeAgo }}</span>
                  </div>
                  <div class="reddit-title">
                    <a :href="post.url" target="_blank" rel="noopener">
                      {{ post.title }}
                    </a>
                  </div>
                  <div class="reddit-stats">
                    <span>⬆️ {{ post.upvotes }}</span>
                    <span>💬 {{ post.comments }}</span>
                    <span
                      >📊 {{ (post.upvoteRatio * 100).toFixed(0) }}%
                      upvoted</span
                    >
                  </div>
                </div>
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

          <div class="view-more-container">
            <button @click="toggleDetailedView(newsItem)" class="view-more-btn">
              <span v-if="newsItem.showDetailed">📖 Show Less</span>
              <span v-else>📊 View All Evidence</span>
            </button>
          </div>

          <!-- Detailed Evidence (Expandable) -->
          <div v-if="newsItem.showDetailed" class="detailed-evidence">
            <div class="detailed-section">
              <h5>🐦 All Twitter Activity</h5>
              <div class="all-tweets">
                <div
                  v-for="tweet in newsItem.viralMetrics.twitter.tweets"
                  :key="tweet.id"
                  class="detailed-tweet"
                >
                  <div class="tweet-header">
                    <span class="username">@{{ tweet.username }}</span>
                    <span v-if="tweet.isVerified" class="verified">✓</span>
                    <span class="engagement">{{ tweet.engagementRate }}</span>
                  </div>
                  <div class="tweet-text">{{ tweet.text }}</div>
                  <div class="tweet-meta">
                    <span>💬 {{ tweet.replies }}</span>
                    <span>🔄 {{ tweet.retweets }}</span>
                    <span>❤️ {{ tweet.likes }}</span>
                    <span>👁️ {{ tweet.impressions }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="detailed-section">
              <h5>🔴 All Reddit Posts</h5>
              <div class="all-reddit">
                <div
                  v-for="post in newsItem.viralMetrics.reddit.posts"
                  :key="post.id"
                  class="detailed-reddit"
                >
                  <div class="reddit-header">
                    <span class="subreddit">r/{{ post.subreddit }}</span>
                    <span class="verified">✓ Verified Real</span>
                  </div>
                  <div class="reddit-title">
                    <a :href="post.url" target="_blank" rel="noopener">
                      {{ post.title }}
                    </a>
                  </div>
                  <div class="reddit-engagement">
                    <span>⬆️ {{ post.upvotes }} upvotes</span>
                    <span>⬇️ {{ post.downvotes }} downvotes</span>
                    <span>💬 {{ post.comments }} comments</span>
                    <span
                      >📊 {{ (post.upvoteRatio * 100).toFixed(0) }}%
                      positive</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      thresholds: {
        minTweets: 10,
        minImpressions: 150,
        minRedditPosts: 1,
        minUpvoteRatio: 0.3,
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
      this.loadingMessage =
        'Analyzing news from multiple sources and validating across Twitter and Reddit...';
      this.hasSearched = true;

      try {
        const response = await axios.get('/api/v2/viral-news');

        if (response.data.success) {
          // Fix: API returns 'data' not 'items', and 'summary' not 'totalNews'
          this.totalAnalyzed = response.data.summary.totalNewsAnalyzed;
          this.viralNews = response.data.data.map((item) => ({
            ...item,
            showDetailed: false, // Add toggle state for each item
          }));
        }
      } catch (error) {
        console.error('Error detecting viral news:', error);
        this.viralNews = [];
      } finally {
        this.loading = false;
      }
    },

    formatTime(timestamp) {
      return new Date(timestamp).toLocaleString();
    },

    toggleDetailedView(newsItem) {
      newsItem.showDetailed = !newsItem.showDetailed;
    },

    getTimeAgo(created_at) {
      const now = new Date();
      const then = new Date(created_at);
      const diffInSeconds = Math.floor((now - then) / 1000);

      if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
      } else if (diffInSeconds < 3600) {
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        return `${diffInMinutes} minutes ago`;
      } else if (diffInSeconds < 86400) {
        const diffInHours = Math.floor(diffInSeconds / 3600);
        return `${diffInHours} hours ago`;
      } else if (diffInSeconds < 604800) {
        const diffInDays = Math.floor(diffInSeconds / 86400);
        return `${diffInDays} days ago`;
      } else {
        const diffInWeeks = Math.floor(diffInSeconds / 604800);
        return `${diffInWeeks} weeks ago`;
      }
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

/* Platform verification styles */
.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.search-link {
  color: #007bff;
  text-decoration: none;
  font-size: 0.85rem;
  padding: 4px 8px;
  border: 1px solid #007bff;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.search-link:hover {
  background: #007bff;
  color: white;
}

.disclaimer {
  font-size: 0.75rem;
  color: #6c757d;
  margin: 8px 0;
  font-style: italic;
}

/* Tweet and Reddit preview styles */
.posts-preview {
  margin-top: 12px;
}

.tweet-preview,
.reddit-preview {
  background: #f8f9fa;
  border-left: 3px solid #007bff;
  padding: 10px;
  margin: 8px 0;
  border-radius: 4px;
}

.tweet-header,
.reddit-header {
  display: flex;
  gap: 8px;
  font-size: 0.85rem;
  margin-bottom: 6px;
  align-items: center;
}

.username {
  font-weight: bold;
  color: #1da1f2;
}

.subreddit {
  font-weight: bold;
  color: #ff4500;
}

.verified {
  color: #1da1f2;
  font-size: 0.8rem;
}

.time {
  color: #6c757d;
  margin-left: auto;
}

.tweet-text,
.reddit-title {
  font-size: 0.9rem;
  margin: 6px 0;
  line-height: 1.4;
}

.reddit-title a {
  color: #333;
  text-decoration: none;
}

.reddit-title a:hover {
  color: #007bff;
  text-decoration: underline;
}

.tweet-stats,
.reddit-stats {
  display: flex;
  gap: 12px;
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 6px;
}

/* View more / detailed evidence styles */
.view-more-container {
  text-align: center;
  margin: 15px 0;
}

.view-more-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.view-more-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.detailed-evidence {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 15px;
  border: 1px solid #e9ecef;
}

.detailed-section {
  margin-bottom: 20px;
}

.detailed-section h5 {
  color: #495057;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid #dee2e6;
}

.detailed-tweet,
.detailed-reddit {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  margin: 10px 0;
}

.engagement {
  background: #28a745;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.reddit-engagement {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 8px;
  flex-wrap: wrap;
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

.news-title a {
  color: #2c3e50;
  text-decoration: none;
  transition: color 0.3s ease;
}

.news-title a:hover {
  color: #007bff;
  text-decoration: underline;
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
