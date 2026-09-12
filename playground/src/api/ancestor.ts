import { requestClient } from '#/api/request';

// 枚举定义
export enum RitualVideoType {
  PREPARE = 'PREPARE',
  PACKAGE = 'PACKAGE',
  BURN = 'BURN',
  FULL = 'FULL',
}

export enum RitualStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  PENDING_RITUAL = 'PENDING_RITUAL',
  PREPARING = 'PREPARING',
  PACKAGING = 'PACKAGING',
  BURNING = 'BURNING',
  PENDING_VIDEO = 'PENDING_VIDEO',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ProductOrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 类型定义
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  cover?: string;
  images?: string[];
  description?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sales: number;
  status: 0 | 1;
  sort?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  image?: string;
  sort: number;
  status: 0 | 1;
  createdAt: string;
}

export interface ProductOrder {
  id: string;
  orderNo: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  amount: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  status: string;
  paidAt?: string;
  shippedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RitualOrder {
  id: string;
  orderNo: string;
  orderName: string;
  deceasedName: string;
  packageId: string;
  packageName: string;
  ritualDate: string;
  amount: number;
  status: RitualStatus;
  videoCount: number;
  remark?: string;
  paidAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RitualOrderDetail extends RitualOrder {
  videos: RitualVideo[];
  logs: RitualLog[];
}

export interface RitualVideo {
  id: string;
  ritualOrderId: string;
  type: RitualVideoType;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  status: number;
  availableAt?: string; // 可查看时间
  createdAt: string;
}

export interface RitualLog {
  id: string;
  ritualOrderId: string;
  fromStatus: string;
  toStatus: string;
  operatorId?: string;
  operatorName: string;
  remark?: string;
  createdAt: string;
}

export interface RitualPackage {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  price: number;
  sort: number;
  status: 0 | 1;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardOverview {
  todayRitualOrders: number;
  todayProductOrders: number;
  todaySalesAmount: number;
  pendingRitualOrders: number;
  totalRitualOrders: number;
  totalProductOrders: number;
  totalSalesAmount: number;
  completedRituals: number;
  recentRitualOrders: RitualOrder[];
  recentProductOrders: ProductOrder[];
}

// API 接口
export const ancestorApi = {
  // 仪表盘
  dashboard: () => requestClient.get<DashboardOverview>('/ancestor/dashboard'),

  // 商品管理
  products: (params?: Record<string, unknown>) =>
    requestClient.get<{ items: Product[]; total: number }>('/ancestor/products', { params }),
  getProduct: (id: string) => requestClient.get<Product>(`/ancestor/products/${id}`),
  createProduct: (data: Partial<Product>) => requestClient.post<Product>('/ancestor/products', data),
  updateProduct: (id: string, data: Partial<Product>) =>
    requestClient.put<Product>(`/ancestor/products/${id}`, data),
  deleteProduct: (id: string) => requestClient.delete(`/ancestor/products/${id}`),

  // 商品分类
  categories: () =>
    requestClient.get<{ items: ProductCategory[]; total: number }>('/ancestor/categories'),
  createCategory: (data: Partial<ProductCategory>) =>
    requestClient.post<ProductCategory>('/ancestor/categories', data),
  updateCategory: (id: string, data: Partial<ProductCategory>) =>
    requestClient.put<ProductCategory>(`/ancestor/categories/${id}`, data),
  deleteCategory: (id: string) => requestClient.delete(`/ancestor/categories/${id}`),

  // 商品订单
  productOrders: (params?: Record<string, unknown>) =>
    requestClient.get<{ items: ProductOrder[]; total: number }>('/ancestor/product-orders', {
      params,
    }),
  getProductOrder: (id: string) =>
    requestClient.get<ProductOrder>(`/ancestor/product-orders/${id}`),
  updateProductOrder: (id: string, data: Partial<ProductOrder>) =>
    requestClient.put<ProductOrder>(`/ancestor/product-orders/${id}`, data),

  // 代祭祀订单
  ritualOrders: (params?: Record<string, unknown>) =>
    requestClient.get<{ items: RitualOrder[]; total: number }>('/ancestor/ritual-orders', {
      params,
    }),
  getRitualOrder: (id: string) =>
    requestClient.get<RitualOrderDetail>(`/ancestor/ritual-orders/${id}`),
  updateRitualOrder: (id: string, data: Partial<RitualOrder>) =>
    requestClient.put<RitualOrder>(`/ancestor/ritual-orders/${id}`, data),
  addRitualOrderVideo: (orderId: string, data: { videoUrl: string; stage: string; availableAt?: string }) =>
    requestClient.post(`/ancestor/ritual-orders/${orderId}/videos`, data),

  // 祭祀套餐
  ritualPackages: () =>
    requestClient.get<{ items: RitualPackage[]; total: number }>('/ancestor/ritual-packages'),

  // 七牛云私有空间下载链接
  getQiniuDownloadUrl: (url: string, expires?: number) =>
    requestClient.post<{ downloadUrl: string }>('/ancestor/qiniu-download-url', { url, expires }),
};
