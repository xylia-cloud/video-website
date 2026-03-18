import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'
import GameSecondaryView from '../views/GameSecondaryView.vue'
import LotteryDetailView from '../views/LotteryDetailView.vue'
import LotteryTouzhuRecordView from '../views/LotteryTouzhuRecordView.vue'
import LotteryHistoryView from '../views/LotteryHistoryView.vue'
import LiveView from '../views/LiveView.vue'
import ProfileView from '../views/ProfileView.vue'
import TagsView from '../views/TagsView.vue'
import TagDetailsView from '../views/TagDetailsView.vue'
import VideoDetailView from '../views/VideoDetailView.vue'
import RechargeView from '../views/RechargeView.vue'
import RechargeCallbackView from '../views/RechargeCallbackView.vue'
import VipRechargeView from '../views/VipRechargeView.vue'
import WithdrawView from '../views/WithdrawView.vue'
import EditProfileView from '../views/EditProfileView.vue'
import ShareFriendsView from '../views/ShareFriendsView.vue'
import WalletView from '../views/WalletView.vue'
import AccountDetailsView from '../views/AccountDetailsView.vue'
import RechargeRecordView from '../views/RechargeRecordView.vue'
import WithdrawRecordView from '../views/WithdrawRecordView.vue'
import BankCardView from '../views/BankCardView.vue'
import FootprintView from '../views/FootprintView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import SearchView from '../views/SearchView.vue'
import AboutUsView from '../views/AboutUsView.vue'
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue'
import GameRecordView from '../views/GameRecordView.vue'
import GamePlayView from '../views/GamePlayView.vue'
import FollowListView from '../views/FollowListView.vue'
import CollectionView from '../views/CollectionView.vue'
import WatchHistoryView from '../views/WatchHistoryView.vue'
import PromotionRecordView from '../views/PromotionRecordView.vue'
import MyAgentView from '../views/MyAgentView.vue'
import TeamManagementView from '../views/TeamManagementView.vue'
import AgentReportView from '../views/AgentReportView.vue'
import CustomerServiceView from '../views/CustomerServiceView.vue'
import AgentRecruitmentView from '../views/AgentRecruitmentView.vue'
import BonusDescriptionView from '../views/BonusDescriptionView.vue'
import CreativeLibraryView from '../views/CreativeLibraryView.vue'
import TutorialDetailView from '../views/TutorialDetailView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
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
      component: HomeView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/game',
      name: 'game',
      component: GameView,
    },
    {
      path: '/game/:topCategoryId/:primaryCategoryId',
      name: 'game-secondary',
      component: GameSecondaryView,
      props: true,
    },
    {
      path: '/game-play',
      name: 'game-play',
      component: GamePlayView,
    },
    {
      path: '/lottery/:primaryCategoryId',
      name: 'lottery-detail',
      component: LotteryDetailView,
      props: true,
    },
    {
      path: '/lottery-touzhu-record',
      name: 'lotteryTouzhuRecord',
      component: LotteryTouzhuRecordView,
    },
    {
      path: '/lottery-history',
      name: 'lotteryHistory',
      component: LotteryHistoryView,
    },
    {
      path: '/game-record',
      name: 'gameRecord',
      component: GameRecordView,
    },
    {
      path: '/live',
      name: 'live',
      component: LiveView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/tags',
      name: 'tags',
      component: TagsView,
    },
    {
      path: '/tag/:id',
      name: 'tagDetails',
      component: TagDetailsView,
    },
    {
      path: '/video/:id',
      name: 'videoDetail',
      component: VideoDetailView,
      props: (route) => ({
        ...route.params,
        invite: route.query.invite,
      }),
    },
    {
      path: '/recharge',
      name: 'recharge',
      component: RechargeView,
    },
    {
      path: '/recharge-callback',
      name: 'rechargeCallback',
      component: RechargeCallbackView,
    },
    {
      path: '/customer-service',
      name: 'customerService',
      component: CustomerServiceView,
    },
    {
      path: '/vip-recharge',
      name: 'vipRecharge',
      component: VipRechargeView,
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      component: WithdrawView,
    },
    {
      path: '/points-record',
      name: 'points-record',
      component: () => import('../views/PointsRecordView.vue'),
    },
    {
      path: '/points-details',
      name: 'points-details',
      component: () => import('../views/PointsDetailsView.vue'),
    },
    {
      path: '/edit-profile',
      name: 'editProfile',
      component: EditProfileView,
    },
    {
      path: '/share-friends',
      name: 'shareFriends',
      component: ShareFriendsView,
    },
    {
      path: '/wallet',
      name: 'wallet',
      component: WalletView,
    },
    {
      path: '/recharge-record',
      name: 'rechargeRecord',
      component: RechargeRecordView,
    },
    {
      path: '/withdraw-record',
      name: 'withdrawRecord',
      component: WithdrawRecordView,
    },
    {
      path: '/bank-card',
      name: 'bankCard',
      component: BankCardView,
    },
    {
      path: '/footprint',
      name: 'footprint',
      component: FootprintView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/about-us',
      name: 'aboutUs',
      component: AboutUsView,
    },
    {
      path: '/privacy-policy',
      name: 'privacyPolicy',
      component: PrivacyPolicyView,
    },
    {
      path: '/follow-list',
      name: 'followList',
      component: FollowListView,
    },
    {
      path: '/collection',
      name: 'collection',
      component: CollectionView,
    },
    {
      path: '/watch-history',
      name: 'watchHistory',
      component: WatchHistoryView,
    },
    {
      path: '/account-details',
      name: 'accountDetails',
      component: AccountDetailsView,
    },
    {
      path: '/promotion-record',
      name: 'promotionRecord',
      component: PromotionRecordView,
    },
    {
      path: '/activity/:id',
      name: 'activityDetail',
      component: () => import('../views/ActivityDetailView.vue'),
    },
    {
      path: '/my-agent',
      name: 'myAgent',
      component: MyAgentView,
    },
    {
      path: '/team-management',
      name: 'teamManagement',
      component: TeamManagementView,
    },
    {
      path: '/agent-report',
      name: 'agentReport',
      component: AgentReportView,
    },
    {
      path: '/agent-recruitment',
      name: 'agentRecruitment',
      component: AgentRecruitmentView,
    },
    {
      path: '/bonus-description',
      name: 'bonusDescription',
      component: BonusDescriptionView,
    },
    {
      path: '/creative-library',
      name: 'creativeLibrary',
      component: CreativeLibraryView,
    },
    {
      path: '/tutorial-detail/:id',
      name: 'tutorialDetail',
      component: TutorialDetailView,
    },
  ],
})

router.afterEach((to) => {
  if (!sessionStorage.getItem('initialRouteName') && to.name) {
    sessionStorage.setItem('initialRouteName', String(to.name))
  }
})

export default router
