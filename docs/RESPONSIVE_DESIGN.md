# 响应式设计规范

## 问题背景
在不同机型（尤其是屏幕尺寸和 DPI 不同的设备）上，使用固定 `px` 单位会导致图标、间距等元素错位或大小不一致。

## 解决方案

### 1. 统一使用 rpx 作为响应式单位
- **rpx (responsive pixel)**: 小程序的响应式单位，会根据屏幕宽度自动缩放
- **换算规则**: 在 iPhone 6 (375px 屏宽) 下，`1rpx = 0.5px`，即 `1px = 2rpx`

### 2. 全局 CSS 变量（app.wxss）
```css
page {
  /* 图标尺寸 - 统一管理，适配不同机型 */
  --icon-size-xs: 32rpx;
  --icon-size-sm: 40rpx;
  --icon-size-md: 48rpx;
  --icon-size-lg: 56rpx;
  --icon-size-xl: 64rpx;
  
  /* 字号 */
  --font-size-xs: 24rpx;
  --font-size-sm: 28rpx;
  --font-size-md: 32rpx;
  --font-size-lg: 36rpx;
  --font-size-xl: 40rpx;
  --font-size-xxl: 48rpx;
  
  /* 间距 */
  --spacing-xs: 8rpx;
  --spacing-sm: 16rpx;
  --spacing-md: 24rpx;
  --spacing-lg: 32rpx;
  --spacing-xl: 48rpx;
  
  /* 圆角 */
  --border-radius-sm: 8rpx;
  --border-radius-md: 16rpx;
  --border-radius-lg: 24rpx;
  --border-radius-round: 999rpx;
}
```

### 3. 图标尺寸使用规范

#### ✅ 正确使用
```html
<!-- 使用 rpx -->
<t-icon name="home" size="40rpx" />
<t-icon name="cart" size="48rpx" />

<!-- 使用 CSS 变量 -->
<t-icon name="close" size="{{iconSize}}" />  <!-- iconSize = '40rpx' -->
```

#### ❌ 错误使用
```html
<!-- 不要使用固定 px -->
<t-icon name="home" size="20px" />  <!-- ❌ 会导致跨机型错位 -->
<t-icon name="cart" size="24px" />  <!-- ❌ 会导致跨机型错位 -->
```

### 4. 导航栏适配

#### navigation-bar 组件
```css
.weui-navigation-bar {
  --height: 88rpx;        /* 使用 rpx */
  --left: 32rpx;
  --icon-size: 48rpx;
}
```

#### 自定义 app-bar (menu 页面)
```css
.app-bar {
  /* 使用 env() 获取安全区域，确保跨机型适配 */
  padding-top: calc(env(safe-area-inset-top) + 16rpx);
}

.app-bar__inner {
  min-height: 88rpx;  /* 固定 rpx 高度 */
  height: auto;
}

.app-bar__icon-btn {
  width: 72rpx !important;
  height: 72rpx !important;
}
```

### 5. TypeScript 中动态设置尺寸

#### ❌ 错误做法
```typescript
// 直接使用系统返回的物理像素
innerPaddingRight: `padding-right: ${res.windowWidth - rect.left}px`
```

#### ✅ 正确做法
```typescript
// 转换为 rpx（物理像素 × 2）
const rightPadding = (res.windowWidth - rect.left) * 2
innerPaddingRight: `padding-right: ${rightPadding}rpx`
```

### 6. 安全区域适配
使用 `env()` 函数处理刘海屏、全面屏等设备的安全区域：

```css
.bottom-bar {
  /* 底部安全区域适配 */
  padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
}

.top-bar {
  /* 顶部安全区域适配 */
  padding-top: calc(env(safe-area-inset-top) + 16rpx);
}
```

## 最佳实践

### 尺寸选择参考
| 元素类型 | 推荐尺寸 | CSS 变量 |
|---------|---------|----------|
| 小图标 | 32-40rpx | --icon-size-xs / --icon-size-sm |
| 常规图标 | 48rpx | --icon-size-md |
| 大图标 | 56-64rpx | --icon-size-lg / --icon-size-xl |
| 按钮高度 | 64-88rpx | - |
| 卡片圆角 | 16-24rpx | --border-radius-md / --border-radius-lg |
| 间距 | 16-32rpx | --spacing-sm / --spacing-lg |

### 常见场景

#### 1. 导航按钮
```html
<t-button class="nav-btn">
  <t-icon name="chevron-left" size="40rpx" />
</t-button>
```

```css
.nav-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 36rpx;
}
```

#### 2. 列表图标
```html
<t-icon name="location" size="40rpx" />
<t-icon name="call" size="48rpx" />
```

#### 3. 购物车图标
```html
<t-icon name="cart" size="48rpx" />
```

## 测试建议
1. 在微信开发者工具中切换不同机型模拟器测试
2. 特别关注：
   - iPhone 6/7/8 (375px)
   - iPhone 6/7/8 Plus (414px)
   - iPhone X/11/12/13 (375px, 有刘海)
   - Android 小屏 (360px)
   - Android 大屏 (480px+)
3. 检查图标是否对齐、大小是否一致

## 修复记录
- ✅ navigation-bar 组件: 全部改用 rpx
- ✅ menu 页面: app-bar 使用 rpx + env()
- ✅ menu.wxml: 所有 t-icon 改用 rpx
- ✅ app.wxss: 添加全局 CSS 变量
- ✅ navigation-bar.ts: 动态计算转换为 rpx

## 注意事项
1. **避免混用**: 不要在同一项目中混用 px 和 rpx
2. **CSS 变量优先**: 优先使用 CSS 变量，便于统一调整
3. **动态样式转换**: TypeScript 中动态设置样式时，记得将物理像素转为 rpx
4. **安全区域**: 涉及全屏或固定定位的元素，务必使用 env() 处理安全区域
