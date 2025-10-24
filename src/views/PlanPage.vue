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
      <table class="table plan-table">
        <tbody>
          <tr 
            v-for="it in group.items" 
            :key="it.id" 
            :class="{ 
              removing: removingItems.has(it.id),
              checked: checkedItems.has(it.id)
            }"
          >
            <td class="checkbox-col">
              <div 
                class="custom-checkbox" 
                @click="toggleCheck(it.id)"
                :class="{ checked: checkedItems.has(it.id) }"
              >
                <span v-if="checkedItems.has(it.id)" class="inner-circle"></span>
              </div>
            </td>
            <td>{{ it.title }}</td>
            <td>{{ it.qty }} {{ it.unit }}</td>
            <td class="price">{{ rub(it.price * it.qty) }}</td>
            <td class="action-col">
              <button 
                class="delete-btn" 
                @click="removeItem(it.id)"
                title="Удалить"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2"><b>Итого по магазину:</b></td>
            <td class="price"><b>{{ kg(group.weight) }}</b></td>
            <td class="price" colspan="2"><b>{{ rub(group.sum) }}</b></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Общий итог -->
    <div class="total-summary">
      <div class="total-row">
        <span><b>ИТОГО:</b></span>
        <span class="total-details">
          <span><b>{{ kg(totalWeight) }}</b></span>
          <span style="margin: 0 8px;">•</span>
          <span><b>{{ rub(totalSum) }}</b></span>
        </span>
      </div>
    </div>
  </div>

  <div v-else class="muted">Корзина пуста.</div>

  <div style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
    <button class="btn" @click="showSaveListModal = true" :disabled="!groupedItems.length">💾 Сохранить как список</button>
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

  <!-- Модальное окно подтверждения перезаписи списка -->
  <div v-if="showOverwriteModal" class="modal-overlay" @click="closeOverwriteModal">
    <div class="modal-content" @click.stop>
      <h3>⚠️ Список уже существует</h3>
      <p style="margin-bottom: 16px;">
        Список с названием <b>"{{ newListName }}"</b> уже существует.
      </p>
      <p class="muted" style="margin-bottom: 20px;">
        Хотите обновить его текущими товарами?
      </p>
      <div class="modal-actions">
        <button class="btn primary" @click="confirmOverwrite">Обновить</button>
        <button class="btn" @click="closeOverwriteModal">Отменить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useCartStore } from '../store/cart'
import { useCatalogStore } from '../store/catalog'
import { makeOrder, createList, updateList } from '../api/googleApi'
import { getTelegramUserId } from '../utils/telegram'

const cart = useCartStore()
const catalogStore = useCatalogStore()
const stores = ref([])
const removingItems = ref(new Set())
const checkedItems = ref(new Set()) // Отмеченные как купленные товары
const showSaveListModal = ref(false)
const showOverwriteModal = ref(false)
const newListName = ref('')
const userListsCount = ref(0)
const existingListToUpdate = ref(null) // Хранит существующий список для обновления

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
    
    // Считаем вес по магазину
    const weight = sortedItems.reduce((acc, item) => {
      const qty = Number(item.qty || 0)
      if (item.unit === 'кг') return acc + qty
      const w = Number(item.weight_per_unit || 0)
      return acc + (w ? qty * w : 0)
    }, 0)
    
    result.push({
      storeId,
      storeName: storeName(storeId),
      items: sortedItems,
      sum,
      weight
    })
  }
  
  // Сортируем магазины по названию
  return result.sort((a, b) => a.storeName.localeCompare(b.storeName, 'ru'))
})

const totalSum = computed(()=> cart.totalSum)
const totalWeight = computed(() => cart.totalWeightKg)
function rub(n){ 
  const rounded = Math.round(n)
  return rounded.toLocaleString('ru-RU') + ' ₽'
}
function kg(n){ return n.toFixed(2) + ' кг' }

function storeName(id){ return stores.value.find(s=>s.id===id)?.name || '' }

function toggleCheck(itemId) {
  // Переключаем состояние чекбокса
  if (checkedItems.value.has(itemId)) {
    checkedItems.value.delete(itemId)
  } else {
    checkedItems.value.add(itemId)
  }
}

function removeItem(itemId) {
  // Добавляем товар в список удаляемых (для визуального эффекта)
  removingItems.value.add(itemId)
  
  // Также убираем из отмеченных, если был отмечен
  checkedItems.value.delete(itemId)
  
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

function clearAll(){ 
  cart.clear()
  checkedItems.value.clear()
}

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
    
    // Проверяем, существует ли список с таким именем у ТЕКУЩЕГО пользователя (используем кэш)
    const existingLists = await catalogStore.fetchUserLists()
    console.log(`📋 Полученные списки для пользователя ${tgUserId}:`, existingLists)
    
    // Выводим детальную информацию о каждом списке
    existingLists?.forEach((list, index) => {
      console.log(`📝 Список ${index + 1}:`, {
        list_id: list.list_id,
        list_name: list.list_name,
        list_name_type: typeof list.list_name
      })
    })
    
    const existingList = existingLists?.find(list => {
      const name = list.list_name
      // Приводим оба значения к строке для сравнения (на случай если list_name - число)
      const nameStr = String(name || '').trim()
      const searchStr = listName.trim()
      return nameStr === searchStr
    })
    
    console.log('🔍 Ищем список с именем:', listName)
    console.log('🔍 Найденный список:', existingList)
    
    if (existingList) {
      // Список с таким именем уже существует - показываем предупреждение
      console.log('⚠️ Список с таким именем уже существует:', existingList.list_id)
      existingListToUpdate.value = existingList
      showSaveListModal.value = false
      showOverwriteModal.value = true
      return
    }
    
    // Создаём новый список
    let response
    {
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
      // Инвалидируем кэш списков, чтобы обновить при следующем обращении
      catalogStore.invalidateLists()
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

function closeOverwriteModal() {
  showOverwriteModal.value = false
  existingListToUpdate.value = null
  // Возвращаем пользователя к модальному окну сохранения
  showSaveListModal.value = true
}

async function confirmOverwrite() {
  try {
    const allItems = groupedItems.value.flatMap(group => group.items)
    const payload = allItems.map(i => ({ id: i.id, qty: i.qty }))
    const listName = newListName.value.trim()
    
    console.log('📝 Обновление существующего списка:', existingListToUpdate.value.list_id)
    
    const response = await updateList(
      existingListToUpdate.value.list_id,
      listName,
      payload,
      totalSum.value,
      cart.totalWeightKg
    )
    
    if (response && response.success) {
      alert(`Список "${listName}" обновлён!`)
      showOverwriteModal.value = false
      existingListToUpdate.value = null
      newListName.value = ''
      // Инвалидируем кэш списков
      catalogStore.invalidateLists()
      await checkUserListsCount()
    } else if (response && response.error) {
      alert(`Ошибка: ${response.error}`)
    } else {
      alert('Не удалось обновить список')
    }
  } catch (error) {
    console.error('Ошибка обновления списка:', error)
    alert(`Ошибка при обновлении списка: ${error.message}`)
  }
}

async function checkUserListsCount() {
  try {
    // Используем кэшированные списки
    const lists = await catalogStore.fetchUserLists()
    userListsCount.value = lists?.length || 0
    console.log(`📊 У пользователя списков:`, userListsCount.value)
  } catch (error) {
    console.error('Ошибка проверки количества списков:', error)
  }
}

onMounted(async ()=>{
  // Используем закэшированные данные
  await catalogStore.fetchCatalog()
  stores.value = catalogStore.stores
  await checkUserListsCount()
})
</script>
