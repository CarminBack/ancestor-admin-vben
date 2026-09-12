import { defineOverridesPreferences, definePreferencesExtension } from '@vben/preferences';

export const overridesPreferences = defineOverridesPreferences({
  app: {
    name: '祭祖管理后台',
    defaultHomePath: '/dashboard',
    enablePreferences: false,
    enableCopyPreferences: false,
    dynamicTitle: true,
  },
  copyright: {
    companyName: '祭祖微信小程序',
    companySiteLink: '',
    date: '2026',
    enable: false,
    icp: '',
    icpLink: '',
    settingShow: false,
  },
  footer: { enable: false },
  shortcutKeys: {
    enable: false,
    globalEscape: false,
    globalLockScreen: false,
    globalLogout: false,
    globalPreferences: false,
    globalSearch: false,
  },
  widget: {
    fullscreen: false,
    globalSearch: false,
    languageToggle: false,
    lockScreen: false,
    notification: false,
    refresh: false,
    themeToggle: false,
    timezone: false,
    logoutButtonPosition: 'header',
    order: ['logoutBtn'],
  },
  tabbar: {
    showMaximize: false,
    showMore: false,
    showRefresh: false,
  },
  breadcrumb: { showHome: false, showIcon: false },
});

export const preferencesExtension = definePreferencesExtension({
  tabLabel: '管理后台设置',
  title: '管理后台设置',
  fields: [],
});
