# DeepSeek 改造执行指南

本文件是给实施模型的任务说明，不是重新审查。详细风险说明见 [优化审查报告](./优化审查报告.md)。

## 任务目标与边界

在不改变公开视频浏览、正常登录、视频播放、充值入口和普通游戏 URL 启动体验的前提下，先完成本仓库可独立实施的 P0/P1 修复：

1. 禁止上游原始 HTML 在本站同源上下文执行。
2. 消除令牌、密码和订单数据的控制台/代理日志泄露，并修复本地 token 过期时间被资料刷新不断续期的问题。
3. 收敛外部 URL、iframe、缓存、sessionStorage 和请求超时/取消的基础能力。
4. 修复测试与 lint 基础设施，使后续修改有可验证的质量门禁。

本仓库是纯静态 Vue 前端；**HttpOnly Cookie、上游 token 服务端托管、支付/提现幂等、上游 token 从 URL 完全消失**需要一个 BFF 和部署权限，不能仅通过前端“假装完成”。实施模型必须把这部分保留为接口契约和待部署项，不能杜撰后端、不能猜测支付渠道或上游协议。

### 强制规则

- 先阅读 `docs/优化审查报告.md`，按本文阶段顺序实施；每阶段都运行指定验证命令。
- 不使用 `git reset --hard`、`git checkout --`、删除用户已有修改，尤其不要覆盖当前已修改的 `src/views/EditProfileView.vue`、`src/views/LoginView.vue`、`src/views/WithdrawView.vue`。
- 不再增加页面内直接 `fetch`；新增请求必须从 `src/api/core` 的统一能力进入。
- 不把 token、密码、身份证、银行卡、支付 URL 或完整 API 响应写入 `console`、URL、异常信息、缓存 key 或日志。
- 不使用 `document.write`、`innerHTML`、`v-html` 渲染任何上游/路由输入；不为“兼容游戏”恢复 raw HTML 模式。
- 所有外链和 iframe 必须经过协议/域名校验；allowed hosts 未配置时应安全失败，而不是允许全部。
- 对支付、提现、购买、资金归集不增加自动重试；任何 retry 仅用于幂等 GET。
- 不对 `public/proxy.php`、`nginx-config.conf` 的生产部署做静默假设。若修改其参考配置，需在提交说明中写明运维还需执行的动作。

## 分阶段实施任务

### A. P0：阻断同源 HTML 注入和不可信外链

#### A1. 创建统一 URL 校验工具

新增 `src/utils/external-url.ts`，对外导出：

```ts
export type ExternalTarget = 'ad' | 'payment' | 'game' | 'customer-service' | 'download'

export function parseAllowedExternalUrl(
  raw: string | undefined | null,
  target: ExternalTarget,
): URL | null

export function openAllowedExternalUrl(
  raw: string | undefined | null,
  target: ExternalTarget,
): Window | null
```

实现约束：

1. 空字符串、非字符串、控制字符、`javascript:`、`data:`、`blob:`、`file:`、非 `https:` 一律返回 `null`。
2. `URL` 解析失败返回 `null`，不能抛给模板层。
3. 域名白名单从 `import.meta.env.VITE_EXTERNAL_ALLOWED_HOSTS` 读取，格式为逗号分隔域名；按 target 可再配置 `VITE_GAME_ALLOWED_HOSTS`、`VITE_PAYMENT_ALLOWED_HOSTS`。仅精确域名或明确的子域匹配，禁止 `includes` 匹配。
4. 白名单为空时，外部目标一律拒绝；同源绝对 URL 可只在业务明确需要时允许。
5. `openAllowedExternalUrl` 必须调用 `window.open(url.href, '_blank', 'noopener,noreferrer')`，并额外设置 `opened.opener = null`（若窗口成功创建）。
6. 工具不得记录原始 URL；调用方失败时仅展示通用提示“链接不可用，请稍后重试”。

在 `.env.example`（新增，不能填真实域名或秘密）写明：

```dotenv
VITE_EXTERNAL_ALLOWED_HOSTS=example.com
VITE_GAME_ALLOWED_HOSTS=games.example.com
VITE_PAYMENT_ALLOWED_HOSTS=pay.example.com
```

真实生产域名应由部署方写入安全的环境配置。不要把上游 token、支付密钥放入 `VITE_*` 变量。

#### A2. 移除游戏 HTML 启动模式

