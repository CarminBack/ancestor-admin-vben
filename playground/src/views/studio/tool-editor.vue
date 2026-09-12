<script setup lang="ts">
import { ref } from 'vue';
import { useVbenDrawer } from '@vben/common-ui';
import { Input, Select, message } from 'antdv-next';
import { studioApi } from '#/api/studio';
const emit=defineEmits(['success']); const tool=ref<any>(); const file=ref<File>(); const categoryOptions=ref<any[]>([]);
const [Drawer,drawerApi]=useVbenDrawer({async onConfirm(){drawerApi.lock();try{await studioApi.updateTool(tool.value.id,tool.value);if(file.value){await studioApi.uploadTool(tool.value.id,file.value);file.value=undefined}message.success('工具项目配置已保存');drawerApi.close();emit('success')}finally{drawerApi.lock(false)}},async onOpenChange(open){if(open){tool.value=JSON.parse(JSON.stringify(drawerApi.getData()));file.value=undefined;categoryOptions.value=(await studioApi.categories()).categories.map((name:string)=>({label:name,value:name}))}}});
function choose(e:any){file.value=e.target.files?.[0]}
defineExpose({drawerApi});
</script>
<template><Drawer title="编辑工具"><div v-if="tool" class="editor"><label>工具名称<Input v-model:value="tool.name" /></label><label>所属分类<Select v-model:value="tool.category" :options="categoryOptions" /></label><label>功能标签<Input v-model:value="tool.tag" /></label><label>系统访问地址<Input :value="`/tools/${tool.id}/`" disabled /></label><label>网页包<div class="upload-box"><input type="file" accept=".zip,application/zip,application/x-zip-compressed" @change="choose"><span>{{file?.name || (tool.packagePath ? '已上传网页包，可重新上传' : '选择 ZIP 网页包')}}</span></div></label></div></Drawer></template>
<style scoped>.editor{display:flex;flex-direction:column;gap:14px}.editor label{color:#687e93;font-size:12px}.editor label>:deep(.ant-input),.editor label>.upload-box{margin-top:6px}.upload-box{display:flex;align-items:center;gap:10px;padding:11px;border:1px dashed #b8d3eb;border-radius:6px;color:#7c92a5;background:#f8fbfe;font-size:11px}.upload-box input{width:86px}.section-title{display:flex;align-items:center;justify-content:space-between;margin-top:8px}.section-row{display:grid;grid-template-columns:1fr 1.5fr auto auto;gap:6px;align-items:center}</style>
