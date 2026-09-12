<script lang="ts" setup>
import { computed } from 'vue';
import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { BasicLayout, LockScreen, UserDropdown } from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const avatar = computed(() => userStore.userInfo?.avatar ?? preferences.app.defaultAvatar);
const menus = [];
async function handleLogout() { await authStore.logout(false); }
function handleClickLogo() {}
</script>

<template>
  <BasicLayout
    :avatar
    :text="userStore.userInfo?.realName || userStore.userInfo?.username"
    @clear-preferences-and-logout="handleLogout"
    @click-logo="handleClickLogo"
    @logout="handleLogout"
  >
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName || userStore.userInfo?.username"
        :description="userStore.userInfo?.username"
        trigger="both"
        @logout="handleLogout"
        @clear-preferences-and-logout="handleLogout"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal v-model:open="accessStore.loginExpired" :avatar>
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
