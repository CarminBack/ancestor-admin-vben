import type { RouteRecordRaw } from 'vue-router';
const routes: RouteRecordRaw[] = [
  { name: 'AncestorDashboard', path: '/dashboard', component: () => import('#/views/ancestor/dashboard.vue'), meta: { icon: 'lucide:layout-dashboard', title: '数据概览', order: 1, affixTab: true } },
  { name: 'AncestorPendingOrders', path: '/order/pending', component: () => import('#/views/ancestor/pending-orders.vue'), meta: { icon: 'lucide:clock', title: '待处理订单', order: 2 } },
  { name: 'AncestorProducts', path: '/product/list', component: () => import('#/views/ancestor/products.vue'), meta: { icon: 'lucide:shopping-bag', title: '商品列表', order: 3 } },
  { name: 'AncestorCategories', path: '/product/category', component: () => import('#/views/ancestor/categories.vue'), meta: { icon: 'lucide:tags', title: '商品分类', order: 4 } },
  { name: 'AncestorProductOrders', path: '/product-order/list', component: () => import('#/views/ancestor/product-orders.vue'), meta: { icon: 'lucide:receipt', title: '商品订单', order: 5 } },
  { name: 'AncestorRitualOrders', path: '/ritual/order', component: () => import('#/views/ancestor/ritual-orders.vue'), meta: { icon: 'lucide:flame', title: '代祭祀订单', order: 6 } },
  { name: 'AncestorRitualOrderDetail', path: '/ritual/order/:id', component: () => import('#/views/ancestor/ritual-order-detail.vue'), meta: { hideInMenu: true, title: '订单详情' } },
  { name: 'AncestorRecords', path: '/ritual/record', component: () => import('#/views/ancestor/ritual-records.vue'), meta: { icon: 'lucide:video', title: '祭祀记录', order: 7 } },
  { name: 'AncestorAdmins', path: '/system/admin', component: () => import('#/views/ancestor/admins.vue'), meta: { icon: 'lucide:users', title: '管理员', order: 8 } },
  { name: 'AncestorRoles', path: '/system/role', component: () => import('#/views/system/role/list.vue'), meta: { icon: 'lucide:shield-check', title: '角色权限', order: 9 } },
  { name: 'AncestorSettings', path: '/system/settings', component: () => import('#/views/ancestor/settings.vue'), meta: { icon: 'lucide:settings', title: '系统设置', order: 10 } },
];
export default routes;
