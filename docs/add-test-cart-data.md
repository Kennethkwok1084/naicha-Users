# 添加购物车测试数据

## 问题诊断

如果结算页显示"商品明细"为空且总价为 ¥0.00，可能的原因：

1. **购物车本身为空** - 没有从菜单页添加商品
2. **Store 绑定延迟** - MobX 绑定需要时间生效
3. **本地存储未加载** - cartStore.init() 未正确执行

## 快速测试方法

### 方法 1: 通过调试器手动添加数据

1. 打开微信开发者工具
2. 点击"调试器" → "Storage" → "Storage"
3. 点击"新增"按钮
4. 输入以下数据：

**Key（键）**:
```
guest_cart
```

**Value（值）**:
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
      },
      {
        "group_id": 3,
        "group_name": "加料",
        "option_id": 5,
        "option_name": "珍珠",
        "price_modifier": 3
      }
    ]
  }
]
```

5. 点击"确定"保存
6. **重新编译项目**或刷新页面
7. 进入结算页查看效果

### 方法 2: 通过控制台注入数据

1. 打开微信开发者工具的"Console"
2. 复制粘贴以下代码并回车：

```javascript
wx.setStorageSync('guest_cart', [
  {
    product_id: 1,
    product_name: "珍珠奶茶",
    quantity: 2,
    base_price: 15,
    selected_specs: [
      {
        group_id: 1,
        group_name: "糖度",
        option_id: 1,
        option_name: "标准糖",
        price_modifier: 0
      }
    ]
  },
  {
    product_id: 2,
    product_name: "芝士奶盖",
    quantity: 1,
    base_price: 18,
    selected_specs: [
      {
        group_id: 1,
        group_name: "糖度",
        option_id: 2,
        option_name: "少糖",
        price_modifier: 0
      }
    ]
  }
]);

console.log('测试数据已添加');
```

3. 导航到结算页或刷新页面

### 方法 3: 通过菜单页添加（推荐）

这是真实用户流程，最能反映实际情况：

1. 导航到"点单"页面
2. 选择任意商品
3. 点击商品进入详情页（如果有）
4. 选择规格（糖度、温度等）
5. 点击"加入购物车"按钮
6. 查看购物车图标是否显示数量
7. 点击购物车或"去结算"按钮
8. 进入结算页

## 查看调试日志

进入结算页后，在 Console 中应该看到以下日志：

```
=== 结算页 onLoad ===
cartStore 初始化后 - items: X 件商品
购物车绑定状态 - items: X
购物车绑定状态 - totalPrice: XX.XX
updateCartDisplay - 购物车商品数量: X
商品详情: {...}
setData cartItems: X 件商品
=== calculatePrice 开始 ===
计算价格 - 商品数量: X
总价: XX 配送费: 0
```

## 常见问题排查

### 问题 1: 添加数据后仍显示为空

**解决方案**:
1. 检查 Storage 中的数据格式是否正确（JSON 格式）
2. 重新编译项目（清除缓存）
3. 查看 Console 是否有错误信息
4. 确认 cartStore.init() 被调用

### 问题 2: 数据时有时无（不稳定）

**原因**: Store 绑定可能有延迟

**解决方案** (已在代码中修复):
```typescript
// onLoad 中添加延迟
setTimeout(() => {
  this.initData();
}, 50);

// onShow 中强制刷新
cartStore.init();
this._cartBindings.updateStoreBindings();
```

### 问题 3: 控制台显示"警告: 购物车为空！"

**检查步骤**:
1. 运行控制台命令查看 store 状态:
   ```javascript
   const { cartStore } = require('./stores/cartStore')
   console.log('cartStore.items:', cartStore.items)
   console.log('存储数据:', wx.getStorageSync('guest_cart'))
   ```

2. 如果 storage 有数据但 store 为空，说明 init() 未执行
3. 如果 store 有数据但页面 data 为空，说明绑定未生效

### 问题 4: 价格显示为 ¥0.00

**检查**:
- items 数组是否有数据
- base_price 字段是否存在且 > 0
- calculatePrice() 是否被调用

**临时测试** (在 Console 中):
```javascript
getCurrentPages().slice(-1)[0].calculatePrice()
```

## 预期效果

添加测试数据后，结算页应显示：

- ✅ 商品明细：2 件商品
  - 珍珠奶茶 x2  ¥15.00
  - 芝士奶盖 x1  ¥18.00 (或 ¥21.00 如果有加料)
- ✅ 商品小计：¥48.00
- ✅ 配送费：¥0.00（门店自提）
- ✅ 合计：¥48.00

## 清除测试数据

如需清空购物车重新测试：

**方法 1 - Storage 面板**:
1. 打开 Storage → Storage
2. 找到 `guest_cart`
3. 点击删除

**方法 2 - 控制台**:
```javascript
wx.removeStorageSync('guest_cart')
console.log('购物车已清空')
```

**方法 3 - 页面上**:
- 在结算页点击"提交订单"会自动清空购物车
