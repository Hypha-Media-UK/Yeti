<template>
  <header class="app-header">
    <div class="container">
      <div class="header-content">
        <h1 class="app-title">Staff Rota</h1>
        <nav class="nav">
          <RouterLink to="/" class="nav-link" active-class="active">
            Rota
          </RouterLink>
          <RouterLink to="/config" class="nav-link" active-class="active">
            Config
          </RouterLink>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.app-header {
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-3);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) 0;
  gap: var(--spacing-3);
}

.app-title {
  font-size: var(--font-size-section);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.nav {
  display: flex;
  gap: var(--spacing-2);
}

.nav-link {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-button);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: var(--transition-base);
}

.nav-link:hover {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
}

.nav-link.active {
  background-color: var(--color-primary);
  color: white;
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .nav {
    width: 100%;
  }

  .nav-link {
    flex: 1;
    text-align: center;
  }
}
</style>