修改 `src/views/GameSecondaryView.vue` 与 `src/views/GamePlayView.vue`：

1. 删除/停止使用 `launchMode === 'html'` 分支、`sessionStorage.setItem(htmlKey, launchHtml)`、`mode=html` 路由参数和 raw HTML 传递。
2. 删除 `GamePlayView` 中的 `gameHtml`、`htmlStorageKey`、`isHtmlLike`、`renderHtmlToIframe`、`bindPgExitInterceptor`、`document.open/write/close` 相关代码。
3. 上游返回 HTML 而不是可校验 URL 时：清除 loading，显示“当前游戏启动方式不安全，暂不支持”，留在原游戏页；不得把 HTML 转成 blob URL、data URL 或 `srcdoc`。
4. URL 模式在跳转前先调用 `parseAllowedExternalUrl(launchUrl, 'game')`。校验失败不跳转；成功后仅把已规范化的 `href` 传给 `GamePlayView`。
5. `GamePlayView` 读取 `route.query.url` 后再次校验，防止用户手工构造 hash 路由。校验失败 `router.replace('/game')`。
6. 游戏 iframe 至少使用 `sandbox="allow-forms allow-scripts allow-popups allow-presentation"`；**禁止** `allow-same-origin`、`allow-top-navigation`、`allow-popups-to-escape-sandbox`。权限 `allow` 仅保留经产品确认的最小项，默认删除 `clipboard-write` 与 `web-share`。
7. 若某游戏依赖同源、下载、弹窗逃逸等能力，不能以放宽 sandbox 的方式绕过。改用独立、无 Cookie、无 localStorage 的游戏子域；这属于 BFF/部署项。

验收命令和人工检查：

```sh
rg -n "document\.write|document\.open|srcdoc|launchMode === 'html'|game_html_" src
```

应无可执行匹配（注释中的历史说明也应删掉或改为安全设计说明）。在浏览器手工访问 `/#/game-play?mode=url&url=javascript:alert(1)` 和非白名单 HTTPS URL，页面必须回到游戏页且不执行脚本。

#### A3. 收敛支付、广告和客服外链

修改以下调用点，全部改为统一工具并处理 `null`：

- `src/components/AdBanner.vue`
- `src/components/VideoList.vue`
- `src/components/DomainPopup.vue`
- `src/components/SearchBar.vue`
- `src/views/HomeView.vue`
- `src/views/ProfileView.vue`
- `src/views/RechargeView.vue`
- `src/views/video-detail/composables/useVideoRecommend.ts`
- 其他 `rg -n "window\.open|location\.href" src` 找到的外部跳转点。

支付页的临时最小修复：`src/views/PaymentView.vue` 必须使用 `parseAllowedExternalUrl(..., 'payment')` 验证 query 中 URL，校验失败不渲染 iframe。**这只是拦截构造路由，不是支付 URL 的最终安全方案。** 最终方案见阶段 D 的 BFF 合约。

修改 `src/views/RechargeView.vue`：将

```vue
<div v-html="formatPlatformName(channel.name)" />
```

改为纯文本分段渲染，例如 `formatPlatformName` 返回 `name.split('$')`，模板用 `v-for` 渲染每段并插入 `<br>`。禁止使用手工 HTML 转义后再使用 `v-html`。

### B. P0/P1：会话、日志与本地存储

#### B1. 修复本地过期时间不断续期

重构 `src/api/core/auth-session.ts`，将当前 `setUserInfo` 的职责分离：

```ts
establishSession(userInfo: UserInfo, options: { isGuest: boolean }): void
updateStoredProfile(patch: Partial<UserInfo>): UserInfo | null
clearSession(): void
```

约束：

1. 只有 `userLogin` 和 `touristLogin` 成功后调用 `establishSession`，它们可以设置 token、`TOKEN_EXPIRE_KEY`、游客标记并启动 expiry watcher。
2. `refreshUserPoints`、头像上传、资料修改只能调用 `updateStoredProfile`，绝不能写 `TOKEN_EXPIRE_KEY`、重置 watcher 或改变 `isGuest`。
3. 迁移期间可保留旧 `setUserInfo` 作为已废弃兼容包装，但必须要求显式 `{ session: 'new' | 'preserve' }`；默认值只能是 `preserve`，防止新调用意外续期。
4. 用户信息 JSON 中的 token 仍是过渡风险；不要宣称这已完成 token 安全。只有 BFF Cookie 化后，才能从浏览器 storage 移除 token。
5. `clearSession` 需要清除 `homeViewState`、`tabStates`、`pending_payment_order`、`homeScrollPosition` 等本项目定义的 session key；不要调用 `sessionStorage.clear()`，避免误删第三方/未来 key。
6. 使用常量集中声明存储 key。新增 `src/api/core/storage.ts`，封装 `readJson`、`writeJson`、`remove`，包含 `try/catch`、schema/version/过期检查的基础能力。

