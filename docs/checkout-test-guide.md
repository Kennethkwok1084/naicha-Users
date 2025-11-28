# 结算页测试指南

## 问题诊断与修复

### 已修复的问题

1. ✅ **导航栏不显示**
   - **原因**: `app.json` 全局设置了 `navigationStyle: "custom"`
   - **修复**: 在 `checkout.json` 中添加 `navigationStyle: "default"` 覆盖全局设置
   - **验证**: 重新编译后，结算页应显示标题"确认订单"和返回按钮

2. ✅ **购物车数据计算逻辑优化**
   - **原因**: 价格计算需要正确处理 `base_price` 和 `selected_specs.price_modifier`
   - **修复**: 
     - `updateCartDisplay()` 方法正确计算单品价格
     - `calculatePrice()` 方法正确累加总价
   - **验证**: 商品价格应显示为基础价格 + 所有规格加价

3. ✅ **添加调试日志**
   - 在 `onLoad`、`onShow`、`updateCartDisplay`、`calculatePrice` 中添加 console.log
   - 方便追踪数据流

## 测试步骤

### 1. 准备测试数据（添加商品到购物车）

**方法 A: 通过菜单页添加商品**

1. 在微信开发者工具中编译项目
2. 点击"构建 npm"（如果还没构建）
3. 导航到"点单"页面（菜单页）
4. 选择任意商品，点击"加入购物车"
5. 如果商品有规格（如糖度、温度），选择规格后添加
6. 确保购物车图标显示数量 > 0

**方法 B: 使用 Storage 面板手动添加（调试用）**

1. 打开微信开发者工具 → 调试器 → Storage → Storage
2. 添加 key: `guest_cart`，value:
```json
[
  {
    "product_id": 1,
    "product_name": "珍珠奶茶",
    "quantity": 2,
    "base_price": 15,
    "selected_specs": [
      {
        "group_id": 1,
        "group_name": "糖度",
        "option_id": 1,
        "option_name": "标准糖",
        "price_modifier": 0
      },
      {
        "group_id": 2,
        "group_name": "温度",
        "option_id": 3,
        "option_name": "去冰",
        "price_modifier": 0
      }
    ]
  },
  {
    "product_id": 2,
    "product_name": "芝士奶盖",
    "quantity": 1,
    "base_price": 18,
    "selected_specs": [
      {
        "group_id": 1,
        "group_name": "糖度",
        "option_id": 2,
        "option_name": "少糖",
        "price_modifier": 0
      }
    ]
  }
]
```
3. 保存后刷新页面

### 2. 进入结算页

1. 在菜单页点击购物车图标（或直接导航到 `/pages/checkout/checkout`）
2. 页面应显示：
   - ✅ 顶部导航栏：标题"确认订单"，左上角返回按钮
   - ✅ 配送方式 Tab："门店自提"（默认）和"外卖配送"
   - ✅ 商品明细列表
   - ✅ 价格统计

### 3. 验证显示内容

**导航栏**
- [ ] 显示标题"确认订单"
- [ ] 显示返回按钮（点击可返回上一页）
- [ ] 背景色为白色，文字为黑色

**配送方式 Tab**
- [ ] 默认选中"门店自提"
- [ ] 切换到"外卖配送"时，显示"选择收货地址"按钮
- [ ] 自提模式显示门店信息和预计取餐时间

**商品明细**
- [ ] 每个商品显示：
  - 商品图片（如有）
  - 商品名称（`product_name`）
  - 规格信息（如"标准糖/去冰"）
  - 单价（基础价 + 规格价）
  - 数量（x2）
- [ ] 价格计算正确：
  - 商品小计 = Σ(单价 × 数量)
  - 配送费：自提 ¥0，配送 ¥5
  - 实付金额 = 商品小计 + 配送费 - 优惠

**其他功能**
- [ ] 优惠券入口（点击提示"功能开发中"）
- [ ] 备注输入（点击弹出输入框）
- [ ] 提交订单按钮（蓝色，底部固定）

### 4. 功能测试

**配送方式切换**
1. 点击"外卖配送" tab
2. 应显示"选择收货地址"按钮
3. 配送费应变为 ¥5.00
4. 点击返回"门店自提"，配送费变回 ¥0.00

