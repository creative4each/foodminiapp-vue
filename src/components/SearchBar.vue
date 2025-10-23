<template>
  <div class="search-container">
    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        v-model="searchQuery"
        @input="handleInput"
        placeholder="Поиск ингредиентов..."
        class="search-input"
      />
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="clear-btn"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const searchQuery = ref('')
const emit = defineEmits(['search'])

function handleInput() {
  emit('search', searchQuery.value)
}

function clearSearch() {
  searchQuery.value = ''
  emit('search', '')
}
</script>
