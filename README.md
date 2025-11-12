# 智能奶茶档口 · 顾客端小程序 · 开发文档 V1.0

# 智能奶茶档口系统 · 顾客端小程序

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![WeChat Mini Program](https://img.shields.io/badge/WeChat-Mini%20Program-07c160.svg)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

> 原生微信小程序 + TypeScript + MobX + TDesign 实现的智能奶茶档口顾客端应用

---

## 📖 项目简介

这是"智能奶茶档口系统"的**顾客端小程序**,为顾客提供便捷的在线点单、支付(预留接口)、订单查询等服务。采用原生微信小程序框架 + TypeScript 构建,集成 MobX 进行状态管理,选用 TDesign 作为 UI 组件库,并支持手动切换适老化主题。

### 核心功能 (MVP V1.0)

- ✅ **商品浏览与选择**：分类展示、商品列表、详情查看、规格选择、价格计算
- ✅ **购物车管理**：添加商品、修改数量/删除、本地持久化（游客/用户独立）、登录合并
- ✅ **下单流程**：地址选择 (微信 API)、自取/配送切换、备注、提交订单
- ✅ **(伪)支付**：预留支付接口，模拟支付成功/失败流程
- ✅ **订单管理**：订单列表展示 (轮询更新状态)、订单详情查看
- ✅ **用户体系**：游客模式浏览、微信登录、游客购物车与用户购物车合并
- ✅ **适老化主题**：支持手动切换，提升易读性和易用性
- 🚧 **售罄处理**：菜单/详情页状态展示、下单时后端校验及前端提示
- 🚧 **营业状态**：启动时获取状态、页面提示、下单时用户确认 (允许打烊下单)

### 后续规划

- ⏳ **真实支付对接**：接入微信支付
- ⏳ **积分系统**：积分累积、优惠券兑换与使用
- ⏳ **地址管理**：新增/编辑/删除收货地址
- ⏳ **预约下单**：指定时间段取货
- ⏳ **售罄提醒**："想要"功能，到货通知

---

## 🛠 技术栈

| 技术             | 版本 | 用途           |
|------------------|------|----------------|
| 原生微信小程序   | -    | 框架基础       |
| TypeScript       | 5.0+ | 类型安全       |
| MobX             | 6.x  | 状态管理       |
| TDesign          | 1.x  | UI 组件库      |
| zod              | 3.x  | 运行时类型校验 |

---

## 🚀 快速开始

### 前置条件

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新稳定版
- Node.js 18+
- npm (或 pnpm/yarn)
- 微信小程序 AppID (测试号或正式 AppID: `wx82600bad5aeb6bd6`)

### 安装与启动

1.  **克隆项目**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    ```
2.  **安装依赖**
    ```bash
    npm install
    # or pnpm install / yarn install
    ```
3.  **配置 AppID & 后端地址**
    - 修改 `project.config.json` 中的 `appid` 为你的 AppID。
    - 在 `miniprogram/utils/request.ts` (或其他配置文件) 中设置 `BASE_URL` 为你的后端 API 地址。
    - (可选) 配置 `project.private.config.json` 覆盖公共配置。
4.  **构建 npm**
    - 在微信开发者工具中:**工具** → **构建 npm**。
    - 确保 `project.config.json` 中已配置 `"packNpmManually": true` 和 `packNpmRelationList` (指向 `package.json` 和 `miniprogram/` 或根目录,取决于 TDesign 安装位置)。
5.  **编译预览**
    - 使用微信开发者工具，选择项目根目录。
    - 点击 **编译** 按钮。

---

## 📁 项目结构 (规划)

````

.
├── miniprogram/              \# 小程序源代码目录 (根据 project.config.json 配置可能不同)
│   ├── pages/                \# 页面
│   │   ├── index/            \# 首页/菜单页 (M1)
│   │   ├── product-detail/   \# 商品详情页 (M2)
│   │   ├── cart/             \# 购物车页 (M3)
│   │   ├── checkout/         \# 订单确认页 (M4)
│   │   ├── payment-result/   \# 支付结果页 (M5)
│   │   ├── order-list/       \# 订单列表页 (M6)
│   │   ├── order-detail/     \# 订单详情页 (M6)
│   │   └── profile/          \# 我的页面 (含登录入口)
│   ├── components/           \# 自定义业务组件
│   │   ├── product-card/     \# 商品卡片
│   │   ├── spec-selector/    \# 规格选择器
│   │   ├── cart-item/        \# 购物车项目
│   │   ├── order-card/       \# 订单卡片
│   │   └── address-selector/ \# 地址选择器 (待实现)
│   ├── stores/               \# MobX 状态管理
│   │   ├── cartStore.ts      \# 购物车状态 (区分游客/用户)
│   │   ├── userStore.ts      \# 用户登录状态与信息
│   │   ├── menuStore.ts      \# 菜单数据缓存 (可选)
│   │   └── shopStore.ts      \# 店铺状态
│   ├── api/                  \# API 请求封装
│   │   ├── menu.ts           \# 菜单相关 API
│   │   ├── order.ts          \# 订单相关 API
│   │   ├── user.ts           \# 用户/认证 API
│   │   └── shop.ts           \# 店铺相关 API
│   ├── utils/                \# 工具函数
│   │   ├── request.ts        \# 封装 wx.request
│   │   ├── storage.ts        \# 封装 wx.storage
│   │   ├── theme.ts          \# 主题切换
│   │   └── auth.ts           \# 登录、Token 管理
│   │   └── cartUtils.ts      \# 购物车合并逻辑
│   │   └── location.ts       \# 定位/地址选择封装
│   ├── styles/               \# 样式与主题
│   │   ├── tokens.json       \# 设计 Tokens
│   │   ├── app.wxss          \# 默认主题 (基于 tokens 生成)
│   │   └── app-elder.wxss    \# 适老化主题 (基于 tokens 生成)
│   │   └── tdesign-custom.wxss  \# TDesign 样式覆盖
│   ├── images/               \# 本地图片资源
│   ├── app.ts                \# 小程序入口
│   ├── app.json              \# 全局配置
│   ├── app.wxss              \# 全局公共样式 (引入主题文件)
│   └── sitemap.json          \# 站点地图
│
├── typings/                  \# TypeScript 类型定义
│   ├── index.d.ts            \# 全局类型
│   └── types/                \# wx API 类型等
├── docs/                     \# 项目文档 (本文件及其他指南)
├── scripts/                  \# 构建脚本 (如 build-tokens.js)
├── project.config.json       \# 项目配置 (公开)
├── project.private.config.json \# 项目私有配置 (本地)
├── tsconfig.json             \# TypeScript 配置
├── package.json              \# npm 依赖
├── AGENTS.md                 \# 开发规范 (已有)
└── README.md                 \# 项目说明 (本文件)

````

## 🔧 开发规范与流程

请严格遵循 [`AGENTS.md`](./AGENTS.md) 中定义的开发规范：

- **TypeScript 强制**: 所有 `.ts` 文件必须强类型，避免 `any`。
- **命名规范**: PascalCase (组件), camelCase (函数/变量), kebab-case (CSS 类)。
- **代码风格**: 使用 Prettier 和 ESLint 保持一致 (2 空格缩进)。
- **状态管理**: 业务状态使用 MobX Stores，页面临时状态可在 Page/Component 内管理。
- **Git Flow**:
    - 基于 `main` 分支创建 `feature/M<模块号>-<功能描述>` 分支进行开发 (例如 `feature/M1-menu-page`)。
    - 完成一个模块 (M0-M6) 的 TODO 列表后，提交代码并发起 Pull Request 到 `main` 分支。
    - Code Review 通过后合并。
- **Commit 规范**: 遵循 Conventional Commits (例如 `feat(M1): add product list display`)。

---

## 📚 相关文档

- [开发指南](./docs/develop.md) - 更详细的技术实现细节和最佳实践。
- [开发规范](./AGENTS.md) - 编码风格、Git 流程等约定。
- [后端 API 文档](./naicha-openapi.json) - 后端接口定义。

---

## 🤝 贡献与 Review

- 开发完成后，请在 Pull Request 中清晰说明完成的功能点和测试情况。
- 使用 `@codex-review` (或指定的 Reviewer) 请求代码评审。

---

**最后更新**：2025年10月27日

**维护者**：小菊

**状态**：开发中 🚧
