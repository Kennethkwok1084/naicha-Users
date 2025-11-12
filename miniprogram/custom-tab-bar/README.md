# 使用 TDesign 悬浮胶囊 TabBar 说明

## ✅ 已完成配置

### 1. 使用 TDesign TabBar 的优势

- ✅ **悬浮胶囊设计** - 现代化的悬浮式 UI,美观大方
- ✅ **图标在上文字在下** - 清晰的信息层级
- ✅ **渐变选中效果** - 使用品牌色渐变背景
- ✅ **内置图标库** - TDesign 图标丰富且统一
- ✅ **毛玻璃背景** - backdrop-filter 模糊效果
- ✅ **响应式动画** - 切换流畅自然

### 2. 当前配置

#### app.json
```json
{
  "tabBar": {
    "custom": true,
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/menu/menu", "text": "点单" },
      { "pagePath": "pages/order-list/order-list", "text": "订单" },
      { "pagePath": "pages/profile/profile", "text": "我的" }
    ]
  }
}
```

#### custom-tab-bar/index.wxml
```xml
<t-tab-bar 
  value="{{active}}" 
  bindchange="onChange" 
  shape="round" 
  theme="tag" 
  split="{{false}}"
  t-class="custom-tab-bar"
>
  <t-tab-bar-item
    wx:for="{{list}}"
    wx:key="name"
    value="{{item.name}}"
    icon="{{item.icon}}"
  >
    {{item.text}}
  </t-tab-bar-item>
</t-tab-bar>
```

### 3. TDesign 图标列表

当前使用的图标:
- `home` - 首页 🏠
- `app` - 点单 📱
- `order` - 订单 📋
- `user` - 我的 👤

更多可用图标 (https://tdesign.tencent.com/miniprogram/components/icon):
- `shop` - 店铺
- `cart` - 购物车
- `coupon` - 优惠券
- `location` - 定位
- `setting` - 设置
- `notification` - 通知

### 4. 样式特点

#### 悬浮胶囊效果
- 底部悬浮,左右留白 32rpx
- 圆角 48rpx,呈现胶囊形状
- 阴影 `0 8rpx 32rpx rgba(0, 0, 0, 0.12)`
- 毛玻璃背景 `backdrop-filter: blur(20rpx)`

#### 布局方式
- 图标在上: `font-size: 44rpx`
- 文字在下: `font-size: 24rpx`
- `flex-direction: column`

#### 选中状态
- 背景: 渐变色 `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 文字: 白色
- 圆角: 32rpx

### 5. 自定义主题

在 `app.wxss` 中修改:
```css
page {
  --td-brand-color: #667eea;
  --td-brand-color-hover: #764ba2;
  --td-tab-bar-bg: rgba(255, 255, 255, 0.9);
  --td-tab-bar-color: #666666;
  --td-tab-bar-active-color: #ffffff;
}
```

### 6. 更换图标

修改 `custom-tab-bar/index.ts`:
```typescript
list: [
  {
    name: 'index',
    icon: 'home',  // 改为其他 TDesign 图标名
    text: '首页'
  }
]
```

### 7. 调整样式

修改 `custom-tab-bar/index.wxss`:
```css
/* 调整悬浮高度 */
.custom-tab-bar {
  bottom: 32rpx !important; /* 改为其他值 */
}

/* 调整圆角 */
.custom-tab-bar {
  border-radius: 48rpx !important; /* 改为其他值 */
}

/* 调整选中背景色 */
.custom-tab-bar .t-tab-bar-item--active {
  background: #667eea !important; /* 单色背景 */
}
```

### 8. 页面配置

每个 tabBar 页面需要在 `pageLifetimes.show` 中更新选中状态:

```typescript
Component({
  pageLifetimes: {
    show() {
      const that = this as any
      if (typeof that.getTabBar === 'function' && that.getTabBar()) {
        that.getTabBar().updateActive('页面名称')
      }
    }
  }
})
```

### 9. 编译步骤

1. 在微信开发者工具中: **工具 -> 构建 npm**
2. 编译成功后刷新页面
3. 查看底部悬浮胶囊 TabBar 效果

### 10. 常见问题

**Q: TabBar 不显示?**
A: 检查是否已执行"构建 npm",确认 TDesign 已安装

**Q: 样式不生效?**
A: 使用 `!important` 覆盖默认样式,或修改 TDesign 主题变量

**Q: 图标不显示?**
A: 确认图标名称正确,查看 TDesign 图标文档

**Q: 悬浮位置不对?**
A: 调整 `bottom`、`left`、`right` 值

**Q: 选中状态不对?**
A: 检查每个页面的 `updateActive` 调用

## 🎨 效果预览

```
┌─────────────────────────────┐
│                             │
│     页面内容区域              │
│                             │
│                             │
└─────────────────────────────┘
    ┌───────────────────┐
    │ 🏠  📱  📋  👤   │  ← 悬浮胶囊 TabBar
    │首页 点单 订单 我的│
    └───────────────────┘
```

## 📚 参考文档

- TDesign TabBar: https://tdesign.tencent.com/miniprogram/components/tab-bar
- TDesign Icon: https://tdesign.tencent.com/miniprogram/components/icon
- TDesign 主题: https://tdesign.tencent.com/miniprogram/custom-theme

## ✅ 已完成配置

### 1. 使用 Vant Weapp TabBar 的优势

- ✅ **无需图标文件** - 使用 Vant 内置图标字体
- ✅ **更灵活** - 完全自定义样式和交互
- ✅ **统一风格** - 与 Vant 组件库保持一致
- ✅ **支持徽标** - 可轻松添加消息提示数字
- ✅ **动画效果** - 自带切换动画

### 2. 当前配置

#### app.json
```json
{
  "tabBar": {
    "custom": true,  // 启用自定义 TabBar
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/menu/menu", "text": "点单" },
      { "pagePath": "pages/order-list/order-list", "text": "订单" },
      { "pagePath": "pages/profile/profile", "text": "我的" }
    ]
  }
}
```

#### custom-tab-bar/index.wxml
使用 Vant Weapp 的 tabbar 组件:
```xml
<van-tabbar active="{{ active }}" bind:change="onChange">
  <van-tabbar-item icon="home-o">首页</van-tabbar-item>
  <van-tabbar-item icon="apps-o">点单</van-tabbar-item>
  <van-tabbar-item icon="orders-o">订单</van-tabbar-item>
  <van-tabbar-item icon="user-o">我的</van-tabbar-item>
