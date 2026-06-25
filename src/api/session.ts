/** Lightweight auth/session exports for router & App shell */
export {
  isLoggedIn,
  isTokenExpired,
  getToken,
  getUserInfo,
  syncTokenExpiryWatcher,
  checkLoginRequired,
} from './core/auth-session'
