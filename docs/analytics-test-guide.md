# 埋点系统测试指南

## 快速验证步骤

### 1. 启动开发服务器

```bash
cd /home/kwok/naicha-taro/Naicha-taro
pnpm dev:weapp
```

### 2. 打开微信开发者工具

加载项目目录: `dist/` (编译输出目录)

### 3. 在控制台手动触发埋点

打开微信开发者工具的 Console，输入以下代码测试:

```javascript
// 获取埋点 API (确保已在 app.ts 中初始化)
const { track, trackPage, trackUser } = require('./utils/analytics')

// 测试1: 操作事件
track('test_add_to_cart', { 
  productId: 1, 
  productName: '珍珠奶茶',
  quantity: 2,
  price: 15.00
})

// 测试2: 页面事件
trackPage('test_menu_page', { 
  categoryId: 3 
})

// 测试3: 用户事件
trackUser(123, { 
  phone: '13800138000', 
  nickname: '测试用户' 
})

console.log('✅ 已发送 3 条测试事件，15秒后自动上报或累积10条时上报')
```

### 4. 观察控制台输出

**预期日志**:

```
[analytics] 队列中有 3 条事件待上报
[analytics] 上报 3 条事件
[analytics] 队列刷新完成
```

### 5. 检查网络请求

在微信开发者工具的 **Network** 面板中:

1. 筛选 `analytics/events` 路径
2. 确认请求:
   - ✅ Method: `POST`
   - ✅ URL: `http://localhost:8000/api/v1/analytics/events`
   - ✅ Status: `204 No Content`
   - ✅ Request Body:
     ```json
     {
       "events": [
         {
           "id": "uuid-v4",
           "type": "event",
           "name": "test_add_to_cart",
           "timestamp": 1700000000000,
           "payload": {...}
         }
       ]
     }
     ```

### 6. 验证数据脱敏

手机号应被脱敏为后4位:

```javascript
trackUser(456, { phone: '13800138000' })

// 实际上报的 payload:
{
  "userId": 456,
  "phone": "****8000"  // ✅ 已脱敏
}
```

## 自动化测试场景

### 场景1: 批量上报 (10条触发)

```javascript
// 快速发送10条事件
for (let i = 0; i < 10; i++) {
  track(`test_event_${i}`, { index: i })
}

// 预期: 立即触发上报 (不等15秒)
```

### 场景2: 定时上报 (15秒触发)

```javascript
// 发送少于10条
track('test_single_event', { test: true })

// 预期: 15秒后自动上报
```

### 场景3: 网络失败重试

```bash
# 临时停止后端服务
# 前端发送事件后,观察队列是否保留

track('test_offline_event', { offline: true })

# 预期: 
# 1. 控制台输出 "[analytics] 上报失败,将在下次重试"
# 2. 事件保留在 Storage 中
# 3. 恢复后端后,15秒内自动重试成功
```

### 场景4: 应用前后台切换

```javascript
// 发送事件但不满10条
track('test_background_event')

// 切换到后台 (Home键或切换应用)
// 预期: 立即触发上报

// 切换回前台
// 预期: 再次触发上报 (清空残留队列)
```

## 数据验证清单

| 验证项 | 方法 | 预期结果 |
|-------|------|---------|
| ✅ 事件入队 | Storage 检查 | `NAICHA_ANALYTICS_QUEUE` 有数据 |
| ✅ UUID 生成 | 检查 `event.id` | 符合 UUID v4 格式 |
| ✅ 时间戳正确 | 检查 `timestamp` | 13位毫秒时间戳 |
| ✅ 类型枚举 | 检查 `type` | 只能是 event/page/user |
| ✅ 批量限制 | 发送11条事件 | 分2批上报 (10+1) |
| ✅ 手机号脱敏 | trackUser 带手机号 | payload 中只有后4位 |
| ✅ 网络失败 | 关闭后端 | 队列保留,不丢失 |
| ✅ 幂等性 | 重复发送相同 id | 后端只记录1次 |

## 后端验证

### 检查数据库记录

```sql
-- 查询最近上报的事件
SELECT id, type, name, timestamp, payload, created_at
FROM analytics_events
ORDER BY created_at DESC
LIMIT 10;
```

### 检查 Celery 队列

```bash
# 查看队列积压情况
curl http://localhost:8000/api/v1/analytics/health

# 预期响应:
{
  "status": "healthy",
  "queue_length": 0,
  "threshold": 10000
}
```

## 常见问题排查

### 1. 控制台报错 `Cannot find module '@/utils/request'`

**原因**: 路径别名未配置  
**解决**: 检查 `tsconfig.json` 和 `config/index.ts` 中的 alias 配置

### 2. 网络请求 404

**原因**: 后端接口未启动或路径错误  
**解决**: 
```bash
# 确认后端服务运行
curl http://localhost:8000/api/v1/analytics/health

# 确认路径正确
grep -r "analytics/events" naicha-openapi.json
```

### 3. 请求 422 Validation Error

**原因**: 请求体不符合 Schema  
**解决**: 检查 `BatchEventsRequest` 格式:
- `events` 数组必须存在且 1-10 条
- 每个 event 必须包含 `id/type/name/timestamp`
- `type` 只能是 `event/page/user`

### 4. 队列不清空

**原因**: 上报失败后队列保留  
**解决**: 正常行为,会在下次自动重试

## 性能监控

### 关键指标

| 指标 | 目标 | 监控方式 |
|-----|------|---------|
| 上报成功率 | ≥99% | Sentry 错误率 |
| 队列堆积 | <100条 | Storage 检查 |
| 上报延迟 | <1s | Network 面板 |
| 内存占用 | <10MB | 性能分析工具 |

### Sentry 集成

埋点错误会自动上报到 Sentry:

```typescript
try {
  await post(ANALYTICS_ENDPOINT, { events: batch })
} catch (err) {
  // 自动捕获并上报到 Sentry
  console.warn('[analytics] 上报失败', err)
}
```

## 上线前检查清单

- [ ] TypeScript 编译无错误
- [ ] 本地测试全部通过
- [ ] 真机测试验证 (iOS + Android)
- [ ] 弱网环境测试 (3G/离线)
- [ ] 队列持久化验证 (强制关闭应用)
- [ ] 数据脱敏检查 (手机号/敏感字段)
- [ ] 后端健康检查通过
- [ ] Celery 队列无积压 (<100)
- [ ] Sentry 错误率 <0.3%
- [ ] 文档更新完成

---

**测试完成标准**: 所有验证项 ✅ 绿色通过  
**回归测试**: 每次发版前执行完整测试流程
