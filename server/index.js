const express = require('express');
const cors = require('cors');
const TrendTracker = require('./trendTracker');
const ViralNewsDetectorV3 = require('./viralNewsDetector');
const XLSX = require('xlsx');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client for semantic analysis
const openaiClient =
  process.env.OPENAI_API_KEY &&
  process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

console.log(
  `🤖 OpenAI Client for semantic analysis: ${
    openaiClient ? 'Enabled' : 'Disabled'
  }`
);

// Initialize trend tracker and viral news detector
const trendTracker = new TrendTracker();
const viralNewsDetector = new ViralNewsDetectorV3();

// Middleware
app.use(cors());
app.use(express.json());

// Simple usage tracking middleware
const usageStats = {
  totalRequests: 0,
  endpointCounts: {},
  dailyStats: {},
  startTime: new Date(),
};

app.use((req, res, next) => {
  usageStats.totalRequests++;

  // Track endpoint usage
  const endpoint = req.path;
  usageStats.endpointCounts[endpoint] =
    (usageStats.endpointCounts[endpoint] || 0) + 1;

  // Track daily usage
  const today = new Date().toISOString().split('T')[0];
  if (!usageStats.dailyStats[today]) {
    usageStats.dailyStats[today] = 0;
  }
  usageStats.dailyStats[today]++;

  // Log API usage
  console.log(
    `📊 API Request: ${req.method} ${req.path} - Total: ${usageStats.totalRequests}`
  );

  next();
});

// Sample trends data (in a real app, this would come from a database)
const sampleTrends = [
  {
    id: 1,
    title: 'Artificial Intelligence',
    category: 'Technology',
    popularity: 95,
    growth: 12.5,
    description: 'AI continues to dominate tech discussions',
  },
  {
    id: 2,
    title: 'Sustainable Living',
    category: 'Lifestyle',
    popularity: 78,
    growth: 8.3,
    description: 'Growing interest in eco-friendly practices',
  },
  {
    id: 3,
    title: 'Remote Work',
    category: 'Business',
    popularity: 85,
    growth: -2.1,
    description: 'Remote work trends stabilizing post-pandemic',
  },
];

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Trend Finder API is running!' });
});

// Usage statistics endpoint
app.get('/api/stats', (req, res) => {
  const uptime = Math.floor((Date.now() - usageStats.startTime) / 1000);

  res.json({
    success: true,
    data: {
      totalRequests: usageStats.totalRequests,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor(
        (uptime % 3600) / 60
      )}m ${uptime % 60}s`,
      startTime: usageStats.startTime,
      topEndpoints: Object.entries(usageStats.endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count })),
      dailyStats: usageStats.dailyStats,
      currentDate: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/trends', (req, res) => {
  res.json({
    success: true,
    data: sampleTrends,
    count: sampleTrends.length,
  });
});

app.get('/api/trends/:id', (req, res) => {
  const trendId = parseInt(req.params.id);
  const trend = sampleTrends.find((t) => t.id === trendId);

  if (!trend) {
    return res.status(404).json({
      success: false,
      message: 'Trend not found',
    });
  }

  res.json({
    success: true,
    data: trend,
  });
});

app.get('/api/trends/category/:category', (req, res) => {
  const category = req.params.category;
  const filteredTrends = sampleTrends.filter(
    (t) => t.category.toLowerCase() === category.toLowerCase()
  );

  res.json({
    success: true,
    data: filteredTrends,
    count: filteredTrends.length,
  });
});

// Advanced trend tracking endpoints
app.get('/api/live-trends', async (req, res) => {
  try {
    console.log('🔍 Fetching live trends from multiple sources...');
    const trendData = await trendTracker.run();

    res.json({
      success: true,
      data: trendData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching live trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live trends',
      error: error.message,
    });
  }
});

app.get('/api/live-trends/news', async (req, res) => {
  try {
    const [gnews, mediastack] = await Promise.all([
      trendTracker.fetchGNews(),
      trendTracker.fetchMediaStack(),
    ]);

    const allNews = [...gnews, ...mediastack].sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: allNews,
      count: allNews.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news trends',
      error: error.message,
    });
  }
});

app.get('/api/live-trends/youtube', async (req, res) => {
  try {
    const youtubeData = await trendTracker.fetchYouTubeTrending();

    res.json({
      success: true,
      data: youtubeData.sort((a, b) => b.score - a.score),
      count: youtubeData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch YouTube trends',
      error: error.message,
    });
  }
});

// YouTube trends endpoint for the YT-TREND tab
app.get('/api/yt-trends', async (req, res) => {
  try {
    console.log('📹 Fetching YouTube trends for YT-TREND tab...');
    const youtubeData = await trendTracker.fetchYouTubeTrending();

    // Transform data to match frontend expectations
    const transformedVideos = youtubeData.map((video, index) => ({
      id: video.id || `yt_${index}`,
      title: video.title,
      channelTitle: video.channelTitle || video.channel || 'Unknown Channel',
      viewCount: video.viewCount || video.views || 0,
      likeCount: video.likeCount || video.likes || 0,
      commentCount: video.commentCount || video.comments || 0,
      publishedAt:
        video.publishedAt || video.publishTime || new Date().toISOString(),
      thumbnail: video.thumbnail || video.thumbnailUrl || '/favicon.ico',
      duration: video.duration || '0:00',
      description: video.description || video.snippet || '',
      url: video.url || `https://youtube.com/watch?v=${video.id}`,
      viralScore: Math.min(Math.max(video.score || 50, 10), 100),
      isViral: (video.score || 50) >= 80,
      isTrending: (video.score || 50) >= 60,
      engagementRate:
        video.engagementRate ||
        (
          ((video.likes + video.comments) / Math.max(video.views, 1)) *
          100
        ).toFixed(1),
      viewVelocity:
        video.viewVelocity ||
        (video.score >= 80
          ? 'Very High'
          : video.score >= 60
          ? 'High'
          : 'Medium'),
    }));

    res.json({
      success: true,
      videos: transformedVideos.sort((a, b) => b.viralScore - a.viralScore),
      count: transformedVideos.length,
      timestamp: new Date().toISOString(),
      analytics: {
        totalViews: transformedVideos.reduce((sum, v) => sum + v.viewCount, 0),
        totalLikes: transformedVideos.reduce((sum, v) => sum + v.likeCount, 0),
        viralVideos: transformedVideos.filter((v) => v.isViral).length,
        trendingVideos: transformedVideos.filter((v) => v.isTrending).length,
        averageScore: (
          transformedVideos.reduce((sum, v) => sum + v.viralScore, 0) /
          transformedVideos.length
        ).toFixed(1),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching YouTube trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch YouTube trends',
      error: error.message,
      videos: [], // Return empty array so frontend doesn't break
    });
  }
});

