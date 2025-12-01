# 默认头像说明

## 文件位置
`miniprogram/images/default-avatar.png`

## 规格要求
- **尺寸**: 200x200 像素
- **格式**: PNG (支持透明背景)
- **大小**: < 50KB
- **用途**: 用户未设置头像时的默认显示

## 设计建议

### 方案 1: 简约图标风格
使用一个简单的用户图标（user icon）:
- 圆形背景: `#E8EAED` (浅灰色)
- 图标颜色: `#9AA0A6` (中灰色)
- 居中的人像剪影图标

### 方案 2: 字母头像
显示 "用" 字或者 "U" 字母:
- 圆形背景: 渐变色 `#667eea → #764ba2`
- 文字颜色: 白色 `#FFFFFF`
- 字体: 加粗，居中

### 方案 3: 占位符图案
简单的几何图案:
- 渐变圆形
- 微信风格的占位符
- 奶茶相关的简单图标

## 临时解决方案

在正式设计稿到位前，可以使用以下方式:

### 使用 TDesign 头像组件的默认图标
```xml
<t-avatar size="large" icon="user" />
```

### 使用在线占位符服务
```javascript
const defaultAvatar = 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=200';
```

### 使用 Base64 内联图片
在代码中直接定义一个简单的 SVG 转 Base64 作为默认头像。

## 实现方式

### 方式 1: 使用网络图片（推荐用于开发阶段）
```javascript
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=用户&background=667eea&color=fff&size=200&font-size=0.5&rounded=true';
```

### 方式 2: 使用本地图片（推荐用于生产环境）
1. 设计师提供 PNG 图片
2. 放置在 `miniprogram/images/default-avatar.png`
3. 使用相对路径引用: `/images/default-avatar.png`

### 方式 3: 使用 TDesign 组件
在 WXML 中使用:
```xml
<t-avatar 
  wx:if="{{!userInfo.avatar_url}}"
  size="120rpx" 
  icon="user"
  shape="circle"
/>
```

## 当前使用

代码中当前引用方式:
```xml
<image 
  class="user-avatar" 
  src="{{userInfo.avatar_url || '/images/default-avatar.png'}}" 
  mode="aspectFill"
/>
```

**建议**: 在设计资源就绪前，临时使用 TDesign 的头像组件或在线占位符服务。
