import { OrderListItem } from '../../api/order';

Component({
  properties: {
    order: {
      type: Object as any,
      value: null,
    },
  },

  data: {
    statusMap: {
      pending_payment: { text: '待支付', color: 'warning' },
      paid: { text: '已支付', color: 'success' },
      in_production: { text: '制作中', color: 'primary' },
      ready_for_pickup: { text: '待取餐', color: 'success' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'default' },
      refund_pending: { text: '退款中', color: 'warning' },
      refunded: { text: '已退款', color: 'default' },
    },
    orderTypeMap: {
      pickup: '自提',
      delivery: '外送',
    },
  },

  methods: {
    /**
     * 点击卡片
     */
    onTap() {
      const order = this.data.order as OrderListItem;
      this.triggerEvent('tap', { order });
    },

    /**
     * 点击操作按钮
     */
    onActionTap(e: WechatMiniprogram.BaseEvent) {
      const { action } = e.currentTarget.dataset;
      const order = this.data.order as OrderListItem;
      this.triggerEvent('action', { action, order });
      // 阻止事件冒泡到卡片
      return false;
    },
  },
});
