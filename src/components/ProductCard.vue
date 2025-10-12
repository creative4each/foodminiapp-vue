<template>
  <div class="card">
    <div class="row" style="justify-content:space-between;">
      <div>
        <div><b>{{ item.title }}</b></div>
        <div class="muted">{{ item.price }}₽ / {{ item.unit }}</div>
      </div>
      <div class="row">
        <button class="qtybtn" @click="dec">-</button>
        <div>{{ qty }}</div>
        <button class="qtybtn" @click="inc">+</button>
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
</script>
