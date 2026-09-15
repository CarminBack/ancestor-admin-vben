<script setup lang="ts">
import { computed, h, ref, onMounted, onUnmounted } from 'vue';
import {
  Card,
  Button,
  Tag,
  Modal,
  Descriptions,
  Timeline,
  Space,
} from 'antdv-next';
import type { RitualOrder, RitualOrderDetail } from '#/api/ancestor';

const DescriptionsItem = Descriptions.Item;
const TimelineItem = Timeline.Item;

// 图标组件
const PlayCircleOutlined = () => h('span', { class: 'i-ant-design:play-circle-outlined' });
const ClockCircleOutlined = () => h('span', { class: 'i-ant-design:clock-circle-outlined' });
const DeleteOutlined = () => h('span', { class: 'i-ant-design:delete-outlined' });
const VideoCameraOutlined = () => h('span', { class: 'i-ant-design:video-camera-outlined' });

interface Props {
  visible: boolean;
  order?: RitualOrderDetail | null;
  showOperations?: boolean; // 是否显示订单操作板块（取消祭祀等按钮）
  showUploadButtons?: boolean; // 是否显示上传视频按钮
}

const props = withDefaults(defineProps<Props>(), {
  showOperations: true,
  showUploadButtons: true,
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'upload-video': [stage: string];
  'view-video': [url: string];
  'set-video-time': [video: any];
  'delete-video': [video: any];
  'cancel-ritual': [order: RitualOrder];
}>();

const statusColorMap: Record<string, string> = {
  PAID: 'blue',
  PREPARING: 'orange',
  PACKAGING: 'cyan',
  BURNING: 'purple',
  COMPLETED: 'green',
  CANCELLED: 'red',
  PENDING_VIDEO: 'gold',
};

const statusTextMap: Record<string, string> = {
  PENDING_PAYMENT: '待支付',
  PENDING_RITUAL: '待祭祀',
  PAID: '已支付',
  PREPARING: '准备中',
  PACKAGING: '封包中',
  BURNING: '焚化中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  PENDING_VIDEO: '待上传视频',
};

const getVideosByType = (type: string) => {
  if (!props.order?.videos) return [];
  return props.order.videos.filter((v: any) => v.stage === type);
};

const isVideoAvailable = (video: any) => {
  if (!video.availableAt) return true;
  return new Date(video.availableAt) <= new Date();
};

// 倒计时更新
const currentTime = ref(Date.now());
let timer: any = null;

onMounted(() => {
  // 每秒更新一次当前时间，用于倒计时
  timer = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

const formatAvailableTime = (availableAt: string) => {
  if (!availableAt) return '';
  const date = new Date(availableAt);
  const diff = date.getTime() - currentTime.value;

  if (diff <= 0) return '已可查看';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}天${hours}小时${minutes}分${seconds}秒后可查看`;
  if (hours > 0) return `${hours}小时${minutes}分${seconds}秒后可查看`;
  if (minutes > 0) return `${minutes}分${seconds}秒后可查看`;
  return `${seconds}秒后可查看`;
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<template>
  <Modal
    :open="visible"
    title="订单详情"
    :width="900"
    :footer="null"
    @cancel="handleClose"
  >
    <div v-if="order" class="detail-container">
      <!-- 订单基本信息 -->
      <Card title="订单信息" :bordered="false" class="mb-4">
        <Descriptions bordered :column="2">
          <DescriptionsItem label="订单编号" :span="2">{{ order.orderNo }}</DescriptionsItem>
          <DescriptionsItem label="阳上人">{{ order.orderName }}</DescriptionsItem>
          <DescriptionsItem label="下单人性别">{{ order.customerGender }}</DescriptionsItem>
          <DescriptionsItem label="阳上人生辰">{{ order.customerBirthDate }}</DescriptionsItem>
          <DescriptionsItem label="阳上人地址" :span="2">{{ order.customerAddress }}</DescriptionsItem>
          <DescriptionsItem label="亡故亲人">{{ order.deceasedName }}</DescriptionsItem>
          <DescriptionsItem label="亡故人性别">{{ order.deceasedGender }}</DescriptionsItem>
          <DescriptionsItem label="亡故人生辰">{{ order.deceasedBirthDate }} {{ order.deceasedBirthTime }}</DescriptionsItem>
          <DescriptionsItem label="关系">{{ order.relationship }}</DescriptionsItem>
          <DescriptionsItem label="墓地" :span="2">{{ order.cemetery }}</DescriptionsItem>
          <DescriptionsItem label="祭祀套餐">{{ order.packageName }}</DescriptionsItem>
          <DescriptionsItem label="祭祀日期">{{ order.ritualDate }}</DescriptionsItem>
          <DescriptionsItem label="订单金额" :span="2">
            <span class="price">¥{{ order.amount }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="当前状态">
            <Tag :color="statusColorMap[order.status]">
              {{ statusTextMap[order.status] || order.status }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="创建时间">{{ order.createdAt }}</DescriptionsItem>
          <DescriptionsItem v-if="order.paidAt" label="支付时间" :span="2">
            {{ order.paidAt }}
          </DescriptionsItem>
          <DescriptionsItem v-if="order.completedAt" label="完成时间" :span="2">
            {{ order.completedAt }}
          </DescriptionsItem>
          <DescriptionsItem v-if="order.remark !== undefined" label="备注" :span="2">
            {{ order.remark || '无' }}
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <!-- 祭祀视频 -->
      <Card title="祭祀视频" :bordered="false" class="mb-4">
        <!-- 准备视频 -->
        <div class="video-section mb-6">
          <div class="flex items-center justify-between mb-3">
            <div class="text-base font-semibold">准备视频</div>
            <Button
              v-if="showUploadButtons"
              type="primary"
              size="small"
              @click="emit('upload-video', 'PREPARING')"
            >
              上传准备视频
            </Button>
          </div>
          <div v-if="getVideosByType('PREPARING').length > 0" class="video-grid">
            <div v-for="video in getVideosByType('PREPARING')" :key="video.id" class="video-card">
              <div class="video-thumbnail" @click="emit('view-video', video.videoUrl)">
                <video :src="video.videoUrl" class="thumbnail-video" />
                <div class="play-overlay">
                  <PlayCircleOutlined class="play-icon" />
                </div>
                <div v-if="!isVideoAvailable(video)" class="video-locked">
                  <ClockCircleOutlined />
                  <span>{{ formatAvailableTime(video.availableAt) }}后可查看</span>
                </div>
              </div>
              <div class="video-info">
                <div v-if="video.availableAt" class="video-time">
                  <ClockCircleOutlined class="mr-1" />
                  <span class="text-xs">{{ video.availableAt }}</span>
                </div>
                <div v-else class="video-time">
                  <span class="text-xs text-green-600">立即可查看</span>
                </div>
                <div class="video-button-row">
                  <Button type="primary" size="small" @click="emit('set-video-time', video)">
                    <ClockCircleOutlined /> 设置时间
                  </Button>
                  <Button type="primary" size="small" danger @click="emit('delete-video', video)">
                    <DeleteOutlined /> 删除
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-placeholder">
            <VideoCameraOutlined class="empty-icon" />
            <span class="text-gray-400">暂无视频</span>
          </div>
        </div>

        <!-- 封包视频 -->
        <div class="video-section mb-6">
          <div class="flex items-center justify-between mb-3">
            <div class="text-base font-semibold">封包视频</div>
            <Button
              v-if="showUploadButtons"
              type="primary"
              size="small"
              @click="emit('upload-video', 'PACKAGING')"
            >
              上传封包视频
            </Button>
          </div>
          <div v-if="getVideosByType('PACKAGING').length > 0" class="video-grid">
            <div v-for="video in getVideosByType('PACKAGING')" :key="video.id" class="video-card">
              <div class="video-thumbnail" @click="emit('view-video', video.videoUrl)">
                <video :src="video.videoUrl" class="thumbnail-video" />
                <div class="play-overlay">
                  <PlayCircleOutlined class="play-icon" />
                </div>
                <div v-if="!isVideoAvailable(video)" class="video-locked">
                  <ClockCircleOutlined />
                  <span>{{ formatAvailableTime(video.availableAt) }}后可查看</span>
                </div>
              </div>
              <div class="video-info">
                <div v-if="video.availableAt" class="video-time">
                  <ClockCircleOutlined class="mr-1" />
                  <span class="text-xs">{{ video.availableAt }}</span>
                </div>
                <div v-else class="video-time">
                  <span class="text-xs text-green-600">立即可查看</span>
                </div>
                <div class="video-button-row">
                  <Button type="primary" size="small" @click="emit('set-video-time', video)">
                    <ClockCircleOutlined /> 设置时间
                  </Button>
                  <Button type="primary" size="small" danger @click="emit('delete-video', video)">
                    <DeleteOutlined /> 删除
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-placeholder">
            <VideoCameraOutlined class="empty-icon" />
            <span class="text-gray-400">暂无视频</span>
          </div>
        </div>

        <!-- 祭祀视频 -->
        <div class="video-section">
          <div class="flex items-center justify-between mb-3">
            <div class="text-base font-semibold">祭祀视频</div>
            <Button
              v-if="showUploadButtons"
              type="primary"
              size="small"
              @click="emit('upload-video', 'BURNING')"
            >
              上传祭祀视频
            </Button>
          </div>
          <div v-if="getVideosByType('BURNING').length > 0" class="video-grid">
            <div v-for="video in getVideosByType('BURNING')" :key="video.id" class="video-card">
              <div class="video-thumbnail" @click="emit('view-video', video.videoUrl)">
                <video :src="video.videoUrl" class="thumbnail-video" />
                <div class="play-overlay">
                  <PlayCircleOutlined class="play-icon" />
                </div>
                <div v-if="!isVideoAvailable(video)" class="video-locked">
                  <ClockCircleOutlined />
                  <span>{{ formatAvailableTime(video.availableAt) }}后可查看</span>
                </div>
              </div>
              <div class="video-info">
                <div v-if="video.availableAt" class="video-time">
                  <ClockCircleOutlined class="mr-1" />
                  <span class="text-xs">{{ video.availableAt }}</span>
                </div>
                <div v-else class="video-time">
                  <span class="text-xs text-green-600">立即可查看</span>
                </div>
                <div class="video-button-row">
                  <Button type="primary" size="small" @click="emit('set-video-time', video)">
                    <ClockCircleOutlined /> 设置时间
                  </Button>
                  <Button type="primary" size="small" danger @click="emit('delete-video', video)">
                    <DeleteOutlined /> 删除
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-placeholder">
            <VideoCameraOutlined class="empty-icon" />
            <span class="text-gray-400">暂无视频</span>
          </div>
        </div>
      </Card>

      <!-- 操作按钮 -->
      <Card v-if="showOperations" title="订单操作" :bordered="false" class="mb-4">
        <Space>
          <Button
            v-if="['PENDING_PAYMENT', 'PAID'].includes(order.status)"
            danger
            @click="emit('cancel-ritual', order)"
          >
            取消祭祀
          </Button>
        </Space>
      </Card>

      <!-- 操作日志 -->
      <Card title="操作日志" :bordered="false">
        <Timeline v-if="order.logs && order.logs.length > 0">
          <TimelineItem v-for="log in order.logs" :key="log.id">
            <p>
              <strong>{{ log.operatorName }}</strong> 将状态从
              <Tag size="small">{{ statusTextMap[log.fromStatus] }}</Tag> 更新为
              <Tag size="small">{{ statusTextMap[log.toStatus] }}</Tag>
            </p>
            <p v-if="log.remark" class="text-gray">{{ log.remark }}</p>
            <p class="text-sm text-gray">{{ log.createdAt }}</p>
          </TimelineItem>
        </Timeline>
        <div v-else class="empty-log">暂无操作记录</div>
      </Card>
    </div>
  </Modal>
</template>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.mb-6 {
  margin-bottom: 24px;
}

.price {
  color: #f5222d;
  font-weight: 600;
  font-size: 16px;
}

.detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.video-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #fff;
}

.video-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  background: #000;
  cursor: pointer;
  overflow: hidden;
}

.thumbnail-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 1;
}

.video-thumbnail:hover .play-overlay {
  background: rgba(0, 0, 0, 0.5);
}

.play-icon {
  font-size: 48px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.video-thumbnail:hover .play-icon {
  font-size: 56px;
  color: #fff;
}

.video-locked {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 12px;
  gap: 8px;
  z-index: 2;
}

.video-locked .anticon {
  font-size: 24px;
}

.video-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.video-time {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  min-height: 20px;
}

.video-button-row {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.video-button-row .ant-btn {
  flex: 1;
  height: 32px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.video-section {
  padding: 16px 0;
}

.video-section:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

.empty-log {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

.text-gray {
  color: #6b7280;
}

.text-sm {
  font-size: 12px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.text-base {
  font-size: 14px;
}

.font-semibold {
  font-weight: 600;
}

.text-xs {
  font-size: 12px;
}

.text-green-600 {
  color: #16a34a;
}

.text-gray-400 {
  color: #9ca3af;
}

.mr-1 {
  margin-right: 4px;
}
</style>
