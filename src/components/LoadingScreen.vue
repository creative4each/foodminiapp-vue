<template>
  <div class="loading-screen">
    <div class="loading-content">
      <!-- Аватар пользователя -->
      <div class="user-avatar-container">
        <div v-if="userPhotoUrl" class="user-avatar">
          <img :src="userPhotoUrl" alt="User avatar" />
        </div>
        <div v-else class="user-avatar-placeholder">
          <span class="avatar-emoji">{{ avatarEmoji }}</span>
        </div>
        
        <!-- Спиннер вокруг аватара -->
        <div class="loading-ring"></div>
      </div>

      <!-- Приветствие -->
      <h2 class="greeting">{{ greeting }}</h2>
      
      <!-- Статус загрузки -->
      <p class="loading-status">{{ statusText }}</p>
      
      <!-- Дополнительный спиннер (опционально) -->
      <div class="dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTelegramUser, isTelegramWebApp } from '../utils/telegram'

const telegramUser = ref(null)
const statusText = ref('Проверка авторизации...')

onMounted(() => {
  if (isTelegramWebApp()) {
    telegramUser.value = getTelegramUser()
    console.log('👤 Telegram User:', telegramUser.value)
    
    // Анимация прогресса загрузки
    const statusSequence = [
      { text: 'Проверка авторизации...', delay: 0 },
      { text: 'Подключение к серверу...', delay: 600 },
      { text: 'Загрузка каталога товаров...', delay: 1200 },
      { text: 'Подгружаем ваши данные...', delay: 1800 }
    ]
    
    statusSequence.forEach(({ text, delay }) => {
      setTimeout(() => {
        statusText.value = text
      }, delay)
    })
  } else {
    statusText.value = 'Загружаем твои данные...'
    
    // Для демо пользователя
    setTimeout(() => {
      statusText.value = 'Почти готово...'
    }, 800)
  }
})

const greeting = computed(() => {
  if (!telegramUser.value) {
    return 'Привет, неизвестный кот! 🐱'
  }
  
  const firstName = telegramUser.value.first_name || 'друг'
  return `Добрый день, ${firstName}! 👋`
})

const avatarEmoji = computed(() => {
  if (!telegramUser.value) {
    return '🐱'
  }
  return '👤'
})

// URL фото профиля (Telegram Web App API не предоставляет прямой доступ к фото)
// Используем эмодзи или placeholder
const userPhotoUrl = computed(() => {
  // Telegram WebApp API не предоставляет photo_url напрямую в initDataUnsafe
  // Можно было бы загружать через Bot API, но для простоты используем placeholder
  return null
})
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.loading-content {
  text-align: center;
  color: white;
  padding: 20px;
  max-width: 400px;
}

.user-avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 32px;
}

.user-avatar,
.user-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 2;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-emoji {
  font-size: 64px;
  line-height: 1;
}

.loading-ring {
  position: absolute;
  top: -8px;
  left: -8px;
  width: calc(100% + 16px);
  height: calc(100% + 16px);
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.8);
  border-right-color: rgba(255, 255, 255, 0.4);
  animation: spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  z-index: 1;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.greeting {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.loading-status {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 24px;
  font-weight: 400;
}

.dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
  height: 24px;
}

.dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  animation: bounce 1.4s infinite ease-in-out both;
}

.dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

