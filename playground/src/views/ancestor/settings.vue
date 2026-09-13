<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Card, Input, Button, Form, FormItem, message } from 'antdv-next';
import { ancestorApi } from '#/api/ancestor';
const settings = reactive<Record<string, string>>({ serviceName: '', wechatId: '', wechatQrCode: '', phone: '', workTime: '', notice: '' });
const fields = { serviceName: '客服名称', wechatId: '客服微信', wechatQrCode: '二维码HTTPS地址', phone: '客服电话', workTime: '服务时间', notice: '客服提示' };
const busy = ref(false);
onMounted(async () => { try { Object.assign(settings, await ancestorApi.getSettings()); } catch { message.error('读取配置失败'); } });
async function save() { busy.value = true; try { await ancestorApi.saveSettings(settings); message.success('已保存，小程序客服信息同步更新'); } catch { message.error('保存失败'); } finally { busy.value = false; } }
</script>
<template><Page title="系统设置"><Card title="小程序客服配置"><Form :label-col="{span:4}" :wrapper-col="{span:16}"><FormItem v-for="(label,key) in fields" :key="key" :label="label"><Input v-model:value="settings[key]" /></FormItem><FormItem><Button type="primary" :loading="busy" @click="save">保存</Button></FormItem></Form></Card></Page></template>
