<template>
  <nav class="navbar">
    <RouterLink to="/" :class="{active: $route.path === '/'}">
      <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="label">Каталог</span>
    </RouterLink>
    <RouterLink to="/plan" :class="{active: $route.path === '/plan'}">
      <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="label">План</span>
    </RouterLink>
    <RouterLink to="/lists" :class="{active: $route.path === '/lists'}">
      <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="label">Списки</span>
    </RouterLink>
  </nav>
</template>

<script setup>
</script>

<style scoped>
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  background: #ffffff;
  border-top: 1px solid #e5e5ea;
  padding: 18px 0 max(12px, env(safe-area-inset-bottom));
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.navbar a {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
  text-decoration: none;
  color: #8e8e93;
  flex: 1;
  padding: 0;
  transition: color 0.2s ease, opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
  transform: translateY(-16px);
}

.icon {
  width: 24px;
  height: 24px;
  color: #8e8e93;
  transition: color 0.2s ease;
}

.navbar a.active .icon {
  color: #007aff;
}

.label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: -0.2px;
  margin-top: 0px;
}

.navbar a.active {
  color: #007aff;
}

.navbar a.active .label {
  font-weight: 600;
}

/* Анимация при нажатии */
.navbar a:active {
  opacity: 0.6;
}
</style>
