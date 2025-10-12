<template>
  <nav class="navbar">
    <RouterLink to="/" :class="{active: $route.path === '/'}">🛍️ Каталог</RouterLink>
    <RouterLink to="/plan" :class="{active: $route.path === '/plan'}">🧾 План</RouterLink>
  </nav>
</template>

<script setup>
</script>
