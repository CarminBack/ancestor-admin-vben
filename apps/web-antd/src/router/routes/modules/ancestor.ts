import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:flame',
      order: 2,
      title: $t('祭祖管理'),
    },
    name: 'Ancestor',
    path: '/ancestor',
    children: [
      {
        name: 'AncestorDashboard',
        path: '/ancestor/dashboard',
        component: () => import('#/views/ancestor/dashboard.vue'),
        meta: {
          icon: 'lucide:layout-dashboard',
          title: $t('数据概览'),
        },
      },
      {
        name: 'AncestorProducts',
        path: '/ancestor/products',
        component: () => import('#/views/ancestor/products.vue'),
        meta: {
          icon: 'lucide:package',
          title: $t('商品列表'),
        },
      },
      {
        name: 'AncestorCategories',
        path: '/ancestor/categories',
        component: () => import('#/views/ancestor/categories.vue'),
        meta: {
          icon: 'lucide:folder',
          title: $t('商品分类'),
        },
      },
      {
        name: 'AncestorProductOrders',
        path: '/ancestor/product-orders',
        component: () => import('#/views/ancestor/product-orders.vue'),
        meta: {
          icon: 'lucide:shopping-cart',
          title: $t('商品订单'),
        },
      },
      {
        name: 'AncestorRitualOrders',
        path: '/ancestor/ritual-orders',
        component: () => import('#/views/ancestor/ritual-orders.vue'),
        meta: {
          icon: 'lucide:calendar',
          title: $t('代祭祀订单'),
        },
      },
      {
        name: 'AncestorRitualOrderDetail',
        path: '/ancestor/ritual-orders/:id',
        component: () => import('#/views/ancestor/ritual-order-detail.vue'),
        meta: {
          hideInMenu: true,
          title: $t('订单详情'),
        },
      },
      {
        name: 'AncestorRitualRecords',
        path: '/ancestor/ritual-records',
        component: () => import('#/views/ancestor/ritual-records.vue'),
        meta: {
          icon: 'lucide:book-open',
          title: $t('祭祀记录'),
        },
      },
      {
        name: 'AncestorAdmins',
        path: '/ancestor/admins',
        component: () => import('#/views/ancestor/admins.vue'),
        meta: {
          icon: 'lucide:users',
          title: $t('管理员'),
        },
      },
      {
        name: 'AncestorSettings',
        path: '/ancestor/settings',
        component: () => import('#/views/ancestor/settings.vue'),
        meta: {
          icon: 'lucide:settings',
          title: $t('系统设置'),
        },
      },
    ],
  },
];

export default routes;