**地址选择（外卖配送模式）**
1. 切换到"外卖配送"
2. 点击"选择收货地址"
3. 在地图中选择位置（模拟器可能不支持，真机测试）
4. 选择后显示地址详情

**备注输入**
1. 点击"备注"行
2. 弹出输入框
3. 输入备注文字（如"少冰"）
4. 点击确认，备注应显示在列表中

**提交订单**
1. 点击"提交订单"按钮
2. 自提模式：直接提交
3. 配送模式：未选地址时提示"请选择收货地址"
4. 提交成功后：
   - 显示"下单成功"提示
   - 购物车清空
   - 跳转到订单列表页

## 常见问题排查

### 问题 1: 购物车数据为空

**检查步骤**：
1. 打开调试器 → Console，查看日志：
   ```
   === 结算页 onLoad ===
   购物车初始状态 - items: [...]
   ```
2. 打开调试器 → Storage → Storage，查看 `guest_cart` 是否有数据
3. 检查 cartStore 是否正确初始化

**解决方法**：
- 确保在菜单页添加了商品
- 或按"测试步骤 1 方法 B"手动添加数据
- 在 app.ts 中确认 `cartStore.init()` 被调用

### 问题 2: 商品显示但价格为 ¥0

**检查步骤**：
1. 查看 Console 日志中的商品数据结构
2. 确认 `base_price` 字段存在且不为 0
3. 确认 `selected_specs` 数组格式正确

**解决方法**：
- 检查菜单页添加商品时的数据格式
- 参考 `CartItem` 接口定义（`stores/cartStore.ts`）
- 手动修正 Storage 中的数据格式

### 问题 3: 导航栏仍然不显示

**检查步骤**：
1. 确认 `checkout.json` 中有 `"navigationStyle": "default"`
2. 重新编译项目（清除缓存）
3. 微信开发者工具：详情 → 本地设置 → 清除缓存

**解决方法**：
```bash
# 在项目根目录执行
cd miniprogram
# 删除编译缓存
rm -rf miniprogram_npm/.DS_Store
```
然后重新"构建 npm"和"编译"

### 问题 4: storeBindings 不工作

**检查步骤**：
1. 确认 `mobx-miniprogram-bindings` 已安装
2. 检查 `storeBindingsBehavior` 导入路径
3. 查看 Console 是否有 MobX 相关错误

**解决方法**：
```bash
# 重新安装依赖
npm install
# 重新构建 npm
# 在微信开发者工具中：工具 → 构建 npm
```

## 调试技巧

### 1. 查看 MobX store 状态
在 Console 中执行：
```javascript
const { cartStore } = require('./stores/cartStore')
console.log('items:', cartStore.items)
console.log('totalPrice:', cartStore.totalPrice)
console.log('totalQuantity:', cartStore.totalQuantity)
```

### 2. 强制刷新购物车显示
在结算页的 Console 中执行：
```javascript
getCurrentPages().slice(-1)[0].calculatePrice()
```

### 3. 查看页面数据
```javascript
const page = getCurrentPages().slice(-1)[0]
console.log('Page data:', page.data)
```

## 预期结果

完成所有测试后，结算页应该：
- ✅ 显示完整的导航栏
- ✅ 正确显示购物车商品（名称、规格、价格、数量）
- ✅ 价格计算准确
- ✅ 配送方式切换正常
- ✅ 各项交互功能正常
- ✅ 提交订单流程顺畅

## 后续优化建议

1. **真实 API 集成**：将 Mock 数据替换为真实的订单预览和创建接口
2. **地址管理**：实现完整的收货地址管理功能
3. **优惠券系统**：开发优惠券选择和计算逻辑
4. **库存校验**：提交订单前检查商品库存
5. **支付功能**：集成微信支付
6. **配送范围检测**：调用 `checkDeliveryRange` 接口验证配送距离

## 相关文件

- 页面逻辑：`miniprogram/pages/checkout/checkout.ts`
- 页面模板：`miniprogram/pages/checkout/checkout.wxml`
- 页面样式：`miniprogram/pages/checkout/checkout.wxss`
- 页面配置：`miniprogram/pages/checkout/checkout.json`
- 购物车 Store：`miniprogram/stores/cartStore.ts`
- 订单 API：`miniprogram/api/order.ts`
