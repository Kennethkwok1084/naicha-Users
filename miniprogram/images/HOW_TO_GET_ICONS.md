# 快速获取 TabBar 图标指南

## 🎯 需要的8个图标文件

```
miniprogram/images/
├── home.png           (首页-灰色)
├── home-active.png    (首页-绿色)
├── menu.png           (点单-灰色)
├── menu-active.png    (点单-绿色)
├── order.png          (订单-灰色)
├── order-active.png   (订单-绿色)
├── profile.png        (我的-灰色)
└── profile-active.png (我的-绿色)
```

## 📥 推荐获取方式

### 方式一: Iconfont (最简单,免费)

1. **访问**: https://www.iconfont.cn/
2. **搜索并下载**:
   - 搜索 "首页" → 下载 home 图标
   - 搜索 "菜单" → 下载 menu 图标  
   - 搜索 "订单" → 下载 order 图标
   - 搜索 "用户" → 下载 profile 图标

3. **下载设置**:
   - 格式: PNG
   - 尺寸: 81x81 或 128x128
   - 颜色: #999999 (灰色) 和 #07c160 (绿色)

4. **重命名**:
   - 灰色版本命名为: home.png, menu.png, order.png, profile.png
   - 绿色版本命名为: home-active.png, menu-active.png, order-active.png, profile-active.png

5. **放置**: 将8个文件放入 `miniprogram/images/` 目录

### 方式二: 使用在线工具直接生成

访问这些网站,选择图标并自定义颜色:
- https://icons8.com/icons (可直接设置颜色和尺寸)
- https://www.flaticon.com/ (需要编辑颜色)
- https://iconmonstr.com/ (简约风格)

### 方式三: 使用 Figma 设计

如果您有 Figma 账号:
1. 新建 81x81 画布
2. 使用图标插件 (如 Iconify, Material Icons)
3. 调整颜色并导出 PNG

## 🎨 图标设计建议

### 图标主题对应关系:
- **首页**: 房子 🏠
- **点单**: 菜单/列表 📋
- **订单**: 文件/清单 📄
- **我的**: 用户/头像 👤

### 颜色规范:
- **未选中**: #999999 (中灰色)
- **选中**: #07c160 (微信绿)

## ⚡ 当前临时方案

项目已配置为**纯文字 TabBar**,图标路径已移除,可以正常运行。

等您准备好图标后,修改 `miniprogram/app.json`:

```json
{
  "pagePath": "pages/index/index",
  "text": "首页",
  "iconPath": "images/home.png",              // 添加这行
  "selectedIconPath": "images/home-active.png" // 添加这行
}
```

## 📦 快速测试

图标放置完成后,在微信开发者工具中:
1. 保存文件 (Ctrl+S)
2. 编译预览
3. 点击底部 TabBar 查看图标切换效果

## ❓ 常见问题

**Q: 图标不显示?**
A: 检查文件路径和文件名大小写是否一致

**Q: 图标模糊?**  
A: 使用 2x 或 3x 尺寸 (162x162 或 243x243),小程序会自动缩放

**Q: 临时想快速测试?**
A: 当前已配置纯文字 TabBar,功能完全正常,图标可后续添加
