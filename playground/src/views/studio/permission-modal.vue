<script setup lang="ts">
import { ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Checkbox, message } from 'antdv-next';
import { studioApi } from '#/api/studio';
const emit=defineEmits(['success']);const user=ref<any>();const tools=ref<any[]>([]);const ids=ref<number[]>([]);
const [Modal,modalApi]=useVbenModal({async onConfirm(){modalApi.lock();try{await studioApi.updateUser(user.value.id,{toolIds:ids.value});message.success('授权已更新');modalApi.close();emit('success')}finally{modalApi.lock(false)}},async onOpenChange(open){if(open){const data=modalApi.getData();user.value=data.user;tools.value=data.tools;ids.value=[...data.user.toolIds]}}});
function change(id:number,checked:boolean){ids.value=checked?[...ids.value,id]:ids.value.filter(x=>x!==id)}
defineExpose({modalApi});
</script>
<template><Modal :title="`${user?.name || ''} 的工具授权`"><div class="permission-modal"><p>勾选后该用户才可以访问对应工具。</p><Checkbox v-for="tool in tools" :key="tool.id" :checked="ids.includes(tool.id)" @change="change(tool.id,$event.target.checked)">{{tool.name}}</Checkbox></div></Modal></template>
<style scoped>.permission-modal{display:flex;flex-direction:column;gap:12px}.permission-modal p{margin:0 0 7px;color:#8796a5;font-size:12px}</style>
