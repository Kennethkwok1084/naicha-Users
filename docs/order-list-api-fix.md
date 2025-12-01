# 订单列表页 API 对接修复说明

**日期**: 2025.11.29  
**问题**: HTTP 405 错误 - 订单列表接口调用失败

---

## 问题分析

### 原始错误
```
GET http://localhost:8000/api/v1/orders?page=1&page_size=10 405 (Method Not Allowed)
```

### 根本原因

1. **接口路径错误**: 前端使用 `/api/v1/orders`，但后端实际接口是 `/api/v1/me/orders`
2. **参数名称不匹配**: 前端使用 `page/page_size`，后端使用 `limit/offset`
3. **响应格式不同**: 后端直接返回订单数组，不是包含分页信息的对象

---

## 修复内容

### 1. 更新 API 接口 (`miniprogram/api/order.ts`)

#### 修改前
```typescript
export const getOrderList = (
  status?: string,
  page: number = 1,
  pageSize: number = 10
) => {
  return request<OrderListResponse>({
    url: '/api/v1/orders',
    method: 'GET',
    data: { page, page_size: pageSize, status }
  });
};
```

#### 修改后
```typescript
export const getOrderList = (
  status?: string,
  limit: number = 20,
  offset: number = 0
) => {
  const queryParams: string[] = [
    `limit=${limit}`,
    `offset=${offset}`,
  ];
  
  if (status && status !== 'all') {
    queryParams.push(`status=${status}`);
  }
  
  const queryString = queryParams.join('&');
  
  return request<OrderListItem[]>({
    url: `/api/v1/me/orders?${queryString}`,
    method: 'GET',
  });
};
```

**关键变更**:
- ✅ 接口路径: `/api/v1/orders` → `/api/v1/me/orders`
- ✅ 参数方式: `data` 对象 → URL 查询字符串
- ✅ 分页参数: `page/page_size` → `limit/offset`
- ✅ 返回类型: `OrderListResponse` → `OrderListItem[]`

### 2. 更新页面逻辑 (`miniprogram/pages/order-list/order-list.ts`)

#### 数据结构调整

```typescript
// 修改前
data: {
  page: 1,
  pageSize: 10,
  total: 0,
}

// 修改后
data: {
  limit: 20,
  offset: 0,
}
```

#### 加载逻辑调整

```typescript
// 计算 hasMore
hasMore: orders.length >= limit

// 上拉加载更多
offset: this.data.offset + this.data.limit
```

### 3. 暂时禁用取消订单功能

由于后端暂未提供取消订单接口，做以下调整：

1. **隐藏取消订单按钮** (`order-card.wxml`)
2. **显示提示信息** - "该功能开发中，请联系商家处理"
3. **添加 TODO 注释** - 标记需要后端支持

---

## 后端 API 规格

### 获取订单列表

**接口**: `GET /api/v1/me/orders`

**请求参数**:
```typescript
{
  limit?: number;   // 每页数量，默认 20，最大 100
  offset?: number;  // 偏移量，默认 0
  status?: string;  // 订单状态筛选（可选）
}
```

**响应格式**:
```typescript
OrderListItem[]  // 直接返回订单数组
```

**示例**:
```
GET /api/v1/me/orders?limit=20&offset=0&status=pending_payment
```

### 取消订单（待实现）

**接口**: `POST /api/v1/orders/{order_id}/cancel`

**状态**: ❌ 后端暂未提供

**需求说明**:
- 仅待支付状态的订单可以取消
- 返回操作结果和消息

---

## 测试建议

### 功能测试

- [x] 订单列表加载
- [x] Tab 切换筛选
- [x] 下拉刷新
- [x] 上拉加载更多
- [ ] 空态展示（需要测试账号无订单场景）
- [ ] 各状态订单展示
- [ ] 点击跳转订单详情

### API 测试

```bash
# 测试订单列表接口
curl -X GET "http://localhost:8000/api/v1/me/orders?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试带状态筛选
curl -X GET "http://localhost:8000/api/v1/me/orders?limit=20&offset=0&status=pending_payment" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 已知问题

1. **状态筛选**: 后端接口参数中没有看到 `status` 参数，需要确认是否支持
2. **取消订单**: 功能已实现但暂时禁用，需等待后端接口
3. **订单详情页**: 点击订单卡片跳转的详情页尚未实现
4. **支付页面**: "去支付"按钮跳转的支付页尚未实现

---

## 后续工作

### 需要后端支持

1. **确认状态筛选** - 确认 `/api/v1/me/orders` 是否支持 `status` 参数
2. **取消订单接口** - 实现 `POST /api/v1/orders/{order_id}/cancel`
3. **响应格式优化** - 考虑返回总数和是否还有更多的信息

### 需要前端完善

1. **订单详情页** - 创建 `/pages/order-detail/order-detail`
2. **支付页面** - 创建 `/pages/payment/payment`
3. **再来一单** - 实现将订单商品加入购物车
4. **埋点上报** - 添加订单相关埋点事件

---

## 文件变更清单

```
miniprogram/
├── api/
│   └── order.ts                  ✅ 更新 API 接口
├── components/
│   └── order-card/
│       └── order-card.wxml       ✅ 隐藏取消按钮
└── pages/
    └── order-list/
        └── order-list.ts         ✅ 更新分页逻辑
```

---

**修复状态**: ✅ 已完成  
**测试状态**: ⏳ 待测试  
**上线状态**: ⏳ 等待后端接口完善