需更新调用方：

- `src/api/modules/auth-login.ts`：登录和游客登录用 `establishSession`；登出用 `clearSession`。
- `src/api/modules/user-points.ts`：积分成功后用 `updateStoredProfile`。
- `src/api/modules/user-profile.ts`：头像与资料成功后用 `updateStoredProfile`。
- `src/stores/user.ts`：只在 storage 更新后 hydrate；不得自行续期。

必须新增单元测试：登录建立 12 小时 expiry；在 11 小时后刷新积分/资料不改变该 expiry；登出清理所有定义的 session key。

#### B2. 删除敏感日志并建立最小日志工具

新增 `src/utils/logger.ts`：

- 生产环境默认 no-op；开发环境只接受白名单上下文。
- `debug/info/warn/error` 不接受任意 `unknown` 原始对象。传入对象时递归遮蔽键名包含 `token`、`pass`、`password`、`authorization`、`cookie`、`uid`、`account`、`phone`、`email`、`payUrl` 的字段。
- 不记录 FormData、URLSearchParams、完整响应、完整用户资料；错误只记录 `name`、受限长度的 `message`、request ID 和接口名。

优先替换并删除以下敏感输出：

- `src/api/modules/auth-login.ts` 中的表单、登录、游客、退出日志；
- `src/api/modules/payment.ts` 的订单参数/响应日志；
- `src/api/modules/user-profile.ts` 的 query 和用户资料日志；
- `src/views/GameSecondaryView.vue` 的 `{ uid, token, keyword }` 日志；
- `vite.config.ts` 代理请求的完整 URL 日志；
- `public/proxy.php` 的完整目标 URL、转发头、错误回显。

完成后执行：

```sh
rg -n -i "console\.(log|warn|error).*token|console\.(log|warn|error).*formData|console\.(log|warn|error).*queryParams|token.*console" src vite.config.ts public
```

除脱敏工具测试外应无命中。不要仅依赖生产构建的 `drop_console`，因为开发、预览、代理和服务端日志仍可能泄露秘密。

### C. P1：缓存、请求基础设施和首页 session

#### C1. 让 TTL 缓存有上限

重写 `src/api/core/cache.ts` 中的 Map 缓存工厂，或新增 `src/api/core/lru-cache.ts`。不需要引入新依赖，使用 `Map` 即可：

1. 条目结构至少有 `data`、`cachedAt`、`expiresAt`、`lastAccessedAt`；可选 `sizeHint`。
2. `get` 时删除过期项，并通过 delete/set 移到 Map 尾部作为最近使用。
3. `set` 前/后执行 sweep，超过 `maxEntries` 时从最旧项开始淘汰。
4. 建议初值：广告 12、详情 50、详情推荐 50。若推荐响应包含用户态，key 必须加入 `uid`；若明确公开，显式命名 `public:` 前缀。
5. 保留 in-flight 去重。失败请求必须在 `finally` 清除 in-flight，不得写入失败缓存。
6. 导出 `getStats()`，仅在开发工具/测试中使用，不能输出缓存业务数据。

测试：添加“50+ 条详情后长度不超过 50”“过期条目读取后删除”“同 key 并发请求只执行一次”“登录身份改变后私有 key 不复用”。

#### C2. 合并首页 session 缓存

在 `HomeView.vue`：

1. 只写 `homeViewState`；停止重复写 `tabStates`。读取时可兼容一次旧 `tabStates`，成功迁移后删除旧 key。
2. 添加 payload 版本、`expiresAt`、最近访问时间；最多保存最近 3 个 tab，每个 tab 最多保留两页或 40 条非广告视频。
3. 使用 `storage.ts` 解析；JSON 失败、版本不匹配、过期时静默删除并重新请求。
4. `clearSession` 必须删掉这个 key。
5. 不在每一个点击/滚动时同步 `JSON.stringify` 大数组。只在 `onBeforeUnmount`、路由离开以及 500 ms 防抖后的稳定状态保存。

