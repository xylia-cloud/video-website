# 影视网站前端项目

## 项目说明
这是一个基于Vue 3和Vite构建的影视网站前端项目。

## 开发环境
```bash
# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

## 生产环境部署说明

### 打包
```bash
# 构建生产环境版本
yarn build
```

### 部署到服务器
将构建好的`dist`目录内容上传到服务器的网站根目录。

### 重要：API代理配置
本项目使用了相对路径`/api`访问后端接口。在生产环境中，需要在Web服务器上配置API代理，将`/api`路径的请求转发到实际的API服务器。

#### Nginx代理配置示例
在服务器上配置Nginx反向代理，将`/api`路径下的请求转发到实际的API服务器`jmlapp.vip`：

```nginx
server {
    listen 80;
    server_name jiji8.cc;  # 你的网站域名

    # 前端静态文件
    location / {
        root /path/to/your/dist;  # 前端构建文件的实际路径
        index index.html;
        try_files $uri $uri/ /index.html;  # 支持前端路由
    }

    # API代理
    location /api/ {
        proxy_pass http://jmlapp.vip/;  # 注意这里API服务器地址，以/结尾会去掉/api前缀
        proxy_set_header Host jmlapp.vip;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache代理配置示例
如果使用Apache服务器，可以使用以下配置：

```apache
<VirtualHost *:80>
    ServerName jiji8.cc
    DocumentRoot /path/to/your/dist
    
    <Directory "/path/to/your/dist">
        AllowOverride All
        Require all granted
        FallbackResource /index.html
    </Directory>
    
    ProxyRequests Off
    ProxyPreserveHost Off
    
    <Location /api>
        ProxyPass http://jmlapp.vip
        ProxyPassReverse http://jmlapp.vip
    </Location>
</VirtualHost>
```

## 项目结构
- `src/` - 源代码目录
  - `api/` - API请求相关代码
  - `assets/` - 静态资源
  - `components/` - 可复用组件
  - `router/` - 路由配置
  - `stores/` - Pinia存储
  - `utils/` - 工具函数
  - `views/` - 页面视图组件
  - `App.vue` - 应用主组件
  - `main.ts` - 应用入口
- `public/` - 公共静态资源
- `vite.config.ts` - Vite配置文件

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
