<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openCustomerServiceModal } from '@/utils/customerService'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const url = route.query.url as string | undefined
  openCustomerServiceModal(url ? { url } : undefined)
  router.replace('/')
})
</script>

<template>
  <div />
</template>
