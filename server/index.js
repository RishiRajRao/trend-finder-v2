const express = require('express');
const cors = require('cors');
const TrendTracker = require('./trendTracker');
const ViralNewsDetectorV3 = require('./viralNewsDetector');
const XLSX = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

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
