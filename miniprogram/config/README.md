# 配置文件说明

## 📁 文件位置
`miniprogram/config/index.ts`

## 🎯 主要功能
统一管理项目的所有配置项,包括:
- API 服务器地址
- 环境切换
- 缓存策略
- 业务配置

## 🔧 如何修改服务器地址

### 方法 1: 修改当前环境 (推荐)
编辑 `config/index.ts` 文件:

```typescript
// 找到当前环境配置
const CURRENT_ENV: 'dev' | 'test' | 'prod' = 'dev' // 改为对应环境

// 或者直接修改环境配置中的地址
export const ENV = {
  dev: {
    apiBaseUrl: 'https://your-dev-api.com',  // 修改这里
    debug: true
  },
  // ...
}
```

### 方法 2: 直接覆盖地址
如果想快速测试某个地址,可以直接修改:

```typescript
// 在 config/index.ts 底部找到
export const API_BASE_URL = config.apiBaseUrl

// 改为
export const API_BASE_URL = 'https://your-custom-api.com'
```

## 📋 配置项说明

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `API_BASE_URL` | API 服务器地址 | 根据环境 |
| `DEBUG` | 是否开启调试模式 | dev/test: true, prod: false |
| `REQUEST_TIMEOUT` | 请求超时时间(毫秒) | 30000 |
| `SOLDOUT_STYLE` | 售罄商品显示方式 | 'disabled' |
| `ORDER_POLLING_INTERVAL` | 订单轮询间隔(毫秒) | 5000 |
| `CACHE_EXPIRE_TIME` | 各类缓存过期时间 | 见文件 |

## 🌍 环境说明

### dev (开发环境)
- 用于本地开发和调试
- 开启 debug 模式,会在控制台打印请求日志

### test (测试环境)  
- 用于测试服务器测试
- 开启 debug 模式

### prod (生产环境)
- 用于正式发布
- 关闭 debug 模式,优化性能

## ⚠️ 注意事项

1. **不要提交真实的生产环境地址到代码仓库**
   - 在 `.gitignore` 中添加 `config/local.ts`
   - 本地覆盖配置写在 `config/local.ts` 中

2. **环境切换后需重新编译**
   - 微信开发者工具: 点击"编译"
   - 确保新地址生效

3. **生产环境发布前检查清单**
   - [ ] `CURRENT_ENV` 设置为 `'prod'`
   - [ ] `API_BASE_URL` 指向生产服务器
   - [ ] `DEBUG` 设置为 `false`
   - [ ] 移除所有 `console.log` 调试代码

## 🔗 相关文件

- `miniprogram/utils/request.ts` - 使用 `API_BASE_URL`
- `miniprogram/stores/*Store.ts` - 使用 `CACHE_EXPIRE_TIME`
- `miniprogram/pages/menu/menu.ts` - 使用 `SOLDOUT_STYLE`

## 示例

### 切换到测试环境
```typescript
// config/index.ts
const CURRENT_ENV: 'dev' | 'test' | 'prod' = 'test'
```

### 临时使用本地服务器
```typescript
// config/index.ts
export const API_BASE_URL = 'http://localhost:8000'
```

### 修改缓存时间
```typescript
// config/index.ts
export const CACHE_EXPIRE_TIME = {
  menu: 5 * 60 * 1000,       // 改为 5 分钟
  shopStatus: 2 * 60 * 1000, // 改为 2 分钟
  userProfile: 15 * 60 * 1000 // 改为 15 分钟
}
```