### D. P1：统一请求层与 BFF 接口契约

#### D1. 先在前端建立 `apiClient`

新增 `src/api/core/client.ts`。第一步不要求一次迁移 68 个请求，但新代码和每次修改到的模块都必须使用它。

建议接口：

```ts
type RequestOptions<T> = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: HeadersInit
  body?: BodyInit | null
  signal?: AbortSignal
  timeoutMs?: number
  parse?: (input: unknown) => T
  requestName: string
  retry?: 'never' | 'safe-get'
}

export class ApiError extends Error {
  kind: 'abort' | 'timeout' | 'network' | 'http' | 'business' | 'invalid-response' | 'auth'
  status?: number
  requestId: string
}
```

实现要求：

- 默认超时 15 秒，使用 `AbortController`；保留传入 signal，页面卸载/筛选变化可取消。
- 仅 `method === 'GET' && retry === 'safe-get'` 可重试最多 2 次，退避加随机抖动；4xx、abort、schema 错误不重试。
- 非 2xx 响应体最多读取有限长度用于错误摘要，不能把完整响应塞进 `Error.message`。
- 使用安全 JSON 解析，返回非 JSON 时抛出 `invalid-response`。
- 认证失败统一触发一次会话失效处理，避免每个模块各自弹窗。
- client 不应偷偷把 token 加入 URL；在 BFF 就绪前，保留旧上游契约的 query token 调用，但标记 `// TODO(bff-token-migration)`，不要错误地改为 header 后造成上游接口失效。

迁移优先级：

1. `video.ts`、`content.ts`、`user-points.ts`；
2. `payment.ts`、`withdraw.ts`、`user-profile.ts`；
3. `GameView.vue`、`GameSecondaryView.vue`、`LotteryDetailView.vue`、`TeamManagementView.vue` 等页面内 fetch，迁入对应 `src/api/modules` 或 `src/features/*/api`。

每个筛选/搜索 composable 保存自己的 controller，在新请求前 `abort()` 前一个；`AbortError` 不显示为用户错误。

#### D2. BFF 必须提供的契约（需要后端/运维确认）

不要在当前前端仓库伪造这些接口；应由后端服务实现并与上游协议联调：

| 前端接口 | 方法 | BFF 行为 |
| --- | --- | --- |
| `/bff/auth/login` | POST | 校验输入，向上游登录；把上游 token 存服务端会话，设置 HttpOnly Cookie；响应不返回上游 token。 |
| `/bff/auth/logout` | POST | 使本站会话和上游 token 失效，清除 Cookie。 |
| `/bff/me`、`/bff/wallet` | GET | 从服务端会话取得上游凭据；返回已 schema 化的资料/余额。 |
| `/bff/payments/orders` | POST | 校验金额/渠道，要求 `Idempotency-Key`，保存订单与状态；不把支付 URL 长期放入前端路由。 |
| `/bff/withdrawals` | POST | 幂等、鉴权、参数校验、审计。 |
| `/bff/games/launch` | POST | 返回短期 `launchId` 与已白名单 URL；拒绝 HTML。 |
| `/bff/games/launch/:id` | GET | 校验归属与过期；返回一次性启动信息或 302 到已白名单地址。 |

BFF 安全约束：服务端上游 token 只进加密会话/密钥存储；日志使用 request ID；支付/提现持久化幂等键；同源 CORS；限流；请求体大小限制；上游主机、路径和 service 名称白名单。

### E. 部署参考配置（须由运维实施）

如果 `nginx-config.conf` 或 `public/proxy.php` 被生产使用，实施模型可提交一个单独、清晰的配置改动，但必须提醒运维完成部署验证：

1. 把两处 `proxy_ssl_verify off` 改为 `on`，配置可信 CA 和 SNI；PHP cURL 同样开启 peer/host verify。
2. 同源前端无需 CORS 响应头；跨域时只回显明确 allowlist origin，且只在确有 cookie 场景时开启 credentials。禁止 `*` 与 credentials 并存。
3. 删除 PHP `debug=test` 分支和 `public/test-config.html` 的生产发布；移除完整 URL/headers/response 的 `error_log`。
4. 反代路由应改为明确 endpoint/service allowlist，不做“任意 `/api/*` / service 透传”；只允许 GET/POST，限制请求体大小并在 Nginx `http` 块配置限流。
5. JSON API 使用 buffering；只让真实 HLS/流媒体路径关闭 buffering。公开只读内容可在代理/BFF 层短缓存，用户和资金接口不得共享缓存。
6. 为 hash 静态资源配置 `Cache-Control: public, max-age=31536000, immutable`；HTML 使用 no-cache；部署前执行干净构建，确保 zip、日志、调试页不在发布目录。

