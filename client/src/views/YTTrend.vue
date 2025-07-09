<template>
  <div class="yt-trend">
    <div class="hero-section">
      <h1 class="title">📹 YouTube Trend Detector</h1>
      <p class="subtitle">
        Discover Trending YouTube Videos with Advanced Analytics
      </p>
    </div>

    <div class="controls">
      <!-- <div class="algorithm-info">
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
      </div> -->

      <div class="action-buttons">
        <button @click="detectYTTrends" :disabled="loading" class="primary-btn">
          <span v-if="loading">🔄 Analyzing...</span>
          <span v-else>🎬 Detect YouTube Trends</span>
        </button>

        <button
          @click="performCrossPlatformAnalysis"
          :disabled="crossPlatformLoading || trendingVideos.length === 0"
          class="secondary-btn"
        >
          <span v-if="crossPlatformLoading">🔄 Cross-Platform Analysis...</span>
          <span v-else>🌐 Cross-Platform Analysis</span>
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
        <!-- <div class="stats">
          <span class="stat">{{ viralVideos }} Viral Videos</span>
          <span class="stat">{{ highEngagement }} High Engagement</span>
          <span class="stat">{{ totalViews }} Total Views</span>
          <span class="stat">{{ totalVideos }} Videos Analyzed</span>
        </div> -->
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
              <!-- <div
                class="viral-score-badge"
                :class="getScoreClass(video.viralScore)"
              >
                Viral Score: {{ video.viralScore }}/100
              </div> -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cross-Platform Analysis Results -->
    <div
      v-if="showCrossPlatformResults && crossPlatformAnalysis"
      class="cross-platform-section"
    >
      <div class="cross-platform-header">
        <h2>🌐 Cross-Platform Analysis Results</h2>
        <button @click="showCrossPlatformResults = false" class="close-btn">
          ✕
        </button>
      </div>

      <!-- <div class="platform-summary">
        <div class="summary-stats">
          <div class="stat-card">
            <h3>📊 Overall Analysis</h3>
            <p>
              <strong>Total Videos:</strong>
              {{ crossPlatformAnalysis.data.analysis.totalVideos }}
            </p>
            <p>
              <strong>High Cross-Platform Score:</strong>
              {{ crossPlatformAnalysis.data.analysis.highCrossPlatformScore }}
            </p>
            <p>
              <strong>Viral Across Platforms:</strong>
              {{ crossPlatformAnalysis.data.analysis.viralAcrossPlatforms }}
            </p>
          </div>

          <div class="stat-card">
            <h3>📊 Analysis Summary</h3>
            <p>
              <strong>Total Cross-Platform Matches:</strong>
              {{
                crossPlatformAnalysis.data.analysis.totalCrossPlatformMatches
              }}
            </p>
            <p>
              <strong>Average Score:</strong>
              {{ crossPlatformAnalysis.data.analysis.avgScore }}/100
            </p>
            <p>
              <strong>Analysis Method:</strong>
              Keyword-based search across platforms
            </p>
          </div>
        </div>
      </div> -->

      <div class="top-cross-platform-videos">
        <!-- <h3>🔥 Top Cross-Platform Performers</h3> -->
        <div
          v-if="getTopCrossPlatformVideos().length === 0"
          class="no-cross-platform-data"
        >
          <p>
            No cross-platform analysis data available. Run the analysis first!
          </p>
        </div>
        <div v-else class="top-videos-grid">
          <div
            v-for="video in getTopCrossPlatformVideos()"
            :key="video.id"
            class="top-video-card"
          >
            <!-- Top section: Image and Title side by side -->
            <div class="video-header">
              <div class="video-thumbnail-small">
                <img :src="video.thumbnail" :alt="video.title" />
              </div>
              <div class="video-title-section">
                <h4>{{ video.title.substring(0, 60) }}...</h4>
              </div>
            </div>

            <!-- Bottom section: All other content -->
            <div class="video-content">
              <div
                class="cross-platform-scores"
                v-if="video.crossPlatformAnalysis"
              >
                <div class="total-score">
                  Total:
                  <strong
                    >{{
                      video.crossPlatformAnalysis.totalScore || 0
                    }}/100</strong
                  >
                </div>
                <div class="platform-scores">
                  <span class="twitter">
                    📱
                    {{
                      (video.crossPlatformAnalysis.twitter &&
                        video.crossPlatformAnalysis.twitter.score) ||
                      0
                    }}/100
                    <small
                      >({{
                        (video.crossPlatformAnalysis.twitter &&
                          video.crossPlatformAnalysis.twitter.matches) ||
                        0
                      }}
                      matches)</small
                    >
                  </span>
                  <span class="reddit">
                    🔴
                    {{
                      (video.crossPlatformAnalysis.reddit &&
                        video.crossPlatformAnalysis.reddit.score) ||
                      0
                    }}/100
                    <small
                      >({{
                        (video.crossPlatformAnalysis.reddit &&
                          video.crossPlatformAnalysis.reddit.matches) ||
                        0
                      }}
                      matches)</small
                    >
                  </span>
                  <span class="news">
                    📰
                    {{
                      (video.crossPlatformAnalysis.googleNews &&
                        video.crossPlatformAnalysis.googleNews.score) ||
                      0
                    }}/100
                    <small
                      >({{
                        (video.crossPlatformAnalysis.googleNews &&
                          video.crossPlatformAnalysis.googleNews.matches) ||
                        0
                      }}
                      matches)</small
                    >
                  </span>
                </div>
                <!-- <div class="viral-potential">
                  {{
                    getCrossPlatformViralStatus(
                      video.crossPlatformAnalysis.totalScore
                    )
                  }}
                </div> -->
                <!-- <div class="platform-highlights">
                  <div
                    v-if="
                      video.crossPlatformAnalysis.twitter &&
                      video.crossPlatformAnalysis.twitter.topMatches &&
                      video.crossPlatformAnalysis.twitter.topMatches.length > 0
                    "
                    class="highlight"
                  >
                    <strong>Twitter:</strong>
                    {{
                      video.crossPlatformAnalysis.twitter.topMatches[0].title
                    }}
                  </div>
                  <div
                    v-if="
                      video.crossPlatformAnalysis.reddit &&
                      video.crossPlatformAnalysis.reddit.topMatches &&
                      video.crossPlatformAnalysis.reddit.topMatches.length > 0
                    "
                    class="highlight"
                  >
                    <strong>Reddit:</strong>
                    {{ video.crossPlatformAnalysis.reddit.topMatches[0].title }}
                  </div>
                </div> -->

                <!-- View Sources Button -->
                <div class="view-sources-section">
                  <button
                    @click="toggleSources(video.id)"
                    class="view-sources-btn"
                    v-if="hasAnySources(video.crossPlatformAnalysis)"
                  >
                    {{
                      showingSources[video.id] ? 'Hide Sources' : 'View Sources'
                    }}
                    ({{ getTotalSourcesCount(video.crossPlatformAnalysis) }})
                  </button>
                </div>

                <!-- Sources Details -->
                <div
                  v-if="
                    showingSources[video.id] &&
                    hasAnySources(video.crossPlatformAnalysis)
                  "
                  class="sources-details"
                >
                  <!-- Time Filter Notice -->
                  <!-- <div class="time-filter-notice">
                    <div class="filter-badge">
                      📅 Results limited to last 3 days for trend relevance
                    </div>
                  </div> -->

                  <!-- Sources Tabs -->
                  <div class="sources-tabs">
                    <!-- Tab Navigation -->
                    <div class="tab-navigation">
                      <button
                        @click="setActiveTab(video.id, 'twitter')"
                        :class="{
                          'tab-btn': true,
                          active: getActiveTab(video.id) === 'twitter',
                          disabled:
                            getTabCount(
                              video.crossPlatformAnalysis,
                              'twitter'
                            ) === 0,
                        }"
                        :disabled="
                          getTabCount(
                            video.crossPlatformAnalysis,
                            'twitter'
                          ) === 0
                        "
                      >
                        📱 Twitter ({{
                          getTabCount(video.crossPlatformAnalysis, 'twitter')
                        }})
                      </button>
                      <button
                        @click="setActiveTab(video.id, 'reddit')"
                        :class="{
                          'tab-btn': true,
                          active: getActiveTab(video.id) === 'reddit',
                          disabled:
                            getTabCount(
                              video.crossPlatformAnalysis,
                              'reddit'
                            ) === 0,
                        }"
                        :disabled="
                          getTabCount(video.crossPlatformAnalysis, 'reddit') ===
                          0
                        "
                      >
                        🔴 Reddit ({{
                          getTabCount(video.crossPlatformAnalysis, 'reddit')
                        }})
                      </button>
                      <button
                        @click="setActiveTab(video.id, 'news')"
                        :class="{
                          'tab-btn': true,
                          active: getActiveTab(video.id) === 'news',
                          disabled:
                            getTabCount(video.crossPlatformAnalysis, 'news') ===
                            0,
                        }"
                        :disabled="
                          getTabCount(video.crossPlatformAnalysis, 'news') === 0
                        "
                      >
                        📰 News ({{
                          getTabCount(video.crossPlatformAnalysis, 'news')
                        }})
                      </button>
                    </div>

                    <!-- Tab Content -->
                    <div class="tab-content">
                      <!-- Twitter Tab -->
                      <div
                        v-if="getActiveTab(video.id) === 'twitter'"
                        class="tab-panel"
                      >
                        <div
                          v-if="
                            video.crossPlatformAnalysis.twitter?.sources
                              ?.length > 0
                          "
                          class="platform-sources"
                        >
                          <div
                            v-for="source in video.crossPlatformAnalysis.twitter
                              .sources"
                            :key="source.url"
                            class="source-item twitter-source"
                          >
                            <div class="source-header">
                              <a
                                :href="source.url"
                                target="_blank"
                                class="source-link"
                              >
                                {{ source.title.substring(0, 80)
                                }}{{ source.title.length > 80 ? '...' : '' }}
                              </a>
                              <span class="source-verified">{{
                                source.verified
                              }}</span>
                            </div>
                            <div class="source-meta">
                              @{{ source.username }} • {{ source.engagement }}
                            </div>
                          </div>
                        </div>
                        <div v-else class="no-sources">
                          No Twitter sources found for this video
                        </div>
                      </div>

                      <!-- Reddit Tab -->
                      <div
                        v-if="getActiveTab(video.id) === 'reddit'"
                        class="tab-panel"
                      >
                        <div
                          v-if="
                            video.crossPlatformAnalysis.reddit?.sources
                              ?.length > 0
                          "
                          class="platform-sources"
                        >
                          <div
                            v-for="source in video.crossPlatformAnalysis.reddit
                              .sources"
                            :key="source.url"
                            class="source-item reddit-source"
                          >
                            <div class="source-header">
                              <a
                                :href="source.url"
                                target="_blank"
                                class="source-link"
                              >
                                {{ source.title.substring(0, 80)
                                }}{{ source.title.length > 80 ? '...' : '' }}
                              </a>
                              <span class="source-verified">{{
                                source.verified
                              }}</span>
                            </div>
                            <div class="source-meta">
                              r/{{ source.subreddit }} • {{ source.engagement }}
                            </div>
                          </div>
                        </div>
                        <div v-else class="no-sources">
                          No Reddit sources found for this video
                        </div>
                      </div>

                      <!-- News Tab -->
                      <div
                        v-if="getActiveTab(video.id) === 'news'"
                        class="tab-panel"
                      >
                        <div
                          v-if="
                            getFilteredNewsSources(
                              video.crossPlatformAnalysis.googleNews?.sources ||
                                []
                            ).length > 0
                          "
                          class="platform-sources"
                        >
                          <!-- Time Filter Notice for News -->
                          <div class="news-time-filter">
                            <span class="filter-info">
                              📅 Showing only news from last 3 days for trend
                              relevance
                            </span>
                          </div>

                          <div
                            v-for="source in getFilteredNewsSources(
                              video.crossPlatformAnalysis.googleNews?.sources ||
                                []
                            )"
                            :key="source.url"
                            class="source-item news-source"
                          >
                            <div class="source-header">
                              <a
                                :href="source.url"
                                target="_blank"
                                class="source-link"
                              >
                                {{ source.title.substring(0, 80)
                                }}{{ source.title.length > 80 ? '...' : '' }}
                              </a>
                              <span class="source-verified">{{
                                source.verified
                              }}</span>
                            </div>
                            <div class="source-meta">
                              {{ source.source }} •
                              {{ formatTime(source.publishedAt) }}
                            </div>
                          </div>
                        </div>
                        <div v-else class="no-sources">
                          No recent news sources found (last 3 days)
                        </div>
                      </div>
                    </div>
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
      crossPlatformLoading: false,
      crossPlatformAnalysis: null,
      showCrossPlatformResults: false,
      showingSources: {}, // Track which videos have sources expanded
      activeSourceTabs: {}, // Track active tab for each video
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
                'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODZkMDllYzMyMWNkNDZiZWFhMDU5MTQiLCJleHAiOjE3ODM1MTI0NzN9.IqCwYFs3Z6J38iMqE1EVAUl3-GcNChFDEvojlmVROao',
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
        this.trendingVideos = []; // No fallback data
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

    async performCrossPlatformAnalysis() {
      this.crossPlatformLoading = true;
      try {
        console.log('🌐 Starting cross-platform analysis...');

        const axios = (await import('axios')).default;
        const response = await axios.post(
          '/api/yt-trends/cross-platform-analysis',
          {
            videos: this.trendingVideos,
          }
        );

        this.crossPlatformAnalysis = response.data;
        this.showCrossPlatformResults = true;

        // Update videos with cross-platform data
        if (response.data.data && response.data.data.videos) {
          this.trendingVideos = response.data.data.videos;
        }

        console.log(
          '✅ Cross-platform analysis completed:',
          this.crossPlatformAnalysis
        );
      } catch (error) {
        console.error('❌ Error in cross-platform analysis:', error);
        alert('Failed to perform cross-platform analysis. Please try again.');
      } finally {
        this.crossPlatformLoading = false;
      }
    },

    getScoreClass(score) {
      if (score >= 80) return 'viral';
      if (score >= 60) return 'trending';
      if (score >= 40) return 'moderate';
      return 'low';
    },

    getCrossPlatformClass(score) {
      if (score >= 85) return 'extremely-viral';
      if (score >= 70) return 'high-viral';
      if (score >= 50) return 'moderate-viral';
      if (score >= 30) return 'some-viral';
      return 'low-viral';
    },

    getCrossPlatformViralStatus(score) {
      if (score >= 85) return '🔥 Extremely Viral Across Platforms';
      if (score >= 70) return '📈 High Cross-Platform Potential';
      if (score >= 50) return '📊 Moderate Cross-Platform Activity';
      if (score >= 30) return '📢 Some Cross-Platform Presence';
      return '📱 Limited Cross-Platform Activity';
    },

    toggleSources(videoId) {
      this.showingSources = {
        ...this.showingSources,
        [videoId]: !this.showingSources[videoId],
      };
    },

    hasAnySources(analysis) {
      if (!analysis) return false;
      return (
        analysis.twitter?.sources?.length > 0 ||
        analysis.reddit?.sources?.length > 0 ||
        this.getFilteredNewsSources(analysis.googleNews?.sources || []).length >
          0
      );
    },

    getTotalSourcesCount(analysis) {
      if (!analysis) return 0;
      return (
        (analysis.twitter?.sources?.length || 0) +
        (analysis.reddit?.sources?.length || 0) +
        this.getFilteredNewsSources(analysis.googleNews?.sources || []).length
      );
    },

    setActiveTab(videoId, tabName) {
      this.activeSourceTabs = {
        ...this.activeSourceTabs,
        [videoId]: tabName,
      };
    },

    getActiveTab(videoId) {
      return this.activeSourceTabs[videoId] || 'twitter';
    },

    getTabCount(analysis, platform) {
      if (!analysis) return 0;
      switch (platform) {
        case 'twitter':
          return analysis.twitter?.sources?.length || 0;
        case 'reddit':
          return analysis.reddit?.sources?.length || 0;
        case 'news':
          return this.getFilteredNewsSources(analysis.googleNews?.sources || [])
            .length;
        default:
          return 0;
      }
    },

    getFilteredNewsSources(sources) {
      if (!sources || sources.length === 0) return [];

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      return sources.filter((source) => {
        if (!source.publishedAt) return false;

        const publishedDate = new Date(source.publishedAt);
        const isWithinThreeDays = publishedDate >= threeDaysAgo;

        if (!isWithinThreeDays) {
          console.log(
            `🚫 Filtered out old news: "${source.title}" (${source.publishedAt})`
          );
        }

        return isWithinThreeDays;
      });
    },

    getTopCrossPlatformVideos() {
      return this.trendingVideos
        .filter((video) => video.crossPlatformAnalysis)
        .sort(
          (a, b) =>
            b.crossPlatformAnalysis.totalScore -
            a.crossPlatformAnalysis.totalScore
        );
      // Removed .slice(0, 5) to show all analyzed videos
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

/* Cross-Platform Analysis Styles */
.secondary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.secondary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cross-platform-badge {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cross-platform-badge.extremely-viral {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
}

.cross-platform-badge.high-viral {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
  color: white;
}

.cross-platform-badge.moderate-viral {
  background: linear-gradient(135deg, #45b7d1, #96c93d);
  color: white;
}

.cross-platform-badge.some-viral {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
}

.cross-platform-badge.low-viral {
  background: linear-gradient(135deg, #ffecd2, #fcb69f);
  color: #333;
}

.platform-breakdown {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 9px;
  opacity: 0.9;
}

.cross-platform-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin: 24px 0;
}

.cross-platform-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.cross-platform-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 700;
}

.close-btn {
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #ff3838;
  transform: scale(1.1);
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.stat-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
}

.stat-card p {
  margin: 8px 0;
  font-size: 14px;
  opacity: 0.9;
}

.top-cross-platform-videos h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.top-videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

.top-video-card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.top-video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

/* Video Header: Image and Title side by side */
.video-header {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
}

.video-thumbnail-small {
  width: 80px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.video-thumbnail-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-title-section {
  flex: 1;
  min-width: 0;
}

.video-title-section h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
  word-wrap: break-word;
}

/* Video Content: All other content below */
.video-content {
  padding: 0 16px 16px 16px;
  border-top: 1px solid #f0f0f0;
}

.total-score {
  font-size: 16px;
  font-weight: 700;
  color: #2c5aa0;
  margin-bottom: 8px;
}

.platform-scores {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 11px;
}

.platform-scores span {
  padding: 2px 6px;
  border-radius: 4px;
  background: #f8f9fa;
  color: #333;
  font-weight: 500;
}

.viral-potential {
  font-size: 12px;
  font-weight: 600;
  color: #e74c3c;
  margin-bottom: 8px;
}

.recommendations {
  font-size: 10px;
  color: #666;
}

.recommendation {
  margin-bottom: 2px;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .top-videos-grid {
    grid-template-columns: 1fr;
  }

  .summary-stats {
    grid-template-columns: 1fr;
  }

  .platform-scores {
    flex-direction: column;
    gap: 4px;
  }

  .secondary-btn {
    margin-left: 0;
    margin-top: 12px;
  }
}

/* View Sources Styles */
.view-sources-section {
  margin-top: 1rem;
  text-align: center;
}

.view-sources-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-sources-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.sources-details {
  margin-top: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e9ecef;
}

.platform-sources {
  margin-bottom: 1.5rem;
}

.platform-sources:last-child {
  margin-bottom: 0;
}

.platform-sources h4 {
  margin: 0 0 0.8rem 0;
  font-size: 1rem;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.3rem;
}

.source-item {
  background: white;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-left: 4px solid #ddd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.source-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.twitter-source {
  border-left-color: #1da1f2;
}

.reddit-source {
  border-left-color: #ff4500;
}

.news-source {
  border-left-color: #228b22;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.source-link {
  flex: 1;
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
  line-height: 1.4;
  font-size: 0.9rem;
}

.source-link:hover {
  color: #3498db;
  text-decoration: underline;
}

.source-verified {
  background: #e8f5e8;
  color: #27ae60;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.source-meta {
  font-size: 0.8rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Semantic Title Styles */
.semantic-title-info {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid #dee2e6;
  border-left: 4px solid #6f42c1;
}

.semantic-title-info h4 {
  margin: 0 0 0.8rem 0;
  font-size: 1rem;
  color: #6f42c1;
  font-weight: 600;
}

.semantic-title-comparison {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.original-title,
.semantic-title {
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.original-title {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.semantic-title {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
}

.title-note {
  text-align: center;
  margin-top: 0.5rem;
}

.title-note small {
  color: #6c757d;
  font-style: italic;
}

/* Time Filter Notice Styles */
.time-filter-notice {
  text-align: center;
  margin-bottom: 1rem;
}

.filter-badge {
  display: inline-block;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(23, 162, 184, 0.3);
}

/* Tab Styles */
.sources-tabs {
  margin-top: 16px;
}

.tab-navigation {
  display: flex;
  border-bottom: 2px solid #e5e5e5;
  margin-bottom: 16px;
  gap: 4px;
  overflow-x: auto;
}

.tab-btn {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  border-radius: 6px 6px 0 0;
  white-space: nowrap;
  min-width: fit-content;
}

.tab-btn:hover:not(.disabled) {
  color: #333;
  background: #f8f9fa;
}

.tab-btn.active {
  color: #007bff;
  border-bottom-color: #007bff;
  background: #f8f9fa;
}

.tab-btn.disabled {
  color: #ccc;
  cursor: not-allowed;
  opacity: 0.5;
}

.tab-content {
  min-height: 200px;
}

.tab-panel {
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

.no-sources {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

/* News time filter notice */
.news-time-filter {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  border-left: 4px solid #2196f3;
  text-align: center;
}

.filter-info {
  font-size: 12px;
  color: #1565c0;
  font-weight: 500;
}

/* Mobile responsiveness for tabs */
@media (max-width: 768px) {
  .tab-navigation {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
  }

  .tab-btn {
    padding: 8px 12px;
    font-size: 12px;
    flex-shrink: 0;
  }

  .filter-info {
    font-size: 11px;
  }
}
</style>
