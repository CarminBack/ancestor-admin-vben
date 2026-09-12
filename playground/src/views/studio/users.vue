<script setup lang="ts">
import { ref } from 'vue';
import { Page, useVbenModal } from '@vben/common-ui';
import { Button, Modal, Tag } from 'antdv-next';
import { useVbenVxeGrid, VbenTableAction } from '#/adapter/vxe-table';
import { studioApi } from '#/api/studio';
import PermissionModal from './permission-modal.vue';
import UserForm from './user-form.vue';
const tools=ref<any[]>([]);
const [FormModal,formModalApi]=useVbenModal({connectedComponent:UserForm,destroyOnClose:true});
const [PermissionDialog,permissionApi]=useVbenModal({connectedComponent:PermissionModal,destroyOnClose:true});
const [Grid,gridApi]=useVbenVxeGrid({gridOptions:{columns:[{field:'name',title:'用户姓名',minWidth:150},{field:'email',title:'登录邮箱',minWidth:220},{field:'roleLabel',title:'角色',width:120},{field:'auditStatus',title:'审批状态',width:120,slots:{default:'audit'}},{field:'permissionCount',title:'授权工具',width:130,slots:{default:'permission'}},{field:'enabled',title:'状态',width:100,slots:{default:'status'}},{field:'operation',title:'操作',width:250,fixed:'right',slots:{default:'action'}}],proxyConfig:{ajax:{query:async()=>{const [u,t]=await Promise.all([studioApi.users(),studioApi.tools()]);tools.value=t.tools;return {items:u.users.map((x:any)=>({...x,roleLabel:x.role==='admin'?'超级管理员':'普通用户',auditStatus:x.role==='admin'?'已通过':(x.enabled?'已通过':'待审批'),permissionCount:x.role==='admin'?'全部工具':`${x.toolIds.length} 个工具`})),total:u.users.length}}}},toolbarConfig:{refresh:true,zoom:true,custom:true},pagerConfig:{enabled:true}}});
async function toggle(row:any){await studioApi.updateUser(row.id,{enabled:!row.enabled});gridApi.query()};async function approve(row:any){await studioApi.approveUser(row.id);gridApi.query()};async function remove(row:any){Modal.confirm({title:'删除用户',content:`确定删除“${row.name}”吗？`,onOk:async()=>{await studioApi.removeUser(row.id);gridApi.query()}})}
function openPermissions(row:any){permissionApi.setData({user:row,tools:tools.value}).open()}
</script>
<template><Page auto-content-height><FormModal @success="gridApi.query"/><PermissionDialog @success="gridApi.query"/><Grid table-title="用户管理"><template #toolbar-tools><Button type="primary" @click="formModalApi.open()">新增用户</Button></template><template #audit="{row}"><Tag :color="row.auditStatus==='已通过'?'success':'warning'">{{row.auditStatus}}</Tag></template><template #permission="{row}"><Button type="link" size="small" @click="openPermissions(row)">{{row.permissionCount}}　⚙</Button></template><template #status="{row}"><Tag :color="row.enabled?'success':'error'">{{row.enabled?'正常':'停用'}}</Tag></template><template #action="{row}"><VbenTableAction :actions="[{text:'审批通过',icon:'lucide:check-circle-2',disabled:row.enabled,onClick:()=>approve(row)},{text:'切换状态',onClick:()=>toggle(row)},{text:'删除',danger:true,onClick:()=>remove(row)}]"/></template></Grid></Page></template>
