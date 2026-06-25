import { createRouter, createWebHashHistory } from 'vue-router'
import { captureInviteCode } from '@/utils/invite'
import { isLoggedIn } from '@/api/session'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      props: (route) => {
        console.log('注册路由Props:', route.query)

        // 获取根URL的查询参数
        const rootParams = new URLSearchParams(window.location.search)
        const rootInvite = rootParams.get('invite')

        // 如果路由查询参数中有invite，优先使用；否则尝试从根URL获取
        const invite = route.query.invite || rootInvite || ''

        return {
          invite,
          redirect: route.query.redirect || '/',
        }
      },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('../views/GameView.vue'),
    },
    {
      path: '/game/:topCategoryId/:primaryCategoryId',
      name: 'game-secondary',
      component: () => import('../views/GameSecondaryView.vue'),
      props: true,
    },
    {
      path: '/game-play',
      name: 'game-play',
      component: () => import('../views/GamePlayView.vue'),
    },
    {
      path: '/lottery/:primaryCategoryId',
      name: 'lottery-detail',
      component: () => import('../views/LotteryDetailView.vue'),
      props: true,
    },
    {
      path: '/lottery-touzhu-record',
      name: 'lotteryTouzhuRecord',
      component: () => import('../views/LotteryTouzhuRecordView.vue'),
    },
    {
      path: '/lottery-history',
      name: 'lotteryHistory',
      component: () => import('../views/LotteryHistoryView.vue'),
    },
    {
      path: '/game-record',
      name: 'gameRecord',
      component: () => import('../views/GameRecordView.vue'),
    },
    {
      path: '/live',
      name: 'live',
      component: () => import('../views/LiveView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      meta: { requiresAuth: true },
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('../views/TagsView.vue'),
    },
    {
      path: '/tag/:id',
      name: 'tagDetails',
      component: () => import('../views/TagDetailsView.vue'),
    },
    {
      path: '/video/:id',
      name: 'videoDetail',
      component: () => import('../views/VideoDetailView.vue'),
      props: (route) => ({
        ...route.params,
        invite: route.query.invite,
      }),
    },
    {
      path: '/recharge',
      name: 'recharge',
      meta: { requiresAuth: true },
      component: () => import('../views/RechargeView.vue'),
    },
    {
      path: '/recharge-callback',
      name: 'rechargeCallback',
      component: () => import('../views/RechargeCallbackView.vue'),
    },
    {
      path: '/payment',
      name: 'payment',
      meta: { requiresAuth: true },
      component: () => import('../views/PaymentView.vue'),
    },
    {
      path: '/customer-service',
      name: 'customerService',
      component: () => import('../views/CustomerServiceView.vue'),
    },
    {
      path: '/vip-recharge',
      name: 'vipRecharge',
      meta: { requiresAuth: true },
      component: () => import('../views/VipRechargeView.vue'),
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      meta: { requiresAuth: true },
      component: () => import('../views/WithdrawView.vue'),
    },
    {
      path: '/points-record',
      name: 'points-record',
      meta: { requiresAuth: true },
      component: () => import('../views/PointsRecordView.vue'),
    },
    {
      path: '/points-details',
      name: 'points-details',
      meta: { requiresAuth: true },
      component: () => import('../views/PointsDetailsView.vue'),
    },
    {
      path: '/edit-profile',
      name: 'editProfile',
      meta: { requiresAuth: true },
      component: () => import('../views/EditProfileView.vue'),
    },
    {
      path: '/share-friends',
      name: 'shareFriends',
      meta: { requiresAuth: true },
      component: () => import('../views/ShareFriendsView.vue'),
    },
    {
      path: '/wallet',
      name: 'wallet',
      meta: { requiresAuth: true },
      component: () => import('../views/WalletView.vue'),
    },
    {
      path: '/recharge-record',
      name: 'rechargeRecord',
      meta: { requiresAuth: true },
      component: () => import('../views/RechargeRecordView.vue'),
    },
    {
      path: '/withdraw-record',
      name: 'withdrawRecord',
      meta: { requiresAuth: true },
      component: () => import('../views/WithdrawRecordView.vue'),
    },
    {
      path: '/bank-card',
      name: 'bankCard',
      meta: { requiresAuth: true },
      component: () => import('../views/BankCardView.vue'),
    },
    {
      path: '/footprint',
      name: 'footprint',
      meta: { requiresAuth: true },
      component: () => import('../views/FootprintView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
    {
      path: '/about-us',
      name: 'aboutUs',
      component: () => import('../views/AboutUsView.vue'),
    },
    {
      path: '/privacy-policy',
      name: 'privacyPolicy',
      component: () => import('../views/PrivacyPolicyView.vue'),
    },
    {
      path: '/follow-list',
      name: 'followList',
      meta: { requiresAuth: true },
      component: () => import('../views/FollowListView.vue'),
    },
    {
      path: '/collection',
      name: 'collection',
      meta: { requiresAuth: true },
      component: () => import('../views/CollectionView.vue'),
    },
    {
      path: '/watch-history',
      name: 'watchHistory',
      meta: { requiresAuth: true },
      component: () => import('../views/WatchHistoryView.vue'),
    },
    {
      path: '/account-details',
      name: 'accountDetails',
      meta: { requiresAuth: true },
      component: () => import('../views/AccountDetailsView.vue'),
    },
    {
      path: '/promotion-record',
      name: 'promotionRecord',
      meta: { requiresAuth: true },
      component: () => import('../views/PromotionRecordView.vue'),
    },
    {
      path: '/activity/:id',
      name: 'activityDetail',
      component: () => import('../views/ActivityDetailView.vue'),
    },
    {
      path: '/my-agent',
      name: 'myAgent',
      meta: { requiresAuth: true },
      component: () => import('../views/MyAgentView.vue'),
    },
    {
      path: '/team-management',
      name: 'teamManagement',
      meta: { requiresAuth: true },
      component: () => import('../views/TeamManagementView.vue'),
    },
    {
      path: '/agent-report',
      name: 'agentReport',
      meta: { requiresAuth: true },
      component: () => import('../views/AgentReportView.vue'),
    },
    {
      path: '/agent-recruitment',
      name: 'agentRecruitment',
      component: () => import('../views/AgentRecruitmentView.vue'),
    },
    {
      path: '/bonus-description',
      name: 'bonusDescription',
      component: () => import('../views/BonusDescriptionView.vue'),
    },
    {
      path: '/creative-library',
      name: 'creativeLibrary',
      component: () => import('../views/CreativeLibraryView.vue'),
    },
    {
      path: '/tutorial-detail/:id',
      name: 'tutorialDetail',
      component: () => import('../views/TutorialDetailView.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const invite = captureInviteCode(to)
  if (invite) {
    console.log('路由守卫捕获邀请码:', invite)
  }

  if (to.meta.requiresAuth && !isLoggedIn()) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
    return
  }

  next()
})

router.afterEach((to) => {
  if (!sessionStorage.getItem('initialRouteName') && to.name) {
    sessionStorage.setItem('initialRouteName', String(to.name))
  }
})

export default router
