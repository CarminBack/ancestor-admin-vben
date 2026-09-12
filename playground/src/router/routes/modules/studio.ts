import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { name: 'StudioHome', path: '/home', component: () => import('#/views/studio/home.vue'), meta: { icon: 'lucide:layout-dashboard', title: '首页', order: 1, affixTab: true } },
  { name: 'StudioUsers', path: '/users', component: () => import('#/views/studio/users.vue'), meta: { icon: 'lucide:users', title: '用户管理', order: 2 } },
  { name: 'StudioCategories', path: '/categories', component: () => import('#/views/studio/categories.vue'), meta: { icon: 'lucide:tags', title: '分类管理', order: 3 } },
  { name: 'StudioTools', path: '/tools', component: () => import('#/views/studio/tools.vue'), meta: { icon: 'lucide:boxes', title: '工具与权限', order: 4 } },
  { name: 'StudioDashboardLegacy', path: '/studio/dashboard', redirect: '/home', meta: { hideInMenu: true, hideInTab: true } },
];
export default routes;
