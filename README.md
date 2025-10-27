# 智能奶茶档口系统 · 顾客端小程序

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![WeChat Mini Program](https://img.shields.io/badge/WeChat-Mini%20Program-07c160.svg)](https://developers.weixin.qq.com/miniprogram/dev/framework/)
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

> 原生微信小程序 + TypeScript 实现的智能奶茶档口顾客端应用

---

## 📖 项目简介

这是"智能奶茶档口系统"的**顾客端小程序**，为顾客提供便捷的在线点单、支付、订单查询等服务。采用原生微信小程序框架 + TypeScript 构建，支持适老化主题切换。

### 核心功能

- ✅ **商品浏览**：分类展示、规格选择、售罄状态提示
- ✅ **购物车管理**：本地存储、离线可用、实时计算总价
- ✅ **下单支付**：自取/配送选择、微信支付对接
- ✅ **订单管理**：实时状态更新、历史订单查询
- ✅ **会员系统**：积分累积、优惠券使用
- 🚧 **预约下单**：指定时间段取货（开发中）
- 🚧 **售罄提醒**："想要"功能，到货通知（规划中）

---

## 🛠 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **原生微信小程序** | - | 框架基础 |
| **TypeScript** | 5.0+ | 类型安全 |
| **MobX** | 6.x | 状态管理（可选） |
| **Vant Weapp** | 1.x | UI 组件库（可选） |

---

## 🚀 快速开始

### 前置条件

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新稳定版
- Node.js 18+（用于依赖管理和构建工具）
- 微信小程序 AppID（测试号或正式 AppID）

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/YourOrg/miniprogram-1.git
   cd miniprogram-1
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境**
   
   编辑 `project.private.config.json`，设置后端 API 地址：
   ```json
   {
     "description": "项目私有配置文件",
     "setting": {
       "urlCheck": false
     }
   }
   ```

4. **构建 npm 包**
   
   在微信开发者工具中：
   - 点击菜单栏 **工具** → **构建 npm**
   - 等待构建完成

5. **启动开发**
   
   在微信开发者工具中：
   - 点击 **编译** 按钮
   - 在模拟器或真机中预览

---

## 📁 项目结构

```
miniprogram-1/
├── miniprogram/              # 小程序源代码目录
│   ├── pages/                # 页面文件
│   │   ├── index/            # 首页（菜单）
│   │   └── logs/             # 日志页面（示例）
│   ├── components/           # 自定义组件
│   │   └── navigation-bar/   # 自定义导航栏
│   ├── utils/                # 工具函数
│   │   └── util.ts           # 通用工具
│   ├── app.ts                # 小程序入口文件
│   ├── app.json              # 小程序全局配置
│   ├── app.wxss              # 全局样式
│   └── sitemap.json          # 站点地图配置
│
├── typings/                  # TypeScript 类型定义
│   ├── index.d.ts            # 自定义类型
│   └── types/                # 第三方库类型
│       └── wx/               # 微信 API 类型定义
│
├── docs/                     # 项目文档
│   ├── FRONTEND_PROMPT.md    # 前端开发提示词
│   ├── FRONTEND_README.md    # 前端项目说明
│   ├── FRONTEND_DEVELOP.md   # 前端开发指南
│   └── MINIAPP_GUIDE.md      # 小程序开发指南
│
├── project.config.json       # 项目配置（公开）
├── project.private.config.json # 项目私有配置（本地）
├── tsconfig.json             # TypeScript 配置
├── package.json              # npm 依赖配置
├── AGENTS.md                 # 开发规范和约定
└── README.md                 # 项目说明（本文件）
```

---

## 🔧 开发指南

### 开发规范

请遵循 [`AGENTS.md`](./AGENTS.md) 中定义的开发规范：

- **TypeScript 强制**：所有 `.ts` 文件必须有类型定义
- **2 空格缩进**：保持代码格式一致
- **组件命名**：PascalCase（如 `ProductCard`）
- **函数命名**：camelCase（如 `fetchMenu`）
- **提交信息**：遵循 Conventional Commits 规范

### 常用命令

```bash
# 安装依赖
npm install

# 类型检查
npm run tsc

# 清理缓存
npm run clean
```

### 环境变量

在 `project.private.config.json` 中配置：

```json
{
  "description": "项目私有配置",
  "setting": {
    "urlCheck": false,  // 开发环境关闭域名校验
    "es6": true,
    "minified": true
  }
}
```

**生产环境**需在微信公众平台配置合法域名。

---

## 📱 功能模块

### 1. 菜单页面（首页）

- 商品分类展示
- 商品列表（图片、名称、价格）
- 售罄商品置灰/隐藏
- 点击商品进入规格选择页

### 2. 购物车

- 商品列表（名称、规格、单价、数量）
- 修改数量 / 删除商品
- 实时计算总价
- 本地存储（离线可用）

### 3. 订单确认

- 订单类型选择（自取 / 配送）
- 配送地址选择
- 配送范围校验
- 备注输入
- 提交订单

### 4. 支付流程

- 调起微信支付
- 支付结果轮询
- 支付失败重试

### 5. 订单列表

- Tab 筛选（全部 / 待支付 / 制作中 / 已完成）
- 订单卡片（订单号、商品、状态、金额）
- 下拉刷新 + 上拉加载更多
- 订单状态实时更新（WebSocket）

---

## 🔗 API 对接

### 后端服务

本项目对接基于 **FastAPI** 构建的后端服务。

**后端仓库**：[naicha-backend](https://github.com/YourOrg/naicha-backend)

### API 基础配置

```typescript
// utils/request.ts
const BASE_URL = 'https://api.naicha.com';

export const request = async (config: RequestConfig) => {
  const token = wx.getStorageSync('auth_token');
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${config.url}`,
      method: config.method || 'GET',
      data: config.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        // 统一处理响应
        resolve(res.data);
      },
      fail: reject,
    });
  });
};
```

### 主要接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/menu` | GET | 获取菜单（分类+商品） |
| `/api/v1/orders` | POST | 创建订单 |
| `/api/v1/orders` | GET | 查询订单列表 |
| `/api/v1/orders/{id}` | GET | 订单详情 |
| `/api/v1/orders/{id}/pay/jsapi` | POST | 发起支付 |

