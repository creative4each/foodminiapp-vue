<template>
  <h1>🧾 План покупок</h1>
  <table class="table" v-if="items.length">
    <thead>
      <tr><th>Магазин</th><th>Товар</th><th>Кол-во</th><th class="price">Сумма</th></tr>
    </thead>
    <tbody>
      <tr v-for="it in items" :key="it.id">
        <td>{{ storeName(it.store_id) }}</td>
        <td>{{ it.title }}</td>
        <td>{{ it.qty }} {{ it.unit }}</td>
        <td class="price">{{ rub(it.price * it.qty) }}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" class="price"><b>Итого:</b></td>
        <td class="price"><b>{{ rub(totalSum) }}</b></td>
      </tr>
    </tfoot>
  </table>

  <div v-else class="muted">Корзина пуста.</div>

  <div style="margin-top:16px; display:flex; gap:12px;">
    <button class="btn" @click="makePlan" :disabled="!items.length">Сохранить в заказы</button>
    <button class="btn" @click="clearAll" :disabled="!items.length">Очистить</button>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useCartStore } from '../store/cart'
import { makeOrder, loadCatalog } from '../api/googleApi'

const cart = useCartStore()
const stores = ref([])

const items = computed(()=> cart.list)
const totalSum = computed(()=> cart.totalSum)
function rub(n){ return Math.round(n) + '₽' }

function storeName(id){ return stores.value.find(s=>s.id===id)?.name || '' }

async function makePlan(){
  const payload = items.value.map(i => ({ id:i.id, qty:i.qty }))
  const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || ''
  const plan = await makeOrder(tgUserId, payload)
  alert('Заказ сохранён. Итого: ' + rub(plan.sum))
}

function clearAll(){ cart.clear() }

onMounted(async ()=>{
  const data = await loadCatalog()
  stores.value = data.stores || []
})
</script>
