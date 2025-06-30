<template>
  <div class="home-page">
    <div class="hero-section">
      <h1 class="main-title">🔥 Trend Finder</h1>
      <p class="subtitle">
        Discover what's trending across news and social media platforms
      </p>
    </div>

    <div class="features-section">
      <div class="feature-card">
        <div class="feature-icon">📰</div>
        <h3>Viral News Detection</h3>
        <p>
          AI-powered analysis of news stories with cross-platform social media
          validation
        </p>
        <router-link to="/viral-news" class="feature-button">
          Explore Viral News →
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: white;
}

.hero-section {
  text-align: center;
  margin-bottom: 4rem;
}

.main-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  max-width: 600px;
  line-height: 1.6;
}

.features-section {
  display: grid;
  gap: 2rem;
  max-width: 1200px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.feature-card p {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.feature-button {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: background 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.feature-button:hover {
  background: rgba(255, 255, 255, 0.3);
  text-decoration: none;
  color: white;
}
</style>
