# 悬浮式导航栏说明

## ✅ 已实现功能

### 1. 悬浮式设计
- ✅ **绝对定位** - 导航栏浮动在页面内容之上
- ✅ **透明背景** - 支持 `background="transparent"`
- ✅ **毛玻璃效果** - 背景模糊 (backdrop-filter)
- ✅ **自适应颜色** - 文字颜色可自定义

### 2. 新增属性

#### `background`
- 默认: `#ffffff` (白色)
- 透明: `transparent` (自动启用毛玻璃效果)
- 自定义: 任意颜色值或渐变

#### `opacity`
- 范围: 0-1
- 默认: 1 (完全不透明)
- 用途: 控制导航栏整体透明度

#### `shadow`
- 类型: Boolean
- 默认: false
- 用途: 是否显示底部阴影

## 📖 使用示例

### 1. 首页 - 透明悬浮导航栏
```xml
<navigation-bar 
  title="首页" 
  back="{{false}}" 
  color="#333333" 
  background="transparent"
></navigation-bar>
```

效果:
- 透明背景 + 毛玻璃模糊
- 悬浮在轮播图之上
- 文字颜色深灰色

### 2. 普通页面 - 白色导航栏
```xml
<navigation-bar 
  title="我的" 
  back="{{true}}" 
  color="#333333" 
  background="#ffffff"
  shadow="{{true}}"
></navigation-bar>
```

效果:
- 白色背景
- 显示返回按钮
- 底部阴影

### 3. 渐变背景导航栏
```xml
<navigation-bar 
  title="点单" 
  back="{{false}}" 
  color="white" 
  background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
></navigation-bar>
```

### 4. 半透明导航栏
```xml
<navigation-bar 
  title="订单" 
  back="{{false}}" 
  color="black" 
  background="rgba(255, 255, 255, 0.8)"
></navigation-bar>
```

## 🎨 页面布局要点

### 使用悬浮导航栏的页面结构:

```xml
<!-- 正确 ✅ -->
<view class="page-container">
  <navigation-bar background="transparent"></navigation-bar>
  <scroll-view class="scrollarea">
    <!-- 页面内容 -->
  </scroll-view>
</view>
```

### 对应样式:

```css
.page-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.scrollarea {
  width: 100%;
  height: 100%;
}
```

### ⚠️ 错误示例:

```xml
<!-- 错误 ❌ - 导航栏和内容分离 -->
<navigation-bar></navigation-bar>
<scroll-view></scroll-view>
```

## 💡 高级用法

### 滚动时改变导航栏样式

在页面 TypeScript 中:
```typescript
Component({
  data: {
    navOpacity: 0.8,
    navBackground: 'transparent'
  },

  methods: {
    onScroll(e: any) {
      const scrollTop = e.detail.scrollTop
      // 滚动超过 100px 时变为白色背景
      if (scrollTop > 100) {
        this.setData({
          navBackground: '#ffffff',
          navOpacity: 1
        })
      } else {
        this.setData({
          navBackground: 'transparent',
          navOpacity: 0.8
        })
      }
    }
  }
})
```

在 WXML 中:
```xml
<navigation-bar 
  background="{{navBackground}}"
  opacity="{{navOpacity}}"
></navigation-bar>
<scroll-view bindscroll="onScroll">
  <!-- 内容 -->
</scroll-view>
```

## 🔧 样式定制

### 修改毛玻璃模糊度

编辑 `components/navigation-bar/navigation-bar.wxss`:
```css
.nav-backdrop {
  backdrop-filter: blur(20rpx); /* 调整这个值 */
  background: rgba(255, 255, 255, 0.7); /* 调整透明度 */
}
```

### 添加边框
```xml
<navigation-bar 
  background="transparent"
  style="border-bottom: 1rpx solid rgba(0,0,0,0.1);"
></navigation-bar>
```

## 📱 兼容性说明

- ✅ iOS: 完全支持毛玻璃效果
- ✅ Android: 支持透明背景,毛玻璃效果可能降级
- ✅ 微信开发者工具: 完全支持

## 🎯 常见问题

**Q: 为什么导航栏下面有白色方块?**
A: 确保页面使用了正确的布局结构,外层要有 `page-container`

**Q: 毛玻璃效果不显示?**
A: 检查是否设置了 `background="transparent"`,某些安卓设备可能不支持

**Q: 如何让导航栏跟随滚动?**
A: 移除 `position: absolute`,使用 `position: sticky`

**Q: 导航栏遮挡内容?**
A: 这是悬浮式设计的特点,内容会在导航栏下方滚动
