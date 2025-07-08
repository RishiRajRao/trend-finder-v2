<template>
  <div class="yt-trend">
    <div class="hero-section">
      <h1 class="title">📹 YouTube Trend Detector</h1>
      <p class="subtitle">
        Discover Trending YouTube Videos with Advanced Analytics
      </p>
    </div>

    <div class="controls">
      <div class="algorithm-info">
        <div class="algorithm-badge">
          <span class="badge-icon">🎯</span>
          <div class="badge-content">
            <h3>YouTube Analytics Engine</h3>
            <p>
              Real-time trending analysis with view velocity, engagement
              metrics, and viral potential scoring
            </p>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="detectYTTrends" :disabled="loading" class="primary-btn">
          <span v-if="loading">🔄 Analyzing...</span>
          <span v-else>🎬 Detect YouTube Trends</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>

    <!-- Results Section -->
    <div v-if="!loading && trendingVideos.length > 0" class="results-section">
      <div class="results-header">
        <div class="results-title-section">
          <h2>🎬 YouTube Trending Analysis</h2>
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
          <span class="stat">{{ viralVideos }} Viral Videos</span>
          <span class="stat">{{ highEngagement }} High Engagement</span>
          <span class="stat">{{ totalViews }} Total Views</span>
          <span class="stat">{{ totalVideos }} Videos Analyzed</span>
        </div>
      </div>

      <div class="videos-grid">
        <div
          v-for="video in trendingVideos"
          :key="video.id"
          class="youtube-video-card"
        >
          <!-- Video Thumbnail with Duration -->
          <div class="thumbnail-container">
            <a :href="video.url" target="_blank" rel="noopener">
              <img
                :src="video.thumbnail"
                :alt="video.title"
                @error="handleImageError"
                class="video-thumbnail"
              />
              <div class="video-duration">{{ video.duration }}</div>
              <div v-if="video.isShort" class="shorts-badge">Shorts</div>
              <div v-if="video.isViral" class="viral-overlay">🔥</div>
            </a>
          </div>

          <!-- Video Info -->
          <div class="video-info">
            <!-- Channel Icon -->
            <div class="channel-avatar">
              <img
                :src="video.channelIcon"
                :alt="video.channelTitle"
                @error="handleChannelIconError"
                class="channel-icon"
              />
            </div>

            <!-- Video Details -->
            <div class="video-details">
              <h3 class="video-title">
                <a :href="video.url" target="_blank" rel="noopener">
                  {{ video.title }}
                </a>
              </h3>

              <div class="video-metadata">
                <p class="channel-name">{{ video.channelTitle }}</p>
                <div class="video-stats">
                  <span class="views"
                    >{{ formatNumber(video.viewCount) }} views</span
                  >
                  <span class="separator">•</span>
                  <span class="time-ago">{{
                    formatTime(video.publishedAt)
                  }}</span>
                </div>
              </div>

              <!-- Viral Score Badge -->
              <div
                class="viral-score-badge"
                :class="getScoreClass(video.viralScore)"
              >
                Viral Score: {{ video.viralScore }}/100
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!loading && trendingVideos.length === 0 && hasSearched"
      class="empty-state"
    >
      <div class="empty-icon">📹</div>
      <h3>No Trending Videos Found</h3>
      <p>Try detecting YouTube trends to see viral content analysis</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'YTTrend',
  data() {
    return {
      loading: false,
      loadingMessage: 'Analyzing YouTube trends...',
      exportLoading: false,
      hasSearched: false,
      trendingVideos: [],
    };
  },
  computed: {
    viralVideos() {
      return this.trendingVideos.filter((video) => video.isViral).length;
    },
    highEngagement() {
      return this.trendingVideos.filter((video) => video.engagementRate > 5)
        .length;
    },
    totalViews() {
      const total = this.trendingVideos.reduce(
        (sum, video) => sum + video.viewCount,
        0
      );
      return this.formatNumber(total);
    },
    totalVideos() {
      return this.trendingVideos.length;
    },
  },
  methods: {
    async detectYTTrends() {
      this.loading = true;
      this.hasSearched = true;
      this.loadingMessage = 'Fetching trending YouTube videos...';

      try {
        // Calculate date range: last 3 days to today
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        const formatDate = (date) => {
          return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        };

        const startDate = formatDate(threeDaysAgo);
        const endDate = formatDate(today);

        // Fetch from the provided API
        const axios = (await import('axios')).default;
        const response = await axios.get(
          `https://confucius.dev.zero1creatorstudio.com/api/user/videos?limit=100&offset=0&start=${startDate}&end=${endDate}&is_short=true`,
          {
            headers: {
              accept: 'application/json',
              'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
              authorization:
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZjZTE1YWU4ZjVlMGQyNTgxNDY5NWYiLCJleHAiOjE3ODM1MDIwODF9.b74MoL7JcwzcuGwYtkMtUPFRzYzOlG31zoiiq9OyXgw',
              origin: 'https://dev.zero1creatorstudio.com',
              referer: 'https://dev.zero1creatorstudio.com/',
              'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            },
          }
        );
        const videos = response.data || [];

        // Transform the API data to match our component structure
        this.trendingVideos = videos.map((video) => ({
          id: video.video_id,
          title: video.title,
          channelTitle: video.channel_title,
          channelIcon: video.channel_icon,
          viewCount: video.views,
          likeCount: video.likes,
          commentCount: video.comment_count,
          publishedAt: video.published_at,
          thumbnail:
            video.thumbnails && video.thumbnails.length > 0
              ? video.thumbnails[2] ||
                video.thumbnails[1] ||
                video.thumbnails[0]
              : '/favicon.ico',
          duration: this.formatDuration(video.duration),
          description: video.description,
          url: `https://youtube.com/watch?v=${video.video_id}`,
          viralScore: this.calculateViralScore(
            video.views,
            video.likes,
            video.comment_count,
            video.published_at
          ),
          isViral: video.views > 500000,
          isTrending: video.views > 100000,
          engagementRate: (
            ((video.likes + video.comment_count) / Math.max(video.views, 1)) *
            100
          ).toFixed(1),
          viewVelocity: this.calculateViewVelocity(
            video.views,
            video.published_at
          ),
          isShort: video.is_short,
        }));

        // Sort by viral score
        this.trendingVideos.sort((a, b) => b.viralScore - a.viralScore);

        if (this.trendingVideos.length === 0) {
          this.loadingMessage = 'No trending videos found';
        }
      } catch (error) {
        console.error('Error detecting YouTube trends:', error);
        this.trendingVideos = this.getMockData(); // Fallback to mock data for demo
      } finally {
        this.loading = false;
      }
    },

    async exportToExcel() {
      this.exportLoading = true;
      try {
        // Implement Excel export functionality
        console.log('Exporting YouTube trends to Excel...');
        // Add actual export logic here
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        this.exportLoading = false;
      }
    },

    getScoreClass(score) {
      if (score >= 80) return 'viral';
      if (score >= 60) return 'trending';
      if (score >= 40) return 'moderate';
      return 'low';
    },

    formatNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    },

    formatTime(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays}d ago`;
      } else {
        return `${diffHours}h ago`;
      }
    },

    handleImageError(event) {
      event.target.src = '/favicon.ico'; // Fallback image
    },

    handleChannelIconError(event) {
      event.target.src = '/favicon.ico'; // Fallback channel icon
    },

    formatDuration(seconds) {
      if (!seconds) return '0:00';
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    calculateViralScore(views, likes, comments, publishedAt) {
      // Base score from views
      let score = Math.min(Math.log10(views + 1) * 10, 70);

      // Engagement bonus
      const engagementRate = (likes + comments) / Math.max(views, 1);
      score += engagementRate * 1000; // Boost for high engagement

      // Recency bonus
      const daysOld =
        (Date.now() - new Date(publishedAt)) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 10; // Recent video bonus

      return Math.min(Math.max(Math.round(score), 10), 100);
    },

    calculateViewVelocity(views, publishedAt) {
      const daysOld = Math.max(
        (Date.now() - new Date(publishedAt)) / (1000 * 60 * 60 * 24),
        1
      );
      const viewsPerDay = views / daysOld;

      if (viewsPerDay > 100000) return 'Very High';
      if (viewsPerDay > 50000) return 'High';
      if (viewsPerDay > 10000) return 'Medium';
      return 'Low';
    },

    // Mock data for demonstration
    getMockData() {
      return [
        {
          id: 'mock1',
          title: 'Breaking: Major Tech Announcement Shakes Industry',
          channelTitle: 'Tech News Central',
          viewCount: 2500000,
          likeCount: 125000,
          commentCount: 15000,
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          thumbnail: '/public/favicon.ico',
          duration: '12:34',
          description:
            'Major technology announcement that is reshaping the entire industry landscape.',
          url: 'https://youtube.com/watch?v=mock1',
          viralScore: 92,
          isViral: true,
          isTrending: true,
          engagementRate: 8.5,
          viewVelocity: 'High',
        },
        {
          id: 'mock2',
          title: 'Viral Dance Challenge Takes Social Media by Storm',
          channelTitle: 'Dance Trends',
          viewCount: 1800000,
          likeCount: 95000,
          commentCount: 8500,
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          thumbnail: '/public/favicon.ico',
          duration: '3:45',
          description:
            'The latest dance challenge that everyone is talking about and trying.',
          url: 'https://youtube.com/watch?v=mock2',
          viralScore: 87,
          isViral: true,
          isTrending: true,
          engagementRate: 7.2,
          viewVelocity: 'Very High',
        },
        {
          id: 'mock3',
          title: 'Celebrity Interview Reveals Shocking Truth',
          channelTitle: 'Entertainment Tonight',
          viewCount: 950000,
          likeCount: 45000,
          commentCount: 5200,
          publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          thumbnail: '/public/favicon.ico',
          duration: '25:18',
          description:
            'Exclusive celebrity interview with surprising revelations.',
          url: 'https://youtube.com/watch?v=mock3',
          viralScore: 74,
          isViral: false,
          isTrending: true,
          engagementRate: 5.8,
          viewVelocity: 'Medium',
        },
      ];
    },
  },
};
</script>

<style scoped>
/* Base styles */
.yt-trend {
  max-width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

/* Hero section */
.hero-section {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1rem;
}

/* Controls */
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.algorithm-info {
  flex: 1;
}

.algorithm-badge {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(238, 90, 36, 0.3);
}

.badge-icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.badge-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.badge-content p {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.primary-btn {
  background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 0, 0, 0.3);
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 0, 0, 0.4);
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Loading state */
.loading-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff0000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Results section */
.results-section {
  margin-top: 2rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.results-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.results-title-section h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.export-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.export-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Videos grid - YouTube style */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 1rem 0;
}

.youtube-video-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e5e5e5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.youtube-video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  border-color: #d1d5db;
}

/* Thumbnail container */
.thumbnail-container {
  position: relative;
  width: 100%;
  height: 140px;
  overflow: hidden;
  border-radius: 8px 8px 0 0;
  background: #f8f9fa;
}

.video-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.youtube-video-card:hover .video-thumbnail {
  transform: scale(1.05);
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.shorts-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.viral-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 1.2rem;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
}

/* Video info section */
.video-info {
  display: flex;
  padding: 12px;
  gap: 12px;
  background: white;
  border-radius: 0 0 12px 12px;
}

.channel-avatar {
  flex-shrink: 0;
}

.channel-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.video-details {
  flex: 1;
  min-width: 0;
}

.video-title {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-title a {
  color: #030303;
  text-decoration: none;
}

.video-title a:hover {
  color: #ff0000;
}

.video-metadata {
  margin-bottom: 8px;
}

.channel-name {
  margin: 0 0 4px 0;
  font-size: 0.8rem;
  color: #606060;
  font-weight: 500;
}

.video-stats {
  font-size: 0.8rem;
  color: #606060;
  display: flex;
  align-items: center;
  gap: 4px;
}

.separator {
  font-size: 0.6rem;
}

.viral-score-badge {
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.viral-score-badge.viral {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.viral-score-badge.trending {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.viral-score-badge.moderate {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.viral-score-badge.low {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Tablet responsiveness */
@media (max-width: 1024px) {
  .videos-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.8rem;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .algorithm-badge {
    flex-direction: column;
    text-align: center;
  }

  .badge-icon {
    margin-right: 0;
    margin-bottom: 0.5rem;
  }

  .results-header {
    flex-direction: column;
    align-items: stretch;
  }

  .stats {
    justify-content: center;
  }

  .videos-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }

  /* For very small screens */
  @media (max-width: 480px) {
    .videos-grid {
      grid-template-columns: 1fr;
    }
  }

  .youtube-video-card {
    max-width: 100%;
  }

  .thumbnail-container {
    height: 200px;
  }

  .video-info {
    padding: 8px;
    gap: 8px;
  }

  .channel-icon {
    width: 32px;
    height: 32px;
  }

  .video-title {
    font-size: 0.85rem;
  }
}
</style>
