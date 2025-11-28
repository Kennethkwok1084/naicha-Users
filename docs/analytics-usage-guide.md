# 业务埋点使用指南

本文档提供埋点框架的使用示例，涵盖页面访问、用户操作、业务转化等场景。

## 目录

1. [页面访问埋点](#页面访问埋点)
2. [商品相关埋点](#商品相关埋点)
3. [购物车埋点](#购物车埋点)
4. [订单埋点](#订单埋点)
5. [支付埋点](#支付埋点)
6. [用户行为埋点](#用户行为埋点)

---

## 页面访问埋点

### 方式一：使用页面混入（推荐）

自动记录页面访问、停留时长、页面离开等事件。

```typescript
// pages/menu/menu.ts
import { pageAnalytics } from '../../utils/page-analytics';

Page({
  ...pageAnalytics, // 混入埋点逻辑
  
  data: {
    // 你的数据
  },
  
  onLoad() {
    // 页面加载会自动记录 page_view 事件
  }
});
```

### 方式二：使用高阶函数

```typescript
// pages/menu/menu.ts
import { createPageWithAnalytics } from '../../utils/page-analytics';

createPageWithAnalytics({
  data: {
    // 你的数据
  },
  
  onLoad() {
    // 页面加载会自动记录 page_view 事件
  }
});
```

### 方式三：手动记录

```typescript
import { track, page } from '../../utils/analytics';

// 记录页面访问
page('/pages/menu/index', {
  page_title: '菜单页',
  query: { category_id: 1 },
  referrer: '/pages/index/index',
});

// 记录页面停留
track('page_leave', {
  page_path: '/pages/menu/index',
  duration: 5000, // 停留 5 秒
});
```

---

## 商品相关埋点

### 1. 商品曝光

```typescript
import { track } from '../../utils/analytics';

// 商品列表中的商品曝光
track('product_expose', {
  product_id: 123,
  product_name: '珍珠奶茶',
  category_id: 1,
  price: 15.00,
  position: 1, // 在列表中的位置
  source: 'menu_list', // 曝光来源
});
```

### 2. 商品点击/查看

```typescript
// 用户点击商品卡片，打开规格弹层
track('product_view', {
  product_id: 123,
  product_name: '珍珠奶茶',
  category_id: 1,
  price: 15.00,
  source: 'menu_list',
});
```

### 3. 规格选择

```typescript
// 用户选择规格
track('spec_select', {
  product_id: 123,
  product_name: '珍珠奶茶',
  group_name: '温度',
  option_name: '热饮',
  price_modifier: 0,
});
```

---

## 购物车埋点

### 1. 加入购物车

```typescript
import { track } from '../../utils/analytics';
import type { AddToCartPayload } from '../../../typings/analytics';

// 用户点击"加入购物车"
const payload: AddToCartPayload = {
  product_id: 123,
  product_name: '珍珠奶茶',
  quantity: 1,
  unit_price: 17.00,
  selected_specs: [
    {
      group_id: 1,
      group_name: '温度',
      option_id: 1,
      option_name: '热饮',
      price_modifier: 0,
    },
    {
      group_id: 2,
      group_name: '加料',
      option_id: 3,
      option_name: '珍珠',
      price_modifier: 2.00,
    },
  ],
  source: 'menu_spec_popup', // 来源：规格弹层
};

track('add_to_cart', payload);
```

### 2. 移除购物车商品

```typescript
track('remove_from_cart', {
  product_id: 123,
  product_name: '珍珠奶茶',
  quantity: 1,
  source: 'cart_page',
});
```

### 3. 修改商品数量

```typescript
track('cart_quantity_change', {
  product_id: 123,
  product_name: '珍珠奶茶',
  old_quantity: 1,
  new_quantity: 2,
  source: 'cart_page',
});
```

### 4. 清空购物车

```typescript
track('cart_clear', {
  item_count: 3, // 清空前的商品数量
  total_value: 45.00, // 清空前的总价
  source: 'cart_page',
});
```

---

## 订单埋点

### 1. 开始结算

```typescript
track('checkout_start', {
  item_count: 3,
  total_price: 45.00,
  order_type: 'pickup', // 'pickup' | 'delivery'
  source: 'cart_page',
});
```

### 2. 选择配送方式

```typescript
track('delivery_type_select', {
  order_type: 'delivery', // 切换为外送
  source: 'checkout_page',
});
```

### 3. 选择地址

```typescript
track('address_select', {
  address_id: 1,
  city: '深圳市',
  district: '南山区',
  source: 'checkout_page',
});
```

### 4. 选择优惠券

```typescript
track('coupon_select', {
  coupon_id: 100,
  coupon_type: 'discount',
  discount_amount: 5.00,
  source: 'checkout_page',
});
```

### 5. 使用积分

```typescript
track('points_use', {
  points_used: 100,
  discount_amount: 10.00,
  source: 'checkout_page',
});
```

### 6. 创建订单

```typescript
import type { OrderCreatePayload } from '../../../typings/analytics';

const payload: OrderCreatePayload = {
  order_id: 12345,
  order_number: 'ORD202511260001',
  order_type: 'pickup',
  total_price: 40.00,
  item_count: 3,
  coupon_used: true,
  points_used: 100,
  source: 'checkout_page',
};

track('order_create', payload);
```

### 7. 订单创建失败

```typescript
track('order_create_fail', {
  error_code: 'INVENTORY_SHORTAGE',
  error_message: '珍珠奶茶库存不足',
  item_count: 3,
  total_price: 45.00,
  source: 'checkout_page',
});
```

---

## 支付埋点

### 1. 发起支付

```typescript
import type { PaymentPayload } from '../../../typings/analytics';

track('payment_initiate', {
  order_id: 12345,
  order_number: 'ORD202511260001',
  payment_channel: 'wechat_jsapi',
  amount: 40.00,
  source: 'order_detail_page',
});
```

### 2. 支付成功

```typescript
const payload: PaymentPayload = {
  order_id: 12345,
  order_number: 'ORD202511260001',
  payment_channel: 'wechat_jsapi',
  amount: 40.00,
  status: 'success',
  source: 'payment_page',
};

track('payment_success', payload);
```

### 3. 支付失败

```typescript
const payload: PaymentPayload = {
  order_id: 12345,
  order_number: 'ORD202511260001',
  payment_channel: 'wechat_jsapi',
  amount: 40.00,
  status: 'fail',
  fail_reason: '余额不足',
  source: 'payment_page',
};

track('payment_fail', payload);
```

### 4. 取消支付

```typescript
const payload: PaymentPayload = {
  order_id: 12345,
  order_number: 'ORD202511260001',
  payment_channel: 'wechat_jsapi',
  amount: 40.00,
  status: 'cancel',
  source: 'payment_page',
};

track('payment_cancel', payload);
```

---

## 用户行为埋点

### 1. 用户登录

```typescript
import { user, track } from '../../utils/analytics';

// 登录成功后更新用户属性
user({
  user_id: 10001,
  is_logged_in: true,
  phone: '138****8888', // 脱敏后的手机号
  tags: ['new_user', 'wechat_login'],
});

// 记录登录事件
track('user_login', {
  login_type: 'wechat',
  source: 'checkout_page', // 从结算页触发登录
});
```

### 2. 用户登出

```typescript
track('user_logout', {
  source: 'profile_page',
});

// 清除用户属性
user({
  user_id: undefined,
  is_logged_in: false,
});
```

### 3. 搜索

```typescript
track('search', {
  keyword: '珍珠奶茶',
  result_count: 5,
  source: 'menu_search_bar',
});
```

### 4. 分享

```typescript
track('share', {
  share_type: 'wechat_friend', // 'wechat_friend' | 'wechat_moments'
  share_content: 'product', // 'product' | 'order' | 'coupon'
  share_target_id: 123, // 商品ID/订单ID/优惠券ID
  source: 'product_detail_page',
});
```

### 5. 点击外部链接

```typescript
track('external_link_click', {
  url: 'https://example.com',
  link_text: '了解更多',
  source: 'profile_page',
});
```

---

## 完整示例：菜单页

```typescript
// pages/menu/menu.ts
import { pageAnalytics, track } from '../../utils/analytics';

Page({
  ...pageAnalytics, // 自动记录页面访问
  
  data: {
    products: [],
  },
  
  onLoad() {
    this.loadMenu();
  },
  
  // 加载菜单
  async loadMenu() {
    const products = await getMenuData();
    this.setData({ products });
    
    // 记录菜单加载成功
    track('menu_load_success', {
      product_count: products.length,
      source: 'menu_page',
    });
  },
  
  // 商品点击
  onProductClick(e: any) {
    const { product } = e.currentTarget.dataset;
    
    // 记录商品查看
    track('product_view', {
      product_id: product.product_id,
      product_name: product.name,
      price: product.base_price,
      source: 'menu_list',
    });
    
    // 打开规格弹层
    this.openSpecPopup(product);
  },
  
  // 加入购物车
  onAddToCart(product: any, specs: any[], quantity: number) {
    // 记录加购事件
    track('add_to_cart', {
      product_id: product.product_id,
      product_name: product.name,
      quantity,
      unit_price: this.calculatePrice(product, specs),
      selected_specs: specs,
      source: 'menu_spec_popup',
    });
    
    // 业务逻辑...
  },
});
```

---

## 完整示例：结算页

```typescript
// pages/checkout/checkout.ts
import { pageAnalytics, track } from '../../utils/analytics';

Page({
  ...pageAnalytics,
  
  data: {
    orderType: 'pickup',
    items: [],
    totalPrice: 0,
  },
  
  onLoad() {
    // 记录开始结算
    track('checkout_start', {
      item_count: this.data.items.length,
      total_price: this.data.totalPrice,
      order_type: this.data.orderType,
      source: 'cart_page',
    });
  },
  
  // 切换配送方式
  onOrderTypeChange(e: any) {
    const orderType = e.detail.value;
    this.setData({ orderType });
    
    track('delivery_type_select', {
      order_type: orderType,
      source: 'checkout_page',
    });
  },
  
  // 提交订单
  async onSubmit() {
    try {
      const order = await createOrder({
        order_type: this.data.orderType,
        items: this.data.items,
      });
      
      // 记录订单创建成功
      track('order_create', {
        order_id: order.order_id,
        order_number: order.order_number,
        order_type: this.data.orderType,
        total_price: order.total_price,
        item_count: this.data.items.length,
        source: 'checkout_page',
      });
      
      // 跳转支付
      wx.navigateTo({
        url: `/pages/payment/index?order_id=${order.order_id}`,
      });
    } catch (error: any) {
      // 记录订单创建失败
      track('order_create_fail', {
        error_code: error.code,
        error_message: error.message,
        item_count: this.data.items.length,
        total_price: this.data.totalPrice,
        source: 'checkout_page',
      });
    }
  },
});
```

---

## 最佳实践

### 1. 命名规范

- **事件名称**：使用 `snake_case`，动词在前（如 `product_view`, `add_to_cart`）
- **字段名称**：使用 `snake_case`（如 `product_id`, `order_type`）
- **来源标识**：统一使用 `source` 字段（如 `menu_list`, `checkout_page`）

### 2. 数据一致性

- 同一实体在不同事件中使用相同的字段名（如 `product_id` 而不是 `prod_id`）
- 价格统一使用 `number` 类型，单位为元（如 `15.00`）
- 时间统一使用 Unix 毫秒时间戳（框架已自动注入）

### 3. 性能优化

- 埋点调用不应阻塞主流程（框架已自动异步处理）
- 避免在高频事件中埋点（如滚动事件）
- 大数据量 payload 需要精简（限制 8KB）

### 4. 隐私保护

- 手机号自动脱敏（框架已处理）
- 不上报敏感信息（如密码、支付密钥）
- 用户ID 使用业务ID而非真实身份信息

### 5. 调试

开发环境开启调试日志：

```typescript
import { initAnalytics } from '../../utils/analytics';

initAnalytics({
  debug: true, // 打印所有埋点事件
});
```

---

## 常见问题

### Q1: 埋点数据何时上报？

- 队列达到 10 条事件时立即上报
- 500ms 内无新事件时自动上报
- 小程序隐藏/退出时强制上报

### Q2: 如何查看埋点是否成功？

开发环境开启 `debug: true`，控制台会打印所有埋点事件。

### Q3: 埋点失败会影响业务吗？

不会。埋点接口失败会静默处理，不会阻塞业务流程。

### Q4: 如何避免重复上报？

框架基于 UUID 去重，相同 `event.id` 的事件只会入库一次。

---

## 相关文档

- [埋点类型定义](../../typings/analytics.d.ts)
- [埋点工具类](../../miniprogram/utils/analytics.ts)
- [埋点 API 模块](../../miniprogram/api/analytics.ts)
- [OpenAPI 规范](../../naicha-openapi.json) - `/api/v1/analytics/events`
