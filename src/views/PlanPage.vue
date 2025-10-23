<template>
  <h1>🧾 План покупок</h1>
  
  <!-- Анимация загрузки списка -->
  <div v-if="cart.isLoadingList" class="loading-overlay">
    <div class="spinner"></div>
    <p class="loading-text">Загрузка списка...</p>
  </div>
  
  <div v-if="groupedItems.length">
    <!-- Группы товаров по магазинам -->
    <div v-for="group in groupedItems" :key="group.storeId" class="store-group">
      <h3 class="store-header">{{ group.storeName }}</h3>
      <table class="table">
        <thead>
          <tr><th>Товар</th><th>Кол-во</th><th class="price">Сумма</th></tr>
        </thead>
        <tbody>
          <tr v-for="it in group.items" :key="it.id" :class="{ removing: removingItems.has(it.id) }">
            <td class="clickable-item" @click="removeItem(it.id)">{{ it.title }}</td>
            <td>{{ it.qty }} {{ it.unit }}</td>
            <td class="price">{{ rub(it.price * it.qty) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td class="price"><b>Итого по магазину:</b></td>
            <td colspan="2" class="price"><b>{{ rub(group.sum) }}</b></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Общий итог -->
    <div class="total-summary">
      <div class="total-row">
        <span><b>ИТОГО:</b></span>
        <span><b>{{ rub(totalSum) }}</b></span>
      </div>
    </div>
  </div>

  <div v-else class="muted">Корзина пуста.</div>

  <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
    <button class="btn" @click="showSaveListModal = true" :disabled="!groupedItems.length">💾 Сохранить как список</button>
    <button class="btn" @click="makePlan" :disabled="!groupedItems.length">Сохранить в заказы</button>
    <button class="btn" @click="clearAll" :disabled="!groupedItems.length">Очистить</button>
  </div>

  <!-- Модальное окно для сохранения списка -->
  <div v-if="showSaveListModal" class="modal-overlay" @click="closeSaveListModal">
    <div class="modal-content" @click.stop>
      <h3>Сохранить список</h3>
      <p class="muted" style="margin-bottom: 12px;">
        Введите название для списка:
      </p>
      <input 
        v-model="newListName" 
        type="text" 
        class="modal-input"
        placeholder="Например: Недельные покупки"
        maxlength="50"
        @keyup.enter="saveAsList"
      />
      <div class="modal-actions">
        <button class="btn" @click="saveAsList" :disabled="!newListName.trim()">Сохранить</button>
        <button class="btn" @click="closeSaveListModal">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useCartStore } from '../store/cart'
import { makeOrder, loadCatalog, createList, getLists, updateList } from '../api/googleApi'
import { getTelegramUserId } from '../utils/telegram'

const cart = useCartStore()
const stores = ref([])
const removingItems = ref(new Set())
const showSaveListModal = ref(false)
const newListName = ref('')
const userListsCount = ref(0)

// Группировка товаров по магазинам с сортировкой
const groupedItems = computed(() => {
  const grouped = cart.groupedByStore
  const result = []
  
  for (const storeId in grouped) {
    // Сортируем товары внутри магазина по алфавиту
    const sortedItems = [...grouped[storeId]].sort((a, b) => {
      const titleA = a.title?.toLowerCase() || ''
      const titleB = b.title?.toLowerCase() || ''
      return titleA.localeCompare(titleB, 'ru')
    })
    
    // Считаем сумму по магазину
    const sum = sortedItems.reduce((acc, item) => acc + (item.price * item.qty), 0)
    
    result.push({
      storeId,
      storeName: storeName(storeId),
      items: sortedItems,
      sum
    })
  }
  
  // Сортируем магазины по названию
  return result.sort((a, b) => a.storeName.localeCompare(b.storeName, 'ru'))
})

const totalSum = computed(()=> cart.totalSum)
function rub(n){ return Math.round(n) + '₽' }

function storeName(id){ return stores.value.find(s=>s.id===id)?.name || '' }

function removeItem(itemId) {
  // Добавляем товар в список удаляемых (для визуального эффекта)
  removingItems.value.add(itemId)
  
  // Через 0.5 секунды удаляем товар из корзины
  setTimeout(() => {
    cart.remove(itemId)
    removingItems.value.delete(itemId)
  }, 500)
}

async function makePlan(){
  // Собираем все товары из всех групп
  const allItems = groupedItems.value.flatMap(group => group.items)
  const payload = allItems.map(i => ({ id:i.id, qty:i.qty }))
  const tgUserId = getTelegramUserId()
  const plan = await makeOrder(tgUserId, payload)
  alert('Заказ сохранён. Итого: ' + rub(plan.sum))
}

function clearAll(){ cart.clear() }

async function saveAsList() {
  if (!newListName.value.trim()) {
    alert('Введите название списка')
    return
  }

  try {
    const allItems = groupedItems.value.flatMap(group => group.items)
    const payload = allItems.map(i => ({ id: i.id, qty: i.qty }))
    const tgUserId = getTelegramUserId()
    const listName = newListName.value.trim()
    
    console.log('🔵 Сохранение списка:', {
      userId: tgUserId,
      listName: listName,
      itemsCount: payload.length,
      sum: totalSum.value,
      weight: cart.totalWeightKg,
      isTelegram: window.Telegram?.WebApp ? 'да' : 'нет'
    })
    
    // Проверяем, существует ли список с таким именем
    const existingListsResponse = await getLists(tgUserId)
    console.log('📋 Полученные списки:', existingListsResponse.lists)
    
    // Выводим детальную информацию о каждом списке
    existingListsResponse.lists?.forEach((list, index) => {
      console.log(`📝 Список ${index + 1}:`, {
        list_id: list.list_id,
        list_name: list.list_name,
        list_name_type: typeof list.list_name
      })
    })
    
    const existingList = existingListsResponse.lists?.find(list => {
      const name = list.list_name
      // Приводим оба значения к строке для сравнения (на случай если list_name - число)
      const nameStr = String(name || '').trim()
      const searchStr = listName.trim()
      return nameStr === searchStr
    })
    
    console.log('🔍 Ищем список с именем:', listName)
    console.log('🔍 Найденный список:', existingList)
    
    let response
    if (existingList) {
      // Обновляем существующий список (лимит не проверяем)
      console.log('📝 Обновление существующего списка:', existingList.list_id)
      response = await updateList(
        existingList.list_id,
        listName,
        payload,
        totalSum.value,
        cart.totalWeightKg
      )
      if (response && response.success) {
        alert(`Список "${listName}" обновлён!`)
      }
    } else {
      // Создаём новый список - проверяем лимит
      if (userListsCount.value >= 5) {
        alert('У вас уже 5 списков (максимум). Удалите старый список или обновите существующий.')
        return
      }
      
      console.log('✨ Создание нового списка')
      response = await createList(
        tgUserId,
        listName,
        payload,
        totalSum.value,
        cart.totalWeightKg
      )
      if (response && response.success) {
        alert(`Список "${listName}" сохранён!\nНайдёте его во вкладке "Списки"`)
      }
    }
    
    console.log('Ответ от API:', response)
    
    if (response && response.success) {
      closeSaveListModal()
      // Обновляем счетчик списков после успешного сохранения
      await checkUserListsCount()
    } else if (response && response.error) {
      alert(`Ошибка: ${response.error}`)
    } else {
      alert('Не удалось сохранить список. Проверьте консоль.')
      console.error('Неожиданный ответ:', response)
    }
  } catch (error) {
    console.error('Ошибка сохранения списка:', error)
    alert(`Ошибка при сохранении списка: ${error.message}`)
  }
}

function closeSaveListModal() {
  showSaveListModal.value = false
  newListName.value = ''
}

async function checkUserListsCount() {
  try {
    const tgUserId = getTelegramUserId()
    const response = await getLists(tgUserId)
    userListsCount.value = response.lists?.length || 0
    console.log(`📊 У пользователя ${tgUserId} списков:`, userListsCount.value)
  } catch (error) {
    console.error('Ошибка проверки количества списков:', error)
  }
}

onMounted(async ()=>{
  const data = await loadCatalog()
  stores.value = data.stores || []
  await checkUserListsCount()
})
</script>
