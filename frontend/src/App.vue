<template>
  <div id="app">
    <AppHeader />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';
</script>

<style>
@import './assets/styles/main.css';
</style>

