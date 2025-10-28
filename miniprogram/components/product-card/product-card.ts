// components/product-card/product-card.ts
Component({
  options: {
    styleIsolation: 'apply-shared'
  },

  properties: {
    productId: {
      type: Number,
      value: 0
    },
    name: {
      type: String,
      value: ''
    },
    description: {
      type: String,
      value: ''
    },
    price: {
      type: Number,
      value: 0
    },
    imageUrl: {
      type: String,
      value: ''
    },
    soldOut: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    handleTap(this: any) {
      if (this.data.soldOut) {
        // 售罄商品点击提示
        wx.showToast({
          title: '该商品已售罄',
          icon: 'none',
          duration: 2000
        })
        return
      }

      // 触发父组件事件,传递商品ID
      this.triggerEvent('tap', {
        productId: this.data.productId
      })
    }
  }
})
