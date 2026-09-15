<template>
  <div class="ritual-order-detail">
    <Page
      title="代祭祀订单详情"
      description="查看和处理代祭祀订单"
      content-full-height
    >
      <template #extra>
        <Button @click="goBack">返回</Button>
      </template>

      <div v-if="loading" class="loading-container">
        <Spin size="large" />
      </div>

      <div v-else-if="orderData" class="detail-container">
        <!-- 订单基本信息 -->
        <Card title="订单信息" class="info-card">
          <Descriptions :column="2" bordered>
            <DescriptionsItem label="订单编号">
              {{ orderData.orderNo }}
            </DescriptionsItem>
            <DescriptionsItem label="订单状态">
              <Tag :color="getStatusColor(orderData.status)">
                {{ getStatusText(orderData.status) }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="阳上人">
              {{ orderData.orderName }}
            </DescriptionsItem>
            <DescriptionsItem label="联系电话">
              {{ '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="亡故亲人">
              {{ orderData.deceasedName }}
            </DescriptionsItem>
            <DescriptionsItem label="祭祀日期">
              {{ orderData.ritualDate }}
            </DescriptionsItem>
            <DescriptionsItem label="祭祀套餐">
              {{ orderData.packageName }}
            </DescriptionsItem>
            <DescriptionsItem label="订单金额">
              <span class="amount">¥{{ orderData.amount }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">
              {{ orderData.createdAt }}
            </DescriptionsItem>
            <DescriptionsItem label="支付时间">
              {{ orderData.paidAt || '-' }}
            </DescriptionsItem>
          <DescriptionsItem v-if="orderData.remark !== undefined" label="备注" :span="2">
            {{ orderData.remark || '无' }}
          </DescriptionsItem>
          </Descriptions>
        </Card>

        <!-- 祭祀流程 -->
        <Card title="祭祀流程" class="process-card">
          <Steps :current="getCurrentStep(orderData.status)" :status="getStepStatus(orderData.status)" :items="stepItems" />

          <div v-if="canAdvanceStatus(orderData.status)" class="action-buttons">
            <Button type="primary" size="large" :disabled="busy" @click="handleAdvanceStatus">
              {{ getAdvanceButtonText(orderData.status) }}
            </Button>
          </div>
        </Card>

        <!-- 祭祀视频 -->
        <Card title="祭祀视频" class="video-card">
          <Row :gutter="16">
            <Col :span="8">
              <div class="video-upload-section">
                <div class="section-title">准备视频</div>
                <div v-if="videos.prepare" class="video-item">
                  <video :src="videos.prepare.url" controls style="width: 100%; border-radius: 8px;"></video>
                  <div class="video-actions">
                    <Button type="link" @click="handlePreviewVideo(videos.prepare)">预览</Button>
                    <Button type="link" :disabled="busy" @click="setVideoTime(videos.prepare)">设置时间</Button>
                    <Button type="link" danger :disabled="busy" @click="handleDeleteVideo('prepare')">删除</Button>
                  </div>
                </div>
                <Upload
                  v-else
                  :custom-request="(options) => customUpload(options, 'prepare')"
                  :disabled="busy || !canUpload"
                  :show-upload-list="false"
                  accept="video/mp4"
                >
                  <Button type="dashed" block>
                    <UploadOutlined /> 上传准备视频
                  </Button>
                </Upload>
              </div>
            </Col>
            <Col :span="8">
              <div class="video-upload-section">
                <div class="section-title">封包视频</div>
                <div v-if="videos.package" class="video-item">
                  <video :src="videos.package.url" controls style="width: 100%; border-radius: 8px;"></video>
                  <div class="video-actions">
                    <Button type="link" @click="handlePreviewVideo(videos.package)">预览</Button>
                    <Button type="link" :disabled="busy" @click="setVideoTime(videos.package)">设置时间</Button>
                    <Button type="link" danger :disabled="busy" @click="handleDeleteVideo('package')">删除</Button>
                  </div>
                </div>
                <Upload
                  v-else
                  :custom-request="(options) => customUpload(options, 'package')"
                  :disabled="busy || !canUpload"
                  :show-upload-list="false"
                  accept="video/mp4"
                >
                  <Button type="dashed" block>
                    <UploadOutlined /> 上传封包视频
                  </Button>
                </Upload>
              </div>
            </Col>
            <Col :span="8">
              <div class="video-upload-section">
                <div class="section-title">焚化视频</div>
                <div v-if="videos.burn" class="video-item">
                  <video :src="videos.burn.url" controls style="width: 100%; border-radius: 8px;"></video>
                  <div class="video-actions">
                    <Button type="link" @click="handlePreviewVideo(videos.burn)">预览</Button>
                    <Button type="link" :disabled="busy" @click="setVideoTime(videos.burn)">设置时间</Button>
                    <Button type="link" danger :disabled="busy" @click="handleDeleteVideo('burn')">删除</Button>
                  </div>
                </div>
                <Upload
                  v-else
                  :custom-request="(options) => customUpload(options, 'burn')"
                  :disabled="busy || !canUpload"
                  :show-upload-list="false"
                  accept="video/mp4"
                >
                  <Button type="dashed" block>
                    <UploadOutlined /> 上传焚化视频
                  </Button>
                </Upload>
              </div>
            </Col>
          </Row>
        </Card>

        <!-- 操作日志 -->
        <Card title="操作日志" class="log-card">
          <Timeline>
            <TimelineItem v-for="log in logs" :key="log.id">
              <div class="log-item">
                <div class="log-header">
                  <Tag>{{ log.operatorName }}</Tag>
                  <span class="log-time">{{ log.createdAt }}</span>
                </div>
                <div class="log-content">
                  {{ log.fromStatus }} → {{ log.toStatus }}
                </div>
                <div v-if="log.remark" class="log-remark">{{ log.remark }}</div>
              </div>
            </TimelineItem>
          </Timeline>
        </Card>
      </div>
      <Modal :open="!!editingVideoId" title="设置视频可查看时间" @cancel="editingVideoId = ''" @ok="saveVideoTime" :confirm-loading="busy">
        <DatePicker v-model:value="videoTime" show-time value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" placeholder="留空表示立即开放" style="width:100%" />
      </Modal>
    </Page>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button, Card, Col, Descriptions, DescriptionsItem, message, Row, Spin, Steps, Tag, Timeline, TimelineItem, Upload, Modal, DatePicker } from 'antdv-next';
import { Page } from '@vben/common-ui';
import { ancestorApi, type RitualOrderDetail, type RitualStatus } from '#/api/ancestor';
import { uploadRitualVideo } from '#/utils/ritual-video-upload';
const UploadOutlined = () => h('span', { class: 'i-ant-design:upload-outlined' });
const route = useRoute(); const router = useRouter();
const loading = ref(false); const busy = ref(false);
const orderData = ref<RitualOrderDetail | null>(null);
const videoTime = ref(''); const editingVideoId = ref('');
const stageTypes = { prepare: 'PREPARE', package: 'PACKAGE', burn: 'BURN' };
const stageNames = { prepare: 'PREPARING', package: 'PACKAGING', burn: 'BURNING' };
type Stage = keyof typeof stageTypes;
const videos = computed(() => Object.fromEntries(Object.entries(stageTypes).map(([key, type]) => {
  const video = orderData.value?.videos.find(v => v.type === type);
  return [key, video ? { ...video, url: video.videoUrl } : null];
})));
const logs = computed(() => orderData.value?.logs || []);
const stepItems = [ { title: '已支付', description: '等待祭祀' }, { title: '准备中', description: '祭祀用品准备' }, { title: '封包中', description: '封包处理' }, { title: '焚化中', description: '焚化进行' }, { title: '待上传视频', description: '视频整理' }, { title: '已完成', description: '祭祀完成' } ];
const canUpload = computed(() => orderData.value && canAdvanceStatus(orderData.value.status));
onMounted(loadOrderDetail); watch(() => route.params.id, loadOrderDetail);
async function loadOrderDetail() {
  loading.value = true;
  try { orderData.value = await ancestorApi.getRitualOrder(String(route.params.id)); }
  catch { orderData.value = null; message.error('加载订单详情失败'); }
  finally { loading.value = false; }
}
function getStatusColor(status: RitualStatus) { return ({ PENDING_PAYMENT: 'default', PAID: 'processing', PREPARING: 'processing', PACKAGING: 'processing', BURNING: 'processing', PENDING_VIDEO: 'warning', COMPLETED: 'success', CANCELLED: 'error' } as Record<string, string>)[status] || 'default'; }
function getStatusText(status: RitualStatus) { return ({ PENDING_PAYMENT: '待支付', PAID: '已支付', PENDING_RITUAL: '待祭祀', PREPARING: '准备中', PACKAGING: '封包中', BURNING: '焚化中', PENDING_VIDEO: '待上传视频', COMPLETED: '已完成', CANCELLED: '已取消' } as Record<string, string>)[status] || status; }
function getCurrentStep(status: RitualStatus) { return ({ PAID: 0, PREPARING: 1, PACKAGING: 2, BURNING: 3, PENDING_VIDEO: 4, COMPLETED: 5 } as Record<string, number>)[status] || 0; }
function getStepStatus(status: RitualStatus) { return status === 'CANCELLED' ? 'error' : 'process'; }
function canAdvanceStatus(status: RitualStatus) { return ['PAID', 'PENDING_RITUAL', 'PREPARING', 'PACKAGING', 'BURNING', 'PENDING_VIDEO'].includes(status); }
function getAdvanceButtonText(status: RitualStatus) { return ({ PAID: '开始准备', PENDING_RITUAL: '开始准备', PREPARING: '完成准备，进入封包', PACKAGING: '完成封包，进入焚化', BURNING: '完成焚化', PENDING_VIDEO: '完成祭祀' } as Record<string, string>)[status] || '下一步'; }
async function perform(action: () => Promise<unknown>) {
  busy.value = true;
  try { await action(); await loadOrderDetail(); message.success('操作成功'); }
  catch { message.error('操作失败，请检查当前订单状态'); }
  finally { busy.value = false; }
}
function handleAdvanceStatus() {
  Modal.confirm({ title: '确认进入下一步', content: getAdvanceButtonText(orderData.value!.status), okText: '确认', cancelText: '取消', onOk: () => perform(() => ancestorApi.advanceRitualOrder(orderData.value!.id)) });
}
async function customUpload(options: any, stage: Stage) {
  busy.value = true;
  try {
    const url = await uploadRitualVideo(options.file, percent => options.onProgress?.({ percent }));
    await ancestorApi.addRitualOrderVideo(orderData.value!.id, { videoUrl: url, stage: stageNames[stage] });
    options.onSuccess?.({}); await loadOrderDetail(); message.success('视频上传成功');
  } catch (e) { options.onError?.(e); message.error(e instanceof Error ? e.message : '视频上传失败'); }
  finally { busy.value = false; }
}
function handlePreviewVideo(video: any) { window.open(video.url, '_blank', 'noopener,noreferrer'); }
function handleDeleteVideo(stage: Stage) {
  const video = videos.value[stage];
  Modal.confirm({ title: '确认删除视频', okText: '确认删除', cancelText: '取消', onOk: () => perform(() => ancestorApi.deleteVideo(video.id)) });
}
function setVideoTime(video: any) { editingVideoId.value = video.id; videoTime.value = video.availableAt || ''; }
async function saveVideoTime() { await perform(() => ancestorApi.updateVideoAvailableTime(editingVideoId.value, videoTime.value || '')); editingVideoId.value = ''; }
function goBack() { router.push('/ritual/order'); }
</script>


<style scoped lang="less">
.ritual-order-detail {
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .detail-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .amount {
    font-size: 18px;
    font-weight: 600;
    color: #f56c6c;
  }

  .process-card {
    :deep(.ant-steps) {
      margin-bottom: 24px;
    }

    .action-buttons {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
  }

  .video-upload-section {
    .section-title {
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 500;
    }

    .video-item {
      .video-actions {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 8px;
      }
    }
  }

  .log-item {
    .log-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .log-time {
        color: #999;
        font-size: 12px;
      }
    }

    .log-content {
      margin-bottom: 4px;
    }

    .log-remark {
      color: #666;
      font-size: 12px;
    }
  }
}
</style>
