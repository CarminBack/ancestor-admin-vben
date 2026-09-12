<script setup lang="ts">
import { useVbenModal } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { studioApi } from '#/api/studio';
const emit=defineEmits(['success']);
const [Form,formApi]=useVbenForm({layout:'vertical',showDefaultActions:false,schema:[{component:'Input',fieldName:'name',label:'用户姓名',rules:'required'},{component:'Input',fieldName:'account',label:'登录账号',rules:'required'},{component:'Input',fieldName:'password',label:'初始密码',componentProps:{type:'password'},rules:'required|min:6'}]});
const [Modal,modalApi]=useVbenModal({async onConfirm(){const {valid}=await formApi.validate();if(!valid)return;modalApi.lock();try{await studioApi.createUser(await formApi.getValues());modalApi.close();emit('success')}finally{modalApi.lock(false)}},onOpenChange(open){if(open)formApi.reset()}});
defineExpose({modalApi});
</script>
<template><Modal title="新增用户"><Form /></Modal></template>
