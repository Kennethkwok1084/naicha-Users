// components/product-card/product-card.ts
import { safeImageUrl } from '../../utils/placeholder'

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

  data: {
    safeImage: ''
  },

  lifetimes: {
    attached(this: any) {
      // 使用安全的图片 URL
      this.setData({
        safeImage: safeImageUrl(this.data.imageUrl, this.data.name)
      })
    }
  },

  observers: {
    'imageUrl, name': function(this: any, imageUrl: string, name: string) {
      this.setData({
        safeImage: safeImageUrl(imageUrl, name)
      })
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
      },
      handleAdd(this: any, e: any) {
        e && e.stopPropagation && e.stopPropagation();
        if (this.data.soldOut) {
          wx.showToast({
            title: '该商品已售罄',
            icon: 'none',
            duration: 2000
          });
          return;
        }
        this.triggerEvent('add', {
          productId: this.data.productId
        });
      }
  }
})