app.get('/api/live-trends/twitter', async (req, res) => {
  try {
    const twitterData = await trendTracker.fetchTwitterTrends();

    res.json({
      success: true,
      data: twitterData.sort((a, b) => b.score - a.score),
      count: twitterData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Twitter trends',
      error: error.message,
    });
  }
});

app.get('/api/live-trends/google', async (req, res) => {
  try {
    const googleTrendsData = await trendTracker.fetchGoogleTrends();

    res.json({
      success: true,
      data: googleTrendsData.sort((a, b) => b.score - a.score),
      count: googleTrendsData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Google trends',
      error: error.message,
    });
  }
});

app.get('/api/live-trends/reddit', async (req, res) => {
  try {
    const redditData = await trendTracker.scrapeRedditTrends();

    res.json({
      success: true,
      data: redditData.sort((a, b) => b.score - a.score),
      count: redditData.length,
      timestamp: new Date().toISOString(),
      meta: {
        subreddits: ['r/india', 'r/worldnews', 'r/unpopularopinion'],
        timeframe: 'Last 72 hours',
        criteria: 'High upvote ratio, growing comments',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Reddit trends',
      error: error.message,
    });
  }
});

// AI-powered cross-matched topics endpoint
app.get('/api/live-trends/themes', async (req, res) => {
  try {
    console.log('🤖 Fetching AI-powered matched topics...');

    // Fetch data from all sources
    const [
      newsGNews,
      newsMediaStack,
      youtubeData,
      googleTrendsData,
      twitterData,
      redditData,
    ] = await Promise.all([
      trendTracker.fetchGNews(),
      trendTracker.fetchMediaStack(),
      trendTracker.fetchYouTubeTrending(),
      trendTracker.fetchGoogleTrends(),
      trendTracker.fetchTwitterTrends(),
      trendTracker.scrapeRedditTrends(),
    ]);

    const allNewsData = [...newsGNews, ...newsMediaStack];

    // Get AI-powered matched topics
    const matchedTopics = await trendTracker.crossMatchTopics(
      allNewsData,
      youtubeData,
      googleTrendsData,
      twitterData,
      redditData
    );

    res.json({
      success: true,
      data: matchedTopics,
      count: matchedTopics.length,
      timestamp: new Date().toISOString(),
      meta: {
        method:
          matchedTopics.length > 0 && matchedTopics[0].aiGenerated
            ? 'OpenAI GPT-3.5-turbo'
            : 'Manual keyword matching',
        totalAnalyzed:
          allNewsData.length +
          youtubeData.length +
          googleTrendsData.length +
          twitterData.length +
          redditData.length,
        topicsFound: matchedTopics.length,
        criteria: [
          'Same news story reported differently',
          'Same events with different wording',
          'Same personalities mentioned',
          'Same incidents',
          'Same trending topics',
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching matched topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matched topics',
      error: error.message,
    });
  }
});

// AI-powered viral content sorting endpoint
app.get('/api/live-trends/viral', async (req, res) => {
  try {
    console.log('🤖 Fetching AI-powered viral content...');

    // Fetch data from all sources
    const [
      newsGNews,
      newsMediaStack,
      youtubeData,
      googleTrendsData,
      twitterData,
      redditData,
    ] = await Promise.all([
      trendTracker.fetchGNews(),
      trendTracker.fetchMediaStack(),
      trendTracker.fetchYouTubeTrending(),
      trendTracker.fetchGoogleTrends(),
      trendTracker.fetchTwitterTrends(),
      trendTracker.scrapeRedditTrends(),
    ]);

    const allNewsData = [...newsGNews, ...newsMediaStack];

    // Get AI-sorted viral content
    const viralContent = await trendTracker.sortViral(
      allNewsData,
      youtubeData,
      googleTrendsData,
      twitterData,
      redditData
    );

    res.json({
      success: true,
      data: viralContent,
      count: viralContent.length,
      timestamp: new Date().toISOString(),
      meta: {
        method:
          viralContent.length > 0 && viralContent[0].aiSelected
            ? 'OpenAI GPT-3.5-turbo'
            : 'Manual viral scoring',
        totalAnalyzed:
          allNewsData.length +
          youtubeData.length +
          googleTrendsData.length +
          twitterData.length +
          redditData.length,
        viralSelected: viralContent.length,
        criteria: [
          'Breaking news impact',
          'Controversy potential',
          'Celebrity/entertainment value',
          'Emotional impact',
          'Social shareability',
          'Indian relevance',
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching viral content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch viral content',
      error: error.message,
    });
  }
});

// =============================================================================
// V2 NEWS-CENTRIC VIRAL DETECTION ENDPOINTS
// =============================================================================

// V2: News-centric viral detection with cross-platform validation
app.get('/api/v2/viral-news', async (req, res) => {
  try {
    console.log('🔥 Starting V2 News-Centric Viral Detection...');

    const viralNewsData = await viralNewsDetector.detectViralNews();

    res.json({
      success: true,
      version: '2.0',
      method: 'News-centric with cross-platform validation',
      data: viralNewsData.items,
      summary: {
        totalNewsAnalyzed: viralNewsData.totalNews,
        analyzedNews: viralNewsData.analyzedNews,
        validatedViralNews: viralNewsData.validatedViralNews,
        crossPlatformValidated: viralNewsData.crossPlatformValidated,
        viralThresholds: {
          minTweets: 10,
          minTweetImpressions: 150,
          minRedditPosts: 1,
          minUpvoteRatio: 0.5,
        },
      },
      timestamp: viralNewsData.analysisTime,
    });
  } catch (error) {
    console.error('❌ V2 Viral News Detection failed:', error);
    res.status(500).json({
      success: false,
      message: 'V2 viral news detection failed',
      error: error.message,
    });
  }
});

// V2: Get detailed viral analysis for specific news item
app.get('/api/v2/viral-news/:newsId/analysis', async (req, res) => {
  try {
    const { newsId } = req.params;

    // This would fetch detailed analysis for a specific news item
    // For now, return mock detailed analysis
    res.json({
      success: true,
      newsId: newsId,
      detailedAnalysis: {
        viralScore: 85,
        crossPlatformEvidence: {
          twitter: {
            totalTweets: 145,
            totalImpressions: 25600,
            averageImpressions: 176,
            topTweets: [
              {
                text: 'Breaking: Mock detailed tweet analysis',
                impressions: 450,
              },
              { text: 'This is trending everywhere!', impressions: 320 },
            ],
          },
          reddit: {
            totalPosts: 23,
            goodEngagementPosts: 18,
            averageUpvoteRatio: 0.82,
            topPosts: [
              {
                title: 'Discussion about this news',
                upvotes: 340,
                comments: 67,
              },
              {
                title: 'Another perspective on this',
                upvotes: 280,
                comments: 45,
              },
            ],
          },
        },
        viralFactors: [
          'High Twitter engagement with 145 tweets',
          'Strong Reddit discussion with 23 posts',
          'Cross-platform reach confirmed',
          'Above average impression rates',
        ],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get detailed viral analysis',
      error: error.message,
    });
  }
});

// V2: Get viral news summary with configurable thresholds
app.get('/api/v2/viral-news/summary', async (req, res) => {
  try {
    const {
      minTweets = 100,
      minImpressions = 100,
      minRedditPosts = 20,
      minUpvoteRatio = 0.7,
    } = req.query;

    // Update thresholds temporarily for this request
    const originalThresholds = { ...viralNewsDetector.viralThresholds };
    viralNewsDetector.viralThresholds = {
      minTweets: parseInt(minTweets),
      minTweetImpressions: parseInt(minImpressions),
      minRedditPosts: parseInt(minRedditPosts),
      goodUpvoteRatio: parseFloat(minUpvoteRatio),
      minRedditEngagement: 10,
    };

    const viralNewsData = await viralNewsDetector.detectViralNews();

    // Restore original thresholds
    viralNewsDetector.viralThresholds = originalThresholds;

    res.json({
      success: true,
      version: '2.0',
      customThresholds: {
        minTweets: parseInt(minTweets),
        minImpressions: parseInt(minImpressions),
        minRedditPosts: parseInt(minRedditPosts),
        minUpvoteRatio: parseFloat(minUpvoteRatio),
      },
      summary: {
        totalNewsAnalyzed: viralNewsData.totalNews,
        viralNewsFound: viralNewsData.viralNews,
        viralPercentage:
          viralNewsData.totalNews > 0
            ? (
                (viralNewsData.viralNews / viralNewsData.totalNews) *
                100
              ).toFixed(1) + '%'
            : '0%',
        topViralNews: viralNewsData.items.slice(0, 5).map((item) => ({
          title: item.title,
          source: item.source,
          viralScore: item.viralMetrics.viralScore,
          twitterCount: item.viralMetrics.twitter.count,
          redditCount: item.viralMetrics.reddit.count,
        })),
      },
      timestamp: viralNewsData.analysisTime,
    });
  } catch (error) {
    console.error('❌ V2 Viral News Summary failed:', error);
    res.status(500).json({
      success: false,
      message: 'V2 viral news summary failed',
      error: error.message,
    });
  }
});

// V2: Debug endpoint to test real Reddit API integration
app.get('/api/v2/debug/reddit-test', async (req, res) => {
  try {
    console.log('🧪 Testing Real Reddit API Integration...');

    // Test Reddit API with a simple search
    const testKeywords = ['india', 'news'];
    const testSubreddit = 'india';

    // Create a temporary detector instance for testing
    const detector = viralNewsDetector;
    const redditResults = await detector.searchRedditSubredditReal(
      testSubreddit,
      testKeywords
    );

    res.json({
      success: true,
      debug: true,
      testParams: {
        subreddit: testSubreddit,
        keywords: testKeywords,
      },
      redditResults: redditResults,
      resultCount: redditResults.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Reddit API test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Reddit API test failed',
      error: error.message,
    });
  }
});

// V2: Debug endpoint to test full viral detection process
app.get('/api/v2/debug/viral-process', async (req, res) => {
  try {
    console.log('🧪 Testing Full Viral Detection Process...');

    // Get news items
    const newsItems = await viralNewsDetector.collectNews();
    console.log(`📰 Collected ${newsItems.length} news items`);

    if (newsItems.length === 0) {
      return res.json({
        success: true,
        debug: true,
        message: 'No news items found - check API keys',
        newsItems: [],
        timestamp: new Date().toISOString(),
      });
    }

    // Test with first news item
    const testNewsItem = newsItems[0];
    console.log(`🔍 Testing with: ${testNewsItem.title}`);

    // Get cross-platform validation
    const validation = await viralNewsDetector.crossValidateNews(testNewsItem);

    res.json({
      success: true,
      debug: true,
      testNewsItem: {
        title: testNewsItem.title,
        source: testNewsItem.source,
        keywords: testNewsItem.keywords,
      },
      validation: validation,
      viralThresholds: viralNewsDetector.viralThresholds,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Viral process test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Viral process test failed',
      error: error.message,
    });
  }
});

// V2: Compare old vs new viral detection methods
app.get('/api/v2/viral-comparison', async (req, res) => {
  try {
    console.log('🔄 Running V1 vs V2 Viral Detection Comparison...');

    // Run both V1 and V2 detection methods
    const [v1Results, v2Results] = await Promise.all([
      // V1: Original method
      (async () => {
        const [
          newsGNews,
          newsMediaStack,
          youtubeData,
          googleTrendsData,
          twitterData,
          redditData,
        ] = await Promise.all([
          trendTracker.fetchGNews(),
          trendTracker.fetchMediaStack(),
          trendTracker.fetchYouTubeTrending(),
          trendTracker.fetchGoogleTrends(),
          trendTracker.fetchTwitterTrends(),
          trendTracker.scrapeRedditTrends(),
        ]);

        const allNewsData = [...newsGNews, ...newsMediaStack];
        return await trendTracker.sortViral(
          allNewsData,
          youtubeData,
          googleTrendsData,
          twitterData,
          redditData
        );
      })(),

      // V2: New news-centric method
      viralNewsDetector.detectViralNews(),
    ]);

    res.json({
      success: true,
      comparison: {
        v1_traditional: {
          method: 'Multi-source aggregation with AI sorting',
          viralItemsFound: v1Results.length,
          approach: 'Collect from all sources, then sort by viral potential',
          items: v1Results.slice(0, 3).map((item) => ({
            title: item.title || item.text,
            source: item.source || item.platform,
            score: item.viralScore || item.score,
          })),
        },
        v2_news_centric: {
          method: 'News-first with cross-platform validation',
          viralItemsFound: v2Results.viralNews,
          approach: 'Start with news, validate virality across platforms',
          items: v2Results.items.slice(0, 3).map((item) => ({
            title: item.title,
            source: item.source,
            viralScore: item.viralMetrics.viralScore,
            twitterEvidence: `${item.viralMetrics.twitter.count} tweets`,
            redditEvidence: `${item.viralMetrics.reddit.count} posts`,
          })),
        },
      },
      recommendation:
        v2Results.viralNews > v1Results.length
          ? 'V2 method detected more viral content with better validation'
          : 'Both methods show similar viral detection capabilities',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Viral Comparison failed:', error);
    res.status(500).json({
      success: false,
      message: 'Viral detection comparison failed',
      error: error.message,
    });
  }
});

// V2: Export viral news data to Excel file (using provided data)
app.post('/api/v2/viral-news/export', async (req, res) => {
  try {
    console.log('📊 Generating Excel export from provided data...');

    const { newsData } = req.body;

    if (!newsData || !Array.isArray(newsData) || newsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No news data provided for export',
      });
    }

    // Prepare simplified data for Excel export (basic news info only)
    const excelData = newsData.map((item, index) => {
      return {
        'S.No': index + 1,
        Title: item.title || '',
        URL: item.url || '',
        Source: item.source || '',
        'Published Date': item.publishedAt
          ? new Date(item.publishedAt).toLocaleString()
          : '',
      };
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const colWidths = [];
    const headers = Object.keys(excelData[0] || {});
    headers.forEach((header, index) => {
      let maxWidth = header.length;
      excelData.forEach((row) => {
        const cellValue = String(row[header] || '');
        maxWidth = Math.max(maxWidth, cellValue.length);
      });
      colWidths[index] = { width: Math.min(maxWidth + 2, 50) }; // Cap at 50 chars
    });
    worksheet['!cols'] = colWidths;

    // Add the worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Viral News Analysis');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true,
    });

    // Generate filename with date in format: viral_news_analysis_2025-07-07
    const date = new Date().toISOString().slice(0, 10); // Gets YYYY-MM-DD format
    const filename = `viral_news_analysis_${date}.xlsx`;

    // Set headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    console.log(
      `✅ Excel export generated: ${filename} (${excelData.length} rows)`
    );

    // Send the Excel file
    res.send(excelBuffer);
  } catch (error) {
    console.error('❌ Excel export failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Excel export',
      error: error.message,
    });
  }
});

/**
 * 🤖 Generate semantic title using OpenAI for better cross-platform searching
 */
async function generateSemanticTitle(video) {
  if (!openaiClient) {
    console.log('⚠️ OpenAI not available, using original title');
    return video.title;
  }

  try {
    console.log(`🤖 Generating semantic title for: "${video.title}"`);

    const prompt = `Analyze this YouTube video and create a clean, searchable title that captures the core topic for cross-platform searching:

Original Title: "${video.title}"
Description: "${video.description || 'No description'}"
Channel: "${video.channelTitle || 'Unknown'}"

Requirements:
1. Create a clean, meaningful title (3-8 words)
2. Remove clickbait elements, caps, and excessive punctuation
3. Focus on the actual topic/subject matter
4. Make it suitable for searching Twitter, Reddit, and news
5. Keep key people, events, or topics mentioned
6. Avoid words like "SHOCKING", "VIRAL", "MUST WATCH", etc.

Examples:
"ELON MUSK SHOCKING TWITTER ANNOUNCEMENT!!!" → "Elon Musk Twitter announcement"
"You WON'T BELIEVE What Taylor Swift Said!" → "Taylor Swift statement"
"BREAKING: iPhone 15 Problems Exposed!" → "iPhone 15 issues"

Return ONLY the clean semantic title, no explanation.`;

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at creating clean, searchable titles from clickbait YouTube titles. You understand what makes content discoverable across different platforms.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const semanticTitle = completion.choices[0].message.content
      .trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .trim();

    if (
      semanticTitle &&
      semanticTitle.length > 3 &&
      semanticTitle.length < 100
    ) {
      console.log(`✅ Generated semantic title: "${semanticTitle}"`);
      return semanticTitle;
    } else {
      console.log('⚠️ Invalid semantic title generated, using original');
      return video.title;
    }
  } catch (error) {
    console.log('⚠️ Semantic title generation failed:', error.message);
    return video.title;
  }
}

/**
 * 🤖 Validate search results using OpenAI to ensure relevance
 */
async function validateResultRelevance(semanticTitle, results, platform) {
  if (!openaiClient || !results.length) {
    return results; // Return all results if OpenAI not available or no results
  }

  try {
    console.log(
      `🤖 Validating ${results.length} ${platform} results for relevance...`
    );

    // Prepare results for validation (limit to top 10 for efficiency)
    const resultsToValidate = results.slice(0, 10);
    const resultTexts = resultsToValidate
      .map((result, index) => {
        const text =
          platform === 'twitter'
            ? result.title || result.text || ''
            : platform === 'reddit'
            ? result.title
            : result.title;
        return `${index + 1}. ${text.substring(0, 150)}`;
      })
      .join('\n');

    const prompt = `Analyze which of these ${platform} results are ACTUALLY related to the topic "${semanticTitle}":

Topic: "${semanticTitle}"

${platform.toUpperCase()} Results:
${resultTexts}

Requirements:
1. Only include results that are DIRECTLY related to the topic
2. Exclude spam, unrelated content, or generic posts
3. Look for specific mentions of people, events, or topics from the semantic title
4. Be strict - better to have fewer relevant results than many irrelevant ones

Return the numbers (1-${
      resultsToValidate.length
    }) of RELEVANT results, separated by commas.
If none are relevant, return "none".
Example: "1,3,5" or "none"`;

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert content curator who can identify truly relevant ${platform} content. You are very strict about relevance.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    const relevantIndices = completion.choices[0].message.content
      .trim()
      .toLowerCase();

    if (relevantIndices === 'none') {
      console.log(`❌ No relevant ${platform} results found after validation`);
      return [];
    }

    // Parse the indices and return relevant results
    const indices = relevantIndices
      .split(',')
      .map((i) => parseInt(i.trim()) - 1) // Convert to 0-based index
      .filter((i) => i >= 0 && i < resultsToValidate.length);

    const validatedResults = indices.map((i) => ({
      ...resultsToValidate[i],
      aiValidated: true,
    }));

    console.log(
      `✅ Validated ${validatedResults.length}/${resultsToValidate.length} ${platform} results as relevant`
    );
    return validatedResults;
  } catch (error) {
    console.log(`⚠️ ${platform} result validation failed:`, error.message);
    return results; // Return original results if validation fails
  }
}

// Cross-platform YouTube trend analysis endpoint
app.post('/api/yt-trends/cross-platform-analysis', async (req, res) => {
  try {
    console.log('🔍 Starting cross-platform analysis for YouTube videos...');
    const { videos } = req.body;

    if (!videos || !Array.isArray(videos)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid video data provided',
      });
    }

    // Analyze each video by searching for related content on other platforms
    const analyzedVideos = await Promise.all(
      videos.map(async (video, index) => {
        console.log(
          `🔍 Analyzing video ${index + 1}/${videos.length}: "${video.title}"`
        );

        // Step 1: Generate semantic title using OpenAI
        const semanticTitle = await generateSemanticTitle(video);
        console.log(`🎯 Using semantic title: "${semanticTitle}"`);

        const keywords = extractKeywords(semanticTitle);
        console.log(
          `🔑 Keywords extracted from semantic title: ${keywords.join(', ')}`
        );

        // Step 2: Search for related content using semantic title
        const [rawTwitterMatches, rawRedditMatches, rawNewsMatches] =
          await Promise.all([
            trendTracker.searchTwitterForTopic(keywords),
            trendTracker.searchRedditForTopic(keywords),
            trendTracker.searchNewsForTopic(keywords),
          ]);

        console.log(
          `📊 Raw results - Twitter: ${rawTwitterMatches.length}, Reddit: ${rawRedditMatches.length}, News: ${rawNewsMatches.length}`
        );

        // Step 3: Validate results using OpenAI to ensure relevance
        const [twitterMatches, redditMatches, newsMatches] = await Promise.all([
          validateResultRelevance(semanticTitle, rawTwitterMatches, 'twitter'),
          validateResultRelevance(semanticTitle, rawRedditMatches, 'reddit'),
          validateResultRelevance(semanticTitle, rawNewsMatches, 'news'),
        ]);

        console.log(
          `✅ Validated results - Twitter: ${twitterMatches.length}, Reddit: ${redditMatches.length}, News: ${newsMatches.length}`
        );

        const crossPlatformScore = await analyzeCrossPlatformTrend(
          video,
          twitterMatches,
          redditMatches,
          newsMatches,
          semanticTitle
        );

        return {
          ...video,
          semanticTitle, // Include semantic title in response
          crossPlatformAnalysis: crossPlatformScore,
        };
      })
    );

    // Calculate summary statistics
    const totalMatches = analyzedVideos.reduce((sum, video) => {
      return (
        sum +
        video.crossPlatformAnalysis.twitter.matches +
        video.crossPlatformAnalysis.reddit.matches +
        video.crossPlatformAnalysis.googleNews.matches
      );
    }, 0);

    res.json({
      success: true,
      data: {
        videos: analyzedVideos,
        analysis: {
          totalVideos: videos.length,
          totalCrossPlatformMatches: totalMatches,
          highCrossPlatformScore: analyzedVideos.filter(
            (v) => v.crossPlatformAnalysis.totalScore >= 70
          ).length,
          viralAcrossPlatforms: analyzedVideos.filter(
            (v) => v.crossPlatformAnalysis.totalScore >= 85
          ).length,
          avgScore: Math.round(
            analyzedVideos.reduce(
              (sum, v) => sum + v.crossPlatformAnalysis.totalScore,
              0
            ) / videos.length
          ),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in cross-platform analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform cross-platform analysis',
      error: error.message,
    });
  }
});

// Cross-platform trend analysis function using viral news validation thresholds
async function analyzeCrossPlatformTrend(
  video,
  twitterData,
  redditData,
  googleNewsData,
  semanticTitle = null
) {
  // Use semantic title if provided, otherwise fallback to original title
  const searchTitle = (semanticTitle || video.title).toLowerCase();
  const videoKeywords = extractKeywords(searchTitle);

  console.log(`🔍 Analyzing cross-platform trend using: "${searchTitle}"`);
  if (semanticTitle) {
    console.log(`🤖 Semantic title provided by OpenAI: "${semanticTitle}"`);
  }

  // Apply viral news validation thresholds (same as non-yt-trend)
  const viralThresholds = {
    minTweets: 10, // Minimum tweets for viral consideration
    minTweetImpressions: 150, // Minimum average impressions
    minRedditPosts: 1, // Minimum Reddit posts
    minUpvoteRatio: 0.5, // Minimum upvote ratio
    minRedditUpvotes: 30, // Minimum total upvotes for viral
    minRedditEngagement: 5, // Minimum comments for engagement
  };

  // Twitter Analysis with validation
  const twitterMatches = findPlatformMatches(
    searchTitle,
    videoKeywords,
    twitterData,
    'title'
  );
  const twitterScore = calculateValidatedTwitterScore(
    twitterMatches,
    viralThresholds
  );

  // Reddit Analysis with validation
  const redditMatches = findPlatformMatches(
    searchTitle,
    videoKeywords,
    redditData,
    'title'
  );
  const redditScore = calculateValidatedRedditScore(
    redditMatches,
    viralThresholds
  );

  // Google News Analysis (same as before)
  const googleNewsMatches = findPlatformMatches(
    searchTitle,
    videoKeywords,
    googleNewsData,
    'title'
  );
  const googleNewsScore = calculateGoogleNewsScore(
    googleNewsMatches,
    googleNewsData
  );

  // Apply viral validation logic
  const isTwitterViral = twitterMatches.length >= viralThresholds.minTweets;
  const totalRedditUpvotes = redditMatches.reduce(
    (sum, r) => sum + (r.upvotes || 0),
    0
  );
  const isRedditViral =
    redditMatches.length >= viralThresholds.minRedditPosts &&
    totalRedditUpvotes >= viralThresholds.minRedditUpvotes;

  // Calculate weighted total score with viral validation
  let totalScore = Math.round(
    twitterScore * 0.35 + redditScore * 0.25 + googleNewsScore * 0.25
  );

  // Apply viral bonus if thresholds are met (same as non-yt-trend)
  if (isTwitterViral && isRedditViral) {
    totalScore += 15; // Cross-platform viral bonus
  } else if (isTwitterViral || isRedditViral) {
    totalScore += 8; // Single platform viral bonus
  }

  // Cap at 100
  totalScore = Math.min(totalScore, 100);

  return {
    totalScore,
    twitter: {
      score: twitterScore,
      weight: 35,
      matches: twitterMatches.length,
      isViral: isTwitterViral,
      topMatches: twitterMatches.slice(0, 3).map((m) => ({
        title: m.title || m.text,
        score: m.score,
        similarity: m.similarity,
        url: m.url,
        username: m.username,
        retweets: m.retweets,
        likes: m.likes,
        fromRapidAPI: m.fromRapidAPI || false,
      })),
      sources: twitterMatches.slice(0, 5).map((m) => ({
        title: m.title || m.text || 'Twitter Post',
        url:
          m.url ||
          `https://twitter.com/search?q=${encodeURIComponent(
            m.title || m.text || ''
          )}`,
        username: m.username || 'Unknown',
        engagement: `${m.likes || 0} likes, ${m.retweets || 0} retweets`,
        type: 'twitter',
        verified: m.fromRapidAPI
          ? 'Real Twitter Data (RapidAPI)'
          : 'Twitter Trends',
      })),
    },
    reddit: {
      score: redditScore,
      weight: 25,
      matches: redditMatches.length,
      isViral: isRedditViral,
      totalUpvotes: totalRedditUpvotes,
      topMatches: redditMatches.slice(0, 3).map((m) => ({
        title: m.title,
        upvotes: m.upvotes,
        comments: m.comments,
        similarity: m.similarity,
        subreddit: m.subreddit,
        url: m.url,
      })),
      sources: redditMatches.slice(0, 5).map((m) => ({
        title: m.title || 'Reddit Post',
        url:
          m.url ||
          `https://reddit.com/search?q=${encodeURIComponent(m.title || '')}`,
        subreddit: m.subreddit || 'Unknown',
        engagement: `${m.upvotes || 0} upvotes, ${m.comments || 0} comments`,
        type: 'reddit',
        verified: 'Real Reddit Data (JSON API)',
      })),
    },
    googleNews: {
      score: googleNewsScore,
      weight: 25,
      matches: googleNewsMatches.length,
      topMatches: googleNewsMatches.slice(0, 3).map((m) => ({
        title: m.title,
        source: m.source,
        similarity: m.similarity,
        url: m.url,
        publishedAt: m.publishedAt,
      })),
      sources: googleNewsMatches.slice(0, 5).map((m) => ({
        title: m.title || 'News Article',
        url:
          m.url ||
          `https://news.google.com/search?q=${encodeURIComponent(
            m.title || ''
          )}`,
        source: m.source || 'Unknown Source',
        publishedAt: m.publishedAt || new Date().toISOString(),
        type: 'news',
        verified:
          m.api === 'GNews-Search'
            ? 'Real News Data (GNews API)'
            : 'News Search',
      })),
    },
    analysis: {
      keywords: videoKeywords,
      crossPlatformReach: calculateCrossPlatformReach(
        twitterMatches,
        redditMatches,
        googleNewsMatches
      ),
      viralPotential: categorizeViralPotential(totalScore),
      recommendedActions: generateRecommendations(
        totalScore,
        twitterMatches,
        redditMatches,
        googleNewsMatches
      ),
    },
  };
}

// Extract keywords from video title
function extractKeywords(title) {
  const stopWords = [
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
  ];

  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10); // Top 10 keywords
}

// Find matches between video and platform content
function findPlatformMatches(
  videoTitle,
  videoKeywords,
  platformData,
  titleField
) {
  const matches = [];

  platformData.forEach((item) => {
    const platformTitle = (item[titleField] || '').toLowerCase();
    const similarity = calculateSimilarity(
      videoTitle,
      platformTitle,
      videoKeywords
    );

    if (similarity > 0.3) {
      // 30% similarity threshold
      matches.push({
        ...item,
        similarity: similarity,
      });
    }
  });

  return matches.sort((a, b) => b.similarity - a.similarity);
}

// Calculate similarity score between two texts
function calculateSimilarity(text1, text2, keywords) {
  // Keyword overlap score
  const keywordMatches = keywords.filter((keyword) =>
    text2.includes(keyword)
  ).length;
  const keywordScore =
    keywords.length > 0 ? keywordMatches / keywords.length : 0;

  // Direct text overlap score
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  const commonWords = words1.filter(
    (word) => words2.includes(word) && word.length > 2
  ).length;
  const textScore =
    Math.max(words1.length, words2.length) > 0
      ? commonWords / Math.max(words1.length, words2.length)
      : 0;

  // Combined score (weighted: 70% keywords, 30% text overlap)
  return keywordScore * 0.7 + textScore * 0.3;
}

// Calculate Twitter score based on tweets and impressions
function calculateTwitterScore(matches, allTwitterData) {
  if (matches.length === 0) return 0;

  let totalScore = 0;
  let impressionFactor = 0;

  matches.forEach((match) => {
    // Base score from existing Twitter scoring
    const baseScore = match.score || 0;

    // Similarity bonus
    const similarityBonus = match.similarity * 20;

    // Impression estimation (based on trend position and viral keywords)
    const estimatedImpressions = estimateTwitterImpressions(match);
    const impressionScore = Math.min(estimatedImpressions / 10000, 25); // Max 25 points

    totalScore += baseScore + similarityBonus + impressionScore;
    impressionFactor += estimatedImpressions;
  });

  // Normalize by number of matches and total Twitter trends
  const normalizedScore = totalScore / Math.max(matches.length, 1);
  const reachFactor =
    (matches.length / Math.max(allTwitterData.length, 1)) * 10;

  return Math.min(Math.round(normalizedScore + reachFactor), 100);
}

// Calculate Reddit score based on comments and upvotes
function calculateRedditScore(matches, allRedditData) {
  if (matches.length === 0) return 0;

  let totalScore = 0;
  let engagementFactor = 0;

  matches.forEach((match) => {
    // Base score from upvotes
    const upvoteScore = Math.min(Math.log10((match.upvotes || 0) + 1) * 5, 20);

    // Comment engagement score
    const commentScore = Math.min(
      Math.log10((match.comments || 0) + 1) * 3,
      15
    );

    // Engagement ratio bonus
    const engagementRatio =
      (match.comments || 0) / Math.max(match.upvotes || 0, 1);
    const engagementBonus = Math.min(engagementRatio * 20, 10);

    // Similarity bonus
    const similarityBonus = match.similarity * 15;

    totalScore +=
      upvoteScore + commentScore + engagementBonus + similarityBonus;
    engagementFactor += (match.upvotes || 0) + (match.comments || 0);
  });

  const normalizedScore = totalScore / Math.max(matches.length, 1);
  const reachFactor = (matches.length / Math.max(allRedditData.length, 1)) * 5;

  return Math.min(Math.round(normalizedScore + reachFactor), 100);
}

// New validated Twitter scoring function using viral news thresholds
function calculateValidatedTwitterScore(matches, viralThresholds) {
  if (matches.length === 0) return 0;

  let score = 0;

  // Apply viral news validation: minimum 10 tweets for viral consideration
  if (matches.length < viralThresholds.minTweets) {
    score = Math.min(matches.length * 3, 20); // Lower score for below threshold
  } else {
    // Base score with logarithmic scaling (like viral news detector)
    score += Math.log10(matches.length + 1) * 15; // 0-30 points

    // Quality score from match similarity
    const avgSimilarity =
      matches.reduce((sum, match) => sum + match.similarity, 0) /
      matches.length;
    score += avgSimilarity * 25; // Up to 25 points

    // Engagement quality bonus with viral thresholds
    let totalEngagement = 0;
    let totalImpressions = 0;
    let validTweets = 0;

    matches.forEach((match) => {
      const impressions = estimateTwitterImpressions(match);
      const engagement =
        (match.retweets || 0) + (match.likes || 0) + (match.replies || 0);

      if (impressions >= viralThresholds.minTweetImpressions) {
        totalImpressions += impressions;
        totalEngagement += engagement;
        validTweets++;
      }
    });

    // Apply viral validation bonus
    if (validTweets > 0 && totalImpressions > 0) {
      const avgEngagementRate = totalEngagement / totalImpressions;
      score += Math.min(avgEngagementRate * 500, 20); // Up to 20 points for high engagement
    }

    // Cross-platform viral bonus
    if (matches.length >= viralThresholds.minTweets) {
      score += 10; // Viral threshold bonus
    }
  }

  return Math.min(Math.round(score), 100);
}

// New validated Reddit scoring function using viral news thresholds
function calculateValidatedRedditScore(matches, viralThresholds) {
  if (matches.length === 0) return 0;

  let score = 0;
  const totalUpvotes = matches.reduce(
    (sum, match) => sum + (match.upvotes || 0),
    0
  );
  const totalComments = matches.reduce(
    (sum, match) => sum + (match.comments || 0),
    0
  );

  // Apply viral news validation: minimum 1 post with 30+ upvotes
  if (
    matches.length < viralThresholds.minRedditPosts ||
    totalUpvotes < viralThresholds.minRedditUpvotes
  ) {
    score = Math.min(matches.length * 5 + totalUpvotes * 0.5, 25); // Lower score for below threshold
  } else {
    // Base score with logarithmic scaling (like viral news detector)
    score += Math.log10(matches.length + 1) * 8; // 0-16 points

    // Upvote quality with logarithmic scale
    score += Math.log10(totalUpvotes + 1) * 6; // 0-15 points

    // Community engagement depth
    const avgCommentsPerPost =
      matches.length > 0 ? totalComments / matches.length : 0;
    const engagementDepth = Math.min(avgCommentsPerPost / 10, 1) * 8; // 0-8 points
    score += engagementDepth;

    // Quality validation: check upvote ratio
    let validPosts = 0;
    matches.forEach((match) => {
      const upvoteRatio = match.upvoteRatio || 0.5;
      if (upvoteRatio >= viralThresholds.minUpvoteRatio) {
        validPosts++;
      }
    });

    // Quality bonus for good upvote ratios
    if (validPosts > 0) {
      score += (validPosts / matches.length) * 10; // Up to 10 points
    }

    // Cross-platform viral bonus
    if (
      matches.length >= viralThresholds.minRedditPosts &&
      totalUpvotes >= viralThresholds.minRedditUpvotes
    ) {
      score += 12; // Viral threshold bonus
    }
  }

  return Math.min(Math.round(score), 100);
}

// Calculate Google News score based on title and semantic matches across different media channels
function calculateGoogleNewsScore(matches, allGoogleNewsData) {
  if (matches.length === 0) return 0;

  // Group matches by source to check for cross-media coverage
  const sourceGroups = {};
  matches.forEach((match) => {
    const source = match.source || 'Unknown';
    if (!sourceGroups[source]) {
      sourceGroups[source] = [];
    }
    sourceGroups[source].push(match);
  });

  const uniqueSources = Object.keys(sourceGroups).length;
  let totalScore = 0;

  matches.forEach((match) => {
    // Base news score
    const baseScore = match.score || 0;

    // Similarity bonus
    const similarityBonus = match.similarity * 25;

    // Source credibility bonus (based on predefined tier system)
    const credibilityBonus = getSourceCredibilityScore(match.source);

    totalScore += baseScore + similarityBonus + credibilityBonus;
  });

  // Multi-source coverage bonus (cross-media validation)
  const crossMediaBonus = Math.min(uniqueSources * 5, 20); // Max 20 points for 4+ sources

  // Semantic title matching bonus (if 4-5 different sources cover similar topic)
  const semanticBonus = uniqueSources >= 4 ? 15 : uniqueSources >= 3 ? 10 : 0;

  const normalizedScore = totalScore / Math.max(matches.length, 1);

  return Math.min(
    Math.round(normalizedScore + crossMediaBonus + semanticBonus),
    100
  );
}

// Estimate Twitter impressions based on trend characteristics
function estimateTwitterImpressions(twitterTrend) {
  let impressions = 1000; // Base impressions

  // Viral keyword multipliers
  const viralKeywords = [
    'viral',
    'trending',
    'breaking',
    'exclusive',
    'shocking',
  ];
  const title = (twitterTrend.title || '').toLowerCase();

  viralKeywords.forEach((keyword) => {
    if (title.includes(keyword)) {
      impressions *= 2;
    }
  });

  // Score-based multiplier
  if (twitterTrend.score > 30) impressions *= 3;
  else if (twitterTrend.score > 20) impressions *= 2;
  else if (twitterTrend.score > 10) impressions *= 1.5;

  return Math.min(impressions, 1000000); // Cap at 1M impressions
}

// Get source credibility score for news outlets
function getSourceCredibilityScore(source) {
  const tier1Sources = [
    'BBC',
    'Reuters',
    'AP News',
    'Times of India',
    'Hindu',
    'Indian Express',
  ];
  const tier2Sources = [
    'NDTV',
    'Hindustan Times',
    'Economic Times',
    'News18',
    'Zee News',
  ];

  const sourceLower = (source || '').toLowerCase();

  if (tier1Sources.some((t1) => sourceLower.includes(t1.toLowerCase())))
    return 15;
  if (tier2Sources.some((t2) => sourceLower.includes(t2.toLowerCase())))
    return 10;
  return 5; // Default score for other sources
}

// Calculate cross-platform reach
function calculateCrossPlatformReach(
  twitterMatches,
  redditMatches,
  googleNewsMatches
) {
  const totalMatches =
    twitterMatches.length + redditMatches.length + googleNewsMatches.length;

  if (totalMatches === 0) return 'No Cross-Platform Presence';
  if (totalMatches >= 15) return 'Viral Across All Platforms';
  if (totalMatches >= 10) return 'High Cross-Platform Reach';
  if (totalMatches >= 5) return 'Moderate Cross-Platform Reach';
  return 'Limited Cross-Platform Presence';
}

// Categorize viral potential
function categorizeViralPotential(score) {
  if (score >= 85) return 'Extremely Viral';
  if (score >= 70) return 'High Viral Potential';
  if (score >= 50) return 'Moderate Viral Potential';
  if (score >= 30) return 'Some Viral Potential';
  return 'Low Viral Potential';
}

// Generate recommendations based on analysis
function generateRecommendations(
  totalScore,
  twitterMatches,
  redditMatches,
  googleNewsMatches
) {
  const recommendations = [];

  if (totalScore >= 70) {
    recommendations.push(
      '🔥 High viral potential detected! Consider promoting immediately.'
    );
  }

  if (twitterMatches.length === 0) {
    recommendations.push(
      '📱 No Twitter presence found. Consider creating Twitter buzz.'
    );
  }

  if (redditMatches.length === 0) {
    recommendations.push(
      '🔴 No Reddit engagement. Share in relevant subreddits.'
    );
  }

  if (googleNewsMatches.length === 0) {
    recommendations.push(
      '📰 Limited news coverage. Consider reaching out to media outlets.'
    );
  }

  if (googleNewsMatches.length >= 3) {
    recommendations.push(
      '📰 Strong news coverage detected! Leverage this momentum.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '📊 Balanced cross-platform presence. Monitor and maintain engagement.'
    );
  }

  return recommendations;
}

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Trend Finder API available at http://localhost:${PORT}`);
  console.log(`🔥 Advanced Trend Tracker endpoints available:`);
  console.log(`   GET /api/live-trends - Complete trend analysis`);
  console.log(`   GET /api/live-trends/news - News trends only`);
  console.log(`   GET /api/live-trends/twitter - Twitter trends only`);
  console.log(`   GET /api/live-trends/youtube - YouTube trends only`);
  console.log(`   GET /api/live-trends/google - Google trends only`);
  console.log(`   GET /api/live-trends/reddit - Reddit trending posts only`);
  console.log(`   GET /api/live-trends/themes - 🤖 AI-powered matched topics`);
  console.log(
    `   GET /api/live-trends/viral - 🤖 AI-powered viral content sorting`
  );
  console.log(`🔥 V2 NEWS-CENTRIC VIRAL DETECTION endpoints:`);
  console.log(`   GET /api/v2/viral-news - 🆕 News-first viral detection`);
  console.log(`   GET /api/v2/viral-news/summary - 🆕 Viral news summary`);
  console.log(`   GET /api/v2/viral-news/:id/analysis - 🆕 Detailed analysis`);
  console.log(`   GET /api/v2/viral-comparison - 🆕 V1 vs V2 comparison`);
});
