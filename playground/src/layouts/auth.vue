<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';


const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const clickLogo = () => {};
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :page-description="'祭祀服务与订单管理'"
    :page-title="'祭祖管理后台'"
    :click-logo="clickLogo"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
