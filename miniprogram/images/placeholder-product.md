# 商品占位图片指南

## 商品默认占位图

在 `product-card` 组件中,当商品没有图片时,会使用占位图:

```
/images/placeholder-product.png
```

### 占位图规格
- **尺寸**: 建议 400x400px (1:1 比例)
- **格式**: PNG (支持透明背景)
- **文件大小**: 建议 < 50KB

### 创建占位图的方法

**方法 1: 使用在线工具**
- 访问 [placeholder.com](https://placeholder.com/)
- 生成 400x400 的占位图
- 下载并重命名为 `placeholder-product.png`

**方法 2: 使用 SVG (临时方案)**
在组件中直接使用 data URI:
```javascript
// 在 product-card.ts 中设置默认值
imageUrl: {
  type: String,
  value: 'data:image/svg+xml;base64,...'
}
```

**方法 3: 使用微信云存储**
- 上传商品图片到云存储
- 在后端 API 返回云存储 URL

## 临时方案

在开发阶段,可以使用以下临时占位图:
- 浅灰色背景 + "暂无图片" 文字
- 使用 CSS 背景色代替图片

将在后续开发中补充实际占位图资源。
