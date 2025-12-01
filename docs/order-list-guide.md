# 订单列表页功能文档

## 功能概述

订单列表页面提供完整的订单管理功能，包括订单查看、状态筛选、取消订单等核心操作。

## 文件结构

```
miniprogram/
├── api/
│   └── order.ts              # 订单 API 接口
├── components/
│   └── order-card/           # 订单卡片组件
│       ├── order-card.ts
│       ├── order-card.wxml
│       ├── order-card.wxss
│       └── order-card.json
└── pages/
    └── order-list/           # 订单列表页面
        ├── order-list.ts
        ├── order-list.wxml
        ├── order-list.wxss
        └── order-list.json
```

## 核心功能

### 1. 订单状态筛选

提供 4 个 Tab 标签，支持按状态筛选订单：

- **全部** - 显示所有订单
- **待支付** - `pending_payment` 状态
- **制作中** - `preparing` 状态
- **已完成** - `completed` 状态

```typescript
tabs: [
  { label: '全部', value: 'all' },
  { label: '待支付', value: 'pending_payment' },
  { label: '制作中', value: 'preparing' },
  { label: '已完成', value: 'completed' },
]
```

### 2. 订单列表展示

#### 订单卡片信息
- 订单号
- 订单状态标签（带颜色区分）
- 商品列表（商品名、规格、单价、数量）
- 订单类型（自提/外送）
- 下单时间（智能显示：今天/昨天/日期）
- 取餐码（自提订单）
- 预计时间（ETA）
- 总价和商品总数

#### 状态映射
```typescript
statusMap: {
  pending_payment: { text: '待支付', color: 'warning' },
  paid: { text: '已支付', color: 'success' },
  preparing: { text: '制作中', color: 'primary' },
  ready: { text: '待取餐', color: 'success' },
  completed: { text: '已完成', color: 'default' },
  cancelled: { text: '已取消', color: 'default' },
}
```

### 3. 下拉刷新

使用 `scroll-view` 的 `refresher-enabled` 原生能力：
- 下拉触发刷新
- 重置页码为 1
- 清空现有列表
- 重新加载数据

```typescript
onRefresh() {
  this.setData({
    refreshing: true,
    page: 1,
    orders: [],
    hasMore: true,
  });
  this.loadOrders(true);
}
```

### 4. 上拉加载更多

自动触发加载更多：
- 滚动到底部触发（`lower-threshold="100"`）
- 检查是否还有更多数据（`hasMore`）
- 防止重复请求（`loadingMore` 标记）
- 页码自动递增

```typescript
onLoadMore() {
  if (!this.data.hasMore || this.data.loadingMore) return;
  
  this.setData({
    page: this.data.page + 1,
  });
  this.loadOrders(false);
}
```

### 5. 取消订单功能

#### 流程
1. 点击"取消订单"按钮
2. 弹出二次确认对话框
3. 确认后调用取消接口
4. 显示加载中 Toast
5. 成功后显示成功提示
6. 自动刷新订单列表

```typescript
handleCancel(order: OrderListItem) {
  Dialog.confirm({
    title: '取消订单',
    content: '确认取消该订单吗？',
    confirmBtn: '确认取消',
    cancelBtn: '再想想',
  }).then(async () => {
    await cancelOrder(order.order_id);
    Toast({ message: '订单已取消', theme: 'success' });
    this.onRefresh();
  });
}
```

### 6. 其他操作

#### 待支付订单
- **取消订单** - 取消并刷新列表
- **去支付** - 跳转到支付页面

#### 制作中/待取餐订单
- **联系商家** - 拨打商家电话

#### 已完成订单
- **再来一单** - 将订单商品加入购物车并跳转到菜单页

### 7. 空态处理

根据不同筛选条件显示不同空态：
- **全部订单为空** - "还没有订单哦" + "去下单"按钮
- **筛选结果为空** - "暂无相关订单"

## API 接口

### 获取订单列表

```typescript
getOrderList(
  status?: string,      // 订单状态，'all' 或具体状态
  page: number = 1,     // 页码
  pageSize: number = 10 // 每页数量
): Promise<OrderListResponse>
```

**请求参数**：
- `status` - 可选，订单状态筛选
- `page` - 页码，从 1 开始
- `page_size` - 每页数量，默认 10

**响应数据**：
```typescript
interface OrderListResponse {
  orders: OrderListItem[];
  total: number;        // 总数
  page: number;         // 当前页
  page_size: number;    // 每页数量
  has_more: boolean;    // 是否还有更多
}
```

### 取消订单

```typescript
cancelOrder(orderId: number): Promise<{
  success: boolean;
  message?: string;
}>
```

**后端接口**：`POST /api/v1/orders/{order_id}/cancel`

## 数据类型

### OrderListItem

```typescript
interface OrderListItem {
  order_id: number;
  order_number: string;
  status: 'pending_payment' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  order_type: 'pickup' | 'delivery';
  total_price: number;
  created_at: string;
  is_scheduled: boolean;
  scheduled_at?: string | null;
  eta_minutes?: number | null;
  eta_text?: string | null;
  pickup_code?: string | null;
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    selected_specs: Array<{
      spec_id: number;
      option_id: number;
      option_name?: string;
      price_modifier?: number | null;
    }>;
  }>;
}
```

## 组件使用

### order-card 组件

**属性**：
- `order` - 订单对象（OrderListItem 类型）

**事件**：
- `bindtap` - 点击卡片事件
- `bindaction` - 操作按钮事件

**使用示例**：
```xml
<order-card
  wx:for="{{orders}}"
  wx:key="order_id"
  order="{{item}}"
  bindtap="onOrderTap"
  bindaction="onOrderAction"
/>
```

## 页面生命周期

### pageLifetimes.show

每次页面显示时自动刷新订单列表：
```typescript
pageLifetimes: {
  show() {
    this.loadOrders(true);
  }
}
```

## 性能优化

1. **防抖加载** - 通过 `loading` 和 `loadingMore` 标记防止重复请求
2. **分页加载** - 每次加载 10 条，减少首屏加载时间
3. **智能刷新** - 仅在必要时刷新列表
4. **滚动优化** - 使用 `scroll-view` 原生组件，性能更好

## 用户体验

1. **加载状态** - 首次加载显示 loading，上拉加载显示"加载更多"
2. **友好提示** - 操作成功/失败均有明确的 Toast 提示
3. **二次确认** - 取消订单等敏感操作需要二次确认
4. **空态引导** - 无订单时提供"去下单"入口
5. **日期格式化** - 智能显示时间（今天/昨天/具体日期）

## TODO

1. **再来一单** - 需要实现将订单商品加入购物车的逻辑
2. **订单详情页** - 需要创建订单详情页面（`/pages/order-detail/order-detail`）
3. **支付页面** - 需要创建支付页面（`/pages/payment/payment`）
4. **客服电话** - 需要从配置接口获取真实的客服电话
5. **后端接口** - 确认后端 API 是否支持：
   - `GET /api/v1/orders` - 订单列表接口
   - `POST /api/v1/orders/{order_id}/cancel` - 取消订单接口

## 测试建议

1. **状态筛选** - 测试各个 Tab 切换是否正常
2. **下拉刷新** - 测试下拉刷新是否能正确重置列表
3. **上拉加载** - 测试分页加载是否正常，是否正确处理"没有更多"状态
4. **取消订单** - 测试取消订单流程，包括二次确认和列表刷新
5. **空态** - 测试无订单时的空态显示
6. **错误处理** - 测试网络错误时的提示
7. **真机测试** - 在真机上测试滚动性能和交互体验
