<template>
  <h1>📝 Мои списки</h1>

  <!-- Анимация загрузки списков -->
  <div v-if="loading" class="loading-overlay">
    <div class="spinner"></div>
    <p class="loading-text">Загрузка списков...</p>
  </div>

  <div v-else-if="lists.length === 0" class="empty-state">
    <div class="empty-icon">📋</div>
    <p class="muted">У вас пока нет сохранённых списков</p>
    <p class="muted" style="font-size: 13px;">Создайте список на странице "План покупок"</p>
  </div>

  <div v-else class="lists-container">
    <div v-for="list in sortedLists" :key="list.list_id" class="list-card">
      <div class="list-header">
        <div class="list-title">
          <span class="list-icon">📝</span>
          <span>{{ list.list_name }}</span>
        </div>
        <div class="list-meta">
          <span class="list-date">{{ formatDate(list.created_at) }}</span>
        </div>
      </div>
      
      <div class="list-info">
        <div class="info-item">
          <span class="info-label">Товаров:</span>
          <span class="info-value">{{ getItemsCount(list) }} шт.</span>
        </div>
        <div class="info-item">
          <span class="info-label">Сумма:</span>
          <span class="info-value">{{ rub(list.sum) }}</span>
        </div>
      </div>

      <div class="list-actions">
        <button class="action-btn primary" @click="loadListToCart(list.list_id)">
          Загрузить
        </button>
        <button class="action-btn secondary" @click="editList(list)">
          Переименовать
        </button>
        <button class="action-btn danger" @click="confirmDelete(list)">
          Удалить
        </button>
      </div>
    </div>
  </div>

  <!-- Модальное окно для переименования -->
  <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
    <div class="modal-content" @click.stop>
      <h3>Переименовать список</h3>
      <input 
        v-model="editingListName" 
        type="text" 
        class="modal-input"
        placeholder="Новое название списка"
        maxlength="50"
      />
      <div class="modal-actions">
        <button class="btn" @click="saveEdit">Сохранить</button>
        <button class="btn" @click="closeEditModal">Отмена</button>
      </div>
    </div>
  </div>

  <!-- Модальное окно подтверждения удаления -->
  <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
    <div class="modal-content" @click.stop>
      <h3>Удалить список?</h3>
      <p>Вы уверены, что хотите удалить список "{{ deletingList?.list_name }}"?</p>
      <div class="modal-actions">
        <button class="btn danger" @click="performDelete">Удалить</button>
        <button class="btn" @click="closeDeleteModal">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { deleteList as apiDeleteList, updateList, loadList } from '../api/googleApi'
import { useCartStore } from '../store/cart'
import { useCatalogStore } from '../store/catalog'
import { getTelegramUserId } from '../utils/telegram'

const router = useRouter()
const cart = useCartStore()
const catalogStore = useCatalogStore()

const lists = ref([])
const loading = ref(true)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingList = ref(null)
const editingListName = ref('')
const deletingList = ref(null)

const sortedLists = computed(() => {
  return [...lists.value].sort((a, b) => {
    const dateA = new Date(a.created_at || 0)
    const dateB = new Date(b.created_at || 0)
    return dateB - dateA // новые сверху
  })
})

onMounted(async () => {
  await loadLists()
})

async function loadLists() {
  loading.value = true
  try {
    // Используем кэшированные данные
    lists.value = await catalogStore.fetchUserLists()
  } catch (error) {
    console.error('Ошибка загрузки списков:', error)
    alert('Не удалось загрузить списки')
  } finally {
    loading.value = false
  }
}

function getItemsCount(list) {
  try {
    const items = JSON.parse(list.items_json || '[]')
    return items.length
  } catch {
    return 0
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Сегодня'
  if (diffDays === 1) return 'Вчера'
  if (diffDays < 7) return `${diffDays} дн. назад`
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function rub(n) {
  const rounded = Math.round(n)
  return rounded.toLocaleString('ru-RU') + ' ₽'
}

async function loadListToCart(listId) {
  // Устанавливаем флаг загрузки (напрямую в state)
  cart.isLoadingList = true
  
  // Моментально переходим на страницу плана (пользователь сразу видит действие)
  router.push('/plan')
  
  // Загрузка в фоне
  try {
    const response = await loadList(listId)
    const list = response.list
    
    if (!list || !list.items) {
      alert('Ошибка загрузки списка')
      cart.isLoadingList = false
      return
    }
    
    // Очищаем корзину
    cart.clear()
    
    // Используем закэшированный каталог
    await catalogStore.fetchCatalog()
    const catalogMap = {}
    catalogStore.catalog.forEach(item => {
      catalogMap[item.id] = item
    })
    
    // Добавляем товары в корзину
    let loadedCount = 0
    list.items.forEach(item => {
      const catalogItem = catalogMap[item.id]
      if (catalogItem) {
        cart.setFromCatalogItem(catalogItem, item.qty)
        loadedCount++
      }
    })
    
    console.log(`✅ Загружено товаров: ${loadedCount}`)
  } catch (error) {
    console.error('Ошибка загрузки списка:', error)
    alert('Не удалось загрузить список в корзину')
  } finally {
    // Сбрасываем флаг загрузки
    cart.isLoadingList = false
  }
}

function editList(list) {
  editingList.value = list
  editingListName.value = list.list_name
  showEditModal.value = true
}

async function saveEdit() {
  if (!editingListName.value.trim()) {
    alert('Введите название списка')
    return
  }
  
  try {
    await updateList(
      editingList.value.list_id,
      editingListName.value.trim(),
      undefined, // items не меняем
      undefined, // sum не меняем
      undefined  // weight не меняем
    )
    
    // Обновляем в кэше
    const updatedList = { ...editingList.value, list_name: editingListName.value.trim() }
    catalogStore.updateListInCache(updatedList)
    lists.value = catalogStore.userLists
    
    closeEditModal()
  } catch (error) {
    console.error('Ошибка обновления списка:', error)
    alert('Не удалось обновить список')
  }
}

function closeEditModal() {
  showEditModal.value = false
  editingList.value = null
  editingListName.value = ''
}

function confirmDelete(list) {
  deletingList.value = list
  showDeleteModal.value = true
}

async function performDelete() {
  try {
    await apiDeleteList(deletingList.value.list_id)
    
    // Удаляем из кэша
    catalogStore.removeListFromCache(deletingList.value.list_id)
    lists.value = catalogStore.userLists
    
    closeDeleteModal()
  } catch (error) {
    console.error('Ошибка удаления списка:', error)
    alert('Не удалось удалить список')
  }
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingList.value = null
}
</script>

