<script setup lang="ts">
import { useVbenDrawer, useVbenModal, Page } from '@vben/common-ui';
import { Button, Modal, Tag, message } from 'antdv-next';
import { useVbenVxeGrid, VbenTableAction } from '#/adapter/vxe-table';
import { studioApi } from '#/api/studio';
import ToolForm from './tool-form.vue';
import ToolEditor from './tool-editor.vue';
import type { StudioTool } from '#/api/studio';
const [ToolModal,toolModalApi]=useVbenModal({connectedComponent:ToolForm,destroyOnClose:true});
const [EditorDrawer,editorDrawerApi]=useVbenDrawer({connectedComponent:ToolEditor,destroyOnClose:true});
const [Grid,gridApi]=useVbenVxeGrid({gridOptions:{columns:[{field:'name',title:'工具名称',minWidth:180},{field:'category',title:'分类',width:140},{field:'tag',title:'标签',width:140},{field:'status',title:'推荐状态',width:110},{field:'enabled',title:'状态',width:110,slots:{default:'status'}},{field:'projectPath',title:'项目路径',minWidth:180},{field:'operation',title:'操作',width:190,fixed:'right',slots:{default:'action'}}],proxyConfig:{ajax:{query:async()=>{const {tools}=await studioApi.tools();return {items:tools.map((t:StudioTool)=>({...t,projectPath:`/tools/${t.id}/`})),total:tools.length}}}},toolbarConfig:{refresh:true,zoom:true,custom:true},pagerConfig:{enabled:true}}});
async function toggle(row:any){await studioApi.updateTool(row.id,{enabled:!row.enabled});gridApi.query()}
function edit(row:any){editorDrawerApi.setData(row).open()}
function remove(row:any){Modal.confirm({title:'删除工具',content:`确认删除“${row.name}”吗？网页包和用户授权也会一并删除。`,okType:'danger',onOk:async()=>{try{await studioApi.removeTool(row.id);message.success('工具已删除');gridApi.query()}catch(error){message.error(error instanceof Error?error.message:'删除工具失败');throw error}}})}
</script>
<template><Page auto-content-height><ToolModal @success="gridApi.query"/><EditorDrawer @success="gridApi.query"/><Grid table-title="工具与权限"><template #toolbar-tools><Button type="primary" @click="toolModalApi.open()">新增工具</Button><Button @click="gridApi.query()">刷新</Button></template><template #status="{row}"><Tag :color="row.enabled?'success':'error'">{{row.enabled?'已开启':'已关闭'}}</Tag></template><template #action="{row}"><VbenTableAction :actions="[{text:'编辑工具',icon:'lucide:edit',onClick:()=>edit(row)}]" :dropdown-actions="[{text:row.enabled?'停用工具':'启用工具',icon:row.enabled?'lucide:pause':'lucide:play',onClick:()=>toggle(row)},{text:'删除工具',icon:'lucide:trash-2',danger:true,popConfirm:{title:`确认删除“${row.name}”吗？`,confirm:()=>remove(row)}}]"/></template></Grid></Page></template>
