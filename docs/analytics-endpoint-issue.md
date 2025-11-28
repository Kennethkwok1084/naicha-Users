# 埋点接口说明

## ✅ 问题已解决 (2025-11-23)

前端 `src/utils/analytics.ts` 中使用的埋点接口 `/api/v1/analytics/events` 已由后端实现并集成。

---

## 原问题记录 (已解决)

前端 `src/utils/analytics.ts` 中使用的埋点接口 `/api/v1/analytics/events` **在后端 OpenAPI 文档中不存在**。

## 后端实际情况

根据 `naicha-openapi.json` 分析,后端目前只提供了**广告追踪接口**:

- `POST /api/v1/ads/track/expose` - 记录广告曝光事件
- `POST /api/v1/ads/track/click` - 记录广告点击事件

这两个接口使用的 Schema 是 `AdTrackRequestSchema`,专门用于广告追踪,不适合通用埋点。

## 解决方案

### 方案一:暂时禁用埋点上报 (推荐用于MVP)

```typescript
// src/utils/analytics.ts 中的 flushAnalyticsQueue 修改为:
export const flushAnalyticsQueue = async () => {
  loadQueueOnBoot()
  if (flushing || queue.length === 0) {
    return
  }
  flushing = true
  
  // TODO: 等待后端实现 /api/v1/analytics/events 接口
  console.log('[analytics] 队列中有', queue.length, '条事件待上报 (暂未实现后端接口)')
  
  // 暂时清空队列,避免无限累积
  queue = []
  persistQueue()
  flushing = false
}
```

**优点**:
- 不会因为接口不存在导致报错
- 本地仍会记录事件日志,便于调试
- 等后端接口就绪后只需移除注释即可

### 方案二:复用广告追踪接口 (不推荐)

理论上可以将通用埋点事件转换为 `AdTrackRequestSchema` 格式上报到 `/api/v1/ads/track/click`,但:
- 语义不符(非广告事件)
- 数据结构不匹配
- 后端可能拒绝处理

### 方案三:要求后端新增接口 (长期方案)

与后端沟通,要求实现:

```yaml
POST /api/v1/analytics/events
Content-Type: application/json

{
  "events": [
    {
      "id": "uuid",
      "type": "event" | "page" | "user",
      "name": "event_name",
      "timestamp": 1700000000000,
      "payload": {}
    }
  ]
}
```

## ✅ 解决方案 (已实施)

**采用方案三**: 后端已实现 `POST /api/v1/analytics/events` 接口

### 接口规格

- **路径**: `/api/v1/analytics/events`
- **方法**: POST
- **认证**: Bearer Token (可选,支持匿名)
- **限制**: 单次最多10条事件,每条 payload ≤8KB
- **幂等性**: 基于 `event.id` (UUID) 去重
- **响应**: 204 No Content (异步处理)

### 前端适配完成

1. ✅ 取消注释 `import { post }` 和 `ANALYTICS_ENDPOINT`
2. ✅ 启用真实上报逻辑 `flushAnalyticsQueue()`
3. ✅ 保留失败重试机制 (队列持久化)

## 修改时间

- 创建: 2025-11-23
- 解决: 2025-11-23
