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
            <DescriptionsItem label="下单人">
              {{ orderData.customerName }}
            </DescriptionsItem>
            <DescriptionsItem label="联系电话">
              {{ orderData.customerPhone }}
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
            <DescriptionsItem v-if="orderData.remark" label="备注" :span="2">
              {{ orderData.remark }}
            </DescriptionsItem>
          </Descriptions>
        </Card>

        <!-- 祭祀流程 -->
        <Card title="祭祀流程" class="process-card">
          <Steps :current="getCurrentStep(orderData.status)" :status="getStepStatus(orderData.status)">
            <Step title="已支付" description="等待祭祀" />
            <Step title="准备中" description="祭祀用品准备" />
            <Step title="封包中" description="封包处理" />
            <Step title="焚化中" description="焚化进行" />
            <Step title="待上传视频" description="视频整理" />
            <Step title="已完成" description="祭祀完成" />
          </Steps>

          <div v-if="canAdvanceStatus(orderData.status)" class="action-buttons">
            <Button type="primary" size="large" @click="handleAdvanceStatus">
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
                    <Button type="link" danger @click="handleDeleteVideo('prepare')">删除</Button>
                  </div>
                </div>
                <Upload
                  v-else
                  :action="uploadAction"
                  :headers="uploadHeaders"
                  accept="video/*"
                  @change="handleUploadChange($event, 'prepare')"
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
                    <Button type="link" danger @click="handleDeleteVideo('package')">删除</Button>
                  </div>
                </div>
                <Upload
                  v-else
                  :action="uploadAction"
                  :headers="uploadHeaders"
                  accept="video/*"
                  @change="handleUploadChange($event, 'package')"
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
                    <Button type="link" danger @click="handleDeleteVideo('burn')">删除</Button>
                  </div>
                </div>
                <Upload
                  v-else
                  :action="uploadAction"
                  :headers="uploadHeaders"
                  accept="video/*"
                  @change="handleUploadChange($event, 'burn')"
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
    </Page>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  message,
  Row,
  Spin,
  Step,
  Steps,
  Tag,
  Timeline,
  TimelineItem,
  Upload,
} from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';
import { Page } from '@vben/common-ui';

import type { RitualOrderDetail, RitualStatus, RitualVideoType } from '#/api/ancestor';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const orderData = ref<RitualOrderDetail | null>(null);
const videos = ref<Record<string, any>>({});
const logs = ref<any[]>([]);

const uploadAction = '/api/upload/video';
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token')}`,
};

onMounted(() => {
  loadOrderDetail();
});

async function loadOrderDetail() {
  loading.value = true;
  try {
    const orderId = route.params.id as string;
    // Mock data
    orderData.value = {
      id: orderId,
      orderNo: 'JZ202609130001',
      customerName: '张三',
      customerPhone: '13800138000',
      deceasedName: '张XX',
      packageId: '2',
      packageName: '诚心祭祀',
      amount: 268,
      ritualDate: '2026-09-15',
      status: 'PREPARING' as RitualStatus,
      videoStatus: 'NONE',
      remark: '',
      createdAt: '2024-09-13 09:30:00',
      paidAt: '2024-09-13 09:32:00',
    };

    logs.value = [
      {
        id: '1',
        operatorName: '管理员',
        fromStatus: '待支付',
        toStatus: '已支付',
        createdAt: '2024-09-13 09:32:00',
      },
      {
        id: '2',
        operatorName: '管理员',
        fromStatus: '已支付',
        toStatus: '准备中',
        createdAt: '2024-09-13 10:00:00',
      },
    ];
  } catch (error) {
    message.error('加载订单详情失败');
  } finally {
    loading.value = false;
  }
}

function getStatusColor(status: RitualStatus) {
  const colorMap: Record<RitualStatus, string> = {
    PENDING: 'default',
    PAID: 'processing',
    PREPARING: 'processing',
    PACKAGING: 'processing',
    BURNING: 'processing',
    PENDING_VIDEO: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };
  return colorMap[status] || 'default';
}

function getStatusText(status: RitualStatus) {
  const textMap: Record<RitualStatus, string> = {
    PENDING: '待支付',
    PAID: '已支付',
    PREPARING: '准备中',
    PACKAGING: '封包中',
    BURNING: '焚化中',
    PENDING_VIDEO: '待上传视频',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };
  return textMap[status] || status;
}

function getCurrentStep(status: RitualStatus) {
  const stepMap: Record<RitualStatus, number> = {
    PENDING: 0,
    PAID: 0,
    PREPARING: 1,
    PACKAGING: 2,
    BURNING: 3,
    PENDING_VIDEO: 4,
    COMPLETED: 5,
    CANCELLED: 0,
  };
  return stepMap[status] || 0;
}

function getStepStatus(status: RitualStatus) {
  return status === 'CANCELLED' ? 'error' : 'process';
}

function canAdvanceStatus(status: RitualStatus) {
  return ['PAID', 'PREPARING', 'PACKAGING', 'BURNING', 'PENDING_VIDEO'].includes(status);
}

function getAdvanceButtonText(status: RitualStatus) {
  const textMap: Record<RitualStatus, string> = {
    PAID: '开始准备',
    PREPARING: '完成准备，进入封包',
    PACKAGING: '完成封包，进入焚化',
    BURNING: '完成焚化',
    PENDING_VIDEO: '完成祭祀',
  };
  return textMap[status] || '下一步';
}

async function handleAdvanceStatus() {
  try {
    // API call to advance status
    message.success('状态更新成功');
    await loadOrderDetail();
  } catch (error) {
    message.error('状态更新失败');
  }
}

function handleUploadChange(info: any, type: RitualVideoType) {
  if (info.file.status === 'done') {
    message.success('视频上传成功');
    videos.value[type] = {
      url: info.file.response.data.url,
    };
  } else if (info.file.status === 'error') {
    message.error('视频上传失败');
  }
}

function handlePreviewVideo(video: any) {
  window.open(video.url, '_blank');
}

async function handleDeleteVideo(type: string) {
  try {
    // API call to delete video
    delete videos.value[type];
    message.success('视频删除成功');
  } catch (error) {
    message.error('视频删除失败');
  }
}

function goBack() {
  router.back();
}
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
