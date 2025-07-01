<script>
export default {
  name: 'App',
};
</script>

<template>
  <div id="app">
    <nav class="nav-gradient text-white py-4 shadow-lg">
      <div class="max-w-6xl mx-auto px-8 flex justify-center items-center">
        <h1 class="text-2xl font-bold">
          🔥 Viral News Finder - Real-time Detection
        </h1>
      </div>
    </nav>

    <main class="max-w-6xl mx-auto p-8">
      <RouterView />
    </main>
  </div>
</template>
