<template>
  <div class="card">
    <div class="card-content">
      <div>
        <div><b>{{ item.title }}</b></div>
        <div class="muted">{{ formatPrice(item.price) }} ₽ / {{ item.unit }}</div>
      </div>
      <div class="controls">
        <!-- Предустановленные кнопки для товаров с шагом 0.1 -->
        <div v-if="step === 0.1" class="preset-buttons">
          <button class="preset-btn" @click="addAmount(0.5)">0.5</button>
          <button class="preset-btn" @click="addAmount(1)">1</button>
        </div>
        <!-- Стандартные кнопки +/- -->
        <div class="qty-controls">
          <button class="qtybtn" @click="dec">-</button>
          <div class="qty-display">{{ qty }}</div>
          <button class="qtybtn" @click="inc">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCartStore } from '../store/cart'

const props = defineProps({ item: { type:Object, required:true } })
const cart = useCartStore()

const step = computed(()=> Number(props.item?.step || 1))
const qty = computed(()=> cart.items[props.item.id]?.qty || 0)

function inc(){ cart.inc(props.item, step.value) }
function dec(){ cart.dec(props.item, step.value) }
function addAmount(amount){ cart.inc(props.item, amount) }
function formatPrice(price) {
  const rounded = Math.round(price)
  return rounded.toLocaleString('ru-RU')
}
</script>
