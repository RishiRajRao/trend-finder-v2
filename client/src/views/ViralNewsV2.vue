<template>
  <div class="viral-news-v2">
    <div class="hero-section">
      <h1 class="title">🔥 Viral News Detector</h1>
      <p class="subtitle">
        Real News Sources with Cross-Platform Social Media Validation
      </p>
    </div>

    <div class="controls">
      <div class="algorithm-info">
        <div class="algorithm-badge">
          <span class="badge-icon">🧠</span>
          <div class="badge-content">
            <h3>AI-Powered Viral Detection</h3>
            <p>
              Advanced algorithm with logarithmic scaling, cross-platform
              validation, and time-decay factors
            </p>
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
        <div class="results-title-section">
          <h2>📊 News Analysis Results</h2>
          <button
            @click="exportToExcel"
            :disabled="exportLoading"
            class="export-btn"
          >
            <span v-if="exportLoading">⏳ Generating...</span>
            <span v-else>📊 Export to Excel</span>
          </button>
        </div>
        <div class="stats">
          <span class="stat">{{ validatedViral }} Validated Viral</span>
          <span class="stat">{{ crossPlatformValidated }} Cross-Platform</span>
          <span class="stat">{{ analyzedCount }} Fully Analyzed</span>
          <span class="stat">{{ totalAnalyzed }} Total Sources</span>
        </div>
      </div>

      <div class="viral-news-grid">
        <div
          v-for="newsItem in viralNews"
          :key="newsItem.url"
          :class="[
            'news-card',
            { 'news-card-estimated': !newsItem.isAnalyzed },
          ]"
        >
          <div class="news-header">
            <h3 class="news-title">
              <a :href="newsItem.url" target="_blank" rel="noopener">
                {{ newsItem.title }}
              </a>
            </h3>
            <div class="viral-metrics">
              <div
                :class="[
                  'viral-score',
                  getScoreClass(newsItem.viralMetrics.viralScore),
                ]"
              >
                {{ newsItem.viralMetrics.viralScore }}/100
              </div>
              <div class="viral-status">
                <span
                  v-if="newsItem.isValidatedViral"
                  class="status-badge validated"
                >
                  ✅ Validated Viral
                </span>
                <span
                  v-else-if="newsItem.isAnalyzed"
                  class="status-badge potential"
                >
                  📊 {{ newsItem.viralPotential }}
                </span>
                <span v-else class="status-badge estimated">
                  🔮 Estimated Potential
                </span>
              </div>
            </div>
          </div>

          <div class="news-meta">
            <span class="source">{{ newsItem.source }}</span>
            <span class="api">{{ newsItem.api }}</span>
            <span class="time">{{ formatTime(newsItem.publishedAt) }}</span>
            <span
              v-if="newsItem.crossPlatformValidated"
              class="validation-badge"
            >
              🔗 Cross-Platform Validated
            </span>
            <span v-if="newsItem.isAnalyzed" class="analysis-badge analyzed">
              🔍 Fully Analyzed
            </span>
            <span v-else class="analysis-badge estimated">
              📋 Basic Analysis
            </span>
          </div>

          <div class="cross-platform-evidence">
            <!-- Tab Navigation -->
            <div class="tab-navigation">
              <button
                @click="setActiveTab(newsItem, 'twitter')"
                :class="[
                  'tab-button',
                  { active: newsItem.activeTab === 'twitter' },
                ]"
              >
                🐦 Twitter ({{ newsItem.viralMetrics.twitter.count }})
              </button>
              <button
                @click="setActiveTab(newsItem, 'reddit')"
                :class="[
                  'tab-button',
                  { active: newsItem.activeTab === 'reddit' },
                ]"
              >
                🔴 Reddit ({{ newsItem.viralMetrics.reddit.count }})
              </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
              <!-- Twitter Tab -->
              <div
                v-if="newsItem.activeTab === 'twitter'"
                class="platform twitter"
              >
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
                  <span v-if="newsItem.viralMetrics.twitter.totalImpressions"
                    >{{
                      newsItem.viralMetrics.twitter.totalImpressions.toLocaleString()
                    }}
                    impressions</span
                  >
                  <span v-if="newsItem.viralMetrics.twitter.verifiedAccounts"
                    >{{
                      newsItem.viralMetrics.twitter.verifiedAccounts
                    }}
                    verified accounts</span
                  >
                  <span v-if="!newsItem.isAnalyzed" class="not-analyzed">
                    No detailed data - Limited analysis
                  </span>
                </div>
                <div
                  v-if="newsItem.viralMetrics.twitter.disclaimer"
                  class="disclaimer"
                >
                  {{ newsItem.viralMetrics.twitter.disclaimer }}
                </div>
                <div v-if="!newsItem.isAnalyzed" class="disclaimer">
                  ℹ️ This item was not fully analyzed for viral potential due to
                  API rate limits.
                </div>

                <!-- All Twitter Posts -->
                <div
                  v-if="newsItem.viralMetrics.twitter.tweets?.length"
                  class="posts-preview"
                >
                  <div
                    v-for="tweet in newsItem.viralMetrics.twitter.tweets"
                    :key="tweet.id"
                    class="tweet-preview"
                  >
                    <div class="tweet-header">
                      <a
                        :href="`https://twitter.com/${tweet.username}`"
                        target="_blank"
                        rel="noopener"
                        class="username-link"
                      >
                        @{{ tweet.username }}
                      </a>
                      <span v-if="tweet.isVerified" class="verified">✓</span>
                      <span class="time">{{
                        tweet.timeAgo || getTimeAgo(tweet.created_at)
                      }}</span>
                      <a
                        :href="tweet.url"
                        target="_blank"
                        rel="noopener"
                        class="tweet-link"
                      >
                        🔗 View Tweet
                      </a>
                    </div>
                    <a
                      :href="tweet.url"
                      target="_blank"
                      rel="noopener"
                      class="tweet-text-link"
                    >
                      <div class="tweet-text">{{ tweet.text }}</div>
                    </a>
                    <div class="tweet-stats">
                      <span>💬 {{ tweet.replies }}</span>
                      <span>🔄 {{ tweet.retweets }}</span>
                      <span>❤️ {{ tweet.likes }}</span>
                      <span>👁️ {{ tweet.impressions }}</span>
                      <span class="engagement-rate"
                        >📊 {{ tweet.engagementRate }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Reddit Tab -->
              <div
                v-if="newsItem.activeTab === 'reddit'"
                class="platform reddit"
              >
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
                  <span v-if="newsItem.viralMetrics.reddit.totalUpvotes"
                    >{{ newsItem.viralMetrics.reddit.totalUpvotes }} total
                    upvotes</span
                  >
                  <span v-if="newsItem.viralMetrics.reddit.totalComments"
                    >{{
                      newsItem.viralMetrics.reddit.totalComments
                    }}
                    comments</span
                  >
                  <span
                    v-if="newsItem.viralMetrics.reddit.subredditsFound?.length"
                  >
                    from
                    {{ newsItem.viralMetrics.reddit.subredditsFound.length }}
                    subreddits
                  </span>
                  <span v-if="!newsItem.isAnalyzed" class="not-analyzed">
                    No detailed data - Limited analysis
                  </span>
                </div>
                <div
                  v-if="newsItem.viralMetrics.reddit.disclaimer"
                  class="disclaimer"
                >
                  {{ newsItem.viralMetrics.reddit.disclaimer }}
                </div>
                <div v-if="!newsItem.isAnalyzed" class="disclaimer">
                  ℹ️ This item was not fully analyzed for viral potential due to
                  API rate limits.
                </div>

                <!-- All Reddit Posts -->
                <div
                  v-if="newsItem.viralMetrics.reddit.posts?.length"
                  class="posts-preview"
                >
                  <div
                    v-for="post in newsItem.viralMetrics.reddit.posts"
                    :key="post.id"
                    class="reddit-preview"
                  >
                    <div class="reddit-header">
                      <a
                        :href="`https://reddit.com/r/${post.subreddit}`"
                        target="_blank"
                        rel="noopener"
                        class="subreddit-link"
                      >
                        r/{{ post.subreddit }}
                      </a>
                      <span class="verified">✓ Real</span>
                      <span class="time">{{ post.timeAgo }}</span>
                      <a
                        :href="post.url"
                        target="_blank"
                        rel="noopener"
                        class="reddit-link"
                      >
                        🔗 View Post
                      </a>
                    </div>
                    <div class="reddit-title">
                      <a :href="post.url" target="_blank" rel="noopener">
                        {{ post.title }}
                      </a>
                    </div>
                    <div class="reddit-stats">
                      <span>⬆️ {{ post.upvotes }}</span>
                      <span>⬇️ {{ post.downvotes || 0 }}</span>
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
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && viralNews.length === 0 && hasSearched"
      class="empty-state"
    >
      <h3>📰 No News Found</h3>
      <p>
        No news items could be analyzed at this time. Please check back later
        for fresh content.
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
      validatedViral: 0,
      crossPlatformValidated: 0,
      analyzedCount: 0,
      exportLoading: false,
    };
  },
  computed: {
    viralPercentage() {
      if (this.totalAnalyzed === 0) return 0;
      return Math.round((this.validatedViral / this.totalAnalyzed) * 100);
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
          // Handle actual API response structure
          this.totalAnalyzed = response.data.summary.totalNewsAnalyzed;
          this.analyzedCount = response.data.summary.analyzedNews;

          // Calculate metrics from the returned data
          const newsItems = response.data.data;
          this.validatedViral = newsItems.filter(
            (item) => item.isValidatedViral
          ).length;
          this.crossPlatformValidated = newsItems.filter(
            (item) => item.crossPlatformValidated
          ).length;

          this.viralNews = newsItems.map((item) => ({
            ...item,
            activeTab: 'twitter', // Default to Twitter tab
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

    setActiveTab(newsItem, tab) {
      newsItem.activeTab = tab;
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

    getScoreClass(score) {
      if (score >= 80) return 'very-high';
      if (score >= 60) return 'high';
      if (score >= 40) return 'medium';
      if (score >= 20) return 'low';
      return 'minimal';
    },

    async exportToExcel() {
      this.exportLoading = true;

      try {
        console.log('🔽 Starting Excel export...');

        // Check if we have data to export
        if (!this.viralNews || this.viralNews.length === 0) {
          alert('❌ No data to export. Please run viral detection first.');
          return;
        }

        // Try the API approach first with provided data (no re-analysis needed)
        try {
          console.log(
            '🌐 Sending analyzed data to server for Excel generation...'
          );
          const response = await axios.post(
            '/api/v2/viral-news/export',
            {
              newsData: this.viralNews,
            },
            {
              responseType: 'blob',
              timeout: 15000, // 15 second timeout - much faster since no analysis needed
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          this.downloadExcelFile(response);
          console.log('✅ Server-side Excel export completed successfully');
          return;
        } catch (apiError) {
          console.warn(
            '⚠️ Server-side export failed, trying client-side approach:',
            apiError.message
          );

          // Fallback to client-side generation
          this.exportExcelClientSide();
        }
      } catch (error) {
        console.error('❌ Excel export failed:', error);
        alert(`❌ Export Failed: ${error.message || 'Unknown error occurred'}`);
      } finally {
        this.exportLoading = false;
      }
    },

    downloadExcelFile(response) {
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from response headers or create default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'viral_news_analysis.xlsx';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`📊 Excel file "${filename}" downloaded successfully!`);
    },

    exportExcelClientSide() {
      // Client-side CSV generation as fallback (basic news info only)
      console.log('📝 Generating simplified CSV file client-side...');

      const csvData = this.generateCSVData();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `viral_news_analysis_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(
        '📊 CSV file downloaded successfully! (Excel generation failed, but CSV contains the same basic news data)'
      );
    },

    generateCSVData() {
      const headers = ['S.No', 'Title', 'URL', 'Source', 'Published Date'];

      const rows = this.viralNews.map((item, index) => {
        return [
          index + 1,
          `"${(item.title || '').replace(/"/g, '""')}"`,
          item.url || '',
          item.source || '',
          item.publishedAt ? new Date(item.publishedAt).toLocaleString() : '',
        ].join(',');
      });

      return [headers.join(','), ...rows].join('\n');
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

/* Tab Navigation Styles */
.tab-navigation {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 15px;
}

.tab-button {
  flex: 1;
  padding: 12px 16px;
  background: #f8f9fa;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: #e9ecef;
  color: #495057;
}

.tab-button.active {
  background: white;
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-content {
  min-height: 200px;
}

/* Tweet and Reddit preview styles */
.posts-preview {
  margin-top: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.tweet-preview,
.reddit-preview {
  background: #f8f9fa;
  border-left: 3px solid #007bff;
  padding: 10px;
  margin: 8px 0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.tweet-preview:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left-color: #1da1f2;
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

.username-link {
  font-weight: bold;
  color: #1da1f2;
  text-decoration: none;
  transition: color 0.2s ease;
}

.username-link:hover {
  color: #0d8bd9;
  text-decoration: underline;
}

.tweet-link {
  color: #1da1f2;
  text-decoration: none;
  font-size: 0.8rem;
  padding: 2px 6px;
  background: rgba(29, 161, 242, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-left: auto;
}

.tweet-link:hover {
  background: rgba(29, 161, 242, 0.2);
  text-decoration: none;
}

.tweet-text-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.tweet-text-link:hover {
  text-decoration: none;
}

.tweet-text-link:hover .tweet-text {
  background: rgba(29, 161, 242, 0.05);
  border-radius: 4px;
  padding: 8px;
  transition: all 0.2s ease;
}

.subreddit {
  font-weight: bold;
  color: #ff4500;
}

.subreddit-link {
  font-weight: bold;
  color: #ff4500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.subreddit-link:hover {
  color: #e03e00;
  text-decoration: underline;
}

.reddit-link {
  color: #ff4500;
  text-decoration: none;
  font-size: 0.8rem;
  padding: 2px 6px;
  background: rgba(255, 69, 0, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-left: auto;
}

.reddit-link:hover {
  background: rgba(255, 69, 0, 0.2);
  text-decoration: none;
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
  flex-wrap: wrap;
}

.engagement-rate {
  background: #e7f3ff;
  color: #0066cc;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 600;
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

.algorithm-info {
  margin-bottom: 20px;
}

.algorithm-badge {
  display: flex;
  align-items: center;
  gap: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.badge-icon {
  font-size: 2rem;
  min-width: 50px;
  text-align: center;
}

.badge-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.badge-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
  line-height: 1.4;
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
  margin-bottom: 20px;
}

.results-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
}

.results-title-section h2 {
  color: #2c3e50;
  margin: 0;
  flex: 1;
  min-width: 250px;
}

.export-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  min-width: 160px;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838, #1b998b);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: #6c757d;
}

.stats {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .results-title-section {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .results-title-section h2 {
    min-width: auto;
  }

  .export-btn {
    width: 100%;
    max-width: 200px;
  }

  .stats {
    justify-content: center;
  }
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

.news-card-estimated {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  opacity: 0.95;
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

.viral-metrics {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  margin-left: 10px;
}

.viral-score {
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-weight: bold;
  font-size: 14px;
}

.viral-score.very-high {
  background: linear-gradient(135deg, #dc3545, #ff1744);
}

.viral-score.high {
  background: linear-gradient(135deg, #ff6b6b, #ffa500);
}

.viral-score.medium {
  background: linear-gradient(135deg, #ffa500, #ffeb3b);
  color: #333;
}

.viral-score.low {
  background: linear-gradient(135deg, #28a745, #20c997);
}

.viral-score.minimal {
  background: linear-gradient(135deg, #6c757d, #adb5bd);
}

.viral-status {
  font-size: 11px;
}

.status-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 10px;
}

.status-badge.validated {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-badge.potential {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-badge.estimated {
  background: #f8f9fa;
  color: #6c757d;
  border: 1px solid #dee2e6;
  font-style: italic;
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

.validation-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
  border: 1px solid #bbdefb;
}

.analysis-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 11px;
}

.analysis-badge.analyzed {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.analysis-badge.estimated {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
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

.platform-stats .not-analyzed {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  font-style: italic;
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

  .algorithm-badge {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