## 测试和 CI 改造

### 修复测试配置

`vitest.config.ts` 不应直接复用完整 `vite.config.ts` 工厂，因为测试加载了与页面运行无关的开发代理/自动组件配置并已启动失败。改为测试专用的最小配置：Vue 插件、`@` alias、`jsdom`、排除 e2e。若某个组件确实依赖 Vant 自动导入，则在测试中显式注册所需 Vant 组件或补充专用插件配置，不能通过忽略启动错误解决。

`playwright.config.ts` 的开发 `baseURL`、`webServer.port` 应与 `vite.config.ts` 的 3001 一致；CI preview 保持实际 preview 端口。用真实页面断言替换 `You did it!`，例如首页的搜索输入框、底部导航或明确 `data-testid`。

在 `package.json` 拆分脚本：

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test:unit": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

不要让 CI 运行带 `--fix` 的 lint。修复现有 156 个 lint 错误时，优先移除无用导入/变量、消除 `any`、补上断言；不要通过大范围关闭规则来获得绿灯。

### 每阶段最低验证命令

```sh
npm run type-check
npm run lint
npm run test:unit
npm run test:e2e
npm run build
git diff --check
rg -n "document\.write|document\.open|srcdoc|v-html" src
rg -n -i "token=.*(\?|&)|[?&]token=|console\.(log|warn|error).*token" src public vite.config.ts
```

`npm run build` 会更新被忽略的 `dist/`，实施模型应在确认不提交构建产物后执行；如果项目发布需要 `dist`，由发布流程生成而非手工维护。

## 可直接交给 DeepSeek 的提示词

```text
你正在修改 Vue 3/Vite 项目。先完整阅读 docs/优化审查报告.md 和 docs/DEEPSEEK改造执行指南.md。

仅实施执行指南的阶段 A、B、C、测试配置修复；阶段 D 的 apiClient 只搭建基础能力并迁移 video/content/user-points，BFF 仅编写接口契约文档，不创建假后端。不要实施需要未知支付/上游协议的改动。

硬性要求：
1. 绝不使用 document.write、srcdoc、v-html 处理上游或路由输入；删除游戏 HTML 启动模式，HTML 响应安全失败。
2. 新增 src/utils/external-url.ts，对游戏、支付、广告、客服外链实施 https + 显式域名白名单校验；未配置白名单时拒绝外链。
3. 将 auth-session 拆为建立会话与更新资料，刷新积分/头像/资料不得改变 TOKEN_EXPIRE_KEY。
4. 不在 URL、console 或错误信息中写 token、密码、订单、完整响应；不要只依赖生产 drop_console。
5. 为内存缓存加 LRU 容量和 TTL 淘汰；首页 session 只保留一个版本化 key。
6. 新代码不得增加页面内直接 fetch；请求只经 apiClient。不得给支付、提现、购买、资金归集加自动 retry。
7. 不覆盖工作区已有的用户修改，不运行破坏性 git 命令，不提交 dist。
8. 补充或更新测试，并依次运行 type-check、lint、unit、e2e、build、git diff --check。若测试因上游网络而不能执行，说明确切原因，不能伪造通过。

每完成一个阶段，汇报：修改文件、行为变化、风险/兼容性影响、命令结果，以及尚需后端/运维完成的前置条件。
```

## 实施完成定义

阶段 A–C 完成后，必须同时满足：

- 代码中不存在执行上游 HTML 的路径，任何非法/非白名单外链均安全失败。
- 登录时间只由登录/续期动作设置；资料与积分刷新不再改变 expiry。
- 详情、广告缓存有 TTL 与容量上限；首页 session 不再双写且可过期清理。
- 已迁移模块使用统一 client，支持超时和取消；支付/提现类无自动重试。
- 生产/开发/代理日志中不输出敏感字段；参考代理配置已给出需运维执行的安全改动。
- `type-check`、只读 `lint`、单元测试、E2E、构建均有真实输出；遗留失败需列出根因和后续任务，不能隐藏。

