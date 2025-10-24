<template>
  <!-- Экран загрузки с плавным исчезновением -->
  <Transition name="fade">
    <LoadingScreen v-if="isLoading" />
  </Transition>
  
  <!-- Основное приложение -->
  <div v-show="!isLoading">
    <div class="container">
      <router-view />
    </div>
    <NavBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import { useCatalogStore } from './store/catalog'

const catalogStore = useCatalogStore()
const isLoading = ref(true)

onMounted(async () => {
  try {
    // Предзагрузка каталога для быстрого старта (один раз!)
    console.log('🔄 Предзагрузка данных...')
    await catalogStore.fetchCatalog()
    console.log('✅ Данные загружены')
    
    // Минимальная задержка для показа экрана загрузки
    // (чтобы пользователь успел увидеть приветствие)
    await new Promise(resolve => setTimeout(resolve, 1500))
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error)
  } finally {
    isLoading.value = false
  }
})
</script>