</van-tabbar>
```

### 3. Vant 内置图标列表

当前使用的图标:
- `home-o` - 首页 (房子轮廓)
- `apps-o` - 点单 (九宫格应用)
- `orders-o` - 订单 (文件列表)
- `user-o` - 我的 (用户头像轮廓)

可选图标 (参考 https://vant-ui.github.io/vant-weapp/#/icon):
- `wap-home-o` - 另一种首页图标
- `bag-o` - 购物袋
- `shopping-cart-o` - 购物车
- `coupon-o` - 优惠券
- `balance-list-o` - 账单列表
- `contact` - 联系人

### 4. 自定义图标颜色

在 `custom-tab-bar/index.wxml` 中:
```xml
<van-tabbar 
  active="{{ active }}" 
  bind:change="onChange"
  active-color="#07c160"    <!-- 选中颜色 (微信绿) -->
  inactive-color="#999999"  <!-- 未选中颜色 (灰色) -->
>
```

### 5. 添加徽标 (消息提示)

如需在订单页显示未读数量:
```xml
<van-tabbar-item icon="orders-o" dot>订单</van-tabbar-item>
<!-- 或显示数字 -->
<van-tabbar-item icon="orders-o" info="5">订单</van-tabbar-item>
```

动态绑定数据:
```xml
<van-tabbar-item icon="orders-o" info="{{ orderCount }}">订单</van-tabbar-item>
```

### 6. 切换图标

修改 `custom-tab-bar/index.wxml`,将图标替换为其他 Vant 图标即可:

```xml
<!-- 示例: 使用其他图标 -->
<van-tabbar-item icon="wap-home">首页</van-tabbar-item>
<van-tabbar-item icon="shopping-cart-o">点单</van-tabbar-item>
<van-tabbar-item icon="balance-list-o">订单</van-tabbar-item>
<van-tabbar-item icon="contact">我的</van-tabbar-item>
```

### 7. 使用自定义图片图标 (可选)

如果想使用自己的图标图片:
```xml
<van-tabbar-item 
  icon="/images/home.png" 
  active-icon="/images/home-active.png"
>
  首页
</van-tabbar-item>
```

### 8. 页面配置说明

每个 tabBar 页面都需要:
1. 使用 `Component()` 而不是 `Page()`
2. 在 `pageLifetimes.show` 中更新选中状态

```typescript
Component({
  pageLifetimes: {
    show() {
      const that = this as any
      if (typeof that.getTabBar === 'function' && that.getTabBar()) {
        that.getTabBar().updateActive('页面名称')
      }
    }
  }
})
```

### 9. 编译步骤

1. 在微信开发者工具中: **工具 -> 构建 npm**
2. 编译成功后刷新页面
3. 查看底部 TabBar 效果

### 10. 常见问题

**Q: TabBar 不显示?**
A: 检查是否已执行"构建 npm"

**Q: 图标不显示?**
A: 确认 Vant Weapp 版本 >= 1.0,图标名称正确

**Q: 切换页面后 TabBar 选中状态不对?**
A: 检查每个页面的 `pageLifetimes.show` 是否正确配置

**Q: 想用自己的图标?**
A: 使用 `icon` 和 `active-icon` 属性指定图片路径

## 🎨 进一步定制

查看 Vant Weapp Tabbar 完整文档:
https://vant-ui.github.io/vant-weapp/#/tabbar