详细 API 文档：[后端 API 文档](https://api.naicha.com/docs)

---

## 🧪 测试

### 单元测试

```bash
# 运行测试（未配置）
npm test
```

### 真机调试

1. 点击微信开发者工具右上角 **预览** 按钮
2. 扫描二维码在手机上打开
3. 查看控制台日志和网络请求

### 常见问题

**Q1: 真机请求失败？**

- 检查域名是否在微信公众平台配置为"服务器域名"
- 确认后端 HTTPS 证书有效

**Q2: 支付失败？**

- 确认 `payer_open_id` 为真实用户 OpenID（不能用测试值）
- 检查微信商户号配置

**Q3: WebSocket 断开？**

- 检查心跳机制是否正常
- 确认后端 WebSocket 服务运行正常

---

## 📦 构建与发布

### 1. 构建生产版本

在微信开发者工具中：
- 点击菜单栏 **工具** → **构建 npm**
- 确保无 TypeScript 错误
- 点击 **上传** 按钮

### 2. 提交审核

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **版本管理**
3. 选择刚上传的版本，点击 **提交审核**
4. 填写审核信息（功能描述、测试账号等）

### 3. 发布上线

审核通过后，点击 **全量发布**。

---

## 📚 相关文档

- [前端开发提示词](./docs/FRONTEND_PROMPT.md) - AI 辅助开发指南
- [前端开发指南](./docs/FRONTEND_DEVELOP.md) - 详细开发流程和最佳实践
- [小程序开发指南](./docs/MINIAPP_GUIDE.md) - 原生小程序技术细节
- [开发规范](./AGENTS.md) - 代码规范和项目约定

---

## 🤝 贡献指南

### 提交流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发并提交**
   ```bash
   git add .
   git commit -m "feat: 添加订单列表分页功能"
   ```

3. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

Types:
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

示例:
feat(pages/menu): 添加商品搜索功能
fix(components/cart): 修复购物车总价计算错误
```

---

## 📄 许可证

本项目为**私有项目**，版权归项目所有者所有。未经授权不得复制、分发或修改。

---

## 📞 联系方式

- **技术支持**：frontend-team@naicha.com
- **产品需求**：product@naicha.com
- **紧急联系**：oncall@naicha.com（7×24）

---

## 🔖 版本历史

### V1.0.0 (2025-10-27)

**初始版本**
- ✅ 项目结构搭建
- ✅ 基础页面（首页、日志页）
- ✅ 自定义导航栏组件
- ✅ TypeScript 类型定义
- ✅ 工具函数封装

---

**最后更新**：2025年10月27日  
**维护者**：前端开发团队  
**状态**：开发中 🚧
