<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Page } from '@vben/common-ui';
import { Card, Form, FormItem, Input, Button, InputNumber, message } from 'antdv-next';

const loading = ref(false);

const settings = reactive({
  appName: '祭祖管理后台',
  customerPhone: '400-888-8888',
  customerWechat: 'ritual_service',
  serviceDescription: '我们提供专业的代祭祀服务，用心传递您的思念。',
  videoRetentionDays: 365,
});

const handleSave = async () => {
  loading.value = true;
  try {
    // 模拟保存
    await new Promise((resolve) => setTimeout(resolve, 500));
    message.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Page title="系统设置">
    <Card :bordered="false" title="基本设置">
      <Form :model="settings" :label-col="{ span: 4 }" :wrapper-col="{ span: 16 }">
        <FormItem label="小程序名称">
          <Input v-model:value="settings.appName" placeholder="请输入小程序名称" />
        </FormItem>
        <FormItem label="客服电话">
          <Input v-model:value="settings.customerPhone" placeholder="请输入客服电话" />
        </FormItem>
        <FormItem label="客服微信">
          <Input v-model:value="settings.customerWechat" placeholder="请输入客服微信号" />
        </FormItem>
        <FormItem label="祭祀服务说明">
          <Input.TextArea
            v-model:value="settings.serviceDescription"
            :rows="4"
            placeholder="请输入服务说明"
          />
        </FormItem>
        <FormItem label="视频保存时间">
          <InputNumber
            v-model:value="settings.videoRetentionDays"
            :min="30"
            :max="3650"
            placeholder="请输入天数"
            addon-after="天"
            style="width: 200px"
          />
          <div class="hint">视频将在此期限后自动删除，建议设置为 365 天或更长</div>
        </FormItem>
        <FormItem :wrapper-col="{ offset: 4 }">
          <Button type="primary" :loading="loading" @click="handleSave">
            保存设置
          </Button>
        </FormItem>
      </Form>
    </Card>
  </Page>
</template>

<script lang="ts">
import { h } from 'vue';
export default { name: 'AncestorSettings' };
</script>

<style scoped>
.hint {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>
