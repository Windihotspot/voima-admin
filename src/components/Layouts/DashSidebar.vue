<template>
  <div class="dash-sidebar mt-6">
    <div class="dash-menu-section">Main Menu</div>

    <ul class="dash-menu">
      <li
        v-for="item in menuItems"
        class="mt-4"
        :key="item.nav"
        :class="{ active: isActive(item) }"
        @click="navigateTo(item)"
      >
        <i :class="item.icon"></i>
        {{ item.label }}
      </li>


      
    </ul>

    <div class="">
       <button class="signout-btn text-red" @click="signOut">
  <i class="mdi mdi-logout"></i>
  <span>Sign Out</span>
</button>
    </div>
   
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/adminAuth'
const authStore = useAdminAuthStore()

const route = useRoute()
const router = useRouter()

const activeNav = ref('home')
const supportOpen = ref(false)

const isActive = (item: { route?: string }) => {
  if (!item.route) return false
  return route.path === item.route || route.path.startsWith(item.route + '/')
}

// Single handler for both main menu and account items.
// If the item is the support toggle, expand/collapse the submenu instead of navigating.
const navigateTo = (item: { nav: string; route?: string }) => {
  if (item.nav === 'support') {
    supportOpen.value = !supportOpen.value
    return
  }

  activeNav.value = item.nav

  if (item.route) {
    router.push(item.route)
  }
}

const signOut = async () => {
  await authStore.logout()
  router.push('/')
}

const menuItems = [
  {
    nav: 'clients',
    label: 'Clients',
    icon: 'mdi mdi-account-group-outline',
    route: '/dashboard'
  },
  {
    nav: 'sop',
    label: 'SOP Library',
    icon: 'mdi mdi-book-open-page-variant-outline',
    route: '/sop'
  },
]


</script>

<style scoped>
.signout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;

  margin-top: auto;
  padding: 10px 12px;

  border: none;
  border-radius: 12px;
  background: transparent;

  color: rgba(15, 23, 42, 0.65);
  font-size: 14px;
  font-family: inherit;

  cursor: pointer;
  text-align: left;

  transition: all 0.2s ease;
}

.signout-btn i {
  font-size: 18px;
  width: 18px;
  height: 18px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.signout-btn:hover {
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
}
.dash-sidebar {
  width: 260px;
  padding: 18px;
  background: #ffffff;
  min-height: 100vh;
  border-right: 1px solid #eef0f4;

  display: flex;
  flex-direction: column;
}
/* SECTION LABEL */
.dash-menu-section {
  font-size: 11px;
  font-weight: 600;
  color: #9aa0a6;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 16px 8px 10px;
}

/* MENU LIST */
.dash-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* MENU ITEM */
.dash-menu li {
  display: flex;
  align-items: center;
  gap: 10px;

  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;

  font-size: 14px;
  color: rgba(15, 23, 42, 0.65);

  transition: all 0.2s ease;
}

.dash-menu li i {
  font-size: 18px;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* HOVER */
.dash-menu li:hover {
  background: rgba(37, 99, 235, 0.08);
  color: #1e293b;
}

/* ACTIVE STATE */
.dash-menu li.active {
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}

.dash-menu li.active i {
  color: #fff;
}

/* SUPPORT CHEVRON */
.support-chevron {
  margin-left: auto;
  transition: transform 0.2s ease;
}

.support-chevron.rotated {
  transform: rotate(180deg);
}

.dash-menu li.support-open {
  background: rgba(37, 99, 235, 0.08);
  color: #1e293b;
}

/* SUPPORT SUBMENU */
.support-submenu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 4px 0 4px 12px;
  padding-left: 20px;
  border-left: 2px solid rgba(37, 99, 235, 0.25);
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.65);
  text-decoration: none;
  transition: all 0.2s ease;
}

.submenu-item:hover {
  background: rgba(37, 99, 235, 0.08);
  color: #1e293b;
}

.submenu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 13px;
  flex-shrink: 0;
}

.wa-icon {
  background: rgba(135, 240, 205, 0.15);
  color: green;
}

.mail-icon {
  background: rgba(37, 99, 235, 0.15);
  color: #2563eb;
}

/* SUBMENU TRANSITION */
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 120px;
}

.mt-4 {
  margin-top: 4px;
}

.mt-6 {
  margin-top: 6px;
}
</style>
