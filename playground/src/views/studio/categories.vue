<script setup lang="ts">
import { Page, useVbenModal } from '@vben/common-ui';
import { Button, Modal, Tag } from 'antdv-next';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { studioApi } from '#/api/studio';
import CategoryForm from './category-form.vue';
const [FormModal,formModalApi]=useVbenModal({connectedComponent:CategoryForm,destroyOnClose:true});
const [Grid,gridApi]=useVbenVxeGrid({gridOptions:{columns:[{field:'name',title:'分类名称',minWidth:240},{field:'toolCount',title:'工具数量',width:150},{field:'status',title:'状态',width:120,slots:{default:'status'}},{field:'operation',title:'操作',width:120,fixed:'right',slots:{default:'action'}}],proxyConfig:{ajax:{query:async()=>{const [{categories},{tools}]=await Promise.all([studioApi.categories(),studioApi.tools()]);return {items:categories.map((name:string)=>({name,toolCount:tools.filter((t:any)=>t.category===name).length,status:1})),total:categories.length}}}},toolbarConfig:{refresh:true,zoom:true,custom:true},pagerConfig:{enabled:true}}});
async function remove(row:any){Modal.confirm({title:'删除分类',content:`确认删除分类“${row.name}”吗？`,onOk:async()=>{await studioApi.removeCategory(row.name);gridApi.query()}})}
</script>
<template><Page auto-content-height><FormModal @success="gridApi.query"/><Grid table-title="分类管理"><template #toolbar-tools><Button type="primary" @click="formModalApi.open()">新增分类</Button></template><template #status><Tag color="success">使用中</Tag></template><template #action="{row}"><Button type="link" size="small" :disabled="row.toolCount>0" @click="remove(row)">删除</Button></template></Grid></Page></template>
