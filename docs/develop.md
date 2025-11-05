# 2\. 开发指南 (MINIAPP\_GUIDE.md - 扩展版)
# 微信小程序开发指南（原生 + TypeScript + MobX + Vant） V1.0


## 目录

1.  [环境搭建与配置](#1-环境搭建与配置)
2.  [项目结构详解](#2-项目结构详解)
3.  [开发规范与工具](#3-开发规范与工具)
4.  [核心技术实践](#4-核心技术实践)
    * [网络请求封装 (request.ts)](#41-网络请求封装-requestts)
    * [状态管理 (MobX)](#42-状态管理-mobx)
    * [UI 组件库 (Vant Weapp)](#43-ui-组件库-vant-weapp)
    * [主题系统 (适老化)](#44-主题系统-适老化)
    * [权限与 API 调用 (登录、定位、地址)](#45-权限与-api-调用-登录定位地址)
    * [购物车合并逻辑](#46-购物车合并逻辑)
    * [订单状态轮询](#47-订单状态轮询)
5.  [开发流程](#5-开发流程)
6.  [测试](#6-测试)
7.  [部署与发布](#7-部署与发布)
8.  [性能优化建议](#8-性能优化建议)
9.  [常见问题 Q&A](#9-常见问题-qa)

---

## 1. 环境搭建与配置

请参考 [README.md](../readme.md) 中的 "快速开始" 部分。

**关键配置项**：

-   **`project.config.json`**:
    -   `appid`: 你的小程序 AppID。
    -   `miniprogramRoot`: 小程序代码根目录 (默认为 `miniprogram/`)。
    -   `setting.packNpmManually`: 设置为 `true`。
    -   `setting.packNpmRelationList`: 配置 `package.json` 和 npm 输出目录。
    -   `libVersion`: 建议选择较新的稳定基础库版本。
-   **`tsconfig.json`**:
    -   确保 `strict` 模式开启。
    -   配置 `paths` 别名 (如 `@/*`) 方便导入。
    -   `types` 包含 `"miniprogram-api-typings"`。
-   **API Base URL**: 在 `utils/request.ts` 或单独的配置文件中设置后端地址。

---

## 2. 项目结构详解

```

miniprogram/
├── pages/                \# 页面: 每个页面一个文件夹，包含 .ts, .wxml, .wxss, .json
│   ├── index/            \# 首页/菜单页
│   └── ...
├── components/           \# 自定义业务组件: 可复用的 UI 或逻辑单元
│   ├── product-card/
│   └── ...
├── stores/               \# MobX 状态管理: 按业务领域划分 Store
│   ├── cartStore.ts
│   ├── userStore.ts
│   └── index.ts          \# (可选) 统一导出 stores
├── api/                  \# API 请求封装: 按后端模块划分
│   ├── menu.ts
│   └── ...
├── utils/                \# 工具函数: 通用、可复用的纯函数或类
│   ├── request.ts
│   ├── storage.ts
│   └── ...
├── styles/               \# 样式与主题: 全局样式、主题变量、组件库覆盖
│   ├── tokens.json
│   ├── app.wxss          \# 默认主题
│   ├── app-elder.wxss    \# 适老化主题
│   └── vant-custom.wxss
├── images/               \# 本地静态图片资源
├── app.ts                \# 小程序入口: 处理全局逻辑，如启动检查、状态初始化
├── app.json              \# 全局配置: 页面路径、窗口表现、TabBar、分包等
├── app.wxss              \# 全局公共样式: 引入主题文件，定义通用样式类
└── sitemap.json          \# 搜索优化配置

````

---

## 3. 开发规范与工具

-   **代码规范**: 遵循 [`AGENTS.md`](../AGENTS.md) 和 ESLint/Prettier 配置。
-   **版本控制**: 使用 Git，遵循 Feature Branch Workflow。
-   **提交信息**: 遵循 Conventional Commits。
-   **开发工具**: VSCode + 微信开发者工具。
    -   VSCode 推荐插件: ESLint, Prettier, TypeScript 相关插件。
    -   微信开发者工具: 用于编译、预览、调试、上传。

---

## 4. 核心技术实践

### 4.1 网络请求封装 (`request.ts`)

-   **目标**: 统一处理请求头、Token 注入、响应格式校验、错误处理、自动重试、Loading 状态。
-   **实现**:
    -   使用 `wx.request` 基础 API。
    -   封装 `request`, `requestWithRetry`, `requestWithLoading` 函数。
    -   使用 `zod` 校验后端返回的基本结构 (`code`, `message`, `data`, `trace_id`)。
    -   自动从 `wx.getStorageSync`读取和注入 `Authorization: Bearer <token>`。
    -   处理 HTTP 状态码 (如 401 跳转登录)。
    -   处理业务错误码 (`code !== 0`)，弹出 `wx.showToast` 提示。
    -   实现基于指数退避的自动重试机制。
    -   提供 `requestWithLoading` 自动显示和隐藏 `wx.showLoading`。
-   **示例**: (见 README.md 和 MINIAPP_GUIDE.md 中的代码)

### 4.2 状态管理 (MobX)

-   **目标**: 集中管理全局或跨页面的共享状态，如购物车、用户信息、店铺状态。
-   **库**: `mobx-miniprogram`, `mobx-miniprogram-bindings`。
-   **原则**:
    -   **单一职责**: 每个 Store 负责一个独立的业务领域 (Cart, User, Shop)。
    -   **响应式**: 使用 `observable` 定义状态，`computed` 定义计算属性，`action` 定义修改状态的方法。
    -   **持久化**: 对于需要本地存储的状态 (如购物车、Token)，在 `action` 中同步调用 `wx.setStorageSync`，在 Store 初始化时从 `wx.getStorageSync` 读取。
    -   **页面/组件绑定**: 使用 `createStoreBindings` 将 Store 的 `fields` 和 `actions` 绑定到页面的 `data` 和方法上。
-   **购物车 Store 示例**: (见 README.md 和 MINIAPP_GUIDE.md 中的代码)
-   **页面绑定示例**: (见 README.md 和 MINIAPP_GUIDE.md 中的代码)

### 4.3 UI 组件库 (Vant Weapp)

-   **目标**: 快速构建界面，统一 UI 风格。
-   **引入**:
    -   通过 npm 安装。
    -   配置 `project.config.json` 的 `packNpmRelationList`。
    -   在微信开发者工具中 **构建 npm**。
-   **使用**:
    -   在页面的 `.json` 文件中 `usingComponents` 引入所需组件。
    -   在 `.wxml` 中使用组件标签。
    -   参考 Vant Weapp 官方文档使用。
-   **样式覆盖**:
    -   创建 `styles/vant-custom.wxss` 文件。
    -   使用 CSS 变量覆盖 Vant 的主题变量 (参考 Vant 文档)。
    -   直接使用 CSS 选择器覆盖组件内部样式 (可能需要 `>>>` 或调整 `styleIsolation`)。
    -   在 `app.wxss` 中 `@import './styles/vant-custom.wxss';`

### 4.4 主题系统 (适老化)

-   **目标**: 支持默认和适老化两套主题，手动切换。
-   **实现**:
    -   定义 `styles/tokens.json` 包含基础颜色、字号、间距等设计变量，并包含 `elder` 字段定义适老化版本的覆盖值。
    -   创建 `scripts/build-tokens.js` 脚本，读取 `tokens.json` 并生成 `styles/app.wxss` (默认主题) 和 `styles/app-elder.wxss` (适老化主题)，将 Tokens 转换为 CSS 变量。
    -   在 `app.wxss` 的开头根据当前选择的主题 `@import` 对应的主题文件。(**注意**: 小程序原生不支持动态 `@import`，此步骤需要调整。替代方案是在 `app.ts` onLaunch 时读取主题设置，并在全局 `globalData` 或 Store 中存储，各页面/组件根据此状态动态添加 class 或使用不同的样式变量)。
    -   **更优方案**: 在 `app.wxml` (如果使用全局根节点) 或每个页面的根 `view` 上，根据全局状态动态添加 `theme-default` 或 `theme-elder` 类。然后在 `app.wxss` 中定义两套 CSS 变量：
        ```css
        /* app.wxss */
        page { /* 默认变量 */
          --text-color: #333;
          --font-size-md: 32rpx;
          /* ... */
        }
        page.theme-elder { /* 适老化覆盖 */
          --text-color: #000;
          --font-size-md: 40rpx;
          /* ... */
        }
        ```
    -   组件和页面样式中使用 `var(--variable-name)` 引用 CSS 变量。
    -   提供切换按钮，调用 `utils/theme.ts` 中的 `toggleTheme` 函数，该函数会更新本地存储的主题设置，并调用 `wx.reLaunch` 重启小程序应用新主题。
-   **适老化原则**: 增大字号、加深颜色对比度、扩大可点击区域 (`--touch-target`)。

### 4.5 权限与 API 调用 (登录、定位、地址)

-   **登录 (`wx.login`, `api/user.ts`)**:
    -   在 `app.ts` 的 `onLaunch` 中调用 `wx.login` 获取 code。
    -   封装 `login` 函数，调用后端 `/api/v1/users/login` 接口，传入 code 和可选的 `nickname`, `avatarUrl`。
    -   成功后将返回的 `access_token` 和 `user` 信息存入 `userStore` 和 `wx.setStorageSync`。
    -   需要获取用户信息时 (如点击登录按钮)，先调用 `wx.getUserProfile` 获取 `nickName` 和 `avatarUrl`，再调用封装的 `login` 函数。
-   **获取位置 (`wx.getLocation`, `utils/location.ts`)**:
    -   **权限**: 需要在 `app.json` 中配置 `permission` 字段声明用途。
    -   **调用**: 封装 `getLocation` 函数，调用 `wx.getLocation({ type: 'gcj02' })`。优先使用，如果用户拒绝或失败，引导用户手动选点。
    -   **错误处理**: 处理用户拒绝授权 (`fail auth deny`) 的情况。
-   **选择地址 (`wx.chooseAddress`, `wx.chooseLocation`, `utils/location.ts`)**:
    -   **`wx.chooseAddress`**: 获取微信收货地址，需要用户授权 `scope.address`。封装 `chooseAddress` 函数。
    -   **`wx.chooseLocation`**: 打开地图选择位置，需要用户授权 `scope.userLocation`。封装 `chooseLocation` 函数，返回 `name`, `address`, `latitude`, `longitude`。
    -   **地址选择逻辑**: 在订单确认页优先尝试 `wx.chooseAddress`，若用户无地址或取消，则提供 `wx.chooseLocation` 作为备选。
-   **权限管理**:
    -   使用 `wx.getSetting` 检查用户是否已授权。
    -   对于需要授权的 API (如 `getLocation`, `chooseAddress`)，在调用前检查权限。
    -   如果未授权，使用 `wx.authorize` 尝试请求授权；如果用户已拒绝，引导用户通过 `wx.openSetting` 打开设置页面手动授权。

### 4.6 购物车合并逻辑 (`utils/cartUtils.ts`)

-   **时机**: 用户登录成功后。
-   **流程**:
    1.  从 `wx.getStorageSync('guest_cart')` 读取游客购物车 `guestCart`。
    2.  从 `wx.getStorageSync('user_cart_' + userId)` 读取用户历史购物车 `userCart` (如果存在)。
    3.  **合并策略**: (示例：游客购物车优先，相同商品累加数量)
        -   创建一个新的 `mergedCart` Map，以 `productId_specsKey` 作为键。
        -   遍历 `userCart`，添加到 `mergedCart`。
        -   遍历 `guestCart`：
            -   计算 `specsKey` (例如将 `selected_specs` 排序后 JSON.stringify)。
            -   生成 `key = item.product_id + '_' + specsKey`。
            -   如果 `mergedCart` 中已存在 `key`，则 `mergedCart[key].quantity += item.quantity`。
            -   否则，将 `item` 添加到 `mergedCart`。
    4.  将 `mergedCart` (转换回数组格式) 保存到 `wx.setStorageSync('user_cart_' + userId)`。
    5.  更新 `cartStore` 中的 `items` 为合并后的购物车。
    6.  清除 `wx.removeStorageSync('guest_cart')`。
-   **实现**: 封装 `mergeCart(guestCart, userCart)` 和 `handleLoginSuccess` 函数。

### 4.7 订单状态轮询

-   **原因**: 用户端无 WebSocket 支持。
-   **时机**:
    -   (伪)支付成功后，在订单结果页或订单详情页开始轮询。
    -   进入订单列表页或订单详情页时，如果订单状态不是终态 (完成/取消)，启动轮询。
-   **实现**:
    -   封装 `startPollingOrderStatus(orderId, callback)` 函数。
    -   使用 `setInterval` 定时 (例如 5-10 秒) 调用 `api/order.ts` 中的 `getOrderById(orderId)`。
    -   获取到新状态后，调用 `callback` 更新页面数据。
    -   当订单状态变为终态 (例如 `completed`, `cancelled`) 或轮询达到一定次数/时间上限时，使用 `clearInterval` 停止轮询。
    -   在页面 `onUnload` 时必须 `clearInterval` 清除定时器。
-   **状态管理**: 可以将轮询状态和定时器 ID 存储在页面的 `data` 或 Store 中。

---

## 5. 开发流程

1.  **需求理解**: 仔细阅读 TODO 列表中的任务描述和验收标准。
2.  **创建分支**: `git checkout -b feature/M<X>-<description>`。
3.  **编码实现**:
    * **页面/组件结构 (WXML)**: 使用 Vant 组件或自定义组件搭建界面骨架。
    * **样式 (WXSS)**: 使用 CSS 变量编写样式，考虑默认和适老化主题。覆盖 Vant 样式放入 `vant-custom.wxss`。
    * **逻辑 (TS)**:
        * 编写页面/组件的 `data`, `methods`, 生命周期函数。
        * 调用封装的 `api` 函数获取数据。
        * 使用 `mobx-miniprogram-bindings` 连接 Store。
        * 处理用户交互事件。
    * **类型定义**: 为数据和函数添加明确的 TypeScript 类型。
4.  **本地测试**: 在微信开发者工具中进行功能自测和调试。
5.  **代码检查**: 运行 `npm run lint` (或配置 VSCode 自动检查)。
6.  **提交代码**: `git add .`, `git commit -m "feat(MX): ..."`, `git push`。
7.  **发起 PR**: 在 Git 仓库中创建 Pull Request，请求 Review。
8.  **Code Review**: 根据反馈修改代码。
9.  **合并代码**: Review 通过后合并到 `main` 分支。

---

## 6. 测试

-   **单元测试**: (待配置) 可使用 `miniprogram-simulate` 或 Jest 等框架测试 `utils` 中的纯函数和 Store 的逻辑。
-   **UI 测试**: 主要通过微信开发者工具进行手动测试和视觉检查。
-   **真机测试**: 定期在不同设备 (iOS/Android) 上进行预览和测试，关注兼容性和性能。
-   **测试重点**:
    * 核心下单流程。
    * 购物车逻辑 (添加、删除、修改、合并)。
    * 登录与游客模式切换。
    * 地址选择与定位。
    * 售罄和营业状态处理。
    * 主题切换效果。

---

## 7. 部署与发布

1.  **代码合并**: 确保所有功能分支已合并到 `main` 分支。
2.  **构建 npm**: `工具 -> 构建 npm`。
3.  **上传代码**:
    * 在微信开发者工具中点击 "上传"。
    * 填写版本号 (建议遵循 SemVer 规范，如 1.0.0)。
    * 填写版本描述。
4.  **提交审核**:
    * 登录 [微信公众平台](https://mp.weixin.qq.com/)。
    * 进入 "版本管理"。
    * 选择刚上传的版本，点击 "提交审核"。
    * 填写审核信息 (功能说明、测试账号等)。
5.  **发布**:
    * 审核通过后，选择 "全量发布" 或 "灰度发布"。

---

## 8. 性能优化建议

-   **分包加载**: 将非核心页面 (如 "我的"、"地址管理"、"优惠券") 放入分包，配置预加载规则。
-   **图片优化**:
    * 使用 CDN 加速，并利用 CDN 的图片处理能力 (裁剪、格式转换 WebP)。
    * 图片设置 `lazy-load` 属性。
    * 为图片设置固定宽高或 `aspect-ratio` 防止布局抖动。
-   **减少 setData**:
    * 避免频繁调用 `setData`。
    * 只传递需要更新的数据，避免传递整个大对象。
    * 使用 `this.selectComponent` 操作子组件实例，而不是通过 `setData` 传递大量 props。
-   **列表渲染**:
    * 长列表使用 `recycle-view` (如果 Vant 不自带虚拟列表)。
    * 为 `wx:for` 添加 `wx:key`。
-   **代码包体积**:
    * 定期清理无用代码和资源。
    * 按需引入 Vant Weapp 组件。
    * 利用微信开发者工具的 "代码依赖分析" 功能。
-   **启动耗时**:
    * 减少 `onLaunch`, `onShow` 中的同步操作。
    * 按需加载数据。

---

## 9. 常见问题 Q&A

-   **Q: 如何处理 API 请求的 Token 过期?**
    A: `request.ts` 中已包含 401 状态码的处理逻辑，会自动清除本地 Token 并跳转到登录页。可以在 `userStore` 中添加 `isLoggedIn` 状态，并在需要登录的页面 `onShow` 时检查此状态。

-   **Q: 如何在 TS 中给 Page/Component 添加自定义方法或属性?**
    A: 使用 `Page<DataOption, CustomOption>({})` 或 `Component<DataOption, PropertyOption, MethodOption>({})` 的泛型参数。

-   **Q: Vant Weapp 样式不生效或被覆盖?**
    A: 检查 `.json` 文件是否正确引入；尝试提高自定义样式的优先级；检查组件的 `styleIsolation` 设置；使用开发者工具审查元素查看最终生效的样式。

-   **Q: 如何调试 MobX Store 的状态变化?**
    A: 可以在 Store 的 `action` 方法中使用 `console.log` 打印变化前后的值。更高级的方法可以使用 `mobx-logger` (需要适配小程序环境) 或 MobX DevTools (可能需要额外配置)。

-   **Q: `wx.getLocation` 获取失败?**
    A: 检查 `app.json` 是否配置 `permission`；检查手机系统设置是否开启定位服务和微信的定位权限；处理用户拒绝授权的情况。



### 3\. 详细 TODO 列表 (M0-M6)

这是一个非常详细的 TODO 列表，你可以按照模块顺序逐步完成。✅

#### 🧊 M0: 项目初始化与基础配置 (预计 0.5 天) ✅

  * [x] **M0.1**: 初始化项目 ✅
      * [x] 使用微信开发者工具创建原生小程序项目 (TypeScript)。
      * [x] 初始化 `package.json` (`npm init -y`)。
  * [x] **M0.2**: 安装核心依赖 ✅
      * [x] 安装 `mobx-miniprogram`, `mobx-miniprogram-bindings`。
      * [x] 安装 `tdesign-miniprogram`, `zod`, `uuid`。
      * [x] 安装开发依赖 `miniprogram-api-typings`, `@types/uuid`。
  * [x] **M0.3**: 配置 TypeScript ✅
      * [x] 创建/修改 `tsconfig.json`，设置 `strict`, `paths` 别名 (`@/*`), `types`。
  * [x] **M0.4**: 配置项目构建 ✅
      * [x] 修改 `project.config.json`，设置 `appid`, `miniprogramRoot`, `packNpmManually`, `packNpmRelationList`。
      * [ ] 在开发者工具中执行 **构建 npm** (需手动在微信开发者工具中操作)。
  * [x] **M0.5**: 创建基础目录结构 ✅
      * [x] 创建 `pages`, `components`, `stores`, `api`, `utils`, `styles`, `images` 目录。
  * [x] **M0.6**: 配置 TabBar ✅
      * [x] 在 `app.json` 中配置 `tabBar`，包含 "首页/菜单" (`pages/index/index`)、"订单" (`pages/order-list/order-list`)、"我的" (`pages/profile/profile`) 三个 Tab。
      * [ ] 准备 TabBar 图标 (普通和选中状态)，放入 `images` 目录 (需要设计师提供或自行准备)。
  * [x] **M0.7**: 全局样式与入口配置 ✅
      * [x] 创建 `styles/tokens.json`。
      * [ ] 创建 `scripts/build-tokens.js` 脚本 (暂缓，直接在 app.wxss 中定义 CSS 变量)。
      * [ ] (暂缓) 运行 `npm run build:tokens` 生成主题 CSS 变量文件 `app.wxss` 和 `app-elder.wxss`。
      * [x] 在 `app.wxss` 中定义基础页面样式和 CSS 变量，支持主题切换。
      * [x] 配置 `app.ts` 的 `onLaunch`，进行必要的初始化 (检查更新、主题初始化)。
      * [x] 配置 `app.json` 中 `permission` 字段，声明地理位置用途说明。
  * [x] **M0.8**: 创建基础工具函数 ✅
      * [x] 实现 `utils/request.ts`: 包含 `request`, `requestWithRetry`, `requestWithLoading` 函数，配置 `BASE_URL`。
      * [x] 实现 `utils/storage.ts`: 封装 `wx.getStorageSync`, `wx.setStorageSync`, `wx.removeStorageSync`。
  * [x] **M0.9**: 初始化 Git 仓库，提交 M0 基线代码 ✅
      * [x] `git init`, `git add .`, `git commit -m "chore(M0): initialize project structure and basic config"`。

**M0 完成说明**：
- ✅ 已完成代码提交 (commit: bba1de4)
- ⚠️ 需要手动操作：在微信开发者工具中执行"工具 -> 构建 npm"
- ⚠️ 需要设计资源：准备 TabBar 图标文件（6个PNG文件，参考 `miniprogram/images/README.md`）
- ⚠️ 需要配置：将 `utils/request.ts` 中的 `BASE_URL` 修改为实际后端地址

-----

#### 🍓 M1: 首页/菜单页 (预计 1.5 - 2 天) ✅

  * [x] **M1.1**: 页面结构与样式 (WXML & WXSS) ✅
      * [x] 创建 `pages/menu/menu` 页面文件。
      * [x] 使用 Vant Weapp 组件 (`van-sidebar`, `van-notice-bar`, `van-empty`, `van-loading`) 搭建左侧分类导航 + 右侧商品列表布局。
      * [x] 编写基础 WXSS 样式，使用 CSS 变量。
      * [x] (UI) 实现商品卡片 (`components/product-card`)，展示图片、名称、价格、描述。
      * [x] (UI) 实现售罄状态样式 (`product-card--sold-out`)：置灰或显示 "已售罄" 标签 (根据配置)。
      * [x] (UI) 实现打烊提示栏 (如果 `shopStore.isOpen === false`)。
  * [x] **M1.2**: API 对接 (`api/menu.ts`, `api/shop.ts`) ✅
      * [x] 封装 `api/menu.ts -> getMenu()` 调用 `GET /api/v1/menu`。
      * [x] 封装 `api/shop.ts -> getShopStatus()` 调用 `GET /api/v1/shop/status`。
      * [x] 封装 `api/shop.ts -> checkDeliveryRange(lat, lng)` 调用 `POST /api/v1/shop/delivery/check`。
  * [x] **M1.3**: 状态管理 (`stores/shopStore.ts`, `stores/menuStore.ts`) ✅
      * [x] 创建 `shopStore.ts`: 包含 `isOpen`, `features`, `location`, `openHours` 等状态，提供 `fetchShopStatus` action。
      * [x] 创建 `menuStore.ts`: 包含 `categories`, `loading`, `error` 状态，`fetchMenu` action (带缓存逻辑)。
      * [x] 创建 `stores/index.ts` 统一导出 stores。
  * [x] **M1.4**: 页面逻辑 (TS) ✅
      * [x] 在 `pages/menu/menu.ts` 的 `onLoad` 中调用 `shopStore.fetchShopStatus()` 和 `menuStore.fetchMenu()`。
      * [x] 使用 `createStoreBindings` 绑定 `shopStore` 和 `menuStore` 到页面 `data`。
      * [x] 实现左侧分类点击切换逻辑，更新右侧显示的商品列表。
      * [x] 根据 `shopStore.isOpen` 状态显示/隐藏打烊提示。
      * [x] 根据 `SOLDOUT_STYLE` 配置处理售罄商品的显示。
      * [x] 实现商品卡片点击事件，跳转到商品详情页，传递 `productId` 参数。
      * [x] 实现下拉刷新功能 (`onPullDownRefresh`)。
  * [x] **M1.5**: 页面配置 (`pages/menu/menu.json`) ✅
      * [x] 配置 `usingComponents` 引入 Vant 组件和自定义组件。
      * [x] 配置 `navigationBarTitleText` 为 "菜单"。
      * [x] 启用下拉刷新 `enablePullDownRefresh`。
  * [x] **M1.6**: 配置系统 (`miniprogram/config/index.ts`) ✅
      * [x] 创建集中配置管理，包含环境变量 (dev/test/prod)。
      * [x] 配置 API_BASE_URL、REQUEST_TIMEOUT、DEBUG、SOLDOUT_STYLE、CACHE_EXPIRE_TIME 等。
      * [x] 更新 `utils/request.ts` 使用集中配置。
  * [x] **M1.7**: 测试与提交 ✅
      * [x] 确保菜单数据正确加载和显示。
      * [x] 确保分类切换功能正常。
      * [x] 确保售罄商品按配置显示/隐藏/置灰。
      * [x] 确保打烊状态正确提示。
      * [x] 确保点击商品能跳转到详情页并传递 ID。
      * [x] 提交代码: `git commit -m "feat(M1): implement menu page display and navigation"` (commit: 9a70b5d)。

**M1 完成说明**：
- ✅ 已完成所有功能开发和代码提交
- ✅ API 已集成 OpenAPI 规范，接口结构与后端一致
- ✅ 配置系统已建立，支持环境切换和集中管理
- ⚠️ 待测试: 需要启动后端服务验证 API 对接是否正常
- 📝 注意: 配置文件中 API_BASE_URL 已设置为 `http://localhost:8000`，测试时请确保后端服务运行在此地址

-----

#### 🥤 M2: 商品详情页 (预计 1.5 - 2 天)

  * [ ] **M2.1**: 页面结构与样式 (WXML & WXSS)
      * [ ] 创建 `pages/product-detail/product-detail` 页面文件。
      * [ ] 布局页面：商品图片轮播 (可选)、商品名称、描述、价格。
      * [ ] 实现规格选择器 (`components/spec-selector`):
          * [ ] 遍历 `spec_groups` 显示规格组名称。
          * [ ] 遍历 `options` 显示规格选项按钮。
          * [ ] 实现选中状态样式。
          * [ ] 实现售罄规格选项的禁用/置灰样式 (`spec-option--disabled`)。
      * [ ] 实现数量选择器 (`van-stepper`)。
      * [ ] 添加 "加入购物车" 按钮。
      * [ ] 添加售罄状态下的 "想要" / "到货提醒" 按钮。
  * [ ] **M2.2**: 状态管理 (`stores/cartStore.ts`)
      * [ ] 确保 `cartStore.ts` 已创建，包含 `items`, `addItem` action。
  * [ ] **M2.3**: 页面逻辑 (TS)
      * [ ] 在 `onLoad` 中获取 `options.id` (商品 ID)。
      * [ ] 根据商品 ID 从 `menuStore` 获取商品数据 (如果 M1 使用了 Store 缓存)，或重新请求 `/api/v1/menu` 并查找对应商品 (如果 M1 未缓存)。
      * [ ] 将商品信息绑定到页面 `data`。
      * [ ] 实现规格选择逻辑：
          * [ ] 维护 `selectedSpecs` (已选规格) 状态。
          * [ ] 处理规格选项点击事件 (`handleSelectSpec`)：
              * 检查选项是否售罄，若是则提示并返回。
              * 更新 `selectedSpecs` 状态。
              * 调用 `calculatePrice` 重新计算并更新显示价格。
      * [ ] 实现数量变更事件 (`handleQuantityChange`)。
      * [ ] 实现价格计算函数 `calculatePrice(basePrice, selectedSpecs)`。
      * [ ] 实现 "加入购物车" 按钮点击事件 (`handleAddToCart`)：
          * 校验是否所有规格组都已选择。
          * 构造 `CartItem` 对象。
          * 调用 `cartStore.addItem(cartItem)`。
          * (可选) 加入成功后返回上一页或提示。
      * [ ] 实现 "想要" 按钮点击事件 (`handleWant`)：
          * 调用 `api/want.ts -> addWant(productId)` (需封装 `POST /api/v1/products/{id}/want`)。
          * 处理成功提示或已记录提示。
  * [ ] **M2.4**: 页面配置 (`pages/product-detail/product-detail.json`)
      * [ ] 配置 `usingComponents` 引入 Vant 组件和自定义组件。
      * [ ] 配置 `navigationBarTitleText` 为 "商品详情"。
  * [ ] **M2.5**: 测试与提交
      * [ ] 确保商品信息正确显示。
      * [ ] 确保规格选择正常，价格动态计算正确。
      * [ ] 确保售罄规格无法选择并有提示。
      * [ ] 确保数量选择正常。
      * [ ] 确保 "加入购物车" 功能正常 (数据进入 `cartStore` 和本地存储)。
      * [ ] 确保规格未选全时无法加入购物车并有提示。
      * [ ] 确保售罄商品显示 "想要" 按钮，点击功能正常。
      * [ ] 提交代码: `git commit -m "feat(M2): implement product detail page with spec selection and add to cart"`。

-----

#### 🛒 M3: 购物车页 (预计 1 天)

  * [ ] **M3.1**: 页面结构与样式 (WXML & WXSS)
      * [ ] 创建 `pages/cart/cart` 页面文件。
      * [ ] 使用 `wx:if` 判断购物车是否为空，显示空状态提示。
      * [ ] 使用 `wx:for` 遍历 `cartStore.items` 渲染购物车列表。
      * [ ] 实现购物车项目组件 (`components/cart-item`)：
          * [ ] 显示商品名称、已选规格 (拼接字符串)、单价 (计算后)、数量。
          * [ ] 添加数量选择器 (`van-stepper`)。
          * [ ] 添加删除按钮。
      * [ ] 底部栏：显示总数量、总金额、"清空购物车" (可选)、"去结算" 按钮。
  * [ ] **M3.2**: 页面逻辑 (TS)
      * [ ] 在 `onLoad` 和 `onShow` 中使用 `createStoreBindings` 绑定 `cartStore` 的 `items`, `totalPrice`, `totalQuantity`, `updateQuantity`, `removeItem`, `clearAll`。
      * [ ] 将 `cartStore` 数据映射到页面 `data`。
      * [ ] 实现 `cart-item` 组件的数量变更事件，调用 `this.updateQuantity(productId, quantity)`。
      * [ ] 实现 `cart-item` 组件的删除按钮事件，调用 `this.removeItem(productId)` (建议加确认提示)。
      * [ ] (可选) 实现 "清空购物车" 按钮事件，调用 `this.clearAll()` (建议加确认提示)。
      * [ ] 实现 "去结算" 按钮事件 (`handleCheckout`)：
          * 检查 `totalQuantity > 0`。
          * 跳转到订单确认页 (`wx.navigateTo({ url: '/pages/checkout/checkout' })`)。
  * [ ] **M3.3**: 页面配置 (`pages/cart/cart.json`)
      * [ ] 配置 `usingComponents` 引入 Vant 组件和自定义组件。
      * [ ] 配置 `navigationBarTitleText` 为 "购物车"。
  * [ ] **M3.4**: 测试与提交
      * [ ] 确保购物车商品列表正确显示，包括规格、价格、数量。
      * [ ] 确保空购物车状态显示正常。
      * [ ] 确保修改数量、删除商品功能正常，总价和总数实时更新。
      * [ ] 确保清空购物车功能正常。
      * [ ] 确保 "去结算" 按钮在购物车非空时可用，并能正确跳转。
      * [ ] 测试购物车数据持久化 (关闭小程序再打开)。
      * [ ] 提交代码: `git commit -m "feat(M3): implement cart page display and operations"`。

-----

#### 🧾 M4: 订单确认页 (预计 2 - 2.5 天)

  * [ ] **M4.1**: 页面结构与样式 (WXML & WXSS)
      * [ ] 创建 `pages/checkout/checkout` 页面文件。
      * [ ] 地址区域：
          * [ ] 显示选中的地址信息 (联系人、电话、详细地址)。
          * [ ] 添加 "选择地址" / "修改地址" 入口。
      * [ ] 订单类型切换：自取 / 配送 (使用 `van-radio-group` 或类似组件)。
      * [ ] 商品清单区域：
          * [ ] 遍历购物车商品 (从 `cartStore` 获取)，简洁展示名称、规格、数量、小计金额。
      * [ ] 备注区域：使用 `van-field` 或 `textarea` 输入备注。
      * [ ] 价格明细区域：商品总额、配送费 (如果选择配送且在范围外或需要计算)、总计金额。
      * [ ] 底部提交栏：显示总计金额、"提交订单" 按钮。
  * [ ] **M4.2**: API 对接 (`api/user.ts`, `api/shop.ts`, `api/order.ts`)
      * [ ] 封装 `api/user.ts -> getUserAddresses()` 调用 `GET /api/v1/me/addresses` (需要登录)。
      * [ ] 封装 `api/shop.ts -> checkDeliveryRange(lat, lng)` 调用 `POST /api/v1/shop/delivery/check`。
      * [ ] 封装 `api/order.ts -> createOrder(orderData)` 调用 `POST /api/v1/orders` (需要登录或游客 session)。
  * [ ] **M4.3**: 工具函数 (`utils/location.ts`, `utils/auth.ts`)
      * [ ] 封装 `utils/location.ts -> chooseUserAddress()`: 优先 `wx.chooseAddress`，失败或无地址时引导 `wx.chooseLocation`，处理权限。
      * [ ] 封装 `utils/location.ts -> getCurrentLocation()`: 调用 `wx.getLocation` 获取当前坐标。
      * [ ] 确保 `utils/auth.ts` 包含获取 Token 和游客 Session 的逻辑。
  * [ ] **M4.4**: 页面逻辑 (TS)
      * [ ] 在 `onLoad` 中：
          * [ ] 从 `cartStore` 获取购物车商品。
          * [ ] 检查用户登录状态 (`userStore.isLoggedIn`)。
          * [ ] 如果已登录，尝试调用 `getUserAddresses` 获取默认地址或第一个地址。
          * [ ] 如果未登录或无地址，设置默认状态。
          * [ ] 计算商品总额。
      * [ ] 地址选择逻辑 (`handleChooseAddress`)：
          * 调用 `utils/location.ts -> chooseUserAddress()`。
          * 获取到地址信息 (微信地址或地图选点) 后，更新页面 `data` 中的 `selectedAddress` (包含 `lat`, `lng`)。
          * 如果选择了地址且订单类型为 "配送"，调用 `checkDeliveryRange` 检查配送范围，更新 `deliverable` 状态和 `deliveryFee` (暂设为 0 或固定值)。
      * [ ] 订单类型切换逻辑 (`handleOrderTypeChange`)：
          * 更新 `orderType` 状态。
          * 如果切换到 "配送" 且已有地址，重新检查配送范围。
          * 如果切换到 "自取"，清除配送费。
      * [ ] 备注输入逻辑 (`handleRemarkInput`)：更新 `remark` 状态。
      * [ ] 提交订单逻辑 (`handleSubmitOrder`)：
          * [ ] **前置校验**:
              * 检查是否已选择地址 (配送模式下)。
              * 检查购物车是否为空。
              * (可选) 检查店铺营业状态，根据策略提示或阻止 (见 M6 总结)。
          * [ ] **构造 `orderData`**:
              * `items`: 从 `cartStore` 格式化。
              * `order_type`: `pickup` 或 `delivery`。
              * `address_id` (如果使用微信地址) 或 `delivery_address` (包含 `contact_name`, `phone`, `address_line`, `lat`, `lng`)。
              * `remark`。
          * [ ] **获取认证信息**:
              * 如果已登录，获取 `token`。
              * 如果未登录，获取 `guest_session_id`。
          * [ ] **调用 `api/order.ts -> createOrder(orderData)`**:
              * 传入 `token` 或 `guest_session_id` (通过 `request.ts` 自动处理或手动添加 header)。
              * **处理游客 Session 过期**: 捕获 400/401 错误，调用 `api/guest.ts -> createGuestSession` 重新获取 session，然后重试 `createOrder`。
              * **处理售罄错误**: 捕获包含 "sold out" 的错误信息，弹窗提示用户返回购物车修改。
          * [ ] **成功**:
              * (如果已登录) 清空用户购物车 `cartStore.clearAll()`。
              * (如果未登录) 清空游客购物车 `clearGuestCart()`。
              * 跳转到支付结果页，传递 `orderId` 和模拟支付状态 (`wx.redirectTo({ url: '/pages/payment-result/payment-result?orderId=' + orderId + '&status=success' })`)。
          * [ ] **失败**: 显示错误提示。
  * [ ] **M4.5**: 页面配置 (`pages/checkout/checkout.json`)
      * [ ] 配置 `usingComponents`。
      * [ ] 配置 `navigationBarTitleText` 为 "确认订单"。
  * [ ] **M4.6**: 测试与提交
      * [ ] 确保购物车商品正确传递和显示。
      * [ ] 测试地址选择功能 (`wx.chooseAddress`, `wx.chooseLocation`) 及权限处理。
      * [ ] 测试自取/配送切换。
      * [ ] 测试配送范围检查 (模拟在范围内和范围外)。
      * [ ] 测试备注输入。
      * [ ] 测试登录状态下提交订单。
      * [ ] 测试游客状态下提交订单 (包括 session 过期重试)。
      * [ ] 测试提交订单时商品售罄的错误处理。
      * [ ] 测试打烊状态下的下单提示 (根据选定策略)。
      * [ ] 确保下单成功后购物车被清空并正确跳转。
      * [ ] 提交代码: `git commit -m "feat(M4): implement checkout page and order creation logic"`。

-----

#### 💸 M5: (伪)支付页/订单结果页 (预计 0.5 天)

  * [ ] **M5.1**: 页面结构与样式 (WXML & WXSS)
      * [ ] 创建 `pages/payment-result/payment-result` 页面文件。
      * [ ] 根据 `status` 参数显示支付成功或失败的图标和文案。
      * [ ] 显示订单号、支付金额 (可选)。
      * [ ] 提供 "查看订单" 按钮 (跳转订单详情页)。
      * [ ] 提供 "返回首页" 按钮。
  * [ ] **M5.2**: 页面逻辑 (TS)
      * [ ] 在 `onLoad` 中获取 `options.orderId` 和 `options.status`。
      * [ ] 将状态绑定到页面 `data`。
      * [ ] 实现 "查看订单" 按钮点击事件，跳转到 `pages/order-detail/order-detail?id=<orderId>`。
      * [ ] 实现 "返回首页" 按钮点击事件，使用 `wx.switchTab({ url: '/pages/index/index' })`。
  * [ ] **M5.3**: 页面配置 (`pages/payment-result/payment-result.json`)
      * [ ] 配置 `usingComponents`。
      * [ ] 配置 `navigationBarTitleText` 为 "支付结果"。
  * [ ] **M5.4**: 测试与提交
      * [ ] 测试支付成功和失败两种状态下的页面显示。
      * [ ] 测试按钮跳转逻辑。
      * [ ] 提交代码: `git commit -m "feat(M5): implement mock payment result page"`。

-----

#### 📄 M6: 订单列表与详情页 (预计 1.5 - 2 天)

  * [ ] **M6.1**: 订单列表页 (`pages/order-list`)
      * [ ] **结构与样式**:
          * [ ] 创建 `pages/order-list/order-list` 页面文件。
          * [ ] 使用 `van-tabs` 实现订单状态筛选 (全部、待支付、制作中、待取/配送、已完成)。
          * [ ] 列表区域使用 `wx:for` 渲染订单卡片 (`components/order-card`)。
          * [ ] 实现下拉刷新 (`enablePullDownRefresh: true`) 和上拉加载更多 (监听 `onReachBottom`)。
          * [ ] 实现空列表状态。
      * [ ] **API**: 封装 `api/order.ts -> getOrders(status, page)` 调用 `GET /api/v1/orders`。
      * [ ] **逻辑**:
          * [ ] 在 `onLoad` 和 `onShow` (或 Tab 切换时) 加载第一页订单数据 (根据当前 Tab 状态)。
          * [ ] 实现 `onPullDownRefresh` 下拉刷新逻辑 (重置页码，重新加载)。
          * [ ] 实现 `onReachBottom` 上拉加载更多逻辑 (页码增加，加载下一页数据并追加)。
          * [ ] 实现 Tab 切换 (`handleTabChange`) 逻辑 (记录当前状态，重置页码，重新加载)。
          * [ ] 实现订单卡片点击事件，跳转到订单详情页 (`wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + orderId })`)。
          * [ ] **轮询**: 在 `onShow` 中启动轮询 (`utils/orderPolling.ts` - 需创建)，检查列表中非终态订单的状态，`onHide` 时停止。
      * [ ] **配置**: `.json` 文件配置 `usingComponents`, `navigationBarTitleText`, `enablePullDownRefresh`。
  * [ ] **M6.2**: 订单详情页 (`pages/order-detail`)
      * [ ] **结构与样式**:
          * [ ] 创建 `pages/order-detail/order-detail` 页面文件。
          * [ ] 显示订单状态、订单号、下单时间。
          * [ ] 显示地址信息 (自取/配送)。
          * [ ] 显示商品清单 (详细)。
          * [ ] 显示价格明细 (商品总额、配送费、总计)。
          * [ ] 显示备注。
          * [ ] (待支付状态) 显示 "去支付" 按钮 (暂不实现支付逻辑)。
          * [ ] (已完成/已取消状态) 显示 "再来一单" 按钮。
      * [ ] **API**: 封装 `api/order.ts -> getOrderById(orderId)` 调用 `GET /api/v1/orders/{id}`。
      * [ ] **逻辑**:
          * [ ] 在 `onLoad` 中获取 `options.id`，调用 `getOrderById` 加载订单详情。
          * [ ] 实现 "再来一单" 按钮逻辑 (将订单商品重新加入购物车，跳转到购物车页)。
          * [ ] **轮询**: 在 `onLoad/onShow` 中，如果订单状态非终态，启动轮询 (`utils/orderPolling.ts`)，`onUnload/onHide` 时停止。
      * [ ] **配置**: `.json` 文件配置 `usingComponents`, `navigationBarTitleText`。
  * [ ] **M6.3**: 订单轮询工具 (`utils/orderPolling.ts`)
      * [ ] 封装 `startOrderPolling(orderId, updateCallback)` 和 `stopOrderPolling(orderId)`。
      * [ ] 内部使用 `setInterval` 定时请求 `getOrderById`。
      * [ ] 状态变化时调用 `updateCallback`。
      * [ ] 变为终态时自动停止。
      * [ ] 管理多个订单的轮询定时器。
  * [ ] **M6.4**: 测试与提交
      * [ ] 测试订单列表不同状态的筛选。
      * [ ] 测试下拉刷新和上拉加载更多。
      * [ ] 测试空列表显示。
      * [ ] 测试订单详情页数据展示是否完整准确。
      * [ ] 测试 "再来一单" 功能。
      * [ ] **重点测试**: 订单状态轮询是否能正确启动、更新状态、并在变为终态或离开页面时停止。
      * [ ] 提交代码: `git commit -m "feat(M6): implement order list and detail pages with polling"`。

-----

**后续**: 完成 M0-M6 后，可以继续实现登录页 (`pages/profile` 完善)、积分、地址管理、真实支付、预约、主题切换按钮等功能。
