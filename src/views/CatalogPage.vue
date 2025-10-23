<template>
  <h1>Список покупок</h1>

  <!-- Анимация загрузки каталога -->
  <div v-if="loading" class="loading-overlay">
    <div class="spinner"></div>
    <p class="loading-text">Загрузка каталога...</p>
  </div>

  <template v-else>
    <!-- 🔹 Поиск -->
    <SearchBar @search="handleSearch" />

    <!-- 🔹 Вкладки "Магазины / Категории" -->
    <div class="tabs">
      <button
        :class="{ active: mode === 'stores' }"
        @click="switchMode('stores')"
      >
        🏬 Магазины
      </button>
      <button
        :class="{ active: mode === 'categories' }"
        @click="switchMode('categories')"
      >
        📦 Категории
      </button>
    </div>

    <!-- 🔹 Кнопки магазинов или категорий -->
    <div class="stores">
      <button
        v-for="opt in options"
        :key="opt.id"
        class="btn"
        :class="{ active: opt.id === activeId }"
        @click="activeId = opt.id"
      >
        {{ opt.name }}
      </button>
    </div>

    <!-- 🔹 Сетка товаров -->
    <div class="grid">
      <ProductCard v-for="p in filtered" :key="p.id" :item="p" />
    </div>
  </template>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { loadCatalog } from '../api/googleApi'
import ProductCard from '../components/ProductCard.vue'
import SearchBar from '../components/SearchBar.vue'

const mode = ref('stores') // режим: 'stores' | 'categories'
const stores = ref([])
const categories = ref([])
const catalog = ref([])
const activeId = ref(null)
const searchQuery = ref('')
const loading = ref(true) // флаг загрузки каталога

onMounted(async () => {
  try {
    const data = await loadCatalog()
    stores.value = data.stores || []
    categories.value = data.categories || [] // ← теперь загружаем категории
    catalog.value = data.catalog || []

    if (mode.value === 'stores' && stores.value[0]) activeId.value = stores.value[0].id
    if (mode.value === 'categories' && categories.value[0]) activeId.value = categories.value[0].id
  } finally {
    loading.value = false
  }
})

function switchMode(m) {
  mode.value = m
  const src = m === 'stores' ? stores.value : categories.value
  activeId.value = src[0]?.id || null
}

function handleSearch(query) {
  searchQuery.value = query
}

// Опции для кнопок
const options = computed(() => (mode.value === 'stores' ? stores.value : categories.value))

// Имя активной категории (если в catalog нет category_id, но есть category)
const activeCategoryName = computed(() => {
  if (mode.value !== 'categories') return ''
  return categories.value.find(c => c.id === activeId.value)?.name || ''
})

// Фильтрация товаров
const filtered = computed(() => {
  let result = catalog.value

  // Если есть поисковый запрос, фильтруем по всем товарам
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(x => 
      x.title?.toLowerCase().includes(query)
    )
  } else {
    // Иначе фильтруем по активному магазину/категории
    if (!activeId.value) return []
    if (mode.value === 'stores') {
      result = result.filter(x => x.store_id === activeId.value)
    } else {
      // поддержка category_id и category (текстового)
      result = result.filter(
        x =>
          x.category_id === activeId.value ||
          x.category === activeCategoryName.value
      )
    }
  }
  
  // Сортировка по алфавиту
  return result.sort((a, b) => {
    const titleA = a.title?.toLowerCase() || ''
    const titleB = b.title?.toLowerCase() || ''
    return titleA.localeCompare(titleB, 'ru')
  })
})
</script>
