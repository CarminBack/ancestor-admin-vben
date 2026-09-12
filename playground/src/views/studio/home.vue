<script setup lang="ts">
import type { AnalysisOverviewItem } from '@vben/common-ui';
import { onMounted, ref } from 'vue';
import { AnalysisOverview } from '@vben/common-ui';
import { SvgCardIcon } from '@vben/icons';
import { studioApi } from '#/api/studio';
import AnalyticsTrends from '../dashboard/analytics/analytics-trends.vue';
const overviewItems=ref<AnalysisOverviewItem[]>([{icon:SvgCardIcon,title:'用户量',totalTitle:'当前用户总量',totalValue:0,value:0}]);
onMounted(async()=>{const count=(await studioApi.users()).users.length;overviewItems.value=[{icon:SvgCardIcon,title:'用户量',totalTitle:'当前用户总量',totalValue:count,value:count}]});
</script>
<template><div class="p-5"><AnalysisOverview :items="overviewItems"/><div class="mt-5"><AnalyticsTrends/></div></div></template>
