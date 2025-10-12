<template>
  <h1>🛒 Каталог</h1>

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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { loadCatalog } from '../api/googleApi'
import ProductCard from '../components/ProductCard.vue'

const mode = ref('stores') // режим: 'stores' | 'categories'
const stores = ref([])
const categories = ref([])
const catalog = ref([])
const activeId = ref(null)

onMounted(async () => {
  const data = await loadCatalog()
  stores.value = data.stores || []
  categories.value = data.categories || [] // ← теперь загружаем категории
  catalog.value = data.catalog || []

  if (mode.value === 'stores' && stores.value[0]) activeId.value = stores.value[0].id
  if (mode.value === 'categories' && categories.value[0]) activeId.value = categories.value[0].id
})

function switchMode(m) {
  mode.value = m
  const src = m === 'stores' ? stores.value : categories.value
  activeId.value = src[0]?.id || null
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
  if (!activeId.value) return []
  if (mode.value === 'stores') {
    return catalog.value.filter(x => x.store_id === activeId.value)
  } else {
    // поддержка category_id и category (текстового)
    return catalog.value.filter(
      x =>
        x.category_id === activeId.value ||
        x.category === activeCategoryName.value
    )
  }
})
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.tabs button {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 8px 10px;
  background: var(--tg-theme-secondary-bg-color, #fff);
  cursor: pointer;
}
.tabs button.active {
  background: var(--tg-theme-link-color, #0ea5e9);
  color: #fff;
  border-color: transparent;
}
.btn.active {
  outline: 2px solid var(--tg-theme-link-color, #0ea5e9);
}
</style>
