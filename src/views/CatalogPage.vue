<template>
  <h1>🛒 Каталог</h1>
  <div class="stores">
    <button v-for="s in stores" :key="s.id" class="btn" @click="selectStore(s.id)">{{ s.name }}</button>
  </div>

  <div class="grid">
    <ProductCard v-for="p in filtered" :key="p.id" :item="p" />
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { loadCatalog } from '../api/googleApi'
import ProductCard from '../components/ProductCard.vue'

const stores = ref([])
const catalog = ref([])
const currentStoreId = ref(null)

function selectStore(id){ currentStoreId.value = id }

const filtered = computed(()=> catalog.value.filter(x => !currentStoreId.value || x.store_id === currentStoreId.value))

onMounted(async ()=>{
  const data = await loadCatalog()
  stores.value = data.stores || []
  catalog.value = data.catalog || []
  if (stores.value[0]) currentStoreId.value = stores.value[0].id
})
</script>
