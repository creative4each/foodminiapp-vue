<template>
  <nav class="navbar">
    <RouterLink to="/" :class="{active: $route.path === '/'}">
      <span class="icon">🛍️</span>
      <span class="label">Каталог</span>
    </RouterLink>
    <RouterLink to="/plan" :class="{active: $route.path === '/plan'}">
      <span class="icon">🧾</span>
      <span class="label">План</span>
    </RouterLink>
    <RouterLink to="/lists" :class="{active: $route.path === '/lists'}">
      <span class="icon">📝</span>
      <span class="label">Списки</span>
    </RouterLink>
  </nav>
</template>

<script setup>
</script>
